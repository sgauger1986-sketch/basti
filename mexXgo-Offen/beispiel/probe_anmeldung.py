#!/usr/bin/env python3
"""
Probe — welche Anmeldeform nimmt der Vermittler an?

Die Entwurf-App und die Original-App melden sich unterschiedlich an. Statt zu
raten, fragt dieses Programm den Server: Es probiert die Varianten der Reihe
nach und schreibt auf, was er dazu sagt.

Geprüft werden nur Connect und Login — beides liest nur und ist auch am
Produktivserver unschädlich. Eine Nachricht wird NUR verschickt, wenn
--senden ausdrücklich mitgegeben wird.

    python3 probe_anmeldung.py --server 82.165.182.81 --firma 0000999
"""

import argparse
import hashlib
import http.client
import re
import uuid

PFAD = "/mxWebService"


def ruf(server, port, funktion, felder, sitzung=None, zeige=True):
    """Ein Aufruf. `felder` ist eine Liste fertiger Feldzeichenketten."""
    rumpf = (f"FC={funktion};RE={len(felder)};" + "".join(felder)).encode("utf-8")
    kennung = sitzung or "NEW"
    kopf = {"Content-Length": str(len(rumpf))}
    if sitzung:
        kopf["Cookie"] = f"ID={sitzung}"
    c = http.client.HTTPConnection(server, port, timeout=20)
    c.request("POST", f"{PFAD}?ID={kennung}", body=rumpf, headers=kopf)
    a = c.getresponse()
    daten = a.read()
    keks = a.getheader("Set-Cookie") or ""
    c.close()
    m = re.search(r"ID=([0-9A-Fa-f]+)", keks)
    if zeige:
        print(f"    → {rumpf.decode('utf-8', 'replace')[:150]}")
        print(f"    ← {daten.decode('utf-8', 'replace')[:120]}")
    return daten.decode("utf-8", "replace"), (m.group(1) if m else None)


def text(name, wert):
    wert = "" if wert is None else str(wert)
    return f'{name}:S={len(wert)}"{wert}";'


def zahl(name, wert):
    return f"{name}:I={int(wert)};"


def sitzung_aus(antwort, keks):
    m = re.match(r'S=(\d+)"', antwort)
    if m:
        return antwort[m.end():m.end() + int(m.group(1))]
    return keks


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--server", required=True)
    p.add_argument("--port", type=int, default=8080)
    p.add_argument("--firma", required=True, help="7-stellige Firmennummer")
    p.add_argument("--station", type=int, default=1)
    p.add_argument("--senden", action="store_true",
                   help="bei jeder angenommenen Variante EINE Präsenznachricht "
                        "schicken (schreibt beim Server!)")
    a = p.parse_args()

    pw = hashlib.sha1(b"").hexdigest().upper()
    udid = str(uuid.uuid4())
    kurz = a.firma                                   # 0000999
    lang = f"{a.station:02d}{a.firma}"               # 010000999

    varianten = [
        ("Original: Connect ohne Parameter, Login nur Key(9)+StationID als Text",
         [], [text("Key", lang), text("StationID", str(a.station))]),
        ("Original mit Key(9), StationID als Zahl",
         [], [text("Key", lang), zahl("StationID", a.station)]),
        ("Original mit Key(7), StationID als Text",
         [], [text("Key", kurz), text("StationID", str(a.station))]),
        ("Unsere App: Key(7), StationID Zahl, PW, UDID (auch bei Connect)",
         [text("Key", kurz), zahl("StationID", a.station), text("PW", pw),
          text("UDID", udid)],
         [text("Key", kurz), zahl("StationID", a.station), text("PW", pw),
          text("UDID", udid)]),
        ("Wie unsere App, aber Key(9)",
         [text("Key", lang), zahl("StationID", a.station), text("PW", pw),
          text("UDID", udid)],
         [text("Key", lang), zahl("StationID", a.station), text("PW", pw),
          text("UDID", udid)]),
    ]

    print(f"Vermittler http://{a.server}:{a.port}{PFAD}")
    print(f"Firma {kurz}, Station {a.station}, lange Kennung {lang}\n")

    for name, cfelder, lfelder in varianten:
        print(f"── {name}")
        try:
            antwort, keks = ruf(a.server, a.port, "Connect", cfelder)
            sid = sitzung_aus(antwort, keks)
            if not sid:
                print("   ERGEBNIS: Connect liefert keine Sitzung\n")
                continue
            antwort2, _ = ruf(a.server, a.port, "Login", lfelder, sid)
            angemeldet = antwort2.startswith("S=") and len(antwort2) > 4
            print(f"   ERGEBNIS: Login {'ANGENOMMEN' if angemeldet else 'ABGELEHNT'}")

            if angemeldet and a.senden:
                leer = hashlib.sha1(b"").hexdigest().upper()
                # Genau der Aufbau aus der echten Zentrale-Warteschlange:
                # SHA-1, Komma, nichts.
                felder = [
                    text("SessionID", sid),
                    text("Key", lfelder[0].split('"')[1]),
                    zahl("StationID", a.station),
                    text("MessageID", uuid.uuid4().hex.upper()),
                    zahl("Recipient", 0),
                    zahl("MsgState", 4),
                    text("Content", leer + ","),
                    zahl("AttachmentType", 0xF000),
                    text("PartID", ""),
                    zahl("PartCount", 0),
                    zahl("Priority", 0),
                ]
                antwort3, _ = ruf(a.server, a.port, "SendMessage", felder, sid)
                print(f"   SENDEN:   {'ANGENOMMEN' if antwort3.startswith('B=T') else 'ABGELEHNT'}")

            ruf(a.server, a.port, "Logout", [text("SessionID", sid)], sid,
                zeige=False)
        except Exception as e:
            print(f"   FEHLER: {e}")
        print()


if __name__ == "__main__":
    main()
