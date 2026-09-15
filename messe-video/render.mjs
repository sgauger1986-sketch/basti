#!/usr/bin/env node
/**
 * Rendert messe-video.html Bild für Bild zu einem MP4 (H.264, ohne Tonspur).
 *
 *   node render.mjs                       -> mexxsoft-messe-video.mp4 (1920x1080, 30 fps)
 *   node render.mjs --fps 25 --crf 18     -> andere Bildrate / Qualität
 *   node render.mjs --stills              -> nur Vorschaubilder (stills/*.png), kein Video
 *   node render.mjs --out datei.mp4
 *
 * Voraussetzungen: Node 18+, `npm install playwright` (+ `npx playwright install chromium`)
 * und ein ffmpeg mit libx264 (Umgebungsvariable FFMPEG oder `ffmpeg` im PATH).
 */
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const FPS = Number(opt('fps', 30));
const CRF = Number(opt('crf', 19));
const OUT = path.resolve(here, opt('out', 'mexxsoft-messe-video.mp4'));
const STILLS_ONLY = args.includes('--stills');
const W = 1920, H = 1080;

// Playwright: lokal installiert oder global (npm root -g)
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  const g = execSync('npm root -g').toString().trim();
  ({ chromium } = require(path.join(g, 'playwright')));
}

// ffmpeg: FFMPEG-Variable, PATH oder das Binary des Python-Pakets imageio-ffmpeg
function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  for (const c of ['ffmpeg']) { try { execSync(`${c} -version`, { stdio: 'ignore' }); return c; } catch {} }
  try { return execSync('python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"').toString().trim(); } catch {}
  throw new Error('Kein ffmpeg gefunden. Bitte FFMPEG=/pfad/zu/ffmpeg setzen oder ffmpeg installieren.');
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.addInitScript(() => { window.__RENDER = true; });
await page.goto('file://' + path.join(here, 'messe-video.html'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const D = await page.evaluate(() => window.__DURATION);
const cdp = await page.context().newCDPSession(page);

async function frame(t) {
  await page.evaluate(t => window.__seek(t), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  return Buffer.from(data, 'base64');
}

if (STILLS_ONLY) {
  const dir = path.join(here, 'stills'); mkdirSync(dir, { recursive: true });
  const times = (opt('times', '2.2,4.4,8,14,22,30,36,42,46.5')).split(',').map(Number);
  for (const t of times) { writeFileSync(path.join(dir, `t${String(t).padStart(5, '0')}.png`), await frame(t)); console.log('still', t); }
  await browser.close();
  process.exit(0);
}

const ffmpeg = findFfmpeg();
const total = Math.round(D * FPS);
console.log(`Rendere ${total} Bilder (${D}s @ ${FPS} fps) mit ${ffmpeg} -> ${OUT}`);
const ff = spawn(ffmpeg, [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-an',                                   // keine Tonspur
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-crf', String(CRF), '-preset', 'slow', '-g', String(FPS * 2),
  '-movflags', '+faststart',
  OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));

const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const buf = await frame(i / FPS);
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % FPS === 0) process.stdout.write(`\r${Math.round(100 * i / total)}%  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(`\nFertig: ${OUT}`);
