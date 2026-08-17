#!/usr/bin/env python3
"""
Prüfstand — ein winziger Vermittler zum Ausprobieren.

Das ist KEIN Produkt und kein Ersatz für den Vermittler von mexXsoft. Es ist
nur so viel Server, wie man braucht, um die eigene Anbindung zu testen, ohne
den Produktivbetrieb anzufassen. Rund 200 Zeilen, alles im Speicher.

Warum es das überhaupt gibt: ReceiveMessage am Produktivserver holt eine
Nachricht aus der Warteschlange und nimmt sie damit der laufenden
Kunden-Zentrale weg. Zum Ausprobieren gehört deshalb ein eigener Endpunkt.

    python3 pruefstand.py --port 8080

Er nimmt jede Firmennummer und jedes Kennwort an — er prüft nichts, er
vermittelt nur. Jede Zeile, die über die Leitung geht, steht auf der Konsole.
"""

import argparse
import http.server
import re
import threading
import time
import uuid

PFAD = "/mxWebService"


# ---------------------------------------------------------------------------
# Satzformat
# ---------------------------------------------------------------------------

def anfrage_lesen(b):
    """
    Zerlegt 'FC=Funktion;RE=n;Feld;Feld;…' — byte-genau, nach Längen.

    Rückgabe: (funktion, {name: wert}). Werte kommen als Text oder als bytes
    (bei BS).
    """
    if not b.startswith(b"FC="):
        return None, {}
    i = b.index(b";")
    funktion = b[3:i].decode("utf-8", "replace")
    i += 1
    if b[i:i + 3] == b"RE=":
        i = b.index(b";", i) + 1

    felder, n = {}, len(b)
    while i < n:
        anf = i
        while i < n and b[i:i + 1] not in (b":", b";"):
            i += 1
        if i >= n:
            break
        if b[i:i + 1] == b";":
            i += 1
            continue
        name = b[anf:i].decode("utf-8", "replace")
        i += 1
        anf = i
        while i < n and b[i:i + 1] != b"=":
            i += 1
        typ = b[anf:i].decode("utf-8", "replace")
        i += 1

        if typ in ("S", "BS"):
            laenge = 0
            while i < n and b[i:i + 1].isdigit():
                laenge = laenge * 10 + int(b[i:i + 1])
                i += 1
            if b[i:i + 1] == b'"':
                i += 1
            ende = min(i + laenge, n)
            roh = b[anf:ende]  # noqa: F841  (nur zur Klarheit)
            felder[name] = (b[i:ende] if typ == "BS"
                            else b[i:ende].decode("utf-8", "replace"))
            i = ende
            if b[i:i + 1] == b'"':
                i += 1
        elif typ == "I":
            anf = i
            while i < n and (b[i:i + 1].isdigit() or b[i:i + 1] == b"-"):
                i += 1
            felder[name] = b[anf:i].decode()
        elif typ == "B":
            felder[name] = "1" if b[i:i + 1] in (b"T", b"1") else "0"
            i += 1
        elif typ == "X":
            felder[name] = ""
        else:
            while i < n and b[i:i + 1] != b";":
                i += 1
        if b[i:i + 1] == b";":
            i += 1
    return funktion, felder


def w_text(s):
    s = "" if s is None else str(s)
    return f'S={len(s)}"{s}";'.encode("utf-8")


def w_zahl(z):
    return f"I={int(z)};".encode()


def w_janein(b):
    return (b"B=T;" if b else b"B=F;")


W_NICHTS = b"X=;"


def satz_schreiben(felder):
    """
    Baut die Antwort auf ReceiveMessage.

    ACHTUNG, hier steckt eine Falle: Die Felder heißen auf der Leitung wie in
    der ANFRAGE — `MessageID`, `AttachmentType`, `PartID` —, NICHT wie die
    Spalten der Datenbank (`messageid`, `atttype`, `partid`). Wer die
    Spaltennamen nimmt, bekommt eine Antwort, die formal richtig aussieht und
    die die App stillschweigend verwirft.

    Der Anhang heißt `Attachment` und geht binär als `BS=`.
    """
    teile = []
    for name, wert in felder:
        if name == "Attachment":
            teile.append(f'{name}:BS={len(wert)}"'.encode() + wert + b'";')
        elif isinstance(wert, int):
            teile.append(f"{name}:I={wert};".encode())
        else:
            wert = "" if wert is None else str(wert)
            teile.append(f'{name}:S={len(wert)}"{wert}";'.encode("utf-8"))
    return f"RE={len(felder)};".encode() + b"".join(teile)


# ---------------------------------------------------------------------------
# Zustand
# ---------------------------------------------------------------------------

SPERRE = threading.Lock()
SITZUNGEN = {}          # sid -> (firma, station)
POSTFAECHER = {}        # (firma, station) -> [nachricht, …]
ALLE = {}               # messageid -> nachricht


def zustell(firma, station, nachricht):
    POSTFAECHER.setdefault((firma, int(station)), []).append(nachricht)
    ALLE[nachricht["messageid"]] = nachricht


# ---------------------------------------------------------------------------
# Die Funktionen
# ---------------------------------------------------------------------------

