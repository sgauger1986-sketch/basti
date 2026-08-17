#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prüfung der Zentrale — beantwortet: kommt die App bei der Zentrale an?

Wird auf dem Windows-Rechner ausgeführt, auf dem mxWebZentrale.exe läuft.
Liest ausschließlich; die Datenbank wird schreibgeschützt geöffnet, die
laufende Zentrale merkt nichts davon.

    python pruefung_zentrale.py
    python pruefung_zentrale.py --datenbank "C:\\mexXgo\\Zentrale\\mxWebZentrale.sqb"

Beantwortet der Reihe nach:

  1. Auf welchen Vermittler und welche Firma zeigt die Zentrale? (IP.txt)
  2. Liegen Nachrichten des Geräts in der Warteschlange?
  3. In welchem Zustand — also: holt die Zentrale sie ab?
"""

import argparse
import os
import sqlite3
import sys

ZUSTAND = {
    0: "Fehler",
    1: "neu",
    2: "keine",
    3: "abgeholt",
    4: "zum Senden",
    5: "bestätigt / erledigt",
    6: "empfangen",
}

TYP = {
    0: "Fachnachricht",
    61440: "$F000  Präsenz / Datenstand",
    61441: "$F001  Datenbank angefordert",
    61442: "$F002  (undokumentiert)",
    61443: "$F003  (Bedeutung unbekannt)",
    61456: "$F010  Datenbank-Paket",
    65281: "$FF01  Chat",
    65535: "$FFFF  SQL an X2",
}

SUCHORTE = [
    "Zentrale/mxWebZentrale.sqb",
    "mxWebZentrale.sqb",
    "../Zentrale/mxWebZentrale.sqb",
    "mxWebZentrale/Zentrale/mxWebZentrale.sqb",
]


def datenbank_finden(vorgabe):
    if vorgabe:
        return vorgabe if os.path.exists(vorgabe) else None
    for ort in SUCHORTE:
        if os.path.exists(ort):
            return ort
    return None


def ip_datei_lesen():
    """IP.txt neben der EXE nennt den Vermittler."""
    for ort in ["IP.txt", "../IP.txt", "mxWebZentrale/IP.txt"]:
        if os.path.exists(ort):
            with open(ort, "r", encoding="latin-1") as f:
                return ort, f.read().strip()
    return None, None


def spalten(verbindung, tabelle):
    try:
        return [z[1] for z in verbindung.execute("PRAGMA table_info(%s)" % tabelle)]
    except sqlite3.Error:
        return []


def tabelle_zeigen(verbindung, tabelle, anzahl):
    vorhandene = spalten(verbindung, tabelle)
    if not vorhandene:
        print("  Tabelle '%s' gibt es nicht." % tabelle)
        return 0

    gesamt = verbindung.execute("SELECT COUNT(*) FROM %s" % tabelle).fetchone()[0]
    print("  %d Sätze insgesamt" % gesamt)
    if gesamt == 0:
        return 0

    print()
    print("  Nach Art und Zustand:")
    for art, zustand, station, empf, n in verbindung.execute(
        "SELECT atttype, msgstate, stationid, recipient, COUNT(*) FROM %s "
        "GROUP BY atttype, msgstate, stationid, recipient "
        "ORDER BY COUNT(*) DESC" % tabelle
    ):
        print(
            "    %-32s  %-22s  Station %s -> %s   %d x"
            % (
                TYP.get(art, "atttype %s" % art),
                ZUSTAND.get(zustand, "Zustand %s" % zustand),
                station,
                empf,
                n,
            )
        )

    hat_zeit = "modify_dt" in vorhandene
    print()
    print("  Die %d jüngsten Sätze:" % anzahl)
    verlauf = verbindung.execute(
        "SELECT id, stationid, recipient, atttype, msgstate, "
        "       COALESCE(SUBSTR(content,1,44),''), %s "
        "FROM %s ORDER BY %s DESC LIMIT ?"
        % (
            "modify_dt" if hat_zeit else "''",
            tabelle,
            "modify_dt" if hat_zeit else "rowid",
        ),
        (anzahl,),
    )
    for firma, station, empf, art, zustand, inhalt, zeit in verlauf:
        print(
            "    %-20s Firma %-8s Station %-4s -> %-4s  %-22s %s"
            % (
                zeit or "",
                firma,
                station,
                empf,
                ZUSTAND.get(zustand, str(zustand)),
                TYP.get(art, "atttype %s" % art),
            )
        )
        if inhalt:
            print("      Inhalt: %s" % inhalt)
    return gesamt


def bewerten(verbindung):
    """Die eigentliche Diagnose."""
    print()
    print("=" * 72)
    print("BEWERTUNG")
    print("=" * 72)

    def zaehle(tabelle, bedingung, werte=()):
        if not spalten(verbindung, tabelle):
            return 0
        return verbindung.execute(
            "SELECT COUNT(*) FROM %s WHERE %s" % (tabelle, bedingung), werte
        ).fetchone()[0]

    praesenz_ein = zaehle("received", "atttype = 61440")
    anford_ein = zaehle("received", "atttype = 61441")
    paket_aus = zaehle("messages", "atttype = 61456")
    offen = zaehle("received", "atttype IN (61440,61441) AND msgstate NOT IN (5,6)")

    print()
    print("  Präsenz ($F000) im Eingang der Zentrale ....... %d" % praesenz_ein)
    print("  Datenanforderung ($F001) im Eingang ........... %d" % anford_ein)
    print("  davon noch nicht erledigt ..................... %d" % offen)
    print("  Datenpakete ($F010) im Ausgang ................ %d" % paket_aus)
    print()

    if praesenz_ein == 0 and anford_ein == 0:
        print("  BEFUND: Die Zentrale hat vom Gerät noch NIE etwas abgeholt.")
        print()
        print("  Das passt zum Bild aus log_blau.txt: Die App sendet, der")
        print("  Vermittler nimmt an, aber die Nachricht bleibt in dessen")
        print("  Warteschlange liegen. Zu prüfen, in dieser Reihenfolge:")
        print()
        print("    1. Läuft mxWebZentrale.exe, und ist sie ANGEMELDET?")
        print("       Ein gestartetes Fenster genügt nicht.")
        print("    2. Zeigen App und Zentrale auf DENSELBEN Vermittler?")
        print("       Siehe IP.txt oben und die Servereinstellung der App.")
        print("    3. Benutzen beide DIESELBE Firmennummer?")
        print("       Die Zentrale holt als Station 0, das Gerät ist Station 1.")
        print("    4. Ist das Gerät in der Zentrale freigegeben (UDID)?")
        print("       Nach einer Neuinstallation der App ändert sie sich.")
    elif offen > 0:
        print("  BEFUND: Die Zentrale HOLT ab, arbeitet die Nachrichten aber")
        print("  nicht vollständig ab — %d liegen unerledigt." % offen)
        print()
        print("  Damit ist der Fehler in der Verarbeitung der Zentrale, nicht")
        print("  in der Übertragung. Auswertung 08 ist an dieser Stelle widerlegt.")
    elif anford_ein > 0 and paket_aus == 0:
        print("  BEFUND: Die Anforderung ($F001) kommt an, aber die Zentrale")
        print("  hat noch KEIN Datenpaket ($F010) erzeugt.")
        print()
        print("  Dann liegt es an der Datenzuordnung: In der X2-Tabelle")
        print("  ADR_MOBILDATA muss für diesen MOBIL_KEY stehen, welche")
        print("  Datensätze das Gerät bekommen soll. Ist dort nichts")
        print("  hinterlegt, gibt es nichts zu schicken.")
    else:
        print("  BEFUND: Eingang und Ausgang sehen unauffällig aus.")
        print("  Präsenz kommt an, Pakete gehen hinaus. Wenn die App trotzdem")
        print("  keine Daten zeigt, weiter auf der Geräteseite suchen —")
        print("  weiterleiter.py zwischen App und Vermittler hängen.")


def main():
    p = argparse.ArgumentParser(
        description="Liest die Warteschlange der Zentrale und sagt, "
        "ob die App dort ankommt. Nur lesend."
    )
    p.add_argument("--datenbank", help="Pfad zu mxWebZentrale.sqb")
    p.add_argument("--anzahl", type=int, default=10, help="wie viele jüngste Sätze")
    a = p.parse_args()

    print("=" * 72)
    print("PRÜFUNG DER ZENTRALE")
    print("=" * 72)

    ort, inhalt = ip_datei_lesen()
    print()
    print("Vermittler laut IP.txt:")
    if inhalt:
        print("  (%s)" % ort)
        for zeile in inhalt.splitlines():
            print("    %s" % zeile)
    else:
        print("  IP.txt nicht gefunden — im Ordner der EXE ausführen,")
        print("  oder den Vermittler von Hand mit der App vergleichen.")

    pfad = datenbank_finden(a.datenbank)
    if not pfad:
        print()
        print("Die Datenbank der Zentrale wurde nicht gefunden.")
        print("Gesucht wurde unter: %s" % ", ".join(SUCHORTE))
        print("Mit --datenbank den Pfad angeben.")
        return 1

    print()
    print("Datenbank: %s" % os.path.abspath(pfad))

    # Schreibgeschützt öffnen: die laufende Zentrale darf nicht gestört werden.
    verbindung = sqlite3.connect("file:%s?mode=ro" % pfad, uri=True)
    try:
        for tabelle, titel in [
            ("received", "EINGANG  (received) — was die Zentrale abgeholt hat"),
            ("messages", "AUSGANG  (messages) — was die Zentrale verschickt"),
        ]:
            print()
            print("-" * 72)
            print(titel)
            print("-" * 72)
            tabelle_zeigen(verbindung, tabelle, a.anzahl)
        bewerten(verbindung)
    finally:
        verbindung.close()

    print()
    print("Ergänzend in X2 abfragen:")
    print("  SELECT MOBIL_KEY, MOBIL_NAME, MOBIL_STATUS, FLAG_1 FROM ADR_MOBIL;")
    print("  SELECT * FROM ADR_MOBILDATA WHERE MOBIL_KEY = '<Schlüssel des Geräts>';")
    return 0


if __name__ == "__main__":
    sys.exit(main())
