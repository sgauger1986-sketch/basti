# Messevideo mexXsoft X2 (GaLaBau & Tiefbau) — Endlosschleife, ohne Ton

Aufmerksamkeitsstarkes Standvideo für **www.mexxsoft.com**, Zielgruppe **GaLaBau und Tiefbau**:
48 Sekunden, 1920×1080, **ohne Tonspur**, nahtlos als **Dauerschleife** abspielbar (Anfang und
Ende sind identisch dunkel, es gibt keinen sichtbaren Schnitt beim Neustart).

Die Bildwelt besteht aus **vierzehn exklusiv mit Higgsfield (Seedance 2.5) erzeugten Videoclips**
(1080p, 8 s, ohne Ton, keine Stockfootage), über die Marke, Module und Botschaften animiert werden.

| Datei | Zweck |
|---|---|
| `mexxsoft-messe-video-v5.mp4` | **Aktuelle Fassung v5 (128 s)**: v4 plus Stopper für Laufkundschaft – „Kennen Sie das?“ (drei Alltagsprobleme, „In 5 Minuten zeigen wir Ihnen, wie es einfacher geht“), eigene Szene **„Die E-Rechnung wird Pflicht“** (2025 Empfang, 2027 Versand ab 800.000 € Umsatz, 2028 alle; ZUGFeRD 2.x, XRechnung), E-Rechnung-Chip in der Markenszene, dauerhaft pulsierende Plakette „Live-Demo hier am Stand · 5 Minuten“ in der Fußzeile, Schluss „Bleiben Sie stehen – Live-Demo in 5 Minuten.“ Quelle: `messe-video-v5.html`. **Download:** https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/5303e5b1-410c-455d-97f5-b3c0d04d5869.mp4 |
| `mexxsoft-messe-video-v4.mp4` | **Fassung v4 (112 s)**: die lange Fassung von v3 mit fünf zusätzlichen Szenen – Aufmaß → Abschlags-/Schlussrechnung, Kolonnen-Plantafel, digitale Bauakte, Material & Pflanzenkataloge, offene Posten/Mahnwesen/Nachkalkulation. Quelle: `messe-video-v4.html`, 14 Higgsfield-Clips. Nicht als MP4 gerendert (durch v5 ersetzt, lokal mit `node render.mjs --html messe-video-v4.html` erzeugbar). |
| `mexxsoft-messe-video-v3.mp4` | **Fassung v3 (68 s)**: beschreibt das Angebot von mexXsoft ausführlicher – Prozesskette von der Anfrage bis zur Schlussrechnung, 8 Module, Angebot in Aktion, mexXgo, Schnittstellen & E-Rechnung, KI-Funktionen 2026, GaLaBau|Tiefbau, Versionen & Service. Quelle: `messe-video-v3.html`, 10 Higgsfield-Clips. **Download:** https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/220e58e2-fff8-46af-99bf-15528066bd35.mp4 |
| `mexxsoft-messe-video-galabau-tiefbau-v2.mp4` | **Das fertige Video** (H.264, 1080p, 30 fps, 48 s, keine Audiospur). Gerendert in der Higgsfield-Cloud, **Download:** https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/ba496ee1-a269-46a2-8cf1-64fd6441cd0f.mp4 (liegt außerdem in der Higgsfield-Mediathek des Kontos). Lokal jederzeit mit `render.mjs` neu erzeugbar. Erste, dunklere Fassung: https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/6683cf58-4295-41e4-b2a0-8a800acd3f9d.mp4 |
| `MexXsoft-Messevideo-v5-Windows.zip` | **Windows-Programm** (Bildschirmschoner/Kiosk mit PIN 0000, Video **v5** eingebaut). **Download:** https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/e53930e9-4ebb-4b70-aacf-fc2a2384e45b.zip · Paket mit v3: https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/eb3b79d6-6355-4ef1-b988-091753e4acb2.zip · Paket mit v2: https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/e0389186-7367-4f54-bb77-7b12c962ed65.zip · Quellen in `kiosk/`. |
| `mexxsoft-messe-video.mp4` | Erste Fassung ohne Videoclips (nur Motion Graphics), alle Gewerke. |
| `messe-video.html` | Die Quelle: Animation als HTML/CSS/JS inkl. Video-Hintergründen. Läuft auch direkt im Browser als Endlosschleife (Vollbild mit Taste **F**), sobald `clips/*.webm` vorhanden sind. |
| `clips/fetch-clips.sh` | Lädt die 14 Higgsfield-Clips und wandelt sie nach WebM/VP9 (für den Render-Browser). |
| `render.mjs` | Erzeugt aus der HTML-Datei das MP4 (Bild für Bild, deterministisch, parallelisierbar). |
| `fonts/` | Schriften Inter & Manrope (SIL Open Font License), lokal eingebettet. |
| `assets/` | Logo (Original, weiße und dunkle Vektorversion). |

