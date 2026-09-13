#!/usr/bin/env python3
"""Erzeugt alle Grafik-Ebenen für das Geburtstagsvideo (Titel, Foto-Tafel,
Bauchbinden, Gutschein-Tafel, Abspann) als PNG-Dateien mit Pillow.

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


def text_layer(lines, shadow=True, align="center"):
    """lines: Liste von (text, font, fill, y[, x]). Transparentes 1920x1080-PNG."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    def pos(d, text, f, y, x=None):
        if x is not None:
            return x, y
        return (W - d.textlength(text, font=f)) / 2, y

    if shadow:
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(sh)
        for text, f, fill, y, *x in lines:
            px, py = pos(d, text, f, y, *x)
            d.text((px + 3, py + 4), text, font=f, fill=(0, 0, 0, 200))
        sh = sh.filter(ImageFilter.GaussianBlur(10))
        img = Image.alpha_composite(img, sh)
    d = ImageDraw.Draw(img)
    for text, f, fill, y, *x in lines:
        d.text(pos(d, text, f, y, *x), text, font=f, fill=fill)
    return img


def spaced(text, gap=" "):
    return gap.join(text)


def bottom_gradient(img, start=0.55, strength=200):
    """Dunkler Verlauf im unteren Bildteil für lesbare Texte."""
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(grad)
    y0 = int(H * start)
    for y in range(y0, H):
        a = int(strength * ((y - y0) / (H - y0)) ** 1.5)
        d.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    return Image.alpha_composite(img.convert("RGBA"), grad)


# 1) Titel über der Eröffnungsszene
title = text_layer([
    ("Für Andrea", font("GreatVibes.ttf", 210), GOLD, 250),
    ("Zum 70. Geburtstag", font("CormorantGaramond-SemiBold.ttf", 82), CREAM, 520),
])
title.save(f"{OUT}/ov_title.png")

# 2) Foto-Tafel: Andreas Foto als 16:9-Ausschnitt (Gesicht im oberen Drittel),
#    leicht vergrößert für den Ken-Burns-Zoom, mit dunklem Verlauf unten
photo = Image.open(f"{ASSETS}/andrea.jpg").convert("RGB")
pw, ph = photo.size
crop_h = int(pw * 9 / 16)
y0 = int(ph * 0.20)  # Ausschnitt beginnt über der Hand, endet unter der Tasche
photo = photo.crop((0, y0, pw, y0 + crop_h)).resize((2400, 1350), Image.LANCZOS)
photo.save(f"{OUT}/photo_plate.png")
photo_txt = text_layer([
    ("Herzlichen Glückwunsch, Andrea!", font("GreatVibes.ttf", 118), GOLD, 866, 110),
    (spaced("70 JAHRE"), font("Montserrat-SemiBold.ttf", 28), CREAM, 1000, 120),
])
photo_txt.save(f"{OUT}/ov_photo.png")
grad = bottom_gradient(Image.new("RGBA", (W, H), (0, 0, 0, 0)), start=0.5, strength=210)
grad.save(f"{OUT}/ov_gradient.png")

# 3) Bauchbinde über der Paris-Szene
paris = text_layer([
    ("Un peu de Paris à Hambourg", font("CormorantGaramond-SemiBold.ttf", 78), CREAM, 760),
    (spaced("EIN STÜCK PARIS IN HAMBURG"), font("Montserrat-SemiBold.ttf", 30), GOLD, 870),
])
paris.save(f"{OUT}/ov_paris.png")

# 4) Bauchbinde über der Toast-Szene
lower = text_layer([
    ("Eine besondere Auszeit", font("CormorantGaramond-SemiBold.ttf", 78), CREAM, 760),
    (spaced("IM CAFÉ PARIS AM HAMBURGER RATHAUS"), font("Montserrat-SemiBold.ttf", 30), GOLD, 870),
])
lower.save(f"{OUT}/ov_lower.png")

# 4b) Liedtext-Einblendungen: gesungene deutsche Zeile + französische Übersetzung
LYRICS = {
    "g1": [  # Strophe 1: deutsch gesungen, französische Übersetzung
        ("Liebe Andrea, heute wirst du siebzig Jahr.", "Chère Andrea, aujourd’hui tu as soixante-dix ans."),
        ("Wir feiern dich, denn du bist wunderbar.", "Nous te fêtons, car tu es merveilleuse."),
        ("Im Café Paris, auf eine schöne Zeit!", "Au Café Paris, à de beaux moments !"),
    ],
    "g2": [  # Strophe 2: französisch gesungen, deutsche Übersetzung
        ("Joyeux anniversaire, Andrea, soixante-dix ans !", "Herzlichen Glückwunsch, Andrea, siebzig Jahre!"),
        ("Au Café Paris, à Hambourg, on trinque à toi.", "Im Café Paris in Hamburg stoßen wir auf dich an."),
        ("Avec tout notre amour, de la part de Basti.", "Mit all unserer Liebe, von Basti."),
    ],
}
for clip, lines in LYRICS.items():
    for i, (de, fr) in enumerate(lines, 1):
        text_layer([
            (de, font("CormorantGaramond-SemiBold.ttf", 60), CREAM, 880),
            (fr, font("CormorantGaramond-Regular.ttf", 46), GOLD, 960),
        ]).save(f"{OUT}/sub_{clip}_{i}.png")
bottom_gradient(Image.new("RGBA", (W, H), (0, 0, 0, 0)), start=0.68, strength=170).save(f"{OUT}/ov_subgrad.png")

# 5) Gutschein-Tafel: unscharfer, abgedunkelter Hintergrund + Gutschein mit Goldrahmen
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

# 6) Abspann
end = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(end)
for y in range(H):  # weicher Verlauf ins Warme
    t = y / H
    d.line([(0, y), (W, y)], fill=(int(20 + 26 * t), int(15 + 18 * t), int(10 + 8 * t)))
end = end.convert("RGBA")
end_txt = text_layer([
    ("Alles Liebe zum 70. Geburtstag", font("CormorantGaramond-SemiBold.ttf", 76), CREAM, 300),
    ("Andrea", font("GreatVibes.ttf", 260), GOLD, 400),
    ("Von Basti", font("GreatVibes.ttf", 96), GOLD, 740),
], shadow=False)
end = Image.alpha_composite(end, end_txt)
d = ImageDraw.Draw(end)
d.line([(660, 700), (1260, 700)], fill=GOLD + (255,), width=2)
end.convert("RGB").save(f"{OUT}/end_card.png")
print("overlays ok")
