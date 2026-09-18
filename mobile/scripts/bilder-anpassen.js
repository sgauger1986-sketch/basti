#!/usr/bin/env node
/**
 * Bringt Quellbilder in alle Größen, die die App braucht – ohne zusätzliche
 * Abhängigkeiten (jimp-compact kommt mit Expo mit).
 *
 * Quellen (assets/quelle/):
 *   icon.png   quadratisch, mind. 1024 px, mit Hintergrund (App-Icon)
 *   hero.png   Hochformat (9:16), Bildwelt für den Login
 *   leer.png   Illustration für Leerzustände, transparenter Hintergrund
 *
 * Ausgabe (assets/):
 *   icon.png 1024², adaptive-icon.png 1024² (Motiv 66 %, Markenfarbe),
 *   splash-icon.png 512² (abgerundet), favicon.png 64², hero.jpg 810×1440,
 *   leer.png ≤ 600² (automatisch beschnitten)
 *
 * Aufruf: node scripts/bilder-anpassen.js
 */
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp-compact');
const { brand } = require('../brand');

const ROOT = path.resolve(__dirname, '..');
const QUELLE = path.join(ROOT, 'assets', 'quelle');
const ZIEL = path.join(ROOT, 'assets');

function hex(h) {
  return parseInt(h.replace('#', '') + 'ff', 16);
}

function rundeEcken(img, radius) {
  const w = img.bitmap.width, h = img.bitmap.height;
  img.scan(0, 0, w, h, function (x, y, idx) {
    const dx = Math.max(radius - x, 0, x - (w - 1 - radius));
    const dy = Math.max(radius - y, 0, y - (h - 1 - radius));
    if (dx * dx + dy * dy > radius * radius) this.bitmap.data[idx + 3] = 0;
  });
  return img;
}

async function icon() {
  const src = await Jimp.read(path.join(QUELLE, 'icon.png'));
  await src.clone().cover(1024, 1024).writeAsync(path.join(ZIEL, 'icon.png'));

  const adaptive = new Jimp(1024, 1024, hex(brand.colors.androidIconBackground));
  const motiv = src.clone().cover(680, 680);
  adaptive.composite(motiv, 172, 172);
  await adaptive.writeAsync(path.join(ZIEL, 'adaptive-icon.png'));

  await rundeEcken(src.clone().cover(512, 512), 112).writeAsync(path.join(ZIEL, 'splash-icon.png'));
  await rundeEcken(src.clone().cover(64, 64), 14).writeAsync(path.join(ZIEL, 'favicon.png'));
  console.log('Icon, Adaptive-Icon, Splash, Favicon geschrieben');
}

async function hero() {
  const src = await Jimp.read(path.join(QUELLE, 'hero.png'));
  await src.cover(810, 1440).quality(80).writeAsync(path.join(ZIEL, 'hero.jpg'));
  console.log('hero.jpg geschrieben');
}

async function leer() {
  const src = await Jimp.read(path.join(QUELLE, 'leer.png'));
  await src.autocrop({ tolerance: 0.02 }).scaleToFit(600, 600).writeAsync(path.join(ZIEL, 'leer.png'));
  console.log('leer.png geschrieben');
}

(async () => {
  if (!fs.existsSync(QUELLE)) throw new Error(`Quellordner fehlt: ${QUELLE}`);
  await icon();
  await hero();
  await leer();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
