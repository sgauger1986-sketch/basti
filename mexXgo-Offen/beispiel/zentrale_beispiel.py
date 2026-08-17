#!/usr/bin/env python3
"""
Beispiel-Zentrale — die kürzeste vollständige Anbindung an den mexXgo-Vermittler.

Das hier ist kein Produkt, sondern eine Vorlage: Es zeigt Zeile für Zeile, was
eine spätere Zentrale tun muss. Wer das in Delphi, C# oder sonst etwas
nachbaut, hat die Anbindung fertig.

Es wird NICHTS verschlüsselt und NICHTS verborgen. Reines HTTP, ein Textformat,
das man mitlesen kann. Ausführlich beschrieben in ../02-SCHNITTSTELLE.md.

Aufruf:

    # nur anmelden und wieder abmelden (unschädlich, auch am Produktivserver)
    python3 zentrale_beispiel.py anmelden --server 82.165.182.81 --firma 0000999

    # voller Ablauf gegen einen eigenen Endpunkt
    python3 zentrale_beispiel.py betrieb --server 127.0.0.1 --port 8080 \
        --firma 0000999 --datenbank meine_daten.sqb

WARNUNG: 'betrieb' ruft ReceiveMessage auf. Am Produktivserver nimmt das der
laufenden Kunden-Zentrale ihre Nachrichten weg. Nur gegen einen eigenen
Endpunkt laufen lassen.
"""

import argparse
import hashlib
import http.client
import re
import sys
import time
import uuid

PFAD = "/mxWebService"

# Nachrichtenzustände, wie sie über die Leitung gehen.
MS_FEHLER, MS_NEU, MS_KEINE, MS_ABGEHOLT, MS_ZUM_SENDEN, MS_BESTAETIGT, MS_EMPFANGEN = range(7)

# Der Bereich ab $F000 sind Steuernachrichten, keine Anhänge.
# Beide Richtungen sind belegt und laufen zwischen App, Vermittler und
# Zentrale seit dem 03.08.2026 im Betrieb.
ATT_PRAESENZ = 0xF000        # 61440 — Gerät: "das ist mein Datenstand"
ATT_DB_ANFORDERUNG = 0xF001  # 61441 — Gerät: "schick mir die Datenbank"
ATT_DATENPAKET = 0xF010      # 61456 — Zentrale: das Datenbank-Paket

# Ein Teil eines gestückelten Anhangs. 48 kB roh ergeben rund 64 kB Base64 —
# klein genug, dass auch schlechte Mobilfunkverbindungen es schaffen.
TEIL_GROESSE = 48 * 1024


# ---------------------------------------------------------------------------
# Das Satzformat
# ---------------------------------------------------------------------------

def feld_text(name, wert):
    """Zeichenkette. Die Länge steht VOR dem Text — das ist die häufigste Falle."""
    wert = "" if wert is None else str(wert)
    return f'{name}:S={len(wert)}"{wert}";'


def feld_zahl(name, wert):
    return f"{name}:I={int(wert)};"


def feld_janein(name, wert):
    # T oder F, nicht 1 oder 0.
    return f'{name}:B={"T" if wert else "F"};'


def anfrage(funktion, felder):
    """Baut den Rumpf einer Anfrage. Die Reihenfolge der Felder bleibt erhalten."""
    return f"FC={funktion};RE={len(felder)};" + "".join(felder)


def antwort_lesen(roh):
    """
    Liest den nackten Rückgabewert. Rückgabe:
      ('text', str) | ('zahl', int) | ('janein', bool) | ('nichts', None)
    """
    t = roh.decode("utf-8", "replace").strip()
    if t.startswith("X="):
        return ("nichts", None)
    if t.startswith("B="):
        return ("janein", t[2:3].upper() in ("T", "1"))
    if t.startswith("I="):
        m = re.match(r"I=(-?\d+)", t)
        return ("zahl", int(m.group(1)) if m else 0)
    if t.startswith("S="):
        m = re.match(r'S=(\d+)"', t)
        if not m:
            return ("text", "")
        laenge = int(m.group(1))
        start = m.end()
        return ("text", t[start:start + laenge])
    return ("text", t)


