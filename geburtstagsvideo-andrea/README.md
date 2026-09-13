# Geburtstagsvideo „Für Andrea – Zum 70. Geburtstag“

Professionelles Geburtstagsvideo (ca. 84 s, 1920×1080, 24 fps, Stereo) für Andrea,
die Französin ist: mit ihrem Foto, französischer Musette-Musik, einer gesungenen
Chanson-Gratulation und dem Gutschein fürs Café Paris am Hamburger Rathaus als
Abschluss.

## Fertiges Video

- Download Version 3 (MP4, 1080p, 84 s, zweisprachig mit Liedtext-Einblendungen und gesprochenen Grüßen, Higgsfield-Mediathek): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/186edf74-faa6-4494-bcc4-18eb220f22fd.mp4
- Vorschaubild Version 3 (Higgsfield): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/caa3e904-e6fb-4cc7-a24a-fed6413fd0ae.jpg
- Version 2 (mit Foto, ohne Einblendungen, 75 s): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/b5fc742f-35a4-4fba-8e39-bc5af1701624.mp4
- Version 1 (ohne Foto, 59 s): https://d2ol7oe51mr4n9.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/9949a282-7bda-4d2d-8298-e195897674d6.mp4
- Higgsfield-Mediathek (Uploads → Video, Dateien `Andrea_70_Geburtstag_v3.mp4`, `_v2.mp4` und `Andrea_70_Geburtstag.mp4`): https://higgsfield.ai
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

## Ablauf des Videos

| Zeit (ca.) | Szene | Inhalt |
|---|---|---|
| 0:00–0:10 | Eröffnung | Café-Paris-Terrasse mit Rathaus, Titel „Für Andrea – Joyeux anniversaire · Zum 70. Geburtstag“ |
| 0:09–0:24 | Andrea | Andreas Foto (Hafenrundfahrt) mit langsamem Zoom, „Bon anniversaire, Andrea !“, gesprochener Gruß auf Französisch und Deutsch, französische Musette |
| 0:23–0:31 | Paris | Akkordeonspieler in Montmartre, Bauchbinde „Un peu de Paris à Hambourg · Ein Stück Paris in Hamburg“ |
| 0:31–0:45 | Gesang, Strophe 1 (deutsch) | Chanson-Sängerin singt auf Deutsch, Liedtext mit französischer Übersetzung eingeblendet |
| 0:45–0:56 | Gesang, Strophe 2 (französisch) | Zweite Strophe auf Französisch mit deutscher Übersetzung, Toast mit Champagner in die Kamera |
| 0:55–1:05 | Toast | Champagner-Anstoßen, Bauchbinde „Santé, Andrea ! · Zum Wohl, Andrea!“ |
| 1:04–1:15 | Gutschein | Der Gutschein (Ken-Burns-Zoom) mit Goldrahmen |
| 1:15–1:24 | Abspann | „Joyeux 70e anniversaire, Andrea – Alles Liebe zum 70. Geburtstag – Von Basti“, gesprochen „De la part de Basti, avec tout mon cœur – von Basti, von ganzem Herzen“ |

Musik: Durchgehend französische Akkordeon-Musette (aus den Higgsfield-Clips
Eröffnung, Paris und Toast als Musikbett), in den Gesangsszenen Chanson mit
Akkordeon und Kontrabass. Die gesprochenen Grüße kommen von einer
ElevenLabs-Stimme (über Higgsfield, laut Szenenanalyse eine Männerstimme,
passend zum Absender Basti), damit Französisch und Deutsch sauber
ausgesprochen werden.

## Liedtext (Version 4, gesungen)

Strophe 1 auf Deutsch (mit französischer Übersetzung im Bild):

> Liebe Andrea, heute wirst du siebzig Jahr.
> Wir feiern dich, denn du bist wunderbar.
> Im Café Paris, auf eine schöne Zeit!

Strophe 2 auf Französisch (mit deutscher Übersetzung im Bild):

> Joyeux anniversaire, Andrea !
> Au Café Paris, à Hambourg, on trinque à toi.
> Avec tout notre amour, de la part de Basti.

Beide Strophen wurden mit Seedance 2.5 in 1080p mit der jeweiligen
Prompt-Sprache generiert, aus mehreren Kandidaten per Spracherkennung die
mit der saubersten Aussprache ausgewählt.

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