def behandle(funktion, f, sid_aus_adresse):
    firma = f.get("Key", "")
    station = int(f.get("StationID") or 0)

    if funktion in ("Connect", "Login"):
        with SPERRE:
            sid = (sid_aus_adresse if sid_aus_adresse and sid_aus_adresse != "NEW"
                   else uuid.uuid4().hex.upper())
            SITZUNGEN[sid] = (firma, station)
            POSTFAECHER.setdefault((firma, station), [])
        return w_text(sid), sid

    if funktion == "Logout":
        with SPERRE:
            SITZUNGEN.pop(f.get("SessionID", ""), None)
        return w_janein(True), None

    if funktion == "Ping":
        return w_janein(True), None

    if funktion == "SendMessage":
        n = {
            "id": firma,
            "stationid": station,
            "messageid": f.get("MessageID", uuid.uuid4().hex.upper()),
            "recipient": int(f.get("Recipient") or 0),
            "msgstate": 1,
            "content": f.get("Content", ""),
            "attachment": b"",
            "attsize": 0,
            "atttype": int(f.get("AttachmentType") or 0),
            "partid": f.get("PartID", ""),
            "partcount": int(f.get("PartCount") or 0),
            "priority": int(f.get("Priority") or 5),
            "modify_dt": time.strftime("%Y-%m-%d %H:%M:%S.000"),
        }
        b64 = f.get("AttachmentB64", "")
        if b64:
            import base64
            n["attachment"] = base64.b64decode(b64)
            n["attsize"] = len(n["attachment"])
        with SPERRE:
            zustell(firma, n["recipient"], n)
        return w_janein(True), None

    if funktion == "ReceiveMessage":
        with SPERRE:
            fach = POSTFAECHER.setdefault((firma, station), [])
            if not fach:
                return W_NICHTS, None
            n = fach.pop(0)
        # Feldnamen wie in der Anfrage, NICHT wie die Datenbankspalten.
        satz = [
            ("MessageID", n["messageid"]), ("StationID", str(n["stationid"])),
            ("Recipient", n["recipient"]), ("MsgState", n["msgstate"]),
            ("Content", n["content"]), ("AttachmentType", n["atttype"]),
            ("PartID", n["partid"]), ("PartCount", n["partcount"]),
            ("Priority", n["priority"]),
        ]
        if n["attachment"]:
            satz.append(("Attachment", n["attachment"]))
        return satz_schreiben(satz), None

    if funktion == "GetMessageState":
        with SPERRE:
            n = ALLE.get(f.get("MessageID", ""))
        return w_zahl(n["msgstate"] if n else 0), None

    if funktion == "ChangeState":
        # Der Zustand kommt je nach Gegenstelle als `State` oder als
        # `MsgState`. Beide annehmen kostet nichts und erspart eine
        # Fehlersuche, die sonst eine Stunde dauert.
        with SPERRE:
            n = ALLE.get(f.get("MessageID", ""))
            if n:
                n["msgstate"] = int(f.get("State") or f.get("MsgState") or 0)
        return w_janein(n is not None), None

    if funktion == "DeleteMessageID":
        with SPERRE:
            ALLE.pop(f.get("MessageID", ""), None)
        return w_janein(True), None

    return W_NICHTS, None


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass                                   # eigene Ausgabe, siehe unten

    def do_POST(self):
        weg = self.path.split("?")[0]
        if weg != PFAD:
            self.send_error(404)
            return
        m = re.search(r"[?&]ID=([^&]*)", self.path)
        sid_aus_adresse = m.group(1) if m else ""

        laenge = int(self.headers.get("Content-Length") or 0)
        rumpf = self.rfile.read(laenge)

        # Genau die Prüfung, an der Neuumsetzungen scheitern.
        if self.headers.get("Content-Type"):
            print("  ! Content-Type gesetzt — die echte Gegenseite antwortet "
                  "hier 404 Data Format not supported")
            self.send_error(404, "Data Format not supported")
            return

        funktion, felder = anfrage_lesen(rumpf)
        zeig = {k: (f"<{len(v)} Bytes>" if isinstance(v, bytes) else
                    (v[:40] + "…" if len(str(v)) > 40 else v))
                for k, v in felder.items()}
        print(f"→ {funktion:16} ID={sid_aus_adresse[:8]:8} {zeig}")

        antwort, neue_sitzung = behandle(funktion, felder, sid_aus_adresse)

        print(f"← {antwort[:120]!r}" + (" …" if len(antwort) > 120 else ""))
        self.send_response(200)
        self.send_header("Content-Length", str(len(antwort)))
        if neue_sitzung:
            self.send_header("Set-Cookie", f"ID={neue_sitzung}; Path=/")
        self.end_headers()
        self.wfile.write(antwort)


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--port", type=int, default=8080)
    p.add_argument("--adresse", default="0.0.0.0")
    a = p.parse_args()

    srv = http.server.ThreadingHTTPServer((a.adresse, a.port), Handler)
    print(f"Prüfstand läuft auf http://{a.adresse}:{a.port}{PFAD}")
    print("Klartext, keine Prüfung von Kennwörtern. Nur zum Ausprobieren.\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nEnde.")


if __name__ == "__main__":
    main()
