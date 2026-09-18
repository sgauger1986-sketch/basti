# Trittwerk – Beipackzettel „Gebrauchs- & Passformhinweise“ für Tierorthesen

Gestaltete Fassung des Beipackzettels (3 Seiten, DIN A4) im Trittwerk-Look.
Die Texte sind unverändert aus der Vorlage übernommen; die Illustrationen wurden
mit Higgsfield (Modell GPT Image 2.5) in einem einheitlichen, flachen
Illustrationsstil erzeugt.

## Fertige Dateien (auf Higgsfield gehostet)

| Datei | Link |
|---|---|
| PDF, 3 Seiten A4 | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/d0c85568-144c-4a31-8426-d96c94848fcb.pdf |
| Vorschau Seite 1 (PNG) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/fbc6c9f4-0c62-475c-b80c-767c947d653e.png |
| Vorschau Seite 2 (PNG) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/843bc284-1abd-469d-98a5-08c6f73926e6.png |
| Vorschau Seite 3 (PNG) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/c3a8bf4e-69dd-4c57-baa8-4337328f5583.png |

## Aufbau

```
beipackzettel.html   Layout (HTML/CSS, druckfertig für A4, 3 Seiten)
fonts/               Manrope (Überschriften) und Source Sans 3 (Fließtext), woff2
bilder/              Illustrationen – werden mit bilder-laden.sh geladen (nicht im Repo)
bilder-laden.sh      lädt die Higgsfield-Illustrationen und verkleinert sie auf Druckgröße
render.js            erzeugt PDF + Seitenvorschauen mit Playwright/Chromium
```

## Gestaltung

- **Farben:** Tannengrün `#1F4D3A`, Salbei `#8FAF9A`, Sand `#E9E1D3`, Papier `#F7F4EE`,
  Terrakotta `#C4643B` als Akzent für Praxis-Tipp und Warnhinweis.
- **Schrift:** Manrope (Wortmarke, Überschriften), Source Sans 3 (Text).
- **Wortmarke:** „TRITTWERK“ mit Pfoten-Signet (SVG, im HTML enthalten) – ein
  Platzhalter, bis ein offizielles Logo vorliegt.
- **Seite 1:** Titel, Hero-Illustration, Abschnitt 1 (Klettbänder/Polster kürzen), Praxis-Tipp.
- **Seite 2:** Abschnitt 2 (Kombi-Klettmaterial, Ausstreich-Effekt), Produktübersicht,
  Abschnitt 3 (Anlegen in 5 Schritten).
- **Seite 3:** Abschnitt 4 (Passformkontrolle als Tabelle), Eingewöhnungs-Hinweis,
  Pflegehinweis, Abschlussbanner.

## Selbst rendern

```bash
cd beipackzettel-trittwerk
./bilder-laden.sh                      # Illustrationen holen (curl + ImageMagick)
npm install playwright                 # einmalig
node render.js ./ausgabe               # PDF + seite-1..3.png nach ./ausgabe
```

Alternativ `beipackzettel.html` im Browser öffnen und mit „Drucken → als PDF“
(A4, Ränder 0, Hintergrundgrafiken an) speichern.

## Illustrationen anpassen

Die Bilder wurden per Higgsfield `generate_image_batch` (Modell `gpt_image_2_5`,
Qualität high, 2K) erzeugt. Stilvorgabe in jedem Prompt: „clean modern flat vector
illustration with soft shading and subtle paper grain“, Palette wie oben, keine
Texte im Bild. Motive: Hund mit Vorderbein-Orthese (Titel), Klettband kürzen,
Schiebepolster kürzen, Grifflasche mit Feuerzeug versiegeln, Ausstreich-Effekt,
Orthese anlegen (Seitenlage), Hautkontrolle, Pflege mit Bürste, Produktübersicht.
