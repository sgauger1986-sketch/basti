# Messevideo mexXsoft X2 — Endlosschleife, ohne Ton

Aufmerksamkeitsstarkes Standvideo für **www.mexxsoft.com**: 48 Sekunden, 1920×1080,
**ohne Tonspur**, nahtlos als **Dauerschleife** abspielbar (Anfang und Ende sind
identisch dunkel, es gibt keinen sichtbaren Schnitt beim Neustart).

| Datei | Zweck |
|---|---|
| `mexxsoft-messe-video.mp4` | **Das fertige Video** (H.264, 30 fps, keine Audiospur) – auf USB-Stick/TV/Player kopieren, Loop aktivieren, fertig. |
| `messe-video.html` | Die Quelle: Animation als HTML/CSS/JS. Läuft auch direkt im Browser als Endlosschleife (Vollbild mit Taste **F** oder Doppelklick). |
| `render.mjs` | Erzeugt aus der HTML-Datei das MP4 (Bild für Bild, deterministisch). |
| `fonts/` | Schriften Inter & Manrope (SIL Open Font License), lokal eingebettet. |
| `assets/` | Hier das **Original-Logo** ablegen (siehe unten). |

## Ablauf des Videos (8 Szenen)

| Zeit | Szene | Inhalt |
|---|---|---|
| 0–5 s | Hook | „Zettelwirtschaft. Excel-Chaos. Abende im Büro.“ – wird durchgestrichen, Stempel **„Schluss damit.“** |
| 5–10 s | Marke | Wortmarke **mexXsoft X2**, „Die Handwerkersoftware.“, Slogan *Einfach · Schnell · Professionell* |
| 10–18 s | Alles in einem | 8 Modulkacheln: Angebote & Rechnungen, Kalkulation, Aufmaß & LV, Kunden & Termine, Material & Artikel, Zeit & Lohn, Schriftverkehr, KI-Funktionen |
| 18–26 s | Software in Aktion | Animiertes Angebot (GaLaBau-Positionen), Summen zählen hoch, Stempel „Angebot versendet“, Ablauf Angebot → Auftrag → Aufmaß → Rechnung |
| 26–33 s | mexXgo | Handy-Mockup: Zeiterfassung, Baustellenfotos, Unterschrift vor Ort · iOS & Android |
| 33–39 s | Gewerke | Laufband: GaLaBau, Tiefbau, Straßenbau, Stuckateure, Trockenbau, Maler, Fliesenleger, Bauunternehmen … |
| 39–44 s | Versionen | Easy · Standard · Premium · Pro · Enterprise – „Wächst mit Ihrem Betrieb.“ · Kaufen / Mieten / Kostenlos testen |
| 44–48 s | Call-to-Action | „Jetzt live erleben.“ · Standtext · **www.mexxsoft.com** · Kontakt |

Durchgehend: kleine Fußzeile mit „mexXsoft X2 · Die Handwerkersoftware“ und der Web-Adresse,
damit die Marke in jeder Sekunde der Schleife sichtbar ist.

## Am Stand abspielen (Dauerschleife)

- **Fernseher / Display mit USB:** MP4 auf einen USB-Stick, im TV-Menü „Wiederholen: Alle/Ein“ bzw. „Loop“ aktivieren.
- **VLC (Windows/Mac):** Datei öffnen, *Wiedergabe → Wiederholen: Ein* (Schleifen-Symbol) und Vollbild (F).
  Kommandozeile: `vlc --loop --fullscreen --no-audio mexxsoft-messe-video.mp4`
- **Windows Media Player / Filme & TV:** Wiederholen-Symbol aktivieren.
- **Ohne Videoplayer:** `messe-video.html` in Chrome/Edge öffnen (Ordner mit `fonts/` und `assets/` mitnehmen), Vollbild mit **F** – läuft von selbst endlos.

## Original-Logo einsetzen

Das echte Logo konnte aus dieser Umgebung nicht von der Website geladen werden; das Video
zeigt deshalb eine gesetzte Wortmarke **mexXsoft** mit hervorgehobenem X.

1. Logo als `assets/logo.svg` (bevorzugt) oder `assets/logo.png` ablegen (ideal: transparenter Hintergrund, helle Version für dunklen Grund).
2. Video neu rendern (siehe unten). Das Logo ersetzt automatisch die Wortmarke in der Markenszene; die Fußzeile bleibt Text.

## Farben, Texte, Standnummer anpassen

Alles steht in `messe-video.html`:

- **Farben:** Block `:root { --green … --orange … --bg … }` ganz oben im `<style>`.
- **Standtext** (z. B. „Halle 4A · Stand 4A-115“): `CONFIG.standText` am Anfang des `<script>`.
- **Texte/Gewerke/Positionen:** direkt im HTML bzw. in den Listen im Script (Szene 6 `rows`).
- **Szenenzeiten:** Objekt `T` im Script; Gesamtlänge `CONFIG.duration`.

## Neu rendern

Voraussetzungen: Node.js 18+, Playwright mit Chromium, ffmpeg mit libx264.

```bash
cd messe-video
npm install playwright && npx playwright install chromium
node render.mjs                 # -> mexxsoft-messe-video.mp4 (1080p, 30 fps)
node render.mjs --stills        # nur Vorschaubilder nach stills/
node render.mjs --fps 25 --crf 18 --out video.mp4
```

Ist ffmpeg nicht im PATH: `FFMPEG=/pfad/zu/ffmpeg node render.mjs`
(alternativ `pip install imageio-ffmpeg`, das Skript findet dieses Binary automatisch).

Das Rendern ist deterministisch: gleiche Quelle, gleiches Video. Die Animation wird nicht
in Echtzeit aufgezeichnet, sondern Bild für Bild berechnet, dadurch ruckelt nichts.
