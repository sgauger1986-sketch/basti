#!/usr/bin/env bash
# Schneidet das Geburtstagsvideo für Andrea aus den KI-generierten Clips
# (Higgsfield) und den Grafik-Ebenen zusammen. Läuft in der Higgsfield-Sandbox
# oder lokal mit ffmpeg + python3/Pillow.
#
# Erwartet im Arbeitsverzeichnis:
#   amb1.mp4  (Eröffnung Café Paris / Rathaus, Kling 3.0)
#   paris.mp4 (Akkordeonspieler in Montmartre, Kling 3.0)
#   g1.mp4    (Gesang Strophe 1 deutsch, Seedance 2.5, 1080p, 15 s)
#   g2.mp4    (Gesang Strophe 2 französisch, Seedance 2.5, 1080p, 12 s)
#   toast.mp4 (Champagner-Toast, Kling 3.0)
#   vo1.mp3   (gesprochener Gruß FR/DE für die Fotoszene, ElevenLabs via Higgsfield)
#   vo2.mp3   (gesprochener Gruß FR/DE für den Abspann)
#   assets/   (Schriften, andrea.jpg, gutschein.png)
#   make_overlays.py
set -euo pipefail
cd "${WORKDIR:-/home/user/w}"

mkdir -p ov
python3 make_overlays.py assets ov

