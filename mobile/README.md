# Mobile App (iOS & Android)

Native App für Baustelle und Außendienst, gebaut mit **Expo / React Native**
(TypeScript). Ein Code für iOS und Android; Builds für beide Stores laufen über
EAS Build in der Cloud – **ein Mac ist nicht nötig**.

Gestaltung: Schrift **Inter**, Markengrün mit Verlaufsflächen, Karten mit weichen
Schatten, Hell-/Dunkelmodus, Bildwelten aus Higgsfield (siehe unten).

## Zwei Betriebsmodi (`brand.js` → `startModus`)

| Modus | Was passiert |
|---|---|
| **`web`** (Standard) | **Hülle um die bestehende heywerki-Web-Oberfläche.** Die App lädt `webAppUrl` in einer nativen Ansicht und ergänzt: eigenes Icon und Splash, App-Sperre, Screenshot-Schutz, Push-Benachrichtigungen, Teilen, Haptik, Offline-Anzeige, Zurück-Taste, Telegram-Kompatibilitätsschicht. Details: [`docs/WEB-BRUECKE.md`](docs/WEB-BRUECKE.md). |
| **`erp`** | Native Bildschirme (Projekte, Leistungsverzeichnisse, Rapporte, Adressen) gegen ein eigenes Backend nach [`docs/API.md`](docs/API.md). Basis für die schrittweise Ablösung der Hülle. |

## Was die App kann (ERP-Modus)

| Bereich | Funktionen |
|---|---|
| Start | Kennzahlen (Angebots-/Auftragsvolumen, offen, fakturiert), laufende Projekte, eigene offene Rapporte |
| Projekte | Suche, Statusfilter, Detail mit Eckdaten, Fortschrittsbalken, Leistungsverzeichnisse, Rapporte; Kunde anrufen / mailen / Navigation starten |
| Leistungsverzeichnisse | Vollständiger hierarchischer Positionsbaum (auf-/zuklappbar), Suche über OZ und Kurztext, Mengen, EP, Gesamtpreise |
| Rapporte | Tagesberichte direkt auf der Baustelle: Arbeitszeiten je Mitarbeiter und Lohnart, Material, Fotos (Kamera/Galerie), GPS-Standort, Notizen. Auto-Speichern, Plausibilitätsprüfung, Übertragungswarteschlange |
| Adressen | Suche, Detail, Anrufen / E-Mail / Navigation / Website, zugehörige Projekte |
| Mehr | Mitarbeiter mit Löhnen/Verrechnungssätzen, Einheiten / MwSt / Lohnarten, Einstellungen (Hell/Dunkel, Standard-Mitarbeiter, Server), Über |

**Offline-first:** Alle Daten liegen lokal. Ohne Netz kann weiter gearbeitet
werden; Rapporte werden übertragen, sobald ein Server erreichbar ist.

**Sicherheit (Details in [`docs/SICHERHEIT.md`](docs/SICHERHEIT.md)):**
- Alle Daten, Rapporte und Fotos liegen **AES-256-GCM-verschlüsselt** auf dem Gerät;
  der Schlüssel nur im iOS Keychain / Android Keystore, nicht in Backups.
- **App-Sperre** per Face ID / Fingerabdruck / Gerätecode, Sichtschutz im
  App-Switcher, Screenshot-Schutz.
- **Nur HTTPS**, keine Klartext-Verbindungen, keine Logs im Release-Build,
  keine EXIF-/GPS-Daten in Fotos.
- „Abmelden“ vernichtet Daten **und** Schlüssel (kryptografisches Löschen).

**Zwei Betriebsarten:**
- **Demo-Modus** – eingebettete Daten der Demo-Datenbank (dieselben wie im
  Web-Prototyp), komplett offline. Zum Zeigen und Testen.
- **Server-Modus** – Anmeldung am Cloud-Backend, Schnittstelle in [`docs/API.md`](docs/API.md).

## Umbenennen (Name, Bundle-ID, Farben)

Alles Markenbezogene steht in **einer Datei: [`brand.js`](brand.js)**.
Name, Claim, URL-Schema, Bundle-IDs, Support-Adresse, Farben. Danach:

```bash
python3 scripts/icons-erzeugen.py   # Icons/Splash in neuer Farbe
npx expo prebuild --clean           # nur falls native Ordner ios/android existieren
```

> **Wichtig:** `iosBundleId` und `androidPackage` lassen sich nach dem ersten
> Store-Upload **nicht mehr ändern**. Den endgültigen Namen also vor dem ersten
> Release festlegen (Reverse-Domain, z. B. `de.neuername.app`).

## Bildwelten (Icon, Login-Hintergrund, Illustrationen)

Die Bildwelten wurden mit **Higgsfield** (Modell GPT Image 2.5) erzeugt:

