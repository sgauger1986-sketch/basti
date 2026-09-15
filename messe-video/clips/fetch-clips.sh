#!/usr/bin/env bash
# Lädt die sechs exklusiv mit Higgsfield (Seedance 2.5, 1080p, 8 s, ohne Ton) erzeugten Clips
# und wandelt sie in WebM/VP9 um, damit sie im Render-Browser (Chromium ohne H.264/HEVC) laufen.
#
#   cd messe-video && bash clips/fetch-clips.sh
#
# Danach: node render.mjs
set -euo pipefail
cd "$(dirname "$0")"
FF="${FFMPEG:-ffmpeg}"

declare -A URLS=(
  [c1]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260915_095230_554107bb-48ae-4865-8940-1bcca494f15a.mp4"  # Tiefbau: Bagger hebt Rohrgraben aus
  [c2]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260915_095217_0cd42ed9-fc1b-4a1e-a937-8bee33a0a605.mp4"  # GaLaBau: fertige Gartenanlage, Drohne
  [c3]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260915_095217_9e73131a-9a81-431c-9974-f4c342f59dcd.mp4"  # Polier mit Tablet auf der Baustelle
  [c4]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260915_095230_2ae729f3-c8eb-45dd-80fa-7a43717aa572.mp4"  # GaLaBau: Pflastern, Rollrasen, Hecke
  [c5]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260915_095230_dcfaf8de-1ae3-4181-bdf0-9771e033c602.mp4"  # Tiefbau: Asphaltfertiger, Drohne
  [c6]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260915_095217_04115428-c62c-4f39-90ff-920fe04de939.mp4"  # Park im Morgenlicht
)

for k in c1 c2 c3 c4 c5 c6; do
  [ -f "$k.mp4" ] || curl -fL --retry 3 -o "$k.mp4" "${URLS[$k]}"
  if [ ! -f "$k.webm" ]; then
    "$FF" -y -hide_banner -loglevel error -i "$k.mp4" -an \
      -c:v libvpx-vp9 -b:v 0 -crf 26 -row-mt 1 -threads 8 -cpu-used 3 -g 12 -keyint_min 12 \
      -pix_fmt yuv420p -vf "scale=1920:1080" "$k.webm"
  fi
  echo "ok $k"
done
