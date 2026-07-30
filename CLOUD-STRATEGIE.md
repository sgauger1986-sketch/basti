# mexXsoft X2 — Strategie für eine Cloud-Variante

**Ziel:** Bestandskunden und Neukunden eine Cloud-Variante von mexXsoft X2 anbieten —
nutzbar im Browser auf jedem Gerät (Windows, Mac, Tablet), ohne lokale Installation.

**Ausgangslage:** X2 ist eine gewachsene Delphi-Anwendung (VCL, Windows-Desktop).
Eine .exe lässt sich nicht in eine Web-Anwendung "umwandeln" — aber mit dem
vorhandenen Quellcode gibt es bewährte Migrationswege. Empfohlen wird ein
**zweistufiges Vorgehen**: schnell verkaufbar starten, parallel die echte
Web-Version aufbauen.

---

## Phase 1 — "X2 Cloud" per Application-Streaming (Zeithorizont: Wochen)

Die bestehende Windows-Anwendung läuft unverändert auf Servern im Rechenzentrum;
Kunden bedienen sie im Browser. Kein Eingriff in die Codebasis nötig bzw. minimal.

### Option A: Thinfinity VirtualUI (Cybele Software) — Empfehlung für Phase 1
- Eine DLL/Unit wird in die Delphi-Anwendung eingebunden (wenige Zeilen Code);
  die VCL-Oberfläche wird pro Nutzer-Sitzung als HTML5 in den Browser gestreamt.
- Explizit für Delphi/VCL-Anwendungen gebaut; Mehrbenutzer-Gateway, Load-Balancing
  und Session-Management sind enthalten.
- Vorteile: schnellste Time-to-Market, ein Installationsstand für alle Kunden,
  zentrale Updates, sofort "Cloud" verkaufbar.
- Nachteile: Desktop-UI im Browser (kein responsives Web-Design), Lizenzkosten
  pro Server/Named User, Skalierung = mehr Server-RAM pro Sitzung.

### Option B: Terminalserver / RDS oder Azure Virtual Desktop
- Klassisches Hosting: Windows Server + RDS-Lizenzen, Zugriff per RDP-Client oder
  HTML5-Gateway (z. B. Apache Guacamole, Parallels RAS).
- Vorteile: etablierte Technik, keinerlei Codeänderung, volle Kompatibilität.
- Nachteile: RDS-CALs und Windows-Lizenzen, "Remote-Desktop-Gefühl" statt
  App-Gefühl, pro Kunde mehr Administrationsaufwand.

### Architektur Phase 1 (pro Mandant)
```
Kunde (Browser) ──HTTPS──▶ Gateway (Thinfinity/Guacamole)
                              │
                              ▼
                      Windows-/Wine-Server
                      ├─ X2.exe (Sitzung je Nutzer)
                      └─ Datenbank des Kunden
                              │
                              ▼
                      Backup + Monitoring
```
- **Pro Kunde eine isolierte Umgebung** (VM oder Container): saubere Datentrennung,
  einfaches Backup, individuelle Versionen möglich.
- Hosting in Deutschland (z. B. Hetzner, IONOS, netcup oder eigenes RZ) wegen
  DSGVO; Auftragsverarbeitungsvertrag (AVV) mit den Kunden abschließen.

---

## Phase 2 — Echte Web-Version (Zeithorizont: Monate, modulweise)

Parallel zu Phase 1 wird X2 schrittweise zur echten Web-Anwendung. Drei Wege,
alle mit Wiederverwendung der bestehenden Delphi-Geschäftslogik möglich:

| Kriterium | uniGUI (FMSoft) | TMS WEB Core + XData | Neubau (REST + modernes Frontend) |
|---|---|---|---|
| Sprache/Team | bleibt Delphi | bleibt Delphi | Backend frei (auch Delphi), Frontend TypeScript |
| Wiederverwendung Logik | hoch (Datenmodule, Business-Code) | mittel–hoch (Logik in REST-Server) | mittel (Logik wird portiert) |
| UI | Web-Formulare, an VCL angelehnt | neue Web-UI, zu JS kompiliert | komplett frei, responsiv, mobil |
| Mandantenfähigkeit | selbst zu bauen | selbst zu bauen | von Anfang an einplanbar |
| Aufwand | mittel | mittel–hoch | hoch |
| Zukunftssicherheit | mittel | mittel–hoch | hoch |

**Empfehlung:** Entscheidung erst nach Code-Analyse. Faustregel:
- Liegt die Geschäftslogik sauber getrennt in Datenmodulen → uniGUI oder
  TMS XData sind sehr effizient.
- Ist Logik stark mit Formularen verwoben (Event-Handler-Code) → der Aufwand
  ist bei allen Wegen ähnlich, dann lieber gleich sauber neu (REST + Web-Frontend)
  und die alte Anwendung als fachliche Referenz nutzen.

**Modulreihenfolge:** mit einem lesenden/überschaubaren Modul starten
(z. B. Auswertungen oder Kundenstamm), dann Angebots-/Rechnungswesen, zuletzt
komplexe Module (Kalkulation, Aufmaß). Jedes fertige Web-Modul kann die
Streaming-Variante schrittweise ablösen.

---

## Querschnittsthemen (für beide Phasen)

- **Datenbank:** zentrale, gehostete DB je Mandant (Firebird/MS SQL — je nachdem,
  was X2 heute nutzt). Backups automatisiert, Restore-Test regelmäßig.
- **Drucken/PDF:** in der Cloud werden Ausdrucke zu PDF-Downloads — Reportwesen
  darauf prüfen.
- **Schnittstellen:** DATEV-Export, GAEB, E-Mail-Versand usw. müssen serverseitig
  funktionieren (keine lokalen Pfade/Drucker/COM-Abhängigkeiten).
- **Lizenzmodell:** Cloud = Abo (pro Nutzer/Monat). Preisfindung: Hosting-Kosten
  pro Nutzer + Marge; Streaming-Lizenzen (Phase 1) einkalkulieren.
- **Sicherheit:** HTTPS überall, 2-Faktor-Login am Gateway, Sitzungs-Timeouts,
  Mandantentrennung, DSGVO-Dokumentation.
- **Mobile Apps:** die bestehenden iOS/Android-Apps mit Offline-Sync bleiben
  unberührt und ergänzen die Cloud-Variante.

---

## Nächste Schritte

1. **Quellcode-Analyse:** repräsentativen Teil des X2-Quellcodes in dieses
   Repository legen (Hauptprojekt, 2–3 typische Formulare, ein Datenmodul).
   Daraus folgt die belastbare Empfehlung für Phase 2 inkl. Aufwandsschätzung.
2. **Eckdaten klären:** Delphi-Version, Datenbank, Anzahl Units/Formulare,
   externe Komponenten (Report-Engine, Grids, GAEB-Bibliotheken).
3. **Phase-1-Pilot:** Thinfinity-VirtualUI-Testlizenz mit einem X2-Build auf
   einem Testserver evaluieren (Kompatibilität, Performance, Druck).
4. **Pilotkunde** für die Cloud-Variante auswählen und Feedbackschleife aufsetzen.
