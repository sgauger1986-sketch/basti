# Geburtstagsvideo „Für Andrea – Zum 70. Geburtstag“

Professionelles Geburtstagsvideo (ca. 59 s, 1920×1080, 24 fps, Stereo) mit einer
gesungenen Chanson-Gratulation und dem Gutschein fürs Café Paris am Hamburger
Rathaus als Abschluss.

## Fertiges Video

- Download (MP4, 1080p, 46 MB, gehostet in der Higgsfield-Mediathek): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/9949a282-7bda-4d2d-8298-e195897674d6.mp4
- Vorschaubild (Higgsfield): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/407be7bb-bcdd-40b8-bb5d-7eabbd26ae74.jpg
- Higgsfield-Mediathek (Uploads → Video, Datei `Andrea_70_Geburtstag.mp4`): https://higgsfield.ai
- Ansehen und teilen (Descript): https://share.descript.com/view/YWUbPN2abGU
- Zum Nachbearbeiten (Descript-Projekt): https://web.descript.com/0dbf90e3-b35c-4ffc-a358-0b88b8ddaa84

## Produktion mit Higgsfield

Das Video wurde komplett mit **Higgsfield** (https://higgsfield.ai) produziert:

- **Generierung der Szenen**: Kling 3.0 (Eröffnung, Toast) und Seedance 2.0 Mini
  (beide Gesangsstrophen mit nativem Ton und Lippensynchronisation). Die
  Sängerin der zweiten Strophe wurde über ein Referenzbild aus der ersten
  Strophe konsistent gehalten. Alle Prompts, Modelle und Clip-Links: `prompts.md`.
- **Schnitt und Rendering**: ffmpeg und Pillow in der Higgsfield-Cloud-Sandbox
  (`build.sh`, `make_overlays.py`).
- **Qualitätsprüfung**: Higgsfield-Videoanalyse (Szene für Szene) und
  Spracherkennung mit faster-whisper.
- **Hosting**: Fertiges Video und Vorschaubild liegen in der Higgsfield-Mediathek.
- Verbrauch: ca. 108 Credits (Kling 3.0 std 10 s = 20 Credits, Seedance 2.0 Mini
  15 s = 37,5 Credits, 12 s = 30 Credits).

## Ablauf des Videos

| Zeit (ca.) | Szene | Inhalt |
|---|---|---|
| 0:00–0:10 | Eröffnung | Café-Paris-Terrasse mit Rathaus, Titel „Für Andrea – Zum 70. Geburtstag“ |
| 0:09–0:24 | Gesang, Strophe 1 | Chanson-Sängerin mit Akkordeon singt die erste Strophe |
| 0:23–0:35 | Gesang, Strophe 2 | Zweite Strophe, Toast mit Champagner in die Kamera |
| 0:34–0:44 | Toast | Champagner-Anstoßen, Bauchbinde „Eine besondere Auszeit im Café Paris am Hamburger Rathaus“ |
| 0:43–0:54 | Gutschein | Der Gutschein (Ken-Burns-Zoom) mit Goldrahmen |
| 0:54–0:59 | Abspann | „Alles Liebe zum 70. Geburtstag, Andrea – Von Basti“, Ausblende |

## Liedtext (gesungen, Deutsch, Walzer)

> Liebe Andrea, heut’ wirst du siebzig Jahr,
> wir feiern dich, so wunderbar.
> Auf Genuss, auf Glück, auf gute Zeit –
> Café Paris, die Freude ist bereit!
>
> Auf dich, Andrea, stoßen wir heut’ an –
> auf siebzig Jahre voller Glanz!
> Alles Liebe, liebe Andrea –
> von Basti, von Herzen, ganz!

## Dateien

- `assets/gutschein.png` – der Gutschein (Vorlage von Basti)
- `assets/*.ttf` – Schriften (Great Vibes, Cormorant Garamond, Montserrat; SIL Open Font License)
- `make_overlays.py` – erzeugt Titel, Bauchbinde, Gutschein-Tafel und Abspann als PNG (Pillow)
- `build.sh` – schneidet die Clips mit ffmpeg zusammen (Überblendungen, Lautheitsangleichung, Musikbett)
- `prompts.md` – die verwendeten Generierungs-Prompts und Modelle

## Selbst neu rendern

```bash
cd geburtstagsvideo-andrea
# Quellclips als amb1.mp4, g1.mp4, g2.mp4, toast.mp4 ins Arbeitsverzeichnis legen
WORKDIR=$PWD bash build.sh
```

Benötigt: ffmpeg (mit libx264, xfade, zoompan), python3 mit Pillow.