## Ablauf v5 (18 Szenen, 128 s)

Wie v4, mit drei Ergänzungen für die Messe: Ein Passant sieht im Schnitt nur 10–20 Sekunden – deshalb gibt es
alle 30–40 Sekunden einen „Stopper“ in großer Schrift, die Fußzeile trägt durchgehend die pulsierende Plakette
**„Live-Demo hier am Stand · 5 Minuten“**, und die E-Rechnung hat eine eigene Szene.

| Zeit | Szene | Clip | Inhalt |
|---|---|---|---|
| 0–5 s | Hook | Rohrgraben | „Zettelwirtschaft. Excel-Chaos. Abende im Büro.“ → „Schluss damit.“ |
| 5–11 s | Marke | Gartenanlage, Drohne | Logo, Claim, Slogan, Chips inkl. **E-Rechnung ready** |
| 11–19 s | Prozess | Neue Straße | Anfrage → … → Buchhaltung & Mahnwesen |
| 19–28 s | Module | Büro | 8 Modulkacheln |
| 28–37 s | Angebot in Aktion | Gartenanlage | Positionen, Summen, Stempel, Ablauf bis E-Rechnung |
| 37–43 s | **Stopper „Kennen Sie das?“** | Asphaltfertiger, Drohne | Rechnungen abends am Küchentisch · Aufmaß auf dem Bierdeckel · Kolonne steht, Material fehlt → „In 5 Minuten zeigen wir Ihnen, wie es einfacher geht.“ |
| 43–51 s | Aufmaß rein, Rechnung raus | Aufmaß mit Messrad | Aufmaßtabelle, REB, Abschlags-/Schlussrechnung |
| 51–58 s | Wer ist morgen wo? | Kolonnen-Einteilung | Plantafel Mo–Fr |
| 58–66 s | mexXgo | Polier mit Tablet | App für die Baustelle |
| 66–73 s | Digitale Bauakte | Fotodoku am Rohrgraben | Bautagebuch, Fotos, Regiebericht, Lieferscheine, Rechnungen |
| 73–79 s | Schnittstellen | Baubesprechung | GAEB, Datanorm, DATEV, ZUGFeRD 2.x, XRechnung, … |
| 79–88 s | **Die E-Rechnung wird Pflicht** | Kundengespräch mit Tablet | 2025 Empfang Pflicht ✓ · 2027 Versand ab 800.000 € Vorjahresumsatz · 2028 alle Betriebe · „mexXsoft X2 ist bereit: ZUGFeRD 2.x, XRechnung, Empfangen & Versenden“ · Kommunen verlangen die XRechnung schon heute |
| 88–95 s | KI 2026 | Baubesprechung | KI-Texte, Förder-KI, Sketch |
| 95–102 s | Material und Pflanzen | Baumschule / Lager | Kataloge Bruns & GBF, Datanorm, Bestellung, Lager |
| 102–108 s | Zwei Gewerke | Pflaster ‖ Asphalt | GaLaBau und Tiefbau |
| 108–115 s | Zahlen, die stimmen | Büro | Offene Posten, Mahnwesen, Nachkalkulation |
| 115–121 s | Versionen & Service | Park | Easy…Enterprise, Kaufen/Mieten/Testen, Support |
| 121–128 s | Call-to-Action | Neue Straße | „Jetzt live erleben.“ · „Bleiben Sie stehen – Live-Demo in 5 Minuten.“ · www.mexxsoft.com · Kontakt · Logo |

Hinweis E-Rechnung: Fristen nach Wachstumschancengesetz (Empfangspflicht seit 1.1.2025, Ausstellungspflicht ab
1.1.2027 bei über 800.000 € Vorjahresumsatz, ab 1.1.2028 für alle; Kleinunternehmer nach § 19 UStG sind von der
Ausstellungspflicht befreit) – bitte vor der Messe noch einmal gegen den aktuellen Stand prüfen.

