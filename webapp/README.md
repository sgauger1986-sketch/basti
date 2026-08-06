# mexXsoft X2 Cloud — Web-App (Offline-First-PWA)

Die Web-Version von mexXsoft X2: läuft in jedem modernen Browser, ist als App
installierbar und funktioniert **offline genauso wie online**.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `index.html` | App-Hülle: Oberfläche, Design (hell/dunkel), Modale, Sync-Status |
| `js/db.js` | Lokale Datenbank (IndexedDB) + Outbox für ungesendete Änderungen |
| `js/sync.js` | Anmeldung, Push/Pull-Synchronisation, Online/Offline-Erkennung |
| `js/app.js` | Module: Dashboard, Projekte, LVs, Rapporte, Adressen, Mitarbeiter, Stammdaten |
| `sw.js` | Service Worker: App startet auch ohne Netz |
| `manifest.webmanifest`, `icons/` | Installierbarkeit als App (PWA) |
| `data/seed.json` | Demo-Datenbestand (1309 Datensätze aus der echten X2-Demo-DB) |

## Nutzung

- **Mit Server (empfohlen):** `cd ../server && node server.js` → `http://localhost:8080`.
  Links unten "Mit Cloud verbinden" (Demo: `demo` / `demo` / `demo`) — danach
  synchronisieren alle Geräte desselben Mandanten automatisch.
- **Ohne Server:** jeder statische Webspace genügt (App arbeitet dann rein
  lokal auf dem Gerät). `file://` funktioniert eingeschränkt (kein Service
  Worker) — besser über einen kleinen HTTP-Server öffnen.

## Bearbeitbare Module in dieser Ausbaustufe

- **Adressen:** anlegen, bearbeiten, löschen
- **Rapporte:** anlegen, bearbeiten (inkl. Projekt-Zuordnung und Prüf-Status)

Alle übrigen Module zeigen den vollständigen Demo-Datenbestand lesend an.
Änderungen funktionieren offline und werden bei nächster Verbindung
automatisch übertragen (Status-Pille oben rechts zeigt den Zustand).