def satz_lesen(b):
    """
    Liest die Antwort auf ReceiveMessage — einen ganzen Satz.

    Das MUSS byte-genau geschehen. Der Anhang kommt als Typ BS und darf
    beliebige Bytes enthalten: Nullbytes, Semikolons, Anführungszeichen. Wer
    bis zum nächsten Trennzeichen liest, zerlegt jede zweite Datenbank falsch.
    """
    if not b or not b.startswith(b"RE="):
        return None
    i = b.index(b";") + 1
    felder, anhang = {}, None
    n = len(b)
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
        i += 1                                   # ':'
        anf = i
        while i < n and b[i:i + 1] != b"=":
            i += 1
        typ = b[anf:i].decode("utf-8", "replace")
        i += 1                                   # '='

        if typ in ("S", "BS"):
            laenge = 0
            while i < n and b[i:i + 1].isdigit():
                laenge = laenge * 10 + int(b[i:i + 1])
                i += 1
            if b[i:i + 1] == b'"':
                i += 1
            ende = min(i + laenge, n)
            if typ == "BS":
                anhang = b[i:ende]
            else:
                felder[name] = b[i:ende].decode("utf-8", "replace")
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
    return felder, anhang


# ---------------------------------------------------------------------------
# Die Verbindung
# ---------------------------------------------------------------------------

class Vermittler:
    """Eine Sitzung am Vermittler. Klartext-HTTP, sonst nichts."""

    def __init__(self, server, port, firma, station=0, kennwort="", udid="",
                 mitschnitt=True):
        self.server = server
        self.port = port
        self.firma = firma
        self.station = station
        # Das Kennwort geht als SHA-1, hexadezimal, GROSSBUCHSTABEN.
        self.pw = hashlib.sha1(kennwort.encode("utf-8")).hexdigest().upper()
        self.udid = udid or str(uuid.uuid4())
        self.sitzung = None
        self.mitschnitt = mitschnitt

    # -- Transport ----------------------------------------------------------

    def _ruf_roh(self, funktion, felder, neue_sitzung=False):
        kennung = "NEW" if (neue_sitzung or not self.sitzung) else self.sitzung
        rumpf = anfrage(funktion, felder).encode("utf-8")

        if self.mitschnitt:
            print(f"  → POST {PFAD}?ID={kennung}")
            print(f"    {anfrage(funktion, felder)}")

        c = http.client.HTTPConnection(self.server, self.port, timeout=20)
        kopf = {
            # KEIN Content-Type. Ist einer gesetzt, antwortet die Gegenseite
            # "404 Data Format not supported". Python setzt von sich aus keinen,
            # andere Bibliotheken schon — dann ausdrücklich leeren.
            "Content-Length": str(len(rumpf)),
        }
        if self.sitzung and not neue_sitzung:
            kopf["Cookie"] = f"ID={self.sitzung}"
        c.request("POST", f"{PFAD}?ID={kennung}", body=rumpf, headers=kopf)
        a = c.getresponse()
        daten = a.read()
        if a.status != 200:
            c.close()
            raise RuntimeError(f"HTTP {a.status} vom Vermittler")

        # Die Sitzung kommt zusätzlich als Cookie zurück.
        keks = a.getheader("Set-Cookie") or ""
        m = re.search(r"ID=([0-9A-Fa-f]+)", keks)
        if m:
            self.sitzung = m.group(1)
        c.close()

        if self.mitschnitt:
            zeig = daten[:160]
            print(f"  ← {zeig!r}" + (" …" if len(daten) > 160 else ""))
        return daten

    def _ruf(self, funktion, felder, neue_sitzung=False):
        return antwort_lesen(self._ruf_roh(funktion, felder, neue_sitzung))

    # -- Anmeldung ----------------------------------------------------------

    def _zugangsfelder(self):
        return [
            feld_text("Key", self.firma),
            feld_zahl("StationID", self.station),
            feld_text("PW", self.pw),
            feld_text("UDID", self.udid),
        ]

    def anmelden(self):
        """Connect, dann Login. Beide liefern dieselbe SessionID."""
        art, wert = self._ruf("Connect", self._zugangsfelder(), neue_sitzung=True)
        if art == "text" and wert:
            self.sitzung = wert

        art, wert = self._ruf("Login", self._zugangsfelder())
        if art != "text" or not wert:
            self.sitzung = None
            raise RuntimeError(
                "Anmeldung abgelehnt — Firmennummer, Stationsnummer oder "
                "Kennwort stimmen nicht.")
        self.sitzung = wert
        return wert

    def lebenszeichen(self):
        """Ein erneuter Connect. Erneuert zugleich die Sitzung."""
        art, wert = self._ruf("Connect", self._zugangsfelder())
        if art == "text" and wert:
            self.sitzung = wert
        return True

    def abmelden(self):
        if not self.sitzung:
            return
        try:
            self._ruf("Logout", [feld_text("SessionID", self.sitzung)])
        except Exception:
            pass
        self.sitzung = None

    # -- Nachrichten --------------------------------------------------------

    def senden(self, empfaenger, inhalt="", atttype=0, anhang_b64="",
               partid="", partcount=0, prioritaet=5):
        messageid = uuid.uuid4().hex.upper()   # GUID, 32 Zeichen, GROSS
        felder = [
            feld_text("SessionID", self.sitzung or ""),
            feld_text("Key", self.firma),
            feld_zahl("StationID", self.station),
            feld_text("MessageID", messageid),
            feld_zahl("Recipient", empfaenger),
            feld_zahl("MsgState", MS_ZUM_SENDEN),
            feld_text("Content", inhalt),
            feld_zahl("AttachmentType", atttype),
        ]
        if anhang_b64:
            # Ausgehend gibt es KEIN Binärfeld — der Anhang geht als Base64-Text.
            felder.append(feld_text("AttachmentB64", anhang_b64))
        felder += [
            feld_text("PartID", partid),
            feld_zahl("PartCount", partcount),
            feld_zahl("Priority", prioritaet),
        ]
        art, wert = self._ruf("SendMessage", felder)
        if art == "janein" and not wert:
            raise RuntimeError("Der Vermittler hat die Nachricht abgelehnt.")
        return messageid

    def abholen(self):
        """Nächste Nachricht als (Felder, Anhang) — oder None, wenn nichts da ist."""
        daten = self._ruf_roh("ReceiveMessage", [
            feld_text("SessionID", self.sitzung or ""),
            feld_text("Key", self.firma),
            feld_zahl("StationID", self.station),
        ])
        if daten.strip().startswith(b"X="):
            return None
        gelesen = satz_lesen(daten)
        if not gelesen:
            return None
        felder, anhang = gelesen
        if not felder.get("MessageID"):
            return None
        return felder, anhang

    def zustand_setzen(self, messageid, zustand):
        # Der Zustand heißt je nach Gegenstelle `State` oder `MsgState` —
        # belegt ist beides. Beide mitzuschicken kostet nichts und erspart
        # eine Fehlersuche, bei der die Quittung stillschweigend verpufft.
        self._ruf("ChangeState", [feld_text("MessageID", messageid),
                                  feld_zahl("State", zustand),
                                  feld_zahl("MsgState", zustand)])

    def loeschen(self, messageid):
        self._ruf("DeleteMessageID", [feld_text("MessageID", messageid)])