## Ablauf v4 (16 Szenen, 112 s)

| Zeit | Szene | Clip | Inhalt |
|---|---|---|---|
| 0–5 s | Hook | Rohrgraben | „Zettelwirtschaft. Excel-Chaos. Abende im Büro.“ → „Schluss damit.“ |
| 5–11 s | Marke | Gartenanlage, Drohne | Logo, „Die ERP-Software für GaLaBau und Tiefbau.“, Slogan, Fakten-Chips |
| 11–19 s | Prozess | Neue Straße mit Rohrgraben | Anfrage → Angebot → Auftrag → Einsatzplanung → Aufmaß → Rechnung → Buchhaltung & Mahnwesen |
| 19–28 s | Module | Büro | Angebot & Rechnung, Kalkulation & Nachkalkulation, Aufmaß (REB), AVA & Nachträge, Einsatzplanung, Bautagebuch & Bauakte, Zeit & Lohn, Warenwirtschaft & Kataloge |
| 28–37 s | Angebot in Aktion | Gartenanlage | Positionen, Summen, Stempel, Ablauf bis E-Rechnung |
| 37–45 s | Aufmaß rein, Rechnung raus | Aufmaß mit Messrad (neu) | Aufmaßtabelle mit Nachtrag, REB-konform, Abschlags- und Schlussrechnung, Mengen direkt in die Rechnung |
| 45–52 s | Wer ist morgen wo? | Kolonnen-Einteilung am Betriebshof (neu) | Plantafel Kolonne A/B und Bagger über Mo–Fr, Änderungen sofort auf der App |
| 52–60 s | mexXgo | Polier mit Tablet | Zeiten, Fotos in die Bauakte, Rapporte unterschreiben, Kundendaten & LV |
| 60–67 s | Digitale Bauakte | Fotodokumentation am Rohrgraben (neu) | Bautagebuch, Fotos, Regiebericht, Aufmaß & Pläne, Lieferscheine, Rechnungen – alles zum Projekt an einem Ort |
| 67–73 s | Schnittstellen | Baubesprechung | GAEB, Datanorm, DATEV, Excel, REB, ZUGFeRD 2.x, XRechnung, DA11/X31, Pflanzenkataloge Bruns & GBF |
| 73–80 s | KI 2026 | Kundengespräch mit Tablet | KI-Texte, Förder-KI, Sketch (KI-Visualisierung) |
| 80–87 s | Material und Pflanzen | Baumschule / Materiallager (neu) | Pflanzenkataloge Bruns & GBF, Lieferantenkataloge Datanorm, Bestellung & Lieferschein, Lager & Preise |
| 87–93 s | Zwei Gewerke | Pflaster ‖ Asphalt | GaLaBau und Tiefbau mit je drei Punkten |
| 93–100 s | Zahlen, die stimmen | Büro | Offene Posten (zählt hoch), Mahnwesen, Nachkalkulation +3,1 %, DATEV-Export, Controlling je Baustelle |
| 100–106 s | Versionen & Service | Park | Easy…Enterprise, Kaufen/Mieten/Testen, Demoversion, Vorführung, Support & Fernwartung, Webinare |
| 106–112 s | Call-to-Action | Neue Straße | „Jetzt live erleben.“ · www.mexxsoft.com · Kontakt · Logo |

## Ablauf v3 (11 Szenen, 68 s)

