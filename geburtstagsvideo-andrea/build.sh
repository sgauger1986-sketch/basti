#!/usr/bin/env bash
# Schneidet das Geburtstagsvideo für Andrea aus den KI-generierten Clips
# (Higgsfield) und den Grafik-Ebenen zusammen. Läuft in der Higgsfield-Sandbox
# oder lokal mit ffmpeg + python3/Pillow.
#
# Erwartet im Arbeitsverzeichnis:
#   amb1.mp4  (Eröffnung Café Paris / Rathaus, Kling 3.0)
#   g1.mp4    (Gesang Strophe 1, Seedance 2.0 mini)
#   g2.mp4    (Gesang Strophe 2, Seedance 2.0 mini)
#   toast.mp4 (Champagner-Toast, Kling 3.0)
#   assets/   (Schriften + gutschein.png)
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

echo "== Segment A: Eröffnung + Titel"
ffmpeg -v error -y -i amb1.mp4 -loop 1 -i ov/ov_title.png -filter_complex \
  "[0:v]${NORM},fade=t=in:st=0:d=1.0[v0];
   [1:v]format=rgba,fade=t=in:st=1.2:d=1.2:alpha=1,fade=t=out:st=7.8:d=1.2:alpha=1[t];
   [v0][t]overlay=0:0:shortest=1[v];[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 10 $V $A segA.mp4

echo "== Segment B: Gesang 1"
ffmpeg -v error -y -i g1.mp4 -filter_complex "[0:v]${NORM}[v];[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 15 $V $A segB.mp4

echo "== Segment C: Gesang 2"
ffmpeg -v error -y -i g2.mp4 -filter_complex "[0:v]${NORM}[v];[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 12 $V $A segC.mp4

echo "== Segment D: Toast + Bauchbinde"
ffmpeg -v error -y -i toast.mp4 -loop 1 -i ov/ov_lower.png -filter_complex \
  "[0:v]${NORM}[v0];
   [1:v]format=rgba,fade=t=in:st=1.0:d=1.0:alpha=1,fade=t=out:st=8.0:d=1.0:alpha=1[t];
   [v0][t]overlay=0:0:shortest=1[v];[0:a]${AF},${LN}[a]" \
  -map "[v]" -map "[a]" -t 10 $V $A segD.mp4

echo "== Segment E: Gutschein (Ken-Burns) und F: Abspann"
ffmpeg -v error -y -loop 1 -i ov/voucher_plate.png -filter_complex \
  "[0:v]scale=2400:1350,zoompan=z='1+0.05*on/264':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=264:s=1920x1080:fps=24,format=yuv420p[v]" \
  -map "[v]" -t 11 $V segE_v.mp4
ffmpeg -v error -y -loop 1 -i ov/end_card.png -vf "${NORM},fade=t=in:st=0:d=0.01,fade=t=out:st=4:d=1" -t 5 $V segF_v.mp4

echo "== Musikbett für E+F"
ffmpeg -v error -y -i amb1.mp4 -i toast.mp4 -i amb1.mp4 -filter_complex \
  "[0:a]${AF}[a0];[1:a]${AF}[a1];[2:a]${AF}[a2];
   [a0][a1]acrossfade=d=1.5[x];[x][a2]acrossfade=d=1.5[y];
   [y]atrim=0:16,${LN},afade=t=out:st=12:d=3[a]" -map "[a]" $A bed.m4a
ffmpeg -v error -y -i segE_v.mp4 -i segF_v.mp4 -i bed.m4a -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=1:offset=10[v]" \
  -map "[v]" -map 2:a -shortest $V $A segEF.mp4

echo "== Finaler Schnitt mit Überblendungen"
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
read -r o1 o2 o3 o4 < <(python3 - "$(dur segA.mp4)" "$(dur segB.mp4)" "$(dur segC.mp4)" "$(dur segD.mp4)" <<'EOF'
import sys
d=[float(x) for x in sys.argv[1:]]; x=0.8; o=[]; t=0
for v in d:
    t+=v-x; o.append(t)
print(" ".join(f"{v:.3f}" for v in o))
EOF
)
echo "xfade offsets: $o1 $o2 $o3 $o4"
ffmpeg -v error -y -i segA.mp4 -i segB.mp4 -i segC.mp4 -i segD.mp4 -i segEF.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=0.8:offset=${o1}[v1];
   [v1][2:v]xfade=transition=fade:duration=0.8:offset=${o2}[v2];
   [v2][3:v]xfade=transition=fade:duration=0.8:offset=${o3}[v3];
   [v3][4:v]xfade=transition=fade:duration=0.8:offset=${o4}[v];
   [0:a][1:a]acrossfade=d=0.8[a1];[a1][2:a]acrossfade=d=0.8[a2];
   [a2][3:a]acrossfade=d=0.8[a3];[a3][4:a]acrossfade=d=0.8[a]" \
  -map "[v]" -map "[a]" $V $A -movflags +faststart Andrea_70_Geburtstag.mp4

ffmpeg -v error -y -ss 4.5 -i Andrea_70_Geburtstag.mp4 -frames:v 1 -q:v 2 poster.jpg
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of compact Andrea_70_Geburtstag.mp4
echo "== fertig"
