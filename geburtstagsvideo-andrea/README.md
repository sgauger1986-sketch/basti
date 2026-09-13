# Geburtstagsvideo „Für Andrea – Zum 70. Geburtstag“

Professionelles Geburtstagsvideo (ca. 59 s, 1920×1080, 24 fps, Stereo) mit einer
gesungenen Chanson-Gratulation und dem Gutschein fürs Café Paris am Hamburger
Rathaus als Abschluss.

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
