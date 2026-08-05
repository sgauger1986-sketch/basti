# mexXsoft X2 Cloud — Offline & Online in einer Anwendung

**Ziel erreicht in dieser Ausbaustufe:** X2 als echte Web-Anwendung, die
**offline genauso funktioniert wie online** — auf jedem Gerät (Windows, Mac,
Tablet, Smartphone), ohne Installation, mit automatischer Synchronisation
zwischen allen Geräten eines Mandanten.

```
┌────────── Gerät A (Büro-PC) ──────────┐      ┌────────── Gerät B (Tablet) ───────────┐
│  Browser / installierte PWA           │      │  Browser / installierte PWA           │
│  ├─ App-Hülle (Service Worker Cache)  │      │  ├─ App-Hülle (Service Worker Cache)  │
│  ├─ Komplette Daten in IndexedDB      │      │  ├─ Komplette Daten in IndexedDB      │
│  └─ Outbox (lokale Änderungen)        │      │  └─ Outbox (lokale Änderungen)        │
└───────────────┬───────────────────────┘      └───────────────┬───────────────────────┘
                │  HTTPS, Bearer-Token                         │
                ▼                                              ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  Sync-Server (Node.js, ohne Abhängigkeiten)                  │
        │  ├─ /api/login   Anmeldung (PBKDF2-Hashes, Rate-Limit)       │
        │  ├─ /api/sync    Push (Outbox) + Pull (Änderungen seit Rev)  │
        │  └─ Pro Mandant: revisioniertes Änderungsprotokoll           │
        │     (append-only, "letzte Änderung gewinnt")                 │
        └──────────────────────────────────────────────────────────────┘
```

## Wie das Offline+Online-Prinzip funktioniert ("Offline-First")

1. **Die App arbeitet immer lokal.** Alle 1300+ Datensätze liegen in der
   Browser-Datenbank (IndexedDB). Lesen, Suchen, Anlegen, Ändern — alles
   funktioniert sofort und ohne Netz, z. B. auf der Baustelle.
2. **Die App-Hülle ist installierbar (PWA).** Ein Service Worker speichert
   HTML, JavaScript und Icons; die App startet auch im Flugmodus. Über
   "Zum Startbildschirm hinzufügen" wird sie zur App auf Tablet/Handy/Desktop.
3. **Jede Änderung landet in einer Outbox.** Ist der Server erreichbar, wird
   automatisch synchronisiert: bei Netzwiederkehr, nach jeder Änderung
   (2,5 s Entprellung) und alle 60 Sekunden.
4. **Der Server führt das Änderungsprotokoll.** Jede akzeptierte Änderung
   erhält eine fortlaufende Revisionsnummer. Geräte holen sich "alles seit
   meiner letzten Revision" — so bleiben beliebig viele Geräte synchron.
5. **Konflikte:** "Letzte Änderung gewinnt" (Zeitstempel-Vergleich pro
   Datensatz). Für die nächste Ausbaustufe ist feldweises Zusammenführen
   vorgesehen (siehe Roadmap).

## Sicherheit

- **Anmeldung pro Mandant/Benutzer**, Passwörter nur als PBKDF2-Hash
  (210 000 Iterationen, Zufalls-Salt) gespeichert; Vergleich zeitkonstant.
- **Bearer-Token** (30 Tage gleitend), Brute-Force-Bremse am Login
  (max. 30 Versuche / 15 Min pro IP).
- **Mandantentrennung:** jeder Mandant hat sein eigenes Änderungsprotokoll
  in einem eigenen Verzeichnis — kein Querzugriff möglich.
- **HTTPS:** in Produktion hinter Caddy/nginx (Let's-Encrypt) betreiben oder
  `TLS_CERT`/`TLS_KEY` direkt setzen. Details in `server/README.md`.
- **DSGVO:** Hosting in Deutschland empfohlen (Hetzner, IONOS, netcup),
  AVV mit Kunden abschließen; Datenhaltung pro Mandant erleichtert Auskunft
  und Löschung.

## Was in dieser Ausbaustufe enthalten ist

| Bereich | Stand |
|---|---|
| Dashboard, Projekte, LVs mit Positionsbaum, Mitarbeiter, Stammdaten | vollständig (lesend), aus echten Demo-Daten |
| **Adressen** | **anlegen, bearbeiten, löschen — offline & online** |
| **Rapporte** | **anlegen, bearbeiten — offline & online** (Baustellen-Szenario) |
| Offline-Betrieb | komplett: App-Start, Lesen, Schreiben ohne Netz |
| Synchronisation | automatisch, mehrgeräte-fähig, getestet (E2E) |
| Installierbar (PWA) | ja, mit Icons und Manifest |
| Mehrmandanten-Server | ja, mit Benutzerverwaltung per Kommandozeile |

## Roadmap (nächste Ausbaustufen)

1. **Weitere Module schreibbar machen** — Projekte und LV-Positionen anlegen/
   bearbeiten (gleiches Outbox-Muster, pro Modul wenige Tage Aufwand).
2. **Benutzer- und Rechteverwaltung im Web** statt Kommandozeile
   (Admin-Bereich, Rollen: Büro / Bauleiter / Monteur).
3. **Feldweises Konflikt-Zusammenführen** statt "letzte Änderung gewinnt",
   plus Änderungshistorie je Datensatz (aus dem Protokoll bereits ableitbar).
4. **PDF-Belege** (Angebot/Rechnung) serverseitig erzeugen.
5. **Server-Datenbank auf PostgreSQL/SQLite umstellen**, sobald Datenmengen
   oder Mehrbenutzer-Last es erfordern — die Sync-API bleibt unverändert.
6. **Import aus der Advantage-DB der Bestandskunden** (`tools/adt_read.py`
   liefert die Grundlage: .adt → JSON → Änderungsprotokoll des Mandanten).

## Schnellstart

```bash
cd server
node server.js
# → http://localhost:8080  (Demo-Zugang: Mandant "demo", Benutzer "demo", Passwort "demo")
```

In der App links unten **"Mit Cloud verbinden"** wählen — ab dann wird
automatisch synchronisiert. Ohne Verbindung arbeitet die App rein lokal weiter.
