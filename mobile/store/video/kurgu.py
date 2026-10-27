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


def muzik(sure, yol, bpm=78, sr=44100):
    """Telifsiz, sentezlenmiş sakin fon: sıcak akor zemini + seyrek marimba + yumuşak bas
    ve kısık ritim. Sol majör, G–D–Em–C (I–V–vi–IV). Stereo, hafif yankı."""
    n = int(sure * sr)
    t = np.arange(n) / sr
    vurus = 60 / bpm
    olcu = vurus * 4
    rng = np.random.default_rng(11)
    hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)  # MIDI → Hz

    # (bas kök, akor notaları) — MIDI
    akorlar = [(43, [55, 59, 62, 67]),   # G
               (38, [54, 57, 62, 66]),   # D/F#
               (40, [52, 55, 59, 64]),   # Em
               (36, [48, 52, 55, 62])]   # Cadd9
    ritim_bas, ritim_bit = ACILIS_SURE, sure - KAPANIS_SURE

    pad = np.zeros(n)
    mar_l, mar_r = np.zeros(n), np.zeros(n)
    bas = np.zeros(n)
    dav = np.zeros(n)

    def ekle(hedef, a, sinyal):
        if a >= n:
            return
        L = min(len(sinyal), n - a)
        hedef[a:a + L] += sinyal[:L]

    for k in range(int(sure / olcu) + 2):
        a0 = k * olcu
        if a0 >= sure:
            break
        kok, notalar = akorlar[k % 4]
        # akor zemini: yavaş giriş/çıkış, hafif detune (koro)
        L = int((olcu + 0.8) * sr)
        tt = np.arange(L) / sr
        zarf = np.minimum(1, tt / 0.9) * np.clip((olcu + 0.8 - tt) / 0.8, 0, 1)
        s = np.zeros(L)
        for m in notalar:
            f = hz(m)
            s += np.sin(2 * np.pi * f * tt) + np.sin(2 * np.pi * f * 1.003 * tt) + 0.12 * np.sin(2 * np.pi * 2 * f * tt)
        ekle(pad, int(a0 * sr), 0.018 * zarf * s)

        # marimba: seyrek, sekizlik ızgarada yumuşak desen (iki desen dönüşümlü)
        desen = [(0, 0), (1.5, 2), (2, 1), (3, 3)] if (k // 4) % 2 == 0 else [(0, 1), (1, 2), (2.5, 3), (3.5, 2)]
        for j, (zaman, idx) in enumerate(desen):
            m = notalar[idx] + 24
            f = hz(m)
            L = int(1.6 * sr)
            tt = np.arange(L) / sr
            ton = (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.2)
                   + 0.25 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 14)
                   + 0.06 * np.sin(2 * np.pi * 10 * f * tt) * np.exp(-tt * 30))
            ton *= np.minimum(1, tt / 0.004)
            ses_g = 0.10 * (0.85 if j % 2 else 1.0)
            pan = 0.38 if j % 2 == 0 else 0.62
            a = int((a0 + zaman * vurus) * sr)
            ekle(mar_l, a, ses_g * (1 - pan) * 2 * ton)
            ekle(mar_r, a, ses_g * pan * 2 * ton)

        if a0 < ritim_bas - 0.01 or a0 >= ritim_bit:
            continue
        # bas: 1. ve 3. vuruşta uzun, yumuşak
        for v in (0, 2):
            f = hz(kok)
            L = int(vurus * 2 * sr)
            tt = np.arange(L) / sr
            zarf = np.minimum(1, tt / 0.02) * np.exp(-tt * 1.6)
            ekle(bas, int((a0 + v * vurus) * sr), 0.09 * zarf * (np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(2 * np.pi * 2 * f * tt)))
        # kısık davul: 1 ve 3'te tok vuruş, 2 ve 4'te hafif tık, sekizliklerde fısıltı
        for v in range(4):
            a = int((a0 + v * vurus) * sr)
            if v in (0, 2):
                L = int(0.3 * sr)
                tt = np.arange(L) / sr
                ekle(dav, a, 0.13 * np.sin(2 * np.pi * (48 + 50 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 11))
            else:
                L = int(0.06 * sr)
                g = rng.standard_normal(L)
                g = np.diff(g, prepend=0)  # tizleştir
                ekle(dav, a, 0.035 * g * np.exp(-np.arange(L) / sr * 70))
            for yarim in (0, 0.5):
                L = int(0.035 * sr)
                g = np.diff(rng.standard_normal(L), prepend=0)
                ekle(dav, int((a0 + (v + yarim) * vurus) * sr), 0.010 * g * np.exp(-np.arange(L) / sr * 120))

    # yankı: üstel sönümlü gürültü (sol/sağ ayrı), FFT evrişimi
    def yanki(x, tohum):
        r = np.random.default_rng(tohum)
        L = int(1.8 * sr)
        ir = r.standard_normal(L) * np.exp(-np.arange(L) / sr / 0.45)
        ir /= np.sqrt((ir ** 2).sum())
        N = 1 << int(np.ceil(np.log2(len(x) + L)))
        return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:len(x)]

    kuru_l = pad + mar_l
    kuru_r = pad + mar_r
    sol = kuru_l + 0.22 * yanki(kuru_l, 1) + bas + dav
    sag = kuru_r + 0.22 * yanki(kuru_r, 2) + bas + dav

    zarf = np.minimum(1, t / 1.5) * np.minimum(1, (sure - t) / 2.5)
    st = np.stack([sol, sag], axis=1) * zarf[:, None]
    st = np.tanh(st * 1.2)
    st = st / max(1e-9, np.abs(st).max()) * 0.7
    with wave.open(str(yol), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


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
