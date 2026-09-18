# Cloud-Neubau der Handwerker-/GaLaBau-Software (Arbeitsname: heywerki)

| Ordner | Inhalt |
|---|---|
| [`mobile/`](mobile/) | **Native App für iOS und Android** (Expo / React Native). Projekte, Leistungsverzeichnisse, Rapporte mit Fotos und GPS, Adressen, Stammdaten. Offline-fähig, Demo-Modus, Server-Anbindung nach [`mobile/docs/API.md`](mobile/docs/API.md). |
| [`prototyp/`](prototyp/) | Lauffähiger Web-Prototyp (eine HTML-Datei) mit echten Demo-Daten. |
| [`datenbank-schema/`](datenbank-schema/) | Aus der Advantage-Demo-DB extrahiertes Schema: 198 Tabellen, 2832 Felder. |
| [`tools/`](tools/) | Python-Werkzeuge zum Lesen der .adt-Dateien und zum Erzeugen des Datenpakets. |
| [`CLOUD-STRATEGIE.md`](CLOUD-STRATEGIE.md) | Zweistufiger Migrationsplan (Streaming → echte Web-Version). |
| [`QUELLCODE-VERLUST-PLAN.md`](QUELLCODE-VERLUST-PLAN.md) | Vorgehen ohne den Delphi-Quellcode. |

**Umbenennung:** Der Produktname ist noch nicht endgültig. In der App steht alles
Markenbezogene in [`mobile/brand.js`](mobile/brand.js) – eine Datei ändern, Icons
neu erzeugen, fertig (Details in [`mobile/README.md`](mobile/README.md)).
