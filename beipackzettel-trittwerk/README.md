# Trittwerk – Beipackzettel „Gebrauchs- & Passformhinweise“ für Tierorthesen

Gestaltete Fassung des Beipackzettels (3 Seiten, DIN A4) im Trittwerk-Look.
Die Texte sind unverändert aus der Vorlage übernommen; die Illustrationen wurden
mit Higgsfield (Modell GPT Image 2.5) in einem einheitlichen, flachen
Illustrationsstil erzeugt.

## Fertige Dateien (auf Higgsfield gehostet)

| Datei | Link |
|---|---|
| PDF, 3 Seiten A4 | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/823b328c-4e6f-4a59-aa43-b9bab044e967.pdf |
| Vorschau Seite 1 (PNG) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/8e0c6b47-341f-481f-a23d-3d650f9253ef.png |
| Vorschau Seite 2 (PNG) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/f6d8169f-b9a7-4976-aab7-96121c056b33.png |
| Vorschau Seite 3 (PNG) | https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/9198f7d9-48fa-4335-b892-5d3fa417d610.png |

## Aufbau

```
beipackzettel.html   Layout (HTML/CSS, druckfertig für A4, 3 Seiten)
fonts/               Manrope (Überschriften) und Source Sans 3 (Fließtext), woff2
logo/                Trittwerk-Logo (Original und freigestellte, einfarbige Fassung)
bilder/              Illustrationen – werden mit bilder-laden.sh geladen (nicht im Repo)
bilder-laden.sh      lädt die Higgsfield-Illustrationen und verkleinert sie auf Druckgröße
render.js            erzeugt PDF + Seitenvorschauen mit Playwright/Chromium
```

## Gestaltung

- **Farben:** Logo-Grün `#2F605A` (aus dem Trittwerk-Logo übernommen), Salbei `#8FB3AA`,
  Sand `#E9E1D3`, Papier `#F7F4EE`, Terrakotta `#C4643B` als Akzent für Praxis-Tipp und Warnhinweis.
- **Schrift:** Manrope (Wortmarke, Überschriften), Source Sans 3 (Text).
- **Logo:** das offizielle Trittwerk-Logo (Hund, Katze, Pferd, Kamel unter dem Bogen) in der
  Kopfzeile jeder Seite; im Abschlussbanner auf Seite 3 in Weiß auf Logo-Grün. Die Datei
  `logo/trittwerk-logo.png` ist die freigestellte Fassung ohne weißen Hintergrund.
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
