"""Rayiç tanıtım videosu kurgusu.

Girdi : ham/s1..s6.mp4 (emülatör ekran kayıtları, 1080x1920)
Çıktı : rayic-tanitim-dikey.mp4 (1080x1920) ve rayic-tanitim-yatay.mp4 (1920x1080)
Kullanım: python kurgu.py   (ffmpeg: imageio-ffmpeg paketi)
"""
import math
import pathlib
import subprocess
import wave

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

KOK = pathlib.Path(__file__).parent
HAM = KOK / "ham"
GECICI = KOK / "_gecici"
GECICI.mkdir(exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
LOGO = Image.open(KOK.parent / "ikon-512.png").convert("RGBA")

KALIN = "C:/Windows/Fonts/segoeuib.ttf"
NORMAL = "C:/Windows/Fonts/segoeui.ttf"
YESIL = (111, 211, 154)
BEYAZ = (244, 255, 248)
SOLUK = (159, 217, 185)
GECIS = 0.4

# (kaynak, başlangıç, süre, başlık, alt yazı)
SAHNELER = [
    ("s1", 0.3, 5.6, "Ne üretiyorsan", "onun fiyatı en üstte"),
    ("s2", 0.6, 6.2, "Günün fiyatları tek ekranda", "Hububat · hayvan · süt — kaynağı ve tarihiyle"),
    ("s3", 0.3, 6.4, "Borsaları karşılaştır", "Hangi ilde kaç lira, kaç ton işlem"),
    ("s4", 0.2, 3.7, "Canlı hayvan ve karkas", "30 günlük fiyat grafiği"),
    ("s5", 0.2, 5.6, "Mazotun karşılığı ne?", "1 litre motorin kaç kg buğday eder"),
    ("s6", 1.8, 4.9, "Elindeki mal kaç para eder?", "20 ton buğday ≈ 330.700 ₺"),
]
ACILIS_SURE, KAPANIS_SURE = 2.6, 3.8

DUZENLER = {
    # telefon ekranı konumu/boyutu, başlık alanı
    "dikey": dict(W=1080, H=1920, ekran=(135, 400, 810, 1440), yazi="ust"),
    "yatay": dict(W=1920, H=1080, ekran=(200, 60, 540, 960), yazi="sag"),
}


def calistir(arg):
    subprocess.run([FF, "-v", "error", "-y", *arg], check=True)


def font(yol, boyut):
    return ImageFont.truetype(yol, boyut)


def arka_plan(W, H):
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    t = np.clip(0.65 * y + 0.35 * x, 0, 1)[..., None]
    ust, alt = np.array([10, 15, 11]), np.array([18, 48, 31])
    rgb = (ust * (1 - t) + alt * t).astype(np.uint8)
    return Image.fromarray(rgb, "RGB").convert("RGBA")


def maske(W, H, ekran):
    """Arka planın kopyası; telefon ekranının yeri yuvarlak köşeli delik + ince çerçeve."""
    x, y, w, h = ekran
    r = int(w * 0.07)
    bg = arka_plan(W, H)
    delik = Image.new("L", (W, H), 255)
    ImageDraw.Draw(delik).rounded_rectangle((x, y, x + w, y + h), r, fill=0)
    bg.putalpha(delik)
    ImageDraw.Draw(bg).rounded_rectangle((x - 3, y - 3, x + w + 3, y + h + 3), r + 3, outline=(60, 110, 80, 255), width=4)
    return bg


def ortali(ciz, metin, f, y, W, renk, x0=0, gen=None):
    gen = gen or W
    b = ciz.textbbox((0, 0), metin, font=f)
    ciz.text((x0 + (gen - (b[2] - b[0])) / 2, y), metin, font=f, fill=renk)


def satirlara_bol(ciz, metin, f, maks):
    kelimeler, satirlar, s = metin.split(), [], ""
    for k in kelimeler:
        aday = (s + " " + k).strip()
        if ciz.textlength(aday, font=f) <= maks:
            s = aday
        else:
            satirlar.append(s)
            s = k
    return satirlar + [s]


def baslik_png(duzen, baslik, alt, ad):
    d = DUZENLER[duzen]
    W, H = d["W"], d["H"]
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c = ImageDraw.Draw(im)
    if d["yazi"] == "ust":
        fb, fa = font(KALIN, 74), font(NORMAL, 40)
        ortali(c, baslik, fb, 120, W, BEYAZ)
        ortali(c, alt, fa, 228, W, SOLUK)
        c.rounded_rectangle((W / 2 - 40, 300, W / 2 + 40, 308), 4, fill=YESIL)
    else:
        x0, gen = 860, 960
        fb, fa = font(KALIN, 84), font(NORMAL, 44)
        satir = satirlara_bol(c, baslik, fb, gen)
        y = 420 - 50 * (len(satir) - 1)
        c.rounded_rectangle((x0, y - 40, x0 + 90, y - 30), 5, fill=YESIL)
        for s in satir:
            c.text((x0, y), s, font=fb, fill=BEYAZ)
            y += 104
        for s in satirlara_bol(c, alt, fa, gen):
            c.text((x0, y + 16), s, font=fa, fill=SOLUK)
            y += 58
    yol = GECICI / f"{ad}_{duzen}.png"
    im.save(yol)
    return yol


def kart_png(duzen, tur):
    d = DUZENLER[duzen]
    W, H = d["W"], d["H"]
    im = arka_plan(W, H)
    c = ImageDraw.Draw(im)
    olcek = 1.0 if duzen == "dikey" else 0.8
    lg = int(300 * olcek)
    logo = LOGO.resize((lg, lg), Image.LANCZOS)
    m = Image.new("L", (lg, lg), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, lg, lg), int(lg * 0.22), fill=255)
    ly = int(H * (0.25 if tur == "acilis" else 0.16))
    im.paste(logo, ((W - lg) // 2, ly), m)
    y = ly + lg + int(50 * olcek)
    ortali(c, "Rayiç", font(KALIN, int(150 * olcek)), y, W, BEYAZ)
    y += int(200 * olcek)
    if tur == "acilis":
        ortali(c, "Fiyatın gerçek yüzü", font(NORMAL, int(60 * olcek)), y, W, SOLUK)
    else:
        ortali(c, "Tarım ve hayvancılığın güncel değerleri", font(NORMAL, int(46 * olcek)), y, W, SOLUK)
        y += int(110 * olcek)
        ortali(c, "Ücretsiz  ·  Üyelik yok", font(KALIN, int(54 * olcek)), y, W, YESIL)
        y += int(130 * olcek)
        ortali(c, "rayic.6ngen.com", font(KALIN, int(64 * olcek)), y, W, BEYAZ)
        y += int(100 * olcek)
        ortali(c, "Yakında Google Play'de", font(NORMAL, int(44 * olcek)), y, W, SOLUK)
    yol = GECICI / f"{tur}_{duzen}.png"
    im.convert("RGB").save(yol)
    return yol


def kart_klip(duzen, tur, sure):
    png = kart_png(duzen, tur)
    d = DUZENLER[duzen]
    out = GECICI / f"k_{tur}_{duzen}.mp4"
    # hafif yakınlaşma
    calistir(["-loop", "1", "-framerate", "30", "-t", str(sure), "-i", str(png),
              "-vf", f"scale={d['W']*2}:-1,zoompan=z='min(1+0.0009*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={d['W']}x{d['H']}:fps=30,format=yuv420p",
              "-t", str(sure), "-c:v", "libx264", "-crf", "18", "-preset", "medium", str(out)])
    return out


def sahne_klip(duzen, i, kaynak, bas, sure, baslik, alt):
    d = DUZENLER[duzen]
    W, H = d["W"], d["H"]
    x, y, w, h = d["ekran"]
    bg = GECICI / f"bg_{duzen}.png"
    mk = GECICI / f"maske_{duzen}.png"
    if not bg.exists():
        arka_plan(W, H).convert("RGB").save(bg)
        maske(W, H, d["ekran"]).save(mk)
    yazi = baslik_png(duzen, baslik, alt, f"y{i}")
    out = GECICI / f"s{i}_{duzen}.mp4"
    fc = (f"[1:v]trim=start={bas}:duration={sure},setpts=PTS-STARTPTS,fps=30,scale={w}:{h}:flags=lanczos[ek];"
          f"[0:v][ek]overlay={x}:{y}[a];[a][2:v]overlay=0:0[b];"
          f"[3:v]format=rgba,fade=in:st=0.15:d=0.45:alpha=1[yz];[b][yz]overlay=0:0,format=yuv420p[v]")
    calistir(["-loop", "1", "-t", str(sure), "-i", str(bg),
              "-i", str(HAM / f"{kaynak}.mp4"),
              "-loop", "1", "-t", str(sure), "-i", str(mk),
              "-loop", "1", "-t", str(sure), "-i", str(yazi),
              "-filter_complex", fc, "-map", "[v]", "-t", str(sure), "-r", "30",
              "-c:v", "libx264", "-crf", "18", "-preset", "medium", str(out)])
    return out


def muzik(sure, yol, bpm=96, sr=44100):
    """Telifsiz, sentezlenmiş sade arka plan: yumuşak pad (Am-F-C-G) + hafif ritim."""
    n = int(sure * sr)
    t = np.arange(n) / sr
    vurus = 60 / bpm
    olcu = vurus * 4
    akorlar = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (130.81, 164.81, 196.0), (196.0, 246.94, 293.66)]
    pad = np.zeros(n)
    for k in range(int(sure / olcu) + 1):
        a, b = int(k * olcu * sr), min(n, int((k + 1) * olcu * sr))
        if a >= n:
            break
        tt = t[a:b] - t[a]
        zarf = np.minimum(1, tt / 0.6) * np.minimum(1, (olcu - tt) / 0.5)
        for f in akorlar[k % 4]:
            pad[a:b] += zarf * (np.sin(2 * math.pi * f * tt) + 0.3 * np.sin(2 * math.pi * 2 * f * tt))
    pad *= 0.06
    ritim = np.zeros(n)
    rng = np.random.default_rng(7)
    for k in range(int(sure / vurus) + 1):
        a = int(k * vurus * sr)
        if a >= n:
            break
        L = min(n - a, int(0.25 * sr))
        tt = np.arange(L) / sr
        ritim[a:a + L] += 0.35 * np.sin(2 * math.pi * (55 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)
        h = int((k + 0.5) * vurus * sr)
        if h < n:
            L2 = min(n - h, int(0.05 * sr))
            ritim[h:h + L2] += 0.05 * rng.standard_normal(L2) * np.exp(-np.arange(L2) / sr * 80)
    ses = pad + ritim * 0.6
    ses *= np.minimum(1, t / 1.5) * np.minimum(1, (sure - t) / 2.0)
    ses = np.clip(ses / max(1e-9, np.abs(ses).max()) * 0.5, -1, 1)
    with wave.open(str(yol), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((ses * 32767).astype(np.int16).tobytes())


def birlestir(duzen):
    klipler = [(kart_klip(duzen, "acilis", ACILIS_SURE), ACILIS_SURE)]
    for i, (k, bas, sure, b, a) in enumerate(SAHNELER, 1):
        klipler.append((sahne_klip(duzen, i, k, bas, sure, b, a), sure))
    klipler.append((kart_klip(duzen, "kapanis", KAPANIS_SURE), KAPANIS_SURE))

    toplam = sum(s for _, s in klipler) - GECIS * (len(klipler) - 1)
    ses = GECICI / "muzik.wav"
    if not ses.exists():
        muzik(toplam + 1, ses)

    girdi, fc, son, ofset = [], [], "[0:v]", 0.0
    for j, (k, s) in enumerate(klipler):
        girdi += ["-i", str(k)]
        if j == 0:
            ofset = s - GECIS
            continue
        etiket = f"[x{j}]"
        fc.append(f"{son}[{j}:v]xfade=transition=fade:duration={GECIS}:offset={ofset:.3f}{etiket}")
        son, ofset = etiket, ofset + s - GECIS
    sesi = len(klipler)
    fc.append(f"[{sesi}:a]atrim=0:{toplam:.3f},afade=t=out:st={toplam-2:.3f}:d=2[a]")
    cikti = KOK / f"rayic-tanitim-{duzen}.mp4"
    calistir([*girdi, "-i", str(ses), "-filter_complex", ";".join(fc),
              "-map", son, "-map", "[a]", "-c:v", "libx264", "-crf", "19", "-preset", "slow",
              "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(cikti)])
    print(f"{cikti.name}: {toplam:.1f} sn")


if __name__ == "__main__":
    for d in DUZENLER:
        birlestir(d)
