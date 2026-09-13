#!/usr/bin/env python3
"""Erzeugt alle Grafik-Ebenen für das Geburtstagsvideo (Titel, Bauchbinde,
Gutschein-Tafel, Abspann) als PNG-Dateien mit Pillow.

Aufruf:  python3 make_overlays.py <assets_dir> <out_dir>
"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS, OUT = sys.argv[1], sys.argv[2]
W, H = 1920, 1080
GOLD = (212, 175, 55)
CREAM = (248, 240, 222)
INK = (20, 15, 10)


def font(name, size):
    return ImageFont.truetype(f"{ASSETS}/{name}", size)


def text_layer(lines, shadow=True):
    """lines: Liste von (text, font, fill, y). Transparentes 1920x1080-PNG."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(sh)
        for text, f, fill, y in lines:
            w = d.textlength(text, font=f)
            d.text(((W - w) / 2 + 3, y + 4), text, font=f, fill=(0, 0, 0, 200))
        sh = sh.filter(ImageFilter.GaussianBlur(10))
        img = Image.alpha_composite(img, sh)
    d = ImageDraw.Draw(img)
    for text, f, fill, y in lines:
        w = d.textlength(text, font=f)
        d.text(((W - w) / 2, y), text, font=f, fill=fill)
    return img


def spaced(text, gap=" "):
    return gap.join(text)


# 1) Titel über der Eröffnungsszene
title = text_layer([
    ("Für Andrea", font("GreatVibes.ttf", 210), GOLD, 250),
    ("Zum 70. Geburtstag", font("CormorantGaramond-SemiBold.ttf", 82), CREAM, 520),
])
title.save(f"{OUT}/ov_title.png")

# 2) Bauchbinde über der Toast-Szene
lower = text_layer([
    ("Eine besondere Auszeit", font("CormorantGaramond-SemiBold.ttf", 78), CREAM, 760),
    (spaced("IM CAFÉ PARIS AM HAMBURGER RATHAUS"), font("Montserrat-SemiBold.ttf", 30), GOLD, 870),
])
lower.save(f"{OUT}/ov_lower.png")

# 3) Gutschein-Tafel: unscharfer, abgedunkelter Hintergrund + Gutschein mit Goldrahmen
voucher = Image.open(f"{ASSETS}/gutschein.png").convert("RGB")
bg = voucher.resize((W, int(W * voucher.height / voucher.width)))
bg = bg.crop((0, (bg.height - H) // 2, W, (bg.height - H) // 2 + H))
bg = bg.filter(ImageFilter.GaussianBlur(28))
bg = Image.blend(bg, Image.new("RGB", (W, H), INK), 0.55)
card_h = 960
card_w = int(voucher.width * card_h / voucher.height)
card = voucher.resize((card_w, card_h), Image.LANCZOS)
frame = Image.new("RGB", (card_w + 16, card_h + 16), GOLD)
frame.paste(card, (8, 8))
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
x0, y0 = (W - frame.width) // 2, (H - frame.height) // 2
sd.rectangle((x0 + 10, y0 + 18, x0 + frame.width + 10, y0 + frame.height + 18), fill=(0, 0, 0, 190))
shadow = shadow.filter(ImageFilter.GaussianBlur(30))
plate = Image.alpha_composite(bg.convert("RGBA"), shadow)
plate.paste(frame, (x0, y0))
plate.convert("RGB").save(f"{OUT}/voucher_plate.png")

# 4) Abspann
end = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(end)
for y in range(H):  # weicher Verlauf ins Warme
    t = y / H
    d.line([(0, y), (W, y)], fill=(int(20 + 26 * t), int(15 + 18 * t), int(10 + 8 * t)))
end = end.convert("RGBA")
end_txt = text_layer([
    ("Alles Liebe zum 70. Geburtstag", font("CormorantGaramond-SemiBold.ttf", 76), CREAM, 300),
    ("Andrea", font("GreatVibes.ttf", 260), GOLD, 400),
    ("Von Basti", font("CormorantGaramond-Regular.ttf", 60), CREAM, 750),
], shadow=False)
end = Image.alpha_composite(end, end_txt)
# Goldene Linien
d = ImageDraw.Draw(end)
d.line([(660, 700), (1260, 700)], fill=GOLD + (255,), width=2)
end.convert("RGB").save(f"{OUT}/end_card.png")
print("overlays ok")