# ---------------------------------------------------------------------------
# Das Datenpaket
# ---------------------------------------------------------------------------

def datenpaket_senden(v, empfaenger, rohdaten):
    """
    Schickt eine SQLite-Datenbank an ein Gerät — gestückelt, mit MD5-Prüfung.

    Jeder Teil ist eine eigene, vollständige Nachricht. Alle tragen dieselbe
    PartID und dieselbe PartCount; die Reihenfolge ergibt sich aus dem
    Zeitstempel. Die Gegenseite gilt als vollständig, sobald die Anzahl der
    Teile PartCount erreicht — dann prüft sie die MD5 des Gesamtstroms.
    """
    import base64

    md5 = hashlib.md5(rohdaten).hexdigest().upper()
    partid = uuid.uuid4().hex.upper()
    teile = [rohdaten[i:i + TEIL_GROESSE]
             for i in range(0, len(rohdaten), TEIL_GROESSE)] or [b""]

    print(f"  Datenpaket: {len(rohdaten)} Bytes, {len(teile)} Teile, MD5 {md5}")
    for nr, teil in enumerate(teile, 1):
        v.senden(
            empfaenger=empfaenger,
            inhalt=md5,                       # die MD5 des GESAMTEN Stroms
            atttype=ATT_DATENPAKET,
            anhang_b64=base64.b64encode(teil).decode("ascii"),
            partid=partid,
            partcount=len(teile),
            prioritaet=0,
        )
        print(f"  Teil {nr}/{len(teile)} abgeschickt ({len(teil)} Bytes)")
    return partid


def datenstand_pruefen(station, gemeldet, datenbank):
    """
    Die Präsenz ($F000) einer Station auswerten — nur lesen, nicht senden.

    Die Station meldet '<SHA-1>,<MD5>': links ihr bisheriger Datenstand,
    rechts die Fassung, die sie hat. Daraus weiß die Zentrale, ob ein
    Datenpaket überhaupt nötig wäre.

    Verschickt wird hier nichts. Das Gerät schickt unmittelbar danach die
    ausdrückliche Anforderung ($F001) hinterher, und erst die löst das
    Datenpaket aus — sonst ginge es auf ein Paar Steuernachrichten zweimal
    heraus. Wer Funkverkehr sparen will, hängt an die Anforderung noch den
    Vergleich mit dieser Prüfsumme.
    """
    hat = (gemeldet.split(",", 1)[1] if "," in gemeldet else "").upper()
    soll = hashlib.md5(datenbank).hexdigest().upper() if datenbank else ""
    if datenbank and hat != soll:
        print(f"  Station {station} hat {hat or '(nichts)'}, soll {soll} "
              f"— sie ist nicht auf Stand.")
        return False
    print(f"  Station {station} ist auf Stand.")
    return True


