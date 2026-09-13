# Geburtstagsvideo „Für Andrea – Zum 70. Geburtstag“

Professionelles Geburtstagsvideo (ca. 74 s, 1920×1080, 24 fps, Stereo) für Andrea,
die Französin ist: mit ihrem Foto, französischer Musette-Musik, einer gesungenen
Chanson-Gratulation und dem Gutschein fürs Café Paris am Hamburger Rathaus als
Abschluss.

## Fertiges Video

- Download Version 2 (MP4, 1080p, 56 MB, mit Andreas Foto und französischer Musik, gehostet in der Higgsfield-Mediathek): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/b5fc742f-35a4-4fba-8e39-bc5af1701624.mp4
- Vorschaubild Version 2 (Higgsfield): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/f7769a77-1e5f-4198-8653-f4365e03dd78.jpg
- Version 1 (ohne Foto, 59 s): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/9949a282-7bda-4d2d-8298-e195897674d6.mp4
- Higgsfield-Mediathek (Uploads → Video, Dateien `Andrea_70_Geburtstag_v2.mp4` und `Andrea_70_Geburtstag.mp4`): https://higgsfield.ai
- Ansehen und teilen (Descript): https://share.descript.com/view/YWUbPN2abGU
- Zum Nachbearbeiten (Descript-Projekt): https://web.descript.com/0dbf90e3-b35c-4ffc-a358-0b88b8ddaa84

## Produktion mit Higgsfield

Das Video wurde komplett mit **Higgsfield** (https://higgsfield.ai) produziert:

- **Generierung der Szenen**: Kling 3.0 (Eröffnung, Paris-Musette, Toast) und Seedance 2.0 Mini
  (beide Gesangsstrophen mit nativem Ton und Lippensynchronisation). Die
  Sängerin der zweiten Strophe wurde über ein Referenzbild aus der ersten
  Strophe konsistent gehalten. Alle Prompts, Modelle und Clip-Links: `prompts.md`.
- **Schnitt und Rendering**: ffmpeg und Pillow in der Higgsfield-Cloud-Sandbox
  (`build.sh`, `make_overlays.py`).
- **Qualitätsprüfung**: Higgsfield-Videoanalyse (Szene für Szene) und
  Spracherkennung mit faster-whisper.
- **Hosting**: Fertiges Video und Vorschaubild liegen in der Higgsfield-Mediathek.
- Verbrauch: ca. 124 Credits (Kling 3.0 std 10 s = 20 Credits, 8 s = 16 Credits,
  Seedance 2.0 Mini 15 s = 37,5 Credits, 12 s = 30 Credits).

## Ablauf des Videos

| Zeit (ca.) | Szene | Inhalt |
|---|---|---|
| 0:00–0:10 | Eröffnung | Café-Paris-Terrasse mit Rathaus, Titel „Für Andrea – Joyeux anniversaire · Zum 70. Geburtstag“ |
| 0:09–0:19 | Andrea | Andreas Foto (Hafenrundfahrt) mit langsamem Zoom, „Bon anniversaire, Andrea !“, französische Musette |
| 0:18–0:26 | Paris | Akkordeonspieler in Montmartre, Bauchbinde „Un peu de Paris à Hambourg“ |
| 0:26–0:40 | Gesang, Strophe 1 | Chanson-Sängerin mit Akkordeon singt die erste Strophe |
| 0:40–0:51 | Gesang, Strophe 2 | Zweite Strophe, Toast mit Champagner in die Kamera |
| 0:50–1:00 | Toast | Champagner-Anstoßen, Bauchbinde „Eine besondere Auszeit im Café Paris am Hamburger Rathaus“ |
| 0:59–1:10 | Gutschein | Der Gutschein (Ken-Burns-Zoom) mit Goldrahmen |
| 1:10–1:14 | Abspann | „Joyeux 70e anniversaire, Andrea – Alles Liebe zum 70. Geburtstag – Von Basti“, Ausblende |

Musik: Durchgehend französische Akkordeon-Musette (aus den Higgsfield-Clips
Eröffnung, Paris und Toast als Musikbett), in den Gesangsszenen Chanson mit
Akkordeon und Kontrabass.

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

- `assets/andrea.jpg` – Foto von Andrea (von Basti)
- `assets/gutschein.png` – der Gutschein (Vorlage von Basti)
- `assets/*.ttf` – Schriften (Great Vibes, Cormorant Garamond, Montserrat; SIL Open Font License)
- `make_overlays.py` – erzeugt Titel, Bauchbinde, Gutschein-Tafel und Abspann als PNG (Pillow)
- `build.sh` – schneidet die Clips mit ffmpeg zusammen (Überblendungen, Lautheitsangleichung, Musikbett)
- `prompts.md` – die verwendeten Generierungs-Prompts und Modelle

## Selbst neu rendern

```bash
cd geburtstagsvideo-andrea
# Quellclips als amb1.mp4, paris.mp4, g1.mp4, g2.mp4, toast.mp4 ins Arbeitsverzeichnis legen
WORKDIR=$PWD bash build.sh
```

Benötigt: ffmpeg (mit libx264, xfade, zoompan), python3 mit Pillow.
