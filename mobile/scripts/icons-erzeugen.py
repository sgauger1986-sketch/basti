#!/usr/bin/env python3
"""
Erzeugt App-Icon, Adaptive-Icon (Android), Splash-Bild und Favicon aus der
Markenfarbe in ../brand.js – ohne externe Abhängigkeiten (reines Python).

Aufruf:  python3 scripts/icons-erzeugen.py
Nach einer Umbenennung/Umfärbung einfach erneut ausführen.
"""
import math, re, struct, zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
brand = (ROOT / "brand.js").read_text(encoding="utf-8")
PRIMARY = re.search(r"primary:\s*'(#[0-9a-fA-F]{6})'", brand).group(1)
NAME = re.search(r"name:\s*'([^']+)'", brand).group(1)

def hex2rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def png(path, w, h, pixel):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            raw.extend(pixel(x, y))
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    out = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    out += chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    Path(path).write_bytes(out)
    print("geschrieben:", path)

def mischen(a, b, t):
    return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))

def rundeck(x, y, w, h, r):
    """Abstand innerhalb eines abgerundeten Quadrats (>0 = innen)."""
    cx, cy = w / 2, h / 2
    dx, dy = abs(x + .5 - cx) - (w / 2 - r), abs(y + .5 - cy) - (h / 2 - r)
    ox, oy = max(dx, 0), max(dy, 0)
    return r - math.hypot(ox, oy) - min(max(dx, dy), 0) * 0

def sechseck(x, y, cx, cy, r):
    """Signierter Abstand zu einem regelmäßigen Sechseck (flache Seiten oben/unten)."""
    px, py = abs(x + .5 - cx), abs(y + .5 - cy)
    return r - max(px * math.sqrt(3) / 2 + py / 2, py)

def glyph(x, y, w, h, k):
    """Weiße Schraubenmutter (Sechseck mit Loch) – Symbol für Handwerk/Werk."""
    cx, cy = w / 2, h / 2
    r_aussen = w * 0.30 * k
    r_loch = w * 0.12 * k
    d1 = sechseck(x, y, cx, cy, r_aussen)
    d2 = math.hypot(x + .5 - cx, y + .5 - cy) - r_loch
    d = min(d1, d2)
    return max(0.0, min(1.0, d + 0.5))  # weiches Kantenpixel

def erzeuge(path, size, hintergrund, ecken, glyph_k=1.0, transparent_aussen=False):
    bg = hex2rgb(hintergrund)
    hell = mischen(bg, (255, 255, 255), 0.18)
    def pixel(x, y):
        innen = rundeck(x, y, size, size, ecken) if ecken else 1.0
        a = max(0.0, min(1.0, innen + 0.5))
        if a <= 0:
            return (0, 0, 0, 0)
        t = (x + y) / (2 * size)
        farbe = mischen(hell, bg, t)
        g = glyph(x, y, size, size, glyph_k)
        farbe = mischen(farbe, (255, 255, 255), g)
        alpha = int(round(255 * a)) if (ecken or transparent_aussen) else 255
        return (*farbe, alpha)
    png(path, size, size, pixel)

def erzeuge_transparent(path, size, glyph_k):
    def pixel(x, y):
        g = glyph(x, y, size, size, glyph_k)
        return (255, 255, 255, int(round(255 * g)))
    png(path, size, size, pixel)

assets = ROOT / "assets"
assets.mkdir(exist_ok=True)
erzeuge(assets / "icon.png", 1024, PRIMARY, ecken=0)                 # iOS rundet selbst
erzeuge(assets / "adaptive-icon.png", 1024, PRIMARY, ecken=0, glyph_k=0.7)  # Android maskiert selbst
erzeuge_transparent(assets / "splash-icon.png", 512, 1.0)            # weiße Marke auf Markenfarbe
erzeuge(assets / "favicon.png", 64, PRIMARY, ecken=12)
print(f"Icons für '{NAME}' in {PRIMARY} erzeugt.")

# ---------------------------------------------------------------------------
# Platzhalter-Quellbilder für scripts/bilder-anpassen.js (werden durch die
# finalen Bildwelten aus Higgsfield ersetzt, siehe README "Bildwelten").
# ---------------------------------------------------------------------------
quelle = assets / "quelle"
quelle.mkdir(exist_ok=True)

def hero_platzhalter(path, w=540, h=960):
    oben = mischen(hex2rgb(PRIMARY), (255, 255, 255), 0.35)
    unten = mischen(hex2rgb(PRIMARY), (0, 0, 0), 0.65)
    kreise = [(0.2, 0.25, 0.30, 0.18), (0.8, 0.15, 0.22, 0.12), (0.65, 0.5, 0.42, 0.10), (0.3, 0.7, 0.35, 0.08)]
    def pixel(x, y):
        t = y / h
        farbe = mischen(oben, unten, t * t)
        for cx, cy, r, a in kreise:
            d = math.hypot((x / w - cx), (y / h - cy) * (h / w))
            if d < r:
                farbe = mischen(farbe, (255, 255, 255), a * (1 - d / r))
        return (*farbe, 255)
    png(path, w, h, pixel)

def leer_platzhalter(path, s=512):
    bg = hex2rgb(PRIMARY); mint = (228, 239, 232); sand = (232, 220, 196)
    def rr(x, y, x0, y0, x1, y1, r):
        cx = min(max(x, x0 + r), x1 - r); cy = min(max(y, y0 + r), y1 - r)
        return math.hypot(x - cx, y - cy) <= r
    def pixel(x, y):
        # Klemmbrett
        if rr(x, y, 150, 120, 380, 420, 18):
            farbe, a = mint, 255
            if rr(x, y, 175, 165, 355, 395, 10): farbe = (255, 255, 255)
            for i, yy in enumerate((200, 250, 300, 350)):
                if rr(x, y, 200, yy, 330 - i * 15, yy + 14, 7): farbe = bg if i == 0 else sand
                if 196 <= x <= 208 and yy - 2 <= y <= yy + 16: farbe = bg
            if rr(x, y, 225, 100, 305, 140, 12): farbe = bg
            return (*farbe, a)
        # Pflanze
        if rr(x, y, 390, 330, 470, 420, 12): return (*sand, 255)
        if math.hypot(x - 430, y - 300) < 34 or math.hypot(x - 405, y - 275) < 22 or math.hypot(x - 455, y - 270) < 22:
            return (*bg, 255)
        return (0, 0, 0, 0)
    png(path, s, s, pixel)

# Icon-Quelle = das erzeugte Icon; Hero/Leer = Platzhalter
(quelle / "icon.png").write_bytes((assets / "icon.png").read_bytes())
hero_platzhalter(quelle / "hero.png")
leer_platzhalter(quelle / "leer.png")
print("Platzhalter-Quellbilder in assets/quelle/ geschrieben")