| Zeit | Szene | Clip | Inhalt |
|---|---|---|---|
| 0–5 s | Hook | Rohrgraben | „Zettelwirtschaft. Excel-Chaos. Abende im Büro.“ → „Schluss damit.“ |
| 5–10 s | Marke | Gartenanlage, Drohne | Logo, „Die ERP-Software für GaLaBau und Tiefbau.“, Slogan, Fakten-Chips |
| 10–17 s | Prozess | Neue Straße mit Rohrgraben | Anfrage → Angebot → Auftrag → Einsatzplanung → Aufmaß → Rechnung → Buchhaltung & Mahnwesen |
| 17–25 s | Module | Büro | Angebot & Rechnung, Kalkulation & Nachkalkulation, Aufmaß (REB), AVA & Nachträge, Einsatzplanung, Bautagebuch & Bauakte, Zeit & Lohn, Warenwirtschaft & Kataloge |
| 25–34 s | Angebot in Aktion | Gartenanlage | Positionen, Summen, Stempel, Ablauf bis E-Rechnung |
| 34–41 s | mexXgo | Polier mit Tablet | Zeiten, Fotos in die Bauakte, Rapporte unterschreiben, Kundendaten & LV |
| 41–47 s | Schnittstellen | Baubesprechung | GAEB, Datanorm, DATEV, Excel, REB, ZUGFeRD 2.x, XRechnung, DA11/X31, Pflanzenkataloge Bruns & GBF |
| 47–53 s | KI 2026 | Kundengespräch mit Tablet | KI-Texte, Förder-KI, Sketch (KI-Visualisierung) |
| 53–59 s | Zwei Gewerke | Pflaster ‖ Asphalt | GaLaBau und Tiefbau mit je drei Punkten |
| 59–64 s | Versionen & Service | Park | Easy…Enterprise, Kaufen/Mieten/Testen, Demoversion, Vorführung, Support & Fernwartung, Webinare |
| 64–68 s | Call-to-Action | Neue Straße | „Jetzt live erleben.“ · www.mexxsoft.com · Kontakt · Logo |

Die Inhalte stammen von mexxsoft.com und Software-Verzeichnissen (Stand September 2026); Schnittstellen- und
Modulnamen bitte vor der Messe einmal gegen den aktuellen Leistungsumfang prüfen.

## Ablauf v2 (8 Szenen, 48 s)

| Zeit | Szene | Clip (Higgsfield) | Inhalt |
|---|---|---|---|
| 0–5 s | Hook | Bagger hebt Rohrgraben aus (Tiefbau) | „Zettelwirtschaft. Excel-Chaos. Abende im Büro.“ – durchgestrichen, Stempel **„Schluss damit.“** |
| 5–10 s | Marke | Fertige Gartenanlage, Drohne (GaLaBau) | **MEXXSOFT-Logo** + X2-Badge, „Die Software für GaLaBau und Tiefbau.“, Slogan *Einfach · Schnell · Professionell* |
| 10–18 s | Alles in einem | Park im Morgenlicht (stark abgedunkelt) | 8 Modulkacheln: Angebote & Rechnungen, Kalkulation, Aufmaß & LV, Kunden & Termine, Material & Pflanzen, Zeit & Lohn, Baustellen-Doku, KI-Funktionen |
| 18–26 s | Software in Aktion | Gartenanlage (stark abgedunkelt) | Animiertes Angebot mit GaLaBau- und Tiefbau-Positionen (Oberboden, Rohrgraben, Pflaster, Rasen), Summen zählen hoch, Stempel „Angebot versendet“, Ablauf Angebot → Auftrag → Aufmaß → Rechnung |
| 26–33 s | mexXgo | Polier mit Tablet auf der Baustelle | „Büro und Baustelle. Verbunden.“ · Zeiterfassung, Fotos, Regieberichte, Leistungslisten · iOS & Android |
| 33–39 s | Zwei Gewerke | Pflasterarbeiten ‖ Asphaltfertiger (Split-Screen) | **GaLaBau** und **Tiefbau** nebeneinander mit je drei branchenspezifischen Punkten – „Zwei Gewerke. Eine Software.“ |
| 39–44 s | Versionen | – | Easy · Standard · Premium · Pro · Enterprise · Kaufen / Mieten / Kostenlos testen |
| 44–48 s | Call-to-Action | Park im Morgenlicht | „Jetzt live erleben.“ · Standtext · **www.mexxsoft.com** · Kontakt · Logo |

Durchgehend: kleine Fußzeile mit „mexXsoft X2 · Die Software für GaLaBau & Tiefbau“ und der Web-Adresse.

## Die Higgsfield-Clips

Alle vierzehn Clips wurden mit dem Modell **Seedance 2.5** (Text-to-Video, 1080p, 16:9, 8 s, `generate_audio: false`)
exklusiv für dieses Video erzeugt (Job-IDs in `clips/fetch-clips.sh`). Die Prompts beschreiben deutsche
Baustellen (Warnwesten, Betonsteinpflaster, Rollrasen, Asphaltfertiger, Rohrgraben mit Verbau) ohne Text,
Logos oder Wasserzeichen. Die Clips werden im Video nur leicht abgedunkelt bzw. mit Verläufen versehen, die
Texte bekommen kräftige Schlagschatten, damit beides gut erkennbar bleibt; sie liegen im Higgsfield-Konto des Nutzers und lassen sich dort jederzeit erneut laden.

