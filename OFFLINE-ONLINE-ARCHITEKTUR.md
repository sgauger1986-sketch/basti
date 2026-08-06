# mexXsoft X2 — Büro (Delphi) + Web-Version mit sofortiger Synchronisation

**Das Prinzip:** Die bewährte Delphi-Version von mexXsoft **bleibt unverändert
im Büro im Einsatz**. Neu hinzu kommt eine **Web-Version**, mit der Kunden von
überall arbeiten können — Baustelle, Homeoffice, unterwegs, auf jedem Gerät.
Beide Welten synchronisieren sich **sofort** über einen zentralen Cloud-Server.

```
   BÜRO (bleibt wie bisher)                      UNTERWEGS / ÜBERALL
┌──────────────────────────────┐        ┌─────────────────────────────────┐
│  mexXsoft X2 (Delphi, .exe)  │        │  Web-Version (Browser / PWA)    │
│  Advantage-Datenbank (.adt)  │        │  Handy · Tablet · Mac · PC      │
│            │                 │        │  arbeitet auch OFFLINE weiter   │
│            ▼                 │        │  (Baustelle ohne Empfang)       │
│  ┌────────────────────────┐  │        └───────────────┬─────────────────┘
│  │ Büro-Connector         │  │                        │ HTTPS + Token
│  │ (connector/, Python)   │  │                        │
│  │ liest .adt, sekunden-  │  │                        ▼
│  │ schneller Abgleich     │◄─┼────────►┌──────────────────────────────┐
│  │ Web-Änderungen →       │  │  HTTPS  │  Cloud-Sync-Server           │
│  │ "webeingang/"-Ordner   │  │         │  (server/, Node.js ohne      │
│  └────────────────────────┘  │         │   Abhängigkeiten)            │
└──────────────────────────────┘         │  · Login je Mandant/Benutzer │
                                         │  · revisioniertes Änderungs- │
                                         │    protokoll pro Mandant     │
                                         │  · Konflikte: letzte         │
                                         │    Änderung gewinnt          │
                                         └──────────────────────────────┘
```

## Die drei Bausteine (alle in diesem Repository, alle getestet)

### 1. `webapp/` — die Web-Version für unterwegs
- Läuft in jedem Browser, installierbar als App (PWA) auf Handy/Tablet/Desktop.
- **Offline-fähig:** kompletter Datenbestand lokal (IndexedDB); Lesen und
  Erfassen funktionieren ohne Empfang, Änderungen warten in einer Outbox und
  gehen bei Netzkontakt automatisch raus.
- Module: Dashboard, Projekte, Leistungsverzeichnisse mit Positionsbaum,
  Adressen (anlegen/ändern/löschen), Rapporte (anlegen/ändern), Mitarbeiter,
  Stammdaten.

### 2. `server/` — der Cloud-Sync-Server (Drehscheibe)
- Eine Datei Node.js, keine Abhängigkeiten — läuft auf jedem Mietserver
  (Hetzner/IONOS, Hosting in Deutschland empfohlen, DSGVO/AVV).
- Anmeldung je Mandant + Benutzer (PBKDF2-Passworthashes, Bearer-Token,
  Brute-Force-Bremse), strikte Mandantentrennung.
- Führt pro Mandant ein revisioniertes, nur-anhängendes Änderungsprotokoll;
  jedes Gerät holt „alles seit meiner letzten Revision“. Konflikte: letzte
  Änderung gewinnt (Zeitstempel), jede Änderung bleibt nachvollziehbar.
- Liefert zugleich die Web-App aus. HTTPS über Reverse-Proxy oder direkt.

### 3. `connector/` — die Brücke ins Büro
- Kleines Python-Programm auf dem Büro-PC neben mexXsoft; **kein Eingriff in
  die Delphi-Anwendung, nur Lesezugriff auf die .adt-Dateien**.
- Büro → Web: erkennt Änderungen sekundenschnell (Datei-Überwachung +
  Datensatz-Hashes) und überträgt sie sofort in die Cloud.
- Web → Büro: legt Web-Erfassungen als Prüfliste in `webeingang/` ab
  (JSON je Tabelle + lesbares Protokoll). Automatisches Zurückschreiben in
  die Produktiv-DB folgt als Ausbaustufe über die ADS-/ODBC-Schnittstelle.
- Erst-Übernahme der Bestandsdaten = einfach `--einmalig` laufen lassen.

## Typischer Ablauf im Alltag

1. Büro legt in mexXsoft (Delphi) ein Projekt an → Connector überträgt es
   binnen Sekunden → der Bauleiter sieht es sofort auf dem Tablet.
2. Der Bauleiter erfasst auf der Baustelle **ohne Empfang** einen Rapport und
   einen neuen Ansprechpartner → die Web-App speichert lokal.
3. Zurück im Netz überträgt die Web-App automatisch → das Büro findet beides
   in `webeingang/` mit Protokoll und übernimmt es in mexXsoft.

## Getestet (automatisiert, Chromium + API)

- Web-App: Offline-Neustart, Offline-Erfassung, automatischer Abgleich bei
  Netzwiederkehr, zweites Gerät empfängt alles.
- Connector: Erst-Übernahme (1309 Datensätze), Änderungs-Erkennung,
  Web-Eingang mit Protokoll, Idempotenz, Löschungs-Abgleich inkl. Schutz
  reiner Web-Datensätze.
- Server: Login/Fehlanmeldung, Token-Pflicht, Konfliktregel, Mandanten-Seed,
  Schutz gegen Pfad-Zugriffe.

## Roadmap

1. **ADS-/ODBC-Schreibanbindung** im Connector: Web-Änderungen automatisch in
   die Advantage-DB zurückschreiben (auf Windows mit Advantage-ODBC-Treiber),
   dann ist der Kreislauf voll-automatisch in beide Richtungen.
2. Weitere Module in der Web-App schreibbar machen (Projekte, LV-Positionen).
3. Benutzer-/Rechteverwaltung im Web (Rollen: Büro, Bauleiter, Monteur).
4. Feldweises Konflikt-Zusammenführen + Änderungshistorie je Datensatz.
5. PDF-Belege (Angebot/Rechnung) serverseitig erzeugen.
6. Server-Datenhaltung auf PostgreSQL/SQLite heben, wenn die Last es erfordert
   (Sync-API bleibt gleich).

## Schnellstart (alles lokal ausprobieren)

```bash
# 1. Cloud-Server starten
cd server && node server.js          # → http://localhost:8080

# 2. Web-App im Browser öffnen, links unten "Mit Cloud verbinden"
#    (Demo-Zugang: demo / demo / demo)

# 3. Büro-Connector starten (hier im Testmodus mit den Demo-Daten;
#    im Echtbetrieb: --db <mexXsoft-Datenverzeichnis>)
cd connector && python3 buero_connector.py \
    --simulate ../webapp/data/seed.json --server http://localhost:8080
```
