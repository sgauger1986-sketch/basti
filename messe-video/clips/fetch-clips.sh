#!/usr/bin/env bash
# Lädt die 16 exklusiv mit Higgsfield (Seedance 2.5, 1080p, 8 s, ohne Ton) erzeugten Clips
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
  [c7]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_050618_c4c2d978-3adb-41d9-aee4-7048b3538837.mp4"  # Büro eines GaLaBau-Betriebs (v3)
  [c8]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_050618_800028dd-ac09-4fde-8557-785aea150391.mp4"  # Kundengespräch mit Tablet-Visualisierung (v3)
  [c9]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_050618_cb9b7c90-97fd-4a32-bf9a-bb95414498e5.mp4"  # Drohne: neue Straße, Pflaster und Rohrgraben (v3)
  [c10]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_050618_ff8cdb98-81ff-40da-a01a-8e7a899f4a83.mp4"  # Baubesprechung am Bauplan (v3)
  [c11]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_064650_88f11a3c-a903-483c-a3f6-e188bb261979.mp4"  # Aufmaß mit Messrad auf neuem Pflaster (v4)
  [c12]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_064650_41e7d903-6d98-4c5c-8134-916cf894f6b2.mp4"  # Kolonnen-Einteilung am Morgen auf dem Betriebshof (v4)
  [c13]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_064650_4d8dda41-12ad-4d70-939e-8b6f5c74faab.mp4"  # Fotodokumentation am Rohrgraben mit Smartphone (v4)
  [c15]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_091912_2c9ce5ff-98ad-4e2a-856c-d32594711e11.mp4"  # Betriebshof am Morgen, Polier mit Smartphone am Transporter (v6, MyOneQrew)
  [c16]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_091911_752ed4b0-fbbd-4c1b-9e4e-16ba3c31d662.mp4"  # Büro: Telefonat am Schreibtisch (v6, MyOneQrew)
  [c14]="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7/hf_20260916_064650_5798f1cc-9f6b-47d0-9cb7-16dcfd92f07b.mp4"  # Baumschule / Materiallager, Stapler mit Pflasterpalette (v4)
)

for k in c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 c16; do
  [ -f "$k.mp4" ] || curl -fL --retry 3 -o "$k.mp4" "${URLS[$k]}"
  if [ ! -f "$k.webm" ]; then
    "$FF" -y -hide_banner -loglevel error -i "$k.mp4" -an \
      -c:v libvpx-vp9 -b:v 0 -crf 26 -row-mt 1 -threads 8 -cpu-used 3 -g 12 -keyint_min 12 \
      -pix_fmt yuv420p -vf "scale=1920:1080" "$k.webm"
  fi
  echo "ok $k"
done
