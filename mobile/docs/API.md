# Server-Schnittstelle der mobilen App

Die App spricht ein kleines REST-API. Dieses Dokument ist der **Vertrag**, den das
künftige Backend (Phase 2 aus `../../CLOUD-STRATEGIE.md`) erfüllen muss. Solange
kein Server existiert, läuft die App im Demo-Modus mit eingebetteten Daten.

Alle Endpunkte liegen unter `{serverUrl}/api/v1`, Antworten sind JSON (UTF-8).
Nach der Anmeldung wird jeder Aufruf mit `Authorization: Bearer <token>` gesendet.
**Nur HTTPS** – die App verweigert unverschlüsselte Verbindungen. Der Server sollte
HSTS setzen, Body-Größen bis ca. 20 MB (Fotos) erlauben und Login-Versuche begrenzen.

## POST /auth/login

Anfrage:
```json
{ "benutzer": "max", "passwort": "geheim" }
```
Antwort `200`:
```json
{ "token": "eyJ…", "benutzer": "max", "mandant": "Muster GaLaBau GmbH" }
```
Fehler: `401` mit `{ "message": "Benutzername oder Passwort falsch" }`.
Der Token sollte lange gültig sein (Wochen) oder erneuerbar, da die App
offline arbeitet und Rapporte später nachsendet.

## GET /mobile/bundle

Liefert den kompletten Datenbestand, den die App lokal vorhält. Die Struktur
entspricht **1:1 den Tabellen/Feldern der X2-Datenbank** (siehe
`../../datenbank-schema/SCHEMA.md`), damit ein Export aus dem Altsystem ohne
Umbau funktioniert. Genau dieses Format erzeugt `../../tools/export_bundle.py`.

```json
{
  "adressen":     [{ "ID_ADRESSE": "…", "AD_ANZEIGENAME": "…", "TEL_GESCHAEFTLICH": "…", "TEL_EMAIL1": "…", "AN_STRASSE_GESCHAEFTLICH": "…", "AN_PLZ_GESCHAEFTLICH": "…", "AN_ORT_GESCHAEFTLICH": "…", "FLAG_FIRMA": true }],
  "projekte":     [{ "ID_PROJEKTE": "…", "ID_PROJEKTE_STATUS": "SV00000001", "NUMMER": "…", "KURZBEZ": "…", "BEZEICHNUNG": "…", "KUNDEN_NAME": "…", "ID_AUFTRAGGEBER": "…", "LV_SUMME_ANGEBOT": 0, "LV_SUMME_AUFTRAG": 0, "LV_SUMME_RECHNUNG": 0 }],
  "lvlisten":     [{ "ID_PROJEKTE_LVLIST": "…", "ID_PROJEKTE": "…", "ID_LV_STATUS": "2", "NUMMER": "…", "KURZBEZ": "…", "BEZEICHNUNG": "…", "ARBEITSBEREICH": "…", "MWST": 19, "ZAKO": "…", "LV_SUMME": 0 }],
  "lvpositionen": [{ "ID_LV_POS": "…", "ID_PARENT": "ROOT", "ID_PROJEKTE_LVLIST": "…", "OZ": "01.01", "KE": "H5", "MENGE": 1, "PREIS": 0, "G_PREIS": 0, "KURZTEXT_TEXT": "…", "SORTIEREN": 1 }],
  "mitarbeiter":  [{ "ID_ADR_MITARBEITER": "…", "BEZEICHNUNG": "…", "PERSONALNUMMER": "…", "MATCHCODE": "…", "STUNDENLOHN": 0, "STUNDENSATZ_TAGLOHN": 0 }],
  "einheiten":    [{ "ID_EINHEIT": "…", "EINHEIT": "m²", "BESCHREIBUNG": "…" }],
  "mwst":         [{ "ID_MWST": "…", "WERT": 19, "BEZEICHNUNG": "…", "AKTIV": true }],
  "lohnarten":    [{ "ID_LOHNART": "…", "NUMMER": "…", "BEZEICHNUNG": "…" }],
  "rapporte":     [{ "ID_RAPPORT": "…", "ID_PROJEKTE": "…", "NUMMER": "…", "NAME": "…", "GEPRUEFT": false }]
}
```

Statuswerte: `ID_PROJEKTE_STATUS` SV00000001 = In Bearbeitung, …02 = Abgeschlossen,
…03 = Auftrag, …04 = Muster, …05 = Angebot. `ID_LV_STATUS` 1 = Angebot,
2 = Auftragsbestätigung, 3 = Rechnung, 4 = Gutschrift, 5 = Mahnung, 6 = Kalkulation.

Empfehlung für den Server: nur Projekte liefern, die dem angemeldeten Nutzer
zugeordnet und nicht abgeschlossen sind; LV-Positionen nur für diese Projekte.
Für große Betriebe kann später ein `?seit=<ISO>`-Parameter für Delta-Updates
ergänzt werden, ohne die App zu ändern.

## POST /rapporte

Mobil erfasster Rapport als JSON (`Content-Type: application/json`). Fotos werden
Base64-kodiert im selben Body übertragen, damit auf dem Gerät nie eine
unverschlüsselte Datei entsteht (siehe `SICHERHEIT.md`).

```json
{
  "lokaleId": "m1x2y3-abc",
  "projektId": "SV00000104",
  "datum": "2026-09-18",
  "name": "Pflasterarbeiten Hof",
  "taetigkeit": "Unterbau verdichtet, 35 m² Pflaster verlegt",
  "zeiten":   [{ "mitarbeiterId": "SV00000102", "stunden": 8, "lohnartId": "SV00000101" }],
  "material": [{ "bezeichnung": "Betonpflaster grau", "menge": 35, "einheit": "m²" }],
  "standort": { "lat": 49.4093, "lng": 8.6942 },
  "notizen": "Kunde wünscht Nachbesserung an der Kante.",
  "fotos": [{ "name": "foto-1.jpg", "mimeType": "image/jpeg", "base64": "/9j/4AAQ…" }]
}
```

Antwort `201`: `{ "id": "SV00000210" }`. Der Server sollte `lokaleId` speichern
und bei erneutem Empfang derselben `lokaleId` **idempotent** dieselbe ID
zurückgeben (die App sendet nach Verbindungsabbrüchen erneut).

Fehler `4xx/5xx` mit `{ "message": "…" }` → der Rapport bleibt auf dem Gerät und
zeigt die Meldung an; der Nutzer kann die Übertragung wiederholen.