V="-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 24"
A="-c:a aac -b:a 192k -ar 48000 -ac 2"
NORM="scale=1920:1080:flags=lanczos,setsar=1,fps=24,format=yuv420p"
LN="loudnorm=I=-16:TP=-1.5:LRA=11"
AF="aformat=sample_rates=48000:channel_layouts=stereo"
# Ken-Burns-Zoom: 24 fps, langsam von 1.0 auf 1.05
# Liedtext-Einblendungen: PNG-Ebenen mit Ein-/Ausblendung zu festen Zeiten (aus Whisper-Wortzeiten)
subs() { # $1 = clip (g1|g2), $2.. = "start:end" je Zeile; gibt Filter-Kette [v0]->[v] und Eingaben aus
  local clip=$1; shift; local i=1 in="" f="[v0][sg]overlay=0:0:shortest=1[w0];" prev="w0"
  for t in "$@"; do local a=${t%%:*} b=${t##*:}
    f+="[$((i+1)):v]format=rgba,fade=t=in:st=$a:d=0.3:alpha=1,fade=t=out:st=$(python3 -c "print($b-0.3)"):d=0.3:alpha=1[s$i];[$prev][s$i]overlay=0:0:shortest=1:enable='between(t,$a,$b)'[w$i];"
    prev="w$i"; in+=" -loop 1 -i ov/sub_${clip}_$i.png"; i=$((i+1)); done
  SUBF="${f%;}"; SUBF="${SUBF/\[w$((i-1))\]/[v]}"; SUBIN="-loop 1 -i ov/ov_subgrad.png$in"
}
kb() { echo "scale=2400:1350,zoompan=z='1+0.05*on/$1':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$1:s=1920x1080:fps=24,format=yuv420p"; }

echo "== Musikbett (französische Musette aus den Clips)"
# Bett 1 (für die Fotoszene): Toast-Musik + Paris-Musette
ffmpeg -v error -y -i toast.mp4 -i paris.mp4 -filter_complex \
  "[0:a]${AF}[a0];[1:a]${AF}[a1];[a0][a1]acrossfade=d=1.5[x];[x]atrim=0:15,${LN}[a]" -map "[a]" $A bed_photo.m4a
# Bett 2 (für Gutschein + Abspann): Eröffnung + Paris + Eröffnung
ffmpeg -v error -y -i amb1.mp4 -i paris.mp4 -i amb1.mp4 -filter_complex \
  "[0:a]${AF}[a0];[1:a]${AF}[a1];[2:a]${AF}[a2];[a0][a1]acrossfade=d=1.5[x];[x][a2]acrossfade=d=1.5[y];
   [y]atrim=0:19,${LN},afade=t=out:st=16:d=3[a]" -map "[a]" $A bed_end.m4a

echo "== Segment A: Eröffnung + Titel"
ffmpeg -v error -y -i amb1.mp4 -loop 1 -i ov/ov_title.png -filter_complex \
  "[0:v]${NORM},fade=t=in:st=0:d=1.0[v0];
   [1:v]format=rgba,fade=t=in:st=1.2:d=1.2:alpha=1,fade=t=out:st=7.8:d=1.2:alpha=1[t];
   [v0][t]overlay=0:0:shortest=1[v];[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 10 $V $A segA.mp4

echo "== Segment P: Andreas Foto (Ken Burns) + Gruß"
ffmpeg -v error -y -loop 1 -i ov/photo_plate.png -loop 1 -i ov/ov_gradient.png -loop 1 -i ov/ov_photo.png -i bed_photo.m4a -i vo1.mp3 -filter_complex \
  "[0:v]$(kb 360)[p];[p][1:v]overlay=0:0:shortest=1[pg];
   [2:v]format=rgba,fade=t=in:st=1.0:d=1.2:alpha=1,fade=t=out:st=13.0:d=1.2:alpha=1[t];
   [pg][t]overlay=0:0:shortest=1[v];
   [4:a]${AF},atempo=1.12,adelay=800|800,volume=1.4,asplit=2[vo1][vo2];
   [3:a][vo1]sidechaincompress=threshold=0.015:ratio=10:attack=40:release=600[bd];
   [bd][vo2]amix=inputs=2:duration=first:normalize=0[a]" \
  -map "[v]" -map "[a]" -t 15 $V $A segP.mp4

echo "== Segment M: Paris-Musette + Bauchbinde"
ffmpeg -v error -y -i paris.mp4 -loop 1 -i ov/ov_paris.png -filter_complex \
  "[0:v]${NORM}[v0];
   [1:v]format=rgba,fade=t=in:st=0.8:d=1.0:alpha=1,fade=t=out:st=6.2:d=1.0:alpha=1[t];
   [v0][t]overlay=0:0:shortest=1[v];[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 8 $V $A segM.mp4

echo "== Segment B: Gesang 1"
subs g1 0.0:4.9 5.2:9.6 9.8:14.7
ffmpeg -v error -y -i g1.mp4 $SUBIN -filter_complex "[0:v]${NORM}[v0];[1:v]format=rgba[sg];${SUBF};[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 15 $V $A segB.mp4

echo "== Segment C: Gesang 2"
subs g2 0.0:3.5 3.6:8.2 8.3:11.9
ffmpeg -v error -y -i g2.mp4 $SUBIN -filter_complex "[0:v]${NORM}[v0];[1:v]format=rgba[sg];${SUBF};[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 12 $V $A segC.mp4

echo "== Segment D: Toast + Bauchbinde"
ffmpeg -v error -y -i toast.mp4 -loop 1 -i ov/ov_lower.png -filter_complex \
  "[0:v]${NORM}[v0];
   [1:v]format=rgba,fade=t=in:st=1.0:d=1.0:alpha=1,fade=t=out:st=8.0:d=1.0:alpha=1[t];
   [v0][t]overlay=0:0:shortest=1[v];[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 10 $V $A segD.mp4

echo "== Segment E: Gutschein (Ken Burns) und F: Abspann"
ffmpeg -v error -y -loop 1 -i ov/voucher_plate.png -filter_complex "[0:v]$(kb 264)[v]" -map "[v]" -t 11 $V segE_v.mp4
ffmpeg -v error -y -loop 1 -i ov/end_card.png -vf "${NORM},fade=t=out:st=8:d=1" -t 9 $V segF_v.mp4
ffmpeg -v error -y -i segE_v.mp4 -i segF_v.mp4 -i bed_end.m4a -i vo2.mp3 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=1:offset=10[v];
   [3:a]${AF},adelay=10500|10500,volume=1.4,asplit=2[vo1][vo2];
   [2:a][vo1]sidechaincompress=threshold=0.015:ratio=10:attack=40:release=600[bd];
   [bd][vo2]amix=inputs=2:duration=first:normalize=0[a]" \
  -map "[v]" -map "[a]" -shortest $V $A segEF.mp4

echo "== Finaler Schnitt mit Überblendungen"
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
read -r o1 o2 o3 o4 o5 o6 < <(python3 -c "
import sys
d=[float(x) for x in sys.argv[1:]]; t=0; o=[]
for v in d:
    t+=v-0.8; o.append(t)
print(' '.join(f'{v:.3f}' for v in o))" "$(dur segA.mp4)" "$(dur segP.mp4)" "$(dur segM.mp4)" "$(dur segB.mp4)" "$(dur segC.mp4)" "$(dur segD.mp4)")
echo "xfade offsets: $o1 $o2 $o3 $o4 $o5 $o6"
ffmpeg -v error -y -i segA.mp4 -i segP.mp4 -i segM.mp4 -i segB.mp4 -i segC.mp4 -i segD.mp4 -i segEF.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=0.8:offset=${o1}[v1];
   [v1][2:v]xfade=transition=fade:duration=0.8:offset=${o2}[v2];
   [v2][3:v]xfade=transition=fade:duration=0.8:offset=${o3}[v3];
   [v3][4:v]xfade=transition=fade:duration=0.8:offset=${o4}[v4];
   [v4][5:v]xfade=transition=fade:duration=0.8:offset=${o5}[v5];
   [v5][6:v]xfade=transition=fade:duration=0.8:offset=${o6}[v];
   [0:a][1:a]acrossfade=d=0.8[a1];[a1][2:a]acrossfade=d=0.8[a2];
   [a2][3:a]acrossfade=d=0.8[a3];[a3][4:a]acrossfade=d=0.8[a4];
   [a4][5:a]acrossfade=d=0.8[a5];[a5][6:a]acrossfade=d=0.8[a]" \
  -map "[v]" -map "[a]" $V $A -movflags +faststart Andrea_70_Geburtstag.mp4

ffmpeg -v error -y -ss 12 -i Andrea_70_Geburtstag.mp4 -frames:v 1 -q:v 2 poster.jpg
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of compact Andrea_70_Geburtstag.mp4
echo "== fertig"
