#!/usr/bin/env python3
"""
Beispiel-Gerät — die Gegenseite zur Beispiel-Zentrale.

Es tut genau das, was die mexXgo-App tut, nur ohne Oberfläche: anmelden,
Präsenz melden, das Datenpaket in Teilen einsammeln, MD5 prüfen, die SQLite-
Datei öffnen — und danach einen Rapport zurückschicken.

Es dient zwei Zwecken: als zweite Vorlage für alle, die ein Gerät anbinden
wollen, und als Gegenstück für den Mitschnitt in ../04-MITSCHNITT.md.

    python3 geraet_beispiel.py --server 127.0.0.1 --port 8899 \
        --firma 0000999 --station 1
"""

import argparse
import base64
import hashlib
import os
import sqlite3
import tempfile
import time

from zentrale_beispiel import (ATT_DATENPAKET, ATT_DB_ANFORDERUNG,
                               ATT_PRAESENZ, MS_BESTAETIGT, Vermittler)


class Datenbank:
    """
    Sammelt die gestückelt empfangene Datenbank ein.

    Die Teile tragen alle dieselbe PartID und dieselbe PartCount. Erst wenn
    alle da sind UND die MD5 des Gesamtstroms zum Wert in `content` passt,
    wird die Datei geschrieben. Passt sie nicht, wird alles verworfen —
    lieber gar keine Daten als halbe.
    """

    def __init__(self):
        self.partid = ""
        self.teile = []
        self.md5_soll = ""
        self.pfad = None

    def nimm_teil(self, partid, teil, teilanzahl, md5_soll):
        if partid != self.partid:
            self.partid = partid
            self.teile = []
            self.md5_soll = (md5_soll or "").upper()
        self.teile.append(teil)
        print(f"    Teil {len(self.teile)}/{teilanzahl} "
              f"({len(teil)} Bytes) angekommen")

        if len(self.teile) < teilanzahl:
            return False

        ganz = b"".join(self.teile)
        ist = hashlib.md5(ganz).hexdigest().upper()
        if self.md5_soll and ist != self.md5_soll:
            print(f"    MD5 stimmt nicht ({ist} statt {self.md5_soll}) "
                  f"— alles verworfen.")
            self.teile, self.partid = [], ""
            return False

        self.pfad = os.path.join(tempfile.gettempdir(), "mexxgo_daten.sqb")
        with open(self.pfad, "wb") as f:
            f.write(ganz)
        print(f"    Vollständig: {len(ganz)} Bytes, MD5 {ist} — "
              f"abgelegt unter {self.pfad}")
        self.teile, self.partid = [], ""
        return True

    def zusammenfassung(self):
        if not self.pfad:
            return
        c = sqlite3.connect(self.pfad)
        tabellen = [r[0] for r in c.execute(
            "select name from sqlite_master where type='table' order by name")]
        print(f"    Enthaltene Tabellen: {', '.join(tabellen) or '(keine)'}")
        for t in tabellen:
            n = c.execute(f"select count(*) from '{t}'").fetchone()[0]
            print(f"      {t:24} {n:6} Datensätze")
        c.close()

    def md5(self):
        if not self.pfad or not os.path.exists(self.pfad):
            return ""
        with open(self.pfad, "rb") as f:
            return hashlib.md5(f.read()).hexdigest().upper()


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--server", required=True)
    p.add_argument("--port", type=int, default=8080)
    p.add_argument("--firma", required=True)
    p.add_argument("--station", type=int, default=1)
    p.add_argument("--kennwort", default="")
    p.add_argument("--takt", type=float, default=2.0)
    p.add_argument("--dauer", type=float, default=30.0)
    p.add_argument("--rapport", action="store_true",
                   help="nach Erhalt der Daten einen Rapport zurückschicken")
    a = p.parse_args()

    db = Datenbank()
    v = Vermittler(a.server, a.port, a.firma, a.station, a.kennwort)
    print(f"Gerät meldet sich an http://{a.server}:{a.port}/mxWebService "
          f"— Firma {a.firma}, Station {a.station}")
    print(f"SessionID = {v.anmelden()}\n")

    # Präsenz melden: '<SHA-1 des bisherigen Stands>,<MD5 der Fassung>'.
    # Bei leerem Stand steht links der SHA-1 der leeren Zeichenkette.
    leer = hashlib.sha1(b"").hexdigest().upper()
    # Erst der eigene Stand, dann die Anforderung — genau in dieser
    # Reihenfolge macht es auch die App.
    print("Präsenz melden ($F000), Datenbank anfordern ($F001):")
    v.senden(empfaenger=0, inhalt=f"{leer},{db.md5()}",
             atttype=ATT_PRAESENZ, prioritaet=0)
    v.senden(empfaenger=0, inhalt="", atttype=ATT_DB_ANFORDERUNG, prioritaet=0)

    rapport_geschickt = False
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
                mid = felder["MessageID"]
                print(f"\n  Eingang: atttype ${typ:04X}, "
                      f"{len(anhang or b'')} Bytes Anhang")

                if typ == ATT_DATENPAKET:
                    fertig = db.nimm_teil(
                        felder.get("PartID", ""), anhang or b"",
                        int(felder.get("PartCount") or 1),
                        felder.get("Content", ""))
                    if fertig:
                        db.zusammenfassung()
                        if a.rapport and not rapport_geschickt:
                            print("\n  Rapport zurück an die Zentrale:")
                            v.senden(
                                empfaenger=0,
                                inhalt='{"AUFTRAG_KOPF":{"NUMMER":"R-0001",'
                                       '"DATUM":"2026-08-17","PROJEKT":"P-100"},'
                                       '"LV_POS":[{"POS":"1.1","MENGE":12.5}],'
                                       '"SIGNATUR":""}',
                                atttype=0, prioritaet=5)
                            rapport_geschickt = True


                v.zustand_setzen(mid, MS_BESTAETIGT)

            time.sleep(a.takt)
    except KeyboardInterrupt:
        print("\nAbbruch.")
    finally:
        v.abmelden()
        print("\nAbgemeldet.")


if __name__ == "__main__":
    main()
