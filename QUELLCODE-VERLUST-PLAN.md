# X2 ohne Quellcode — Handlungsplan

**Lage:** Der Quellcode von mexXsoft X2 ist nicht verfügbar (Entwickler hat das
Unternehmen verlassen, Code nicht übergeben). Vorhanden sind: die kompilierte
Anwendung (.exe), die Installationspakete und die Kundendatenbanken.

Das ist ein bekanntes, lösbares Szenario — aber es braucht drei parallele Spuren:

---

## Spur 1 — Quellcode zurückholen (sofort starten, höchste Priorität)

### Rechtlich
- Software, die ein **angestellter** Entwickler im Rahmen seines Arbeitsverhältnisses
  erstellt hat, gehört dem Arbeitgeber (§ 69b UrhG). Der Ex-Mitarbeiter muss
  Quellcode und Unterlagen herausgeben.
- Bei einem **Freelancer** entscheidet der Vertrag — Verträge und Rechnungen prüfen
  (Stichworte: Nutzungsrechte, Werkvertrag, Herausgabe).
- Vorgehen: erst freundlich um Übergabe bitten (oft die schnellste Lösung, ggf.
  gegen Vergütung einer geordneten Übergabe), parallel anwaltlich beraten lassen
  (IT-Recht). Fristsetzung per Anwaltsschreiben ist der zweite Schritt.

### Suchen — der Code liegt oft noch irgendwo
- [ ] Alte Entwickler-Rechner/Notebooks der Firma (auch ausgemusterte)
- [ ] Server-/NAS-Backups, alte Backup-Bänder/Platten
- [ ] Versionsverwaltung: gab es einen SVN-/Git-/TFS-Server? Auch gehostet
      (GitHub, Bitbucket, Azure DevOps) — Zugänge/Rechnungen prüfen
- [ ] Der Rechner, auf dem die **Setups gebaut** wurden (Installer-Skripte,
      oft liegt daneben der komplette Quellbaum)
- [ ] E-Mail-Postfächer (Code-Anhänge, Zugangsdaten), USB-Sticks, Cloud-Speicher
      der Firma
- [ ] Typische Delphi-Pfade auf alten Maschinen: `C:\Projekte`, `C:\Entwicklung`,
      `Dokumente\Embarcadero\Studio\Projects`; Dateiendungen: `.dpr`, `.dproj`,
      `.pas`, `.dfm`

---

## Spur 2 — Cloud-Variante trotzdem jetzt anbieten (ohne Quellcode möglich)

Die Streaming-Lösung aus `CLOUD-STRATEGIE.md` Phase 1 braucht in der
No-Code-Variante **keinen Eingriff in die Anwendung**:

- **Windows Server + Remotedesktopdienste (RDS)** mit HTML5-Gateway, oder
  **Apache Guacamole** / **Parallels RAS** davor → X2 läuft unverändert auf dem
  Server, Kunden arbeiten im Browser (auch am Mac).
- Pro Kunde eine isolierte VM mit eigener Datenbank, Hosting in Deutschland,
  AVV, automatische Backups.
- Einschränkung gegenüber der Thinfinity-VirtualUI-Variante: kein nahtloses
  "App-Fenster im Browser", sondern Desktop-Sitzung — für den Start völlig
  ausreichend und sofort verkaufbar.

> Damit ist das Geschäftsziel "Cloud anbieten" **unabhängig vom Quellcode-Problem**
> kurzfristig erreichbar.

---

## Spur 3 — Produkt-Zukunft sichern (Neubau vorbereiten)

Ohne Quellcode sind **keine Fehlerbehebungen und keine Anpassungen** mehr möglich
(auch keine gesetzlichen: Steuer-/GoBD-Änderungen, Schnittstellen-Updates).
Selbst wenn Spur 1 Erfolg hat, zeigt der Vorfall: Das Produkt braucht eine
tragfähige, dokumentierte Basis. Drei Bausteine machen den Neubau realistisch:

1. **Die Datenbank ist vollständig vorhanden.** Schema, Tabellen, Beziehungen und
   echte Daten sind lesbar — das ist das halbe Fachkonzept. Aus der DB lässt sich
   das Datenmodell der neuen Web-Version direkt ableiten und Bestandsdaten
   können übernommen werden.
2. **Aus der .exe ist mehr rekonstruierbar als gedacht.** Delphi-Binärdateien
   enthalten die kompletten Formular-Definitionen (DFM-Ressourcen): alle Masken,
   Felder, Beschriftungen, Ereignis-Zuordnungen lassen sich zu 100 % extrahieren
   (Werkzeuge: Resource-Extraktion, Interactive Delphi Reconstructor). Die
   eigentliche Geschäftslogik liegt nur als Maschinencode vor — sie muss anhand
   des laufenden Programms fachlich neu beschrieben und neu implementiert werden.
   Rechtlich unproblematisch, da es die eigene Software ist.
3. **Das laufende Programm als Referenz.** Jede Maske, jeder Ablauf, jeder
   Ausdruck kann am Altsystem nachvollzogen und dokumentiert werden, solange es
   in der Streaming-Cloud weiterläuft.

**Empfehlung:** Neubau als echte Web-Anwendung (mehrmandantenfähig, Abo-Modell),
modulweise, beginnend mit Stammdaten → Angebote/Rechnungen → Spezialmodule.
Die Streaming-Cloud aus Spur 2 überbrückt die gesamte Übergangszeit.

---

## Konkrete nächste Schritte

1. Checkliste in Spur 1 abarbeiten; anwaltliche Erstberatung terminieren.
2. Die X2-Installationsdateien (.exe/Setup) und eine **Leer- oder Testdatenbank**
   (keine echten Kundendaten!) in dieses Repository legen → daraus werden
   Delphi-Version, Komponenten, Formulare und das Datenbankschema analysiert
   und dokumentiert.
3. Streaming-Pilot (Spur 2) auf einem Testserver aufsetzen.
4. Nach der Analyse: Aufwandsschätzung und Modul-Roadmap für den Neubau.