## Windows-Programm (.exe) als Bildschirmschoner mit PIN

Im Ordner `kiosk/` liegt eine kleine Windows-App (Electron, keine Installation nötig, Windows 10/11 64 Bit):
sie zeigt das Video im Vollbild in Dauerschleife, immer im Vordergrund, ohne Mauszeiger, und lässt sich
nur nach PIN-Eingabe beenden (Standard **0000**, änderbar in `config.json` neben der .exe).
Tastendruck oder Klick öffnet das PIN-Feld; ohne Eingabe verschwindet es nach 20 s wieder. Alt+F4 und Esc
beenden das Programm nicht. Ein `video.mp4` neben der .exe ersetzt das eingebaute Video.

Fertiges Paket (Zip entpacken, `MexXsoft-Messevideo.exe` starten): siehe Link in der Dateitabelle oben.
Selbst bauen: `cd kiosk && npm install && npm run pack:win` (Video vorher als `kiosk/video.mp4` ablegen).

## Am Stand abspielen (Dauerschleife)

- **Fernseher / Display mit USB:** MP4 auf einen USB-Stick, im TV-Menü „Wiederholen: Alle/Ein“ bzw. „Loop“ aktivieren.
- **VLC (Windows/Mac):** Datei öffnen, *Wiedergabe → Wiederholen: Ein* (Schleifen-Symbol) und Vollbild (F).
  Kommandozeile: `vlc --loop --fullscreen --no-audio mexxsoft-messe-video.mp4`
- **Windows Media Player / Filme & TV:** Wiederholen-Symbol aktivieren.
- **Ohne Videoplayer:** `messe-video.html` in Chrome/Edge öffnen (Ordner mit `fonts/`, `assets/` und `clips/*.webm` mitnehmen), Vollbild mit **F** – läuft von selbst endlos.

## Logo

Das Original-Logo (dunkelviolette Wortmarke MEXXSOFT mit Claim „Wir sind OneQrew“, Farbe `#220739`)
liegt in `assets/`:

| Datei | Zweck |
|---|---|
| `assets/logo-original.png` | Logo wie geliefert (dunkel auf Weiß, zugeschnitten). |
| `assets/logo.svg` | Vektorisierte **weiße** Variante – wird im Video auf dem dunklen Grund verwendet. |
| `assets/logo-dark.svg` | Vektorisierte Variante in der Originalfarbe, z. B. für helle Flächen. |

Die Vektorisierung wurde aus der gelieferten 470×470-Pixel-Datei erzeugt. Liegt eine höher
aufgelöste oder eine originale Vektordatei (SVG/EPS) vor, einfach als `assets/logo.svg`
(weiße Version) ablegen und neu rendern.

Die Farbwelt des Videos (Hintergrund `#120626`/`#220739`, Akzent helles Violett `#b48cff`)
ist vom Logo abgeleitet.

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
bash clips/fetch-clips.sh       # Higgsfield-Clips laden und nach WebM wandeln (einmalig)
node render.mjs                 # -> mexxsoft-messe-video.mp4 (1080p, 30 fps)
node render.mjs --stills        # nur Vorschaubilder nach stills/
node render.mjs --fps 25 --crf 18 --out video.mp4
# schneller auf mehreren Kernen: Segmente parallel rendern und mit ffmpeg zusammenfügen
node render.mjs --from 0 --to 720 --out seg1.mp4 & node render.mjs --from 720 --to 1440 --out seg2.mp4 & wait
printf "file 'seg1.mp4'\nfile 'seg2.mp4'\n" > list.txt && ffmpeg -f concat -safe 0 -i list.txt -c copy -movflags +faststart out.mp4
```

Ist ffmpeg nicht im PATH: `FFMPEG=/pfad/zu/ffmpeg node render.mjs`
(alternativ `pip install imageio-ffmpeg`, das Skript findet dieses Binary automatisch).

Das Rendern ist deterministisch: gleiche Quelle, gleiches Video. Die Animation wird nicht
in Echtzeit aufgezeichnet, sondern Bild für Bild berechnet, dadurch ruckelt nichts.