# ---------------------------------------------------------------------------
# Die zwei Betriebsarten
# ---------------------------------------------------------------------------

def nur_anmelden(a):
    """Connect + Login + Logout. Liest nur — auch am Produktivserver unschädlich."""
    v = Vermittler(a.server, a.port, a.firma, a.station, a.kennwort)
    print(f"Anmeldung an http://{a.server}:{a.port}{PFAD} "
          f"— Firma {a.firma}, Station {a.station}")
    sid = v.anmelden()
    print(f"\nAngemeldet. SessionID = {sid}")
    v.abmelden()
    print("Abgemeldet.")


def betrieb(a):
    """Der volle Ablauf: anmelden, takten, Präsenz beantworten, Eingang leeren."""
    datenbank = b""
    if a.datenbank:
        with open(a.datenbank, "rb") as f:
            datenbank = f.read()
        print(f"Datenbank {a.datenbank}: {len(datenbank)} Bytes, "
              f"MD5 {hashlib.md5(datenbank).hexdigest().upper()}")

    v = Vermittler(a.server, a.port, a.firma, a.station, a.kennwort)
    print(f"Anmeldung an http://{a.server}:{a.port}{PFAD}")
    print(f"SessionID = {v.anmelden()}\n")

    gemeldet = {}
    ende = time.monotonic() + a.dauer
    try:
        while time.monotonic() < ende:
            v.lebenszeichen()

            while True:
                n = v.abholen()
                if not n:
                    break
                felder, anhang = n
                typ = int(felder.get("AttachmentType") or 0)
                von = int(felder.get("StationID") or 0)
                mid = felder["MessageID"]
                print(f"\n  Eingang: von Station {von}, atttype ${typ:04X}, "
                      f"{len(anhang or b'')} Bytes Anhang")

                # Die beiden Steuernachrichten kommen als Paar und haben
                # klar getrennte Aufgaben: $F000 sagt, WAS die Station hat,
                # $F001 bittet um die Datenbank. Gesendet wird nur auf $F001
                # — sonst ginge das Paket zweimal heraus.
                if typ == ATT_PRAESENZ:
                    gemeldet[von] = felder.get("Content", "")
                    datenstand_pruefen(von, gemeldet[von], datenbank)
                elif typ == ATT_DB_ANFORDERUNG:
                    print(f"  Station {von} fordert die Datenbank an.")
                    if datenbank:
                        datenpaket_senden(v, von, datenbank)
                else:
                    # Hier gehört der Fachteil hin: Rapport, Tagesbericht,
                    # Unterschrift. Der Inhalt ist BSON — Aufbau noch offen,
                    # siehe 02-SCHNITTSTELLE.md Abschnitt 12.
                    print(f"  Fachnachricht, {len(felder.get('Content',''))} "
                          f"Zeichen Inhalt — gehört nach X2 geschrieben.")

                v.zustand_setzen(mid, MS_BESTAETIGT)

            time.sleep(a.takt)
    except KeyboardInterrupt:
        print("\nAbbruch.")
    finally:
        v.abmelden()
        print("Abgemeldet.")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="befehl", required=True)

    for name, hilfe in (("anmelden", "nur Connect + Login + Logout"),
                        ("betrieb", "voller Ablauf mit Takt und Eingang")):
        s = sub.add_parser(name, help=hilfe)
        s.add_argument("--server", required=True)
        s.add_argument("--port", type=int, default=8080)
        s.add_argument("--firma", required=True, help="7-stellige Firmennummer")
        s.add_argument("--station", type=int, default=0, help="0 = Zentrale")
        s.add_argument("--kennwort", default="")
        if name == "betrieb":
            s.add_argument("--datenbank", help="SQLite-Datei für die Geräte")
            s.add_argument("--takt", type=float, default=2.0)
            s.add_argument("--dauer", type=float, default=60.0)

    a = p.parse_args()
    if a.befehl == "anmelden":
        nur_anmelden(a)
    else:
        if a.server not in ("127.0.0.1", "localhost", "::1"):
            print("WARNUNG: 'betrieb' ruft ReceiveMessage auf. An einem "
                  "Produktivserver nimmt das der laufenden Kunden-Zentrale "
                  "ihre Nachrichten weg.", file=sys.stderr)
            if input("Trotzdem fortfahren? (ja/nein) ").strip().lower() != "ja":
                return
        betrieb(a)


if __name__ == "__main__":
    main()
