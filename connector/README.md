# mexXsoft X2 Cloud — Büro-Connector

Verbindet die **bestehende Delphi-Version im Büro** (die unverändert
weiterläuft) mit der Web-Version. Läuft als kleines Programm auf dem Büro-PC
oder Server neben mexXsoft — benötigt nur Python 3, keine Installation von
Zusatzpaketen, kein Eingriff in mexXsoft selbst.

## Was er tut

- **Büro → Web (automatisch, sofort):** überwacht die Advantage-Datenbank
  (.adt-Dateien) von mexXsoft. Neue oder geänderte Datensätze werden binnen
  Sekunden in die Cloud übertragen — Außendienst und Baustelle sehen immer
  den aktuellen Büro-Stand.
- **Web → Büro (kontrolliert):** Änderungen aus der Web-Version werden
  abgeholt und im Ordner `webeingang/` abgelegt — pro Tabelle eine
  JSON-Datei plus `protokoll.txt` als lesbare Liste („wer hat wann was
  geändert“). So kann das Büro Web-Erfassungen prüfen und übernehmen.
  Direktes automatisches Zurückschreiben in die laufende Advantage-DB ist
  bewusst nicht aktiv (Datensicherheit der Produktivdatenbank); die
  ADS-/ODBC-Schreibanbindung ist die vorgesehene Ausbaustufe.

## Start

```bash
# Auf dem Büro-PC, neben der mexXsoft-Installation:
python buero_connector.py --db "C:\mexXsoft\Demo\Daten" ^
    --server https://cloud.mexxsoft.de --tenant demo --user buero --pass geheim
```

Der Connector prüft alle 10 Sekunden (einstellbar mit `--intervall`), ob sich
.adt-Dateien geändert haben, und gleicht dann ab. Wichtig: den Ordner
`tools/` aus diesem Repository mitkopieren (enthält den .adt-Leser).

## Weitere Aufrufe

```bash
# Erst-Übernahme der Bestandsdaten (eine Runde, dann Ende):
python buero_connector.py --db ... --server ... --einmalig

# Im Büro Gelöschtes auch in der Cloud löschen (bewusst zuschaltbar):
python buero_connector.py --db ... --server ... --push-loeschungen

# Test ohne echte Datenbank (liest Tabellen aus einer JSON-Datei):
python buero_connector.py --simulate ../webapp/data/seed.json --server http://localhost:8080
```

## Sicherheitsverhalten

- Kein Schreibzugriff auf die mexXsoft-Datenbank — der Connector **liest nur**.
- Datensätze, die bisher nur im Web existieren, sind vor der
  Löschungs-Erkennung geschützt (sie fehlen ja absichtlich noch im Büro).
- Konflikte (Büro und Web ändern denselben Datensatz) entscheidet der Server
  nach „letzte Änderung gewinnt“; durch den schnellen Abgleich sind die
  Fenster dafür klein, und jede Änderung bleibt im Server-Protokoll nachvollziehbar.
- Zustand (Hashes, letzte Revision, Token) liegt in `connector-state.json`;
  Löschen dieser Datei erzwingt einen kompletten Neuabgleich — ungefährlich.

## Als Windows-Dienst / Autostart

Am einfachsten über den Aufgabenplaner: Aufgabe „Bei Anmeldung starten“,
Programm `pythonw.exe`, Argumente wie oben. Alternativ NSSM
(`nssm install X2Connector ...`) für einen echten Dienst.
