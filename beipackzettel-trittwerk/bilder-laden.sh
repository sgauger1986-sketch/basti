#!/usr/bin/env bash
# Lädt die mit Higgsfield (GPT Image 2.5) generierten Illustrationen in den Ordner bilder/.
# Die PNG-Originale (2048 px) werden auf Druckgröße verkleinert und als JPEG gespeichert.
# Voraussetzung: curl und ImageMagick (convert). Ohne ImageMagick werden die PNGs unverändert abgelegt.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p bilder
B="https://d8j0ntlcm91z4.cloudfront.net/user_3GRTegXbub5I6mftvsB2QipWAN7"

declare -A SRC=(
  [00-titel-hund-orthese]="hf_20260918_190747_6103f6ba-d429-42c5-9b6b-c815d2816d9f.png"
  [01-klettband-kuerzen]="hf_20260918_190746_e1f5fd90-e5fe-417a-a17d-43822c68ded4.png"
  [02-schiebepolster-kuerzen]="hf_20260918_190745_9e70d13c-ff2b-4878-9cc0-e58a70367ecb.png"
  [03-grifflasche-feuerzeug]="hf_20260918_190745_45d9f5d7-9b05-4378-abfa-765b35a23c44.png"
  [04-ausstreich-effekt]="hf_20260918_190746_b6433276-eca3-48bf-8551-5467dde5b3be.png"
  [05-orthese-anlegen]="hf_20260918_190745_50e83474-5657-4826-a902-318064626129.png"
  [06-hautkontrolle]="hf_20260918_190746_7d9bc7ca-1eef-40f3-951e-c819ba0a155f.png"
  [07-pflege-buerste]="hf_20260918_190745_ef20ba04-47be-4285-b104-d6499cbefed9.png"
  [08-orthese-uebersicht]="hf_20260918_190746_ca4ea246-3e9a-4b4c-85ce-e0e729bed356.png"
)
declare -A BREITE=( [00-titel-hund-orthese]=1800 [08-orthese-uebersicht]=1400 )

for name in "${!SRC[@]}"; do
  echo "lade $name …"
  curl -sSf "$B/${SRC[$name]}" -o "bilder/$name.png"
  if command -v convert >/dev/null 2>&1; then
    convert "bilder/$name.png" -resize "${BREITE[$name]:-1000}x" -quality 88 "bilder/$name.jpg"
    rm -f "bilder/$name.png"
  else
    echo "  (ImageMagick fehlt – PNG bleibt; bitte im HTML .jpg durch .png ersetzen oder manuell konvertieren)"
  fi
done
echo "fertig: $(ls bilder | wc -l) Dateien in bilder/"
