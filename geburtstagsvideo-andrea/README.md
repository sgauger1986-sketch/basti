# Geburtstagsvideo „Für Andrea – Zum 70. Geburtstag“

Professionelles Geburtstagsvideo (ca. 68 s, 1920×1080, 24 fps, Stereo) für Andrea,
die Französin ist: mit ihrem Foto, französischer Musette-Musik, einer gesungenen
Chanson-Gratulation und dem Gutschein fürs Café Paris am Hamburger Rathaus als
Abschluss.

## Fertiges Video

- **Download Version 5** (MP4, 1080p, 68 s, Aufbau wie Version 1, deutscher Gesang neu, keine Sprecherstimme; Higgsfield-Mediathek): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/21c668d9-f9c6-4a29-a6af-8386033e01e8.mp4
- Vorschaubild Version 5 (Higgsfield): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/5a7b425e-dad9-42a1-8a72-5c33fe1a3c4b.jpg
- Version 4 (84 s, mit Sprecherstimme, Untertiteln und französischer Strophe): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/ab24db00-e44b-4925-b4c4-5d6e79527c83.mp4
- Version 3 (alter Gesang, 84 s): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/186edf74-faa6-4494-bcc4-18eb220f22fd.mp4
- Version 2 (mit Foto, ohne Einblendungen, 75 s): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/b5fc742f-35a4-4fba-8e39-bc5af1701624.mp4
- Version 1 (ohne Foto, 59 s): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/9949a282-7bda-4d2d-8298-e195897674d6.mp4
- Higgsfield-Mediathek (Uploads → Video, Dateien `Andrea_70_Geburtstag_v5.mp4`, `_v4.mp4`, `_v3.mp4`, `_v2.mp4` und `Andrea_70_Geburtstag.mp4`): https://higgsfield.ai
- **Ansehen und teilen, Version 4 (Descript): https://share.descript.com/view/6P1AarqtzY7**
- Ansehen und teilen, Version 3 (Descript): https://share.descript.com/view/hlNSMgDaO2M
- Ansehen und teilen, Version 2 (Descript): https://share.descript.com/view/CDbdnyVhQGe
- Ansehen und teilen, Version 1 (Descript): https://share.descript.com/view/YWUbPN2abGU
- Zum Nachbearbeiten (Descript-Projekt): https://web.descript.com/0dbf90e3-b35c-4ffc-a358-0b88b8ddaa84

## Produktion mit Higgsfield

Das Video wurde komplett mit **Higgsfield** (https://higgsfield.ai) produziert:

- **Generierung der Szenen**: Kling 3.0 (Eröffnung, Paris-Musette, Toast) und Seedance 2.5
  in 1080p (beide Gesangsstrophen mit nativem Ton und Lippensynchronisation; Versionen 1–3
  nutzten Seedance 2.0 Mini). Die
  Sängerin der zweiten Strophe wurde über ein Referenzbild aus der ersten
  Strophe konsistent gehalten. Alle Prompts, Modelle und Clip-Links: `prompts.md`.
- **Schnitt und Rendering**: ffmpeg und Pillow in der Higgsfield-Cloud-Sandbox
  (`build.sh`, `make_overlays.py`).
- **Gesprochene Grüße**: Text-to-Speech (ElevenLabs Multilingual über
  Higgsfield, Voice-Preset „Elodie“, klingt in der Ausgabe männlich),
  Französisch und Deutsch.
- **Qualitätsprüfung**: Higgsfield-Videoanalyse (Szene für Szene) und
  Spracherkennung mit faster-whisper (auch für die Wortzeiten der
  Liedtext-Einblendungen).
- **Hosting**: Fertiges Video und Vorschaubild liegen in der Higgsfield-Mediathek.
- Verbrauch: ca. 800 Credits insgesamt, davon ca. 675 für sieben Seedance-2.5-Kandidaten der
  Gesangsstrophen in Version 4 (Seedance 2.5 15 s 1080p = 135 Credits, 12 s = 108 Credits) (Kling 3.0 std 10 s = 20 Credits, 8 s = 16 Credits,
  Seedance 2.0 Mini 15 s = 37,5 Credits, 12 s = 30 Credits).

## Ablauf des Videos (Version 5, Aufbau wie Version 1)

| Zeit (ca.) | Szene | Inhalt |
|---|---|---|
| 0:00–0:10 | Eröffnung | Café-Paris-Terrasse mit Rathaus, Titel „Für Andrea – Zum 70. Geburtstag“ |
| 0:09–0:19 | Andrea | Andreas Foto mit langsamem Zoom, „Herzlichen Glückwunsch, Andrea! · 70 Jahre“, nur Musik |
| 0:18–0:33 | Gesang, Strophe 1 | Chanson-Sängerin singt auf Deutsch |
| 0:32–0:44 | Gesang, Strophe 2 | Zweite Strophe auf Deutsch, Toast mit Champagner in die Kamera |
| 0:43–0:53 | Toast | Champagner-Anstoßen, Einblendung „Eine besondere Auszeit im Café Paris am Hamburger Rathaus“ |
| 0:52–1:03 | Gutschein | Der Gutschein (Ken-Burns-Zoom) mit Goldrahmen |
| 1:03–1:08 | Abspann | „Alles Liebe zum 70. Geburtstag, Andrea – Von Basti“, Ausblende |

Musik: Französische Akkordeon-Musette aus den Higgsfield-Clips als Musikbett,
in den Gesangsszenen Chanson mit Akkordeon und Kontrabass. Keine
Sprecherstimme, keine Liedtext-Einblendungen (Versionen 3 und 4 hatten beides).

## Liedtext (Version 5, gesungen, Deutsch)

> Liebe Andrea, heute wirst du siebzig Jahr.
> Wir feiern dich, denn du bist wunderbar.
> Im Café Paris, auf eine schöne Zeit!
>
> Im Café Paris in Hamburg stoßen wir auf dich an.
> Alles Liebe, liebe Andrea, von Herzen, von Basti.

Beide Strophen mit Seedance 2.5 und deutscher Prompt-Sprache generiert und per
Spracherkennung geprüft (95 % bzw. 94 % Worttreffer, Name klar).

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
