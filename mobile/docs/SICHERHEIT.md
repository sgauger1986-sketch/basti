# Sicherheitskonzept der mobilen App

Ziel: Kundendaten, Kalkulationen und Baustellenfotos dürfen das Gerät nur
verschlüsselt verlassen und auf dem Gerät nur verschlüsselt liegen. Unten steht,
was die App dafür tut, wie es technisch umgesetzt ist und was **nicht** in der
App selbst gelöst werden kann.

## 1. Daten auf dem Gerät (Data at Rest)

| Was | Wie |
|---|---|
| Datenbestand (Projekte, LVs, Adressen, Stammdaten) | AES-256-GCM-verschlüsselt in AsyncStorage (`src/security/tresor.ts`, `src/data/storage.ts`) |
| Mobil erfasste Rapporte | AES-256-GCM-verschlüsselt in AsyncStorage |
| Fotos | Sofort nach Aufnahme AES-256-GCM-verschlüsselt im App-Dokumentordner abgelegt (`.enc`); das unverschlüsselte Original aus dem Kamera-Cache wird gelöscht; EXIF-/GPS-Metadaten werden nicht übernommen (`src/security/fotoTresor.ts`) |
| Einstellungen | verschlüsselt wie oben |
| Sitzung / Zugangs-Token | direkt im iOS Keychain bzw. Android Keystore-gesicherten Speicher (`expo-secure-store`), Zugriffsklasse *WhenUnlockedThisDeviceOnly* |
| Geräteschlüssel (256 Bit) | wird beim ersten Start zufällig erzeugt und **nur** im Keychain/Keystore gespeichert – nie in AsyncStorage, nie in Logs, nie im Datenbestand, nicht in Backups |

Eigenschaften:
- **Frische Nonce pro Datensatz**, GCM-Authentifizierung erkennt jede Manipulation.
- **Kryptografisches Löschen:** Bei „Abmelden“ oder „Alle Daten auf diesem Gerät
  löschen“ werden Daten, Fotos, Sitzung **und der Geräteschlüssel** vernichtet.
  Forensisch wiederhergestellte Reste sind ohne Schlüssel wertlos.
- Zusätzlich greift die Geräteverschlüsselung des Betriebssystems (iOS Data
  Protection, Android File-Based Encryption).
- **Keine Backups:** `android.allowBackup = false`; auf iOS liegt der Schlüssel
  in der Keychain-Klasse *ThisDeviceOnly* und wird nicht in iCloud übertragen,
  verschlüsselte Daten ohne Schlüssel sind wertlos.
- Der Demo-Datenbestand ist in der App eingebettet. Er stammt aus der
  Demo-Datenbank und enthält keine echten Kundendaten.

## 2. Zugriff auf die App

- **App-Sperre** (Standard: an): Beim Start und nach einstellbarer Zeit im
  Hintergrund (sofort / 1 / 5 / 15 Minuten) muss per Face ID, Touch ID,
  Fingerabdruck oder Gerätecode entsperrt werden (`src/security/AppSperre.tsx`).
  Ist auf dem Gerät keine Bildschirmsperre eingerichtet, weist die App darauf hin.
- **Sichtschutz:** Sobald die App in den Hintergrund geht, wird der Inhalt
  abgedeckt. Im App-Switcher sind keine Kundendaten sichtbar.
- **Screenshot-Schutz** (Standard: an): Android `FLAG_SECURE` (keine Screenshots,
  keine Bildschirmaufnahme, kein Vorschaubild), iOS Aufnahme-Schwärzung und
  App-Switcher-Schutz (`expo-screen-capture`).

## 3. Übertragung (Data in Transit)

- **Nur HTTPS.** `http://` wird bei der Anmeldung abgelehnt; einzige Ausnahme
  sind Entwicklungs-Builds zu lokalen Adressen (`localhost`, `10.x`, `192.168.x`).
- iOS App Transport Security ohne Ausnahmen (`NSAllowsArbitraryLoads = false`),
  Android `usesCleartextTraffic = false`.
- Token als `Authorization: Bearer` – nie in URLs, nie in Logs.
- Fotos werden im Arbeitsspeicher entschlüsselt und direkt im JSON-Body
  übertragen. Es entsteht zu keinem Zeitpunkt eine unverschlüsselte Datei.
- Rapporte werden idempotent über `lokaleId` gesendet, damit Wiederholungen nach
  Verbindungsabbruch keine Duplikate erzeugen.

## 4. Keine Leaks über Nebenkanäle

- **Logs:** Im Release-Build entfernt Babel alle `console.*`-Aufrufe. Im Code
  werden ohnehin keine Daten geloggt.
- **Tastatur:** Keine Autokorrektur für Zugangsdaten (`autoCorrect=false`,
  `secureTextEntry`).
- **Zwischenablage:** Die App schreibt nichts in die Zwischenablage.
- **Fotos:** Kamera-Aufnahmen landen nicht in der Galerie, sondern nur im Tresor.
- **Code:** Android-Release mit ProGuard/R8 (Verkleinerung und Verschleierung),
  JavaScript liegt als Hermes-Bytecode vor.
- **Berechtigungen:** nur Kamera, Fotos, Standort (nur bei Nutzung), Biometrie.
  Kein Zugriff auf Kontakte, Mikrofon, Hintergrund-Standort.

## 5. Was die App allein nicht leisten kann

Diese Punkte gehören zum Gesamtsystem und sind hier bewusst benannt:

1. **Server/Backend:** Verschlüsselte Datenbank, Mandantentrennung, kurze
   Token-Laufzeiten mit Erneuerung, Rate-Limiting am Login, Protokollierung.
   Vertrag in [`API.md`](API.md).
2. **Zertifikats-Pinning:** Schützt vor manipulierten Root-Zertifikaten auf
   verwalteten Geräten. Mit Expo möglich (natives Modul), kostet aber jedes Mal
   ein App-Update, wenn das Server-Zertifikat wechselt. Empfehlung: einführen,
   sobald die Server-Domain endgültig feststeht.
3. **Jailbreak/Root-Erkennung:** Nur als Warnhinweis sinnvoll, nie als harte
   Sperre (leicht umgehbar, viele Fehlalarme).
4. **Mobile Device Management (MDM):** Bei Firmengeräten Geräteverschlüsselung
   und Code-Sperre per MDM erzwingen.
5. **Ende-zu-Ende-Verschlüsselung** (Server sieht nur Chiffrate) ist mit einer
   Büro-Software, die Daten auswerten und drucken muss, nicht vereinbar. Der
   Server muss den Daten vertrauen dürfen – daher gehört er in ein deutsches
   Rechenzentrum mit AVV (siehe `../../CLOUD-STRATEGIE.md`).
6. **Web-Variante:** Der Web-Build dient nur der Entwicklung. Dort gibt es keinen
   Schlüsselbund; der Schlüssel liegt im Browser-Speicher. Nicht ausliefern.

## 6. Prüfen

```bash
npm test          # enthält Tresor-Tests: Roundtrip, Manipulation, falscher Schlüssel
```

Manuelle Checkliste vor einem Release:
- [ ] Android: `adb backup` liefert keine App-Daten (allowBackup aus).
- [ ] Screenshot in der App wird blockiert (Android) bzw. geschwärzt (iOS).
- [ ] App-Switcher zeigt nur das Logo.
- [ ] Nach „Abmelden“ ist AsyncStorage leer und der Ordner `fotos/` gelöscht.
- [ ] Anmeldung an `http://…` wird abgelehnt.
- [ ] Release-Build enthält keine `console.log`-Ausgaben (Logcat / Console.app).