| Bild | Verwendung | Higgsfield-Job |
|---|---|---|
| App-Icon (Sechskant-Mutter mit Blatt, Markengrün) | `assets/quelle/icon.png` → Icon, Adaptive-Icon, Splash, Favicon | `517e209f-a9cf-4291-8de1-b98322fed5bd` |
| Natursteinterrasse im Morgenlicht (9:16) | `assets/quelle/hero.png` → Login-Hintergrund | `3d4c9791-a98c-4157-9375-9a4be8a82552` |
| Klemmbrett mit Pflanze (transparent) | `assets/quelle/leer.png` → Leerzustände | `d75a5c95-9457-4da4-8283-c015b8b93767` |

Die Dateien im Repository sind **Platzhalter** (aus `scripts/icons-erzeugen.py`),
weil das Higgsfield-CDN aus der Build-Umgebung nicht erreichbar war. Übernahme
der echten Bilder:

1. Die drei Bilder aus dem Higgsfield-Verlauf herunterladen und als
   `assets/quelle/icon.png`, `assets/quelle/hero.png`, `assets/quelle/leer.png` ablegen.
2. `node scripts/bilder-anpassen.js` ausführen – erzeugt alle Größen in `assets/`
   (nutzt `jimp-compact`, das mit Expo mitkommt; keine weitere Installation).

Neue Motive: gleiches Vorgehen, die Prompts stehen im Higgsfield-Verlauf.

## Entwicklung

```bash
cd mobile
npm install
npm start            # Expo Dev Server; QR-Code mit Expo Go (iOS/Android) scannen
npm run typecheck    # TypeScript
npm test             # Unit-Tests (Fachlogik, Mapping, Sync, API-Client)
npm run export       # Bundle für iOS und Android erzeugen (Smoke-Test ohne Geräte)
```

Zum Testen auf dem eigenen Handy reicht die **Expo Go**-App aus dem Store: `npm start`
und QR-Code scannen. Kamera, Fotos und GPS funktionieren dort bereits.

## Builds für die Stores (EAS)

Einmalig: Expo-Konto anlegen (expo.dev), dann

```bash
npm install -g eas-cli
eas login
eas init                       # trägt die projectId in app.config.ts ein
eas build --profile preview --platform all     # Test-Builds (APK + iOS intern)
eas build --profile production --platform all  # Store-Builds
eas submit --platform ios      # App Store Connect
eas submit --platform android  # Google Play
```

Profile stehen in [`eas.json`](eas.json). Für iOS braucht es ein Apple-Developer-
Konto (99 $/Jahr), für Android ein Google-Play-Entwicklerkonto (einmalig 25 $).
Zertifikate und Signierschlüssel verwaltet EAS automatisch.

## Aufbau

```
brand.js               ← Markenkonfiguration (Name, IDs, Farben)
app.config.ts          ← Expo-Konfiguration, liest brand.js
app/                   ← Bildschirme (Expo Router, dateibasiert)
  huelle.tsx           ← Web-Hülle (startModus 'web')
  (tabs)/              ← Start, Projekte, Rapporte, Adressen, Mehr
  projekt/[id].tsx     ← Projektdetail
  lv/[id].tsx          ← LV-Positionsbaum
  adresse/[id].tsx     ← Adressdetail
  rapport/neu.tsx      ← Projekt wählen → Entwurf
  rapport/[id].tsx     ← Rapport-Editor
  login.tsx, mitarbeiter.tsx, stammdaten.tsx, einstellungen.tsx, ueber.tsx
src/
  domain/              ← Fachmodell, Status, Formatierung, LV-Baum, Kennzahlen
  data/                ← Mapping X2-Felder → Modell, Repository (Demo/Server), Storage, Sync
  security/            ← Tresor (AES-GCM, Schlüsselbund), Foto-Tresor, App-Sperre
  huelle/              ← Web-Hülle: Navigationsregeln, Brückenskript, Push
  state/               ← globaler App-Zustand (AppProvider)
  theme/, ui/          ← Farben, Bausteine
docs/WEB-BRUECKE.md    ← Web-Hülle: Brücke, Telegram-Kompatibilität, Navigationsregeln
docs/API.md            ← Vertrag für das Backend (ERP-Modus)
docs/SICHERHEIT.md     ← Sicherheitskonzept und Release-Checkliste
scripts/               ← Icon-Platzhalter (icons-erzeugen.py), Bildpipeline (bilder-anpassen.js)
__tests__/             ← Jest-Tests
```

## Nächste Schritte

1. Backend nach `docs/API.md` bereitstellen (zunächst reicht ein Export-Job aus
   der X2-Datenbank mit `tools/export_bundle.py` hinter einem Login).
2. Endgültigen Produktnamen in `brand.js` eintragen, Icons neu erzeugen.
3. `eas init`, Test-Build, App auf 2–3 Geräten im Betrieb testen.
4. Store-Einträge (Screenshots, Datenschutzerklärung) vorbereiten, `eas submit`.
