# Mobile App (iOS & Android)

Native App für Baustelle und Außendienst, gebaut mit **Expo / React Native**
(TypeScript). Ein Code für iOS und Android; Builds für beide Stores laufen über
EAS Build in der Cloud – **ein Mac ist nicht nötig**.

## Was die App kann

| Bereich | Funktionen |
|---|---|
| Start | Kennzahlen (Angebots-/Auftragsvolumen, offen, fakturiert), laufende Projekte, eigene offene Rapporte |
| Projekte | Suche, Statusfilter, Detail mit Eckdaten, Fortschrittsbalken, Leistungsverzeichnisse, Rapporte; Kunde anrufen / mailen / Navigation starten |
| Leistungsverzeichnisse | Vollständiger hierarchischer Positionsbaum (auf-/zuklappbar), Suche über OZ und Kurztext, Mengen, EP, Gesamtpreise |
| Rapporte | Tagesberichte direkt auf der Baustelle: Arbeitszeiten je Mitarbeiter und Lohnart, Material, Fotos (Kamera/Galerie), GPS-Standort, Notizen. Auto-Speichern, Plausibilitätsprüfung, Übertragungswarteschlange |
| Adressen | Suche, Detail, Anrufen / E-Mail / Navigation / Website, zugehörige Projekte |
| Mehr | Mitarbeiter mit Löhnen/Verrechnungssätzen, Einheiten / MwSt / Lohnarten, Einstellungen (Hell/Dunkel, Standard-Mitarbeiter, Server), Über |

**Offline-first:** Alle Daten liegen lokal (AsyncStorage), Zugangsdaten
verschlüsselt im SecureStore. Ohne Netz kann weiter gearbeitet werden; Rapporte
werden übertragen, sobald ein Server erreichbar ist.

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
  state/               ← globaler App-Zustand (AppProvider)
  theme/, ui/          ← Farben, Bausteine
docs/API.md            ← Vertrag für das Backend
scripts/               ← Icon-Generator
__tests__/             ← Jest-Tests
```

## Nächste Schritte

1. Backend nach `docs/API.md` bereitstellen (zunächst reicht ein Export-Job aus
   der X2-Datenbank mit `tools/export_bundle.py` hinter einem Login).
2. Endgültigen Produktnamen in `brand.js` eintragen, Icons neu erzeugen.
3. `eas init`, Test-Build, App auf 2–3 Geräten im Betrieb testen.
4. Store-Einträge (Screenshots, Datenschutzerklärung) vorbereiten, `eas submit`.
