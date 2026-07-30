# X2 Cloud — funktionsfähiger Prototyp

`x2-cloud-prototyp.html` ist eine **lauffähige Web-Version** zentraler X2-Module,
erzeugt **aus den echten Daten der Demo-Datenbank**. Einfach im Browser öffnen —
keine Installation, keine Server, läuft auf Mac, Windows, Tablet.

## Was der Prototyp zeigt

- **Dashboard** mit Live-Kennzahlen (Angebots-, Auftrags-, Rechnungsvolumen),
  berechnet aus den echten Projektdaten.
- **Projekte** → Detailansicht → zugehörige **Leistungsverzeichnisse**.
- **Leistungsverzeichnisse** mit dem vollständigen **hierarchischen Positionsbaum**
  (1087 echte LV-Positionen aus der Demo-DB) — das Herzstück einer GaLaBau-ERP.
- **Adressen** (Kunden/Lieferanten) mit Detailkarten.
- **Mitarbeiter** mit Kalkulationslöhnen und Verrechnungssätzen.
- **Einheiten, MwSt-Sätze, Lohnarten** als Stammdaten.
- Suche, Hell-/Dunkelmodus, responsive Bedienung.

## Warum das wichtig ist

Der Prototyp ist der **Machbarkeitsnachweis** für den Neubau als echte Web-Anwendung:
Er belegt, dass sich das Datenmodell (198 Tabellen, siehe `../datenbank-schema/`)
verlustfrei in eine moderne Browser-Oberfläche überführen lässt — inklusive der
bestehenden Daten. Die Optik ist an eine klassische ERP angelehnt und Modul für
Modul erweiterbar.

> Wichtig: Dies ist ein **Ansichts-Prototyp** (nur lesend, Daten fest eingebettet).
> Er ist noch keine mandantenfähige, schreibende Anwendung mit Datenbank-Backend —
> das ist der nächste Ausbauschritt (siehe `../CLOUD-STRATEGIE.md`, Phase 2).

## Wie er erzeugt wurde (reproduzierbar)

```
tools/adt_schema.py    # Tabellenstruktur aus .adt-Dateien  -> datenbank-schema/
tools/adt_read.py      # Datensätze aus .adt-Dateien lesen
tools/export_bundle.py # kuratiertes, bereinigtes JSON-Datenpaket
tools/build_app.py     # JSON in die HTML-Oberfläche einsetzen
```

Alle Werkzeuge lesen direkt das Advantage-Database-Format (.adt) der Demo-DB —
ganz ohne den fehlenden Delphi-Quellcode.
