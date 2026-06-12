"""
Anadolu Borsa — Ana Scraper
Calistirilacak: python scraper/scraper.py
Ortam: scraper/.env dosyasindan SUPABASE_URL ve SUPABASE_SERVICE_KEY okunur
CI: ayni degiskenler GitHub Secrets'tan gelir (Settings > Secrets > Actions).
Not: SUPABASE_URL ve SUPABASE_SERVICE_KEY ikisi de Secrets'ta tanimli olmali.
"""

import json
import re
import time
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(override=False)

# Tarihler her zaman Turkiye gunune gore (GitHub Actions runner'i UTC'de calisir;
# 23:00 TSI = 20:00 UTC ayni gune denk gelir ama buna sans eseri guvenmeyelim).
# tzdata yoksa (Windows) sabit UTC+3 kullan: Turkiye 2016'dan beri DST uygulamiyor.
try:
    from zoneinfo import ZoneInfo
    TR_TZ = ZoneInfo("Europe/Istanbul")
except Exception:
    TR_TZ = timezone(timedelta(hours=3), name="TRT")


def bugun_tr() -> str:
    return datetime.now(TR_TZ).date().isoformat()


# Supabase istemcisi lazy olusturulur: modul import'u (testler dahil) env gerektirmez,
# guard ilk DB erisiminde calisir.
_supabase = None


def get_supabase():
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        eksik = [ad for ad, deg in (("SUPABASE_URL", url), ("SUPABASE_SERVICE_KEY", key)) if not deg]
        if eksik:
            raise SystemExit(
                f"[HATA] Ortam degiskeni eksik: {', '.join(eksik)}.\n"
                "  - Yerelde: scraper/.env dosyasina ekleyin.\n"
                "  - GitHub Actions: repo Settings > Secrets and variables > Actions altina "
                "ayni isimlerle ekleyin."
            )
        from supabase import create_client
        _supabase = create_client(url, key)
    return _supabase


# --- NORMALIZE ---
def normalize(text: str) -> str:
    result = ""
    tr_map = {
        "İ": "I", "Ğ": "G", "Ü": "U", "Ş": "S", "Ö": "O", "Ç": "C",
        "ı": "I", "ğ": "G", "ü": "U", "ş": "S", "ö": "O", "ç": "C",
    }
    for c in text.upper():
        result += tr_map.get(c, c)
    return result.strip()


HEDEF_YEM = {
    "ARPA":   "ARPA",
    "BUGDAY": "BUGDAY",
    "MISIR":  "MISIR",
    "SAMAN":  "SAMAN",
    "YONCA":  "YONCA",
    "YULAF":  "YULAF",
    "CAVDAR": "CAVDAR",
}


def urun_norm_bul(ad: str) -> str | None:
    n = normalize(ad)
    for k in HEDEF_YEM:
        if k in n:
            return HEDEF_YEM[k]
    return None


def parse_fiyat(s) -> float | None:
    """Turkce/karisik sayi formatlarini cozumler.

    Kurallar:
      - Hem '.' hem ',' varsa: '.' binlik, ',' ondalik  -> '15.206,000' = 15206.0
      - Yalniz ',' varsa: ondalik                        -> '11,550'     = 11.55
      - Yalniz tek '.' varsa: noktadan sonra tam 3 hane VE oncesi <=3 hane ise
        binlik ('12.000' = 12000), aksi halde ondalik ('14.50' = 14.5)
      - Birden cok '.' varsa: binlik                     -> '1.234.567'  = 1234567
    Eski surum her noktayi binlik sayip '14.50' girdisini 1450 yapiyordu (10x hata).
    """
    s = str(s).strip().replace("\xa0", "").replace(" ", "")
    if not s:
        return None
    neg = s.startswith("-")
    s = s.lstrip("+-")
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    elif s.count(".") == 1:
        bas, son = s.split(".")
        if len(son) == 3 and 0 < len(bas) <= 3:
            s = bas + son
    elif s.count(".") > 1:
        s = s.replace(".", "")
    try:
        v = float(s)
    except ValueError:
        return None
    return -v if neg else v


def ton_to_kg(v: float | None) -> float | None:
    """TOBB borsalari ayni urunu farkli birimle yayinlayabiliyor:
      - Eskisehir 'ARPA' = '15.206,000' -> 15206 TL/ton
      - Corum     'ARPA' = '11,550'     -> 11.55 TL/kg
    Tahil TL/kg ~8-30, TL/ton ~8000-30000 araliginda; aradaki bosluk genis
    oldugu icin >=1000 olan degerleri ton kabul edip /1000 ile TL/kg'a ceviriyoruz."""
    if v is None:
        return None
    return round(v / 1000, 4) if v >= 1000 else round(v, 4)


# Sanity bound'lar: kaynak HTML'i degisir/bozulursa absurt degerin DB'ye
# yazilmasini engeller; sinir disi deger None olur (kayit atilir veya alan bos kalir).
YEM_FIYAT_SINIR = (0.5, 500.0)       # TL/kg
HAYVAN_FIYAT_SINIR = (20.0, 5000.0)  # TL/kg karkas


def sinirla(v: float | None, sinir: tuple[float, float]) -> float | None:
    if v is None:
        return None
    alt, ust = sinir
    return v if alt <= v <= ust else None


# --- LOG ---
def log_yaz(kaynak: str, durum: str, kayit_sayisi: int = 0, hata=None):
    # Log yazimi hicbir zaman scraper'i durdurmamali (ag hatasi vb.)
    try:
        get_supabase().table("scraper_log").insert({
            "kaynak":       kaynak,
            "durum":        durum,
            "kayit_sayisi": kayit_sayisi,
            "hata_mesaji":  str(hata) if hata else None,
        }).execute()
    except Exception as e:
        print(f"[UYARI] scraper_log yazilamadi ({kaynak}): {e}")


# --- FALLBACK KONTROL ---
def fallback_kontrol(kaynak: str, gun_esik: int = 3):
    """3 gun ust uste hata varsa kritik uyari yaz."""
    try:
        result = (
            get_supabase().table("scraper_log")
            .select("*")
            .eq("kaynak", kaynak)
            .order("calisma_tarihi", desc=True)
            .limit(gun_esik)
            .execute()
        )
    except Exception as e:
        print(f"[UYARI] fallback kontrolu yapilamadi ({kaynak}): {e}")
        return
    hatalar = [r for r in (result.data or []) if r.get("durum") == "hata"]
    if len(hatalar) >= gun_esik:
        print(f"[KRITIK] {kaynak} {gun_esik} gundir calısmiyor!")


# --- UPSERT ---
def _dedup(veriler: list, keys: list) -> list:
    seen, result = set(), []
    for v in veriler:
        k = tuple(v.get(key) for key in keys)
        if k not in seen:
            seen.add(k)
            result.append(v)
    return result


def yem_kaydet(veriler: list):
    if not veriler:
        return
    veriler = _dedup(veriler, ["borsa", "urun_norm", "cekilme_tarihi"])
    get_supabase().table("fiyat_snapshot").upsert(
        veriler, on_conflict="borsa,urun_norm,cekilme_tarihi"
    ).execute()


def hayvan_kaydet(veriler: list):
    if not veriler:
        return
    veriler = _dedup(veriler, ["kaynak", "hayvan_norm", "cekilme_tarihi"])
    get_supabase().table("hayvan_fiyat_snapshot").upsert(
        veriler, on_conflict="kaynak,hayvan_norm,cekilme_tarihi"
    ).execute()


# --- TOBB SCRAPER ---
TOBB_BORSALAR = {
    "ANKARA":    "5AN10",
    "ESKISEHIR": "5ES10",
    "CORUM":     "5CO20",
    "ILGIN":     "5IL10",
}


def tobb_scrape(borsa_adi: str, borsa_kod: str) -> list:
    url = f"https://borsa.tobb.org.tr/fiyat_borsa.php?borsakod={borsa_kod}"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")
        tablo = soup.find("table")
        if not tablo:
            raise Exception("Tablo bulunamadi")
        sonuclar = []
        for satir in tablo.find_all("tr")[1:]:
            h = [td.get_text(strip=True) for td in satir.find_all("td")]
            if len(h) < 6:
                continue
            norm = urun_norm_bul(h[0])
            if not norm:
                continue
            ortalama = sinirla(ton_to_kg(parse_fiyat(h[5])) if len(h) > 5 else None, YEM_FIYAT_SINIR)
            if ortalama is None:
                # Site yapisi degisti/bozuk deger geldi: sessizce yazma, atla
                continue
            sonuclar.append({
                "borsa":          borsa_adi,
                "urun":           h[0],
                "urun_norm":      norm,
                "birim":          h[1] if len(h) > 1 else "KG",
                "son_tarih":      None,
                "en_az":          sinirla(ton_to_kg(parse_fiyat(h[3])) if len(h) > 3 else None, YEM_FIYAT_SINIR),
                "en_cok":         sinirla(ton_to_kg(parse_fiyat(h[4])) if len(h) > 4 else None, YEM_FIYAT_SINIR),
                "ortalama":       ortalama,
                "islem_miktari":  parse_fiyat(h[6]) if len(h) > 6 else None,
                "cekilme_tarihi": bugun_tr(),
            })
        log_yaz(f"TOBB_{borsa_adi}", "basarili", len(sonuclar))
        print(f"[OK] TOBB {borsa_adi}: {len(sonuclar)} urun")
        return sonuclar
    except Exception as e:
        log_yaz(f"TOBB_{borsa_adi}", "hata", hata=e)
        fallback_kontrol(f"TOBB_{borsa_adi}")
        print(f"[HATA] TOBB {borsa_adi}: {e}")
        return []


# --- KTB SCRAPER (Playwright) ---
def ktb_scrape() -> list:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[UYARI] Playwright kurulu degil")
        return []
    sonuclar = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://www.ktb.org.tr/anlikfiyat", timeout=30000)
            page.wait_for_selector("table", timeout=15000)
            soup = BeautifulSoup(page.content(), "html.parser")
            for tablo in soup.find_all("table"):
                for satir in tablo.find_all("tr")[1:]:
                    h = [td.get_text(strip=True) for td in satir.find_all("td")]
                    if len(h) < 4:
                        continue
                    norm = urun_norm_bul(h[0])
                    if not norm:
                        continue
                    ortalama = sinirla(ton_to_kg(parse_fiyat(h[2])) if len(h) > 2 else None, YEM_FIYAT_SINIR)
                    if ortalama is None:
                        continue
                    sonuclar.append({
                        "borsa":          "KTB_KONYA",
                        "urun":           h[0],
                        "urun_norm":      norm,
                        "birim":          "KG",
                        "son_tarih":      None,
                        "en_az":          ortalama,
                        "en_cok":         sinirla(ton_to_kg(parse_fiyat(h[3])) if len(h) > 3 else None, YEM_FIYAT_SINIR),
                        "ortalama":       ortalama,
                        "islem_miktari":  None,
                        "cekilme_tarihi": bugun_tr(),
                    })
            log_yaz("KTB_KONYA", "basarili", len(sonuclar))
            print(f"[OK] KTB: {len(sonuclar)} urun")
        except Exception as e:
            log_yaz("KTB_KONYA", "hata", hata=e)
            fallback_kontrol("KTB_KONYA")
            print(f"[HATA] KTB: {e}")
        finally:
            browser.close()
    return sonuclar


# --- ESK SCRAPER (Karkas) ---
def esk_karkas_scrape() -> list:
    url = "https://www.esk.gov.tr/tr/11931/Alim-Fiyatlari"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"}
    HAYVAN_MAP = {
        "TOSUN": "TOSUN", "INEK": "INEK", "MANDA": "MANDA",
        "KUZU":  "KUZU",  "TOKLU": "TOKLU", "KOYUN": "KOYUN",
        "DANA":  "DANA",  "OGLAK": "OGLAK",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")
        sonuclar = []
        for tablo in soup.find_all("table"):
            for satir in tablo.find_all("tr")[1:]:
                h = [td.get_text(strip=True) for td in satir.find_all(["td", "th"])]
                if len(h) < 2:
                    continue
                hayvan_adi = h[0]
                n = normalize(hayvan_adi)
                norm = next((v for k, v in HAYVAN_MAP.items() if k in n), None)
                if not norm:
                    continue
                fiyat = sinirla(parse_fiyat(h[-1]), HAYVAN_FIYAT_SINIR)
                if not fiyat:
                    continue
                kat = "buyukbas" if norm in ["TOSUN", "INEK", "MANDA", "DANA"] else "kucukbas"
                sonuclar.append({
                    "kaynak":         "ESK",
                    "hayvan":         hayvan_adi,
                    "hayvan_norm":    norm,
                    "kategori":       kat,
                    "bolge":          None,
                    "fiyat":          fiyat,
                    "birim":          "TL/kg karkas",
                    "cekilme_tarihi": bugun_tr(),
                })
        log_yaz("ESK_KARKAS", "basarili", len(sonuclar))
        print(f"[OK] ESK karkas: {len(sonuclar)} hayvan")
        return sonuclar
    except Exception as e:
        log_yaz("ESK_KARKAS", "hata", hata=e)
        fallback_kontrol("ESK_KARKAS")
        print(f"[HATA] ESK karkas: {e}")
        return []


# --- USK SCRAPER (Cig Sut Tavsiye Fiyati) ---
# ESK cig sut sayfalarini yayindan kaldirdi (2026-06 itibariyla hepsi 404).
# Resmi referans: Ulusal Sut Konseyi (USK) cig sut tavsiye fiyati duyurulari.
# Fiyat donemseldir (yilda 2-3 kez belirlenir); gunluk calisma o gun gecerli
# degeri yeniden yazar — tazelik rozeti ve tarihsel seri icin istenen davranis.
USK_SITE = "https://ulusalsutkonseyi.org.tr"
USK_KATEGORI_URL = f"{USK_SITE}/kategori/cig-sut-fiyatlari/"
SUT_FIYAT_SINIR = (5.0, 200.0)  # TL/litre


def _usk_fiyat_ayikla(metin: str) -> float | None:
    """USK duyuru metninden tavsiye fiyatini cikar.

    Ornek duyuru cumlesi: "...cig inek sutu tavsiye satis fiyati ureticinin
    eline litre basina net gececek sekilde (cig sut destegi haric) 24,30 TL
    olarak oy birligi ile belirlenmistir."
    """
    duz = normalize(metin)  # buyuk harf + TR karakter sadelestirme
    for pat in [
        r"TAVSIYE\s+(?:SATIS\s+)?FIYATI[^0-9]{0,250}?(\d{1,3},\d{1,4})\s*TL",
        r"(\d{1,3},\d{1,4})\s*TL\s+OLARAK",
        r"LITRE[^0-9]{0,100}?(\d{1,3},\d{1,4})\s*TL",
    ]:
        m = re.search(pat, duz)
        if m:
            f = sinirla(parse_fiyat(m.group(1)), SUT_FIYAT_SINIR)
            if f:
                return f
    return None


def _usk_tablo_fiyat(soup) -> float | None:
    """Yillik fiyat sayfasindaki donem tablosundan guncel fiyati cek.

    Tablo yapisi: DONEM | CIG INEK SUTU TAVSIYE FIYATI (TL/Lt) | ...
    Satirlar kronolojik; en alttaki (acik uclu donem) gecerli fiyattir.
    """
    for tablo in soup.find_all("table"):
        satirlar = tablo.find_all("tr")
        if not satirlar:
            continue
        baslik = [normalize(b.get_text(" ", strip=True)) for b in satirlar[0].find_all(["td", "th"])]
        fiyat_idx = next((i for i, b in enumerate(baslik) if "TAVSIYE FIYATI" in b), None)
        if fiyat_idx is None:
            continue
        son = None
        for tr in satirlar[1:]:
            h = [td.get_text(" ", strip=True) for td in tr.find_all(["td", "th"])]
            if len(h) <= fiyat_idx:
                continue
            f = sinirla(parse_fiyat(h[fiyat_idx]), SUT_FIYAT_SINIR)
            if f:
                son = f
        if son:
            return son
    return None


def usk_sut_scrape() -> list:
    """Parite hesabi icin ZORUNLU. SUT norm kodu ile hayvan_fiyat_snapshot'a yazilir."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"}
    try:
        resp = requests.get(USK_KATEGORI_URL, headers=headers, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Kategori sayfasinda en yeni yil/duyuru sayfalari ustte; sirayi koruyarak topla
        linkler: list[str] = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "tavsiye-fiyat" not in href:
                continue
            if href.startswith("/"):
                href = USK_SITE + href
            if href not in linkler:
                linkler.append(href)

        for link in linkler[:3]:
            try:
                r = requests.get(link, headers=headers, timeout=20)
                r.raise_for_status()
                sayfa = BeautifulSoup(r.text, "html.parser")
                # 1) donem tablosu (yillik sayfalar), 2) duyuru cumlesi (haber sayfalari)
                fiyat = _usk_tablo_fiyat(sayfa) or _usk_fiyat_ayikla(sayfa.get_text(" ", strip=True))
            except Exception:
                continue
            if fiyat:
                kayit = [{
                    "kaynak":         "USK",
                    "hayvan":         "Cig Sut (USK tavsiye)",
                    "hayvan_norm":    "SUT",
                    "kategori":       "sut",
                    "bolge":          None,
                    "fiyat":          fiyat,
                    "birim":          "TL/litre",
                    "cekilme_tarihi": bugun_tr(),
                }]
                log_yaz("USK_SUT", "basarili", 1)
                print(f"[OK] USK sut ({link}): {fiyat} TL/litre")
                return kayit

        raise ValueError(f"duyurularda fiyat bulunamadi ({len(linkler)} link denendi)")
    except Exception as e:
        log_yaz("USK_SUT", "hata", hata=e)
        fallback_kontrol("USK_SUT")
        print(f"[HATA] USK sut: {e}")
        return []


# --- UKON SCRAPER ---
def ukon_scrape() -> list:
    url = "https://www.ukon.org.tr/fiyatlar"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")
        tablo = soup.find("table")
        if not tablo:
            return ukon_playwright()
        sonuclar = []
        for satir in tablo.find_all("tr")[1:]:
            h = [td.get_text(strip=True) for td in satir.find_all("td")]
            if len(h) < 3:
                continue
            fiyat = sinirla(parse_fiyat(h[2]), HAYVAN_FIYAT_SINIR)
            if not fiyat:
                continue
            n = normalize(h[0])
            norm = "DANA" if "DANA" in n else "KUZU" if "KUZU" in n else None
            if not norm:
                continue
            sonuclar.append({
                "kaynak":         "UKON",
                "hayvan":         h[0],
                "hayvan_norm":    norm,
                "kategori":       "buyukbas" if norm == "DANA" else "kucukbas",
                "bolge":          h[1] if len(h) > 1 else None,
                "fiyat":          fiyat,
                "birim":          "TL/kg karkas",
                "cekilme_tarihi": bugun_tr(),
            })
        log_yaz("UKON", "basarili", len(sonuclar))
        print(f"[OK] UKON: {len(sonuclar)} fiyat")
        return sonuclar
    except Exception as e:
        log_yaz("UKON", "hata", hata=e)
        print(f"[HATA] UKON: {e}")
        return []


def ukon_playwright() -> list:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return []
    sonuclar = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://www.ukon.org.tr/fiyatlar", timeout=30000)
            page.wait_for_selector("table", timeout=15000)
            soup = BeautifulSoup(page.content(), "html.parser")
            for tablo in soup.find_all("table"):
                for satir in tablo.find_all("tr")[1:]:
                    h = [td.get_text(strip=True) for td in satir.find_all("td")]
                    if len(h) < 3:
                        continue
                    fiyat = sinirla(parse_fiyat(h[2]), HAYVAN_FIYAT_SINIR)
                    if not fiyat:
                        continue
                    n = normalize(h[0])
                    norm = "DANA" if "DANA" in n else "KUZU" if "KUZU" in n else None
                    if not norm:
                        continue
                    sonuclar.append({
                        "kaynak":         "UKON",
                        "hayvan":         h[0],
                        "hayvan_norm":    norm,
                        "kategori":       "buyukbas" if norm == "DANA" else "kucukbas",
                        "bolge":          h[1] if len(h) > 1 else None,
                        "fiyat":          fiyat,
                        "birim":          "TL/kg karkas",
                        "cekilme_tarihi": bugun_tr(),
                    })
        except Exception:
            pass
        finally:
            browser.close()
    return sonuclar


# --- HAVA ---
def hava_guncelle():
    from hava import hava_cek
    import json
    iller_path = Path(__file__).parent / "iller.json"
    iller = json.loads(iller_path.read_text(encoding="utf-8"))
    tum_hava = []
    for il, koord in iller.items():
        kayitlar = hava_cek(il, koord["lat"], koord["lon"])
        tum_hava.extend(kayitlar)
        time.sleep(0.3)
    if tum_hava:
        get_supabase().table("hava_durumu").upsert(
            tum_hava, on_conflict="il,tahmin_tarihi"
        ).execute()
        print(f"[OK] Hava durumu: {len(tum_hava)} kayit")


# --- ANA AKIS ---
def main():
    print(f"\n{'=' * 50}")
    print(f"Anadolu Borsa Scraper — {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    print(f"{'=' * 50}\n")

    # YEM
    yem_veriler = []
    for ad, kod in TOBB_BORSALAR.items():
        yem_veriler.extend(tobb_scrape(ad, kod))
        time.sleep(1)
    yem_veriler.extend(ktb_scrape())
    if yem_veriler:
        yem_kaydet(yem_veriler)

    # HAYVAN
    hayvan_veriler = []
    hayvan_veriler.extend(esk_karkas_scrape())
    time.sleep(1)
    hayvan_veriler.extend(usk_sut_scrape())
    time.sleep(1)
    hayvan_veriler.extend(ukon_scrape())
    if hayvan_veriler:
        hayvan_kaydet(hayvan_veriler)

    # HAVA
    try:
        hava_guncelle()
    except Exception as e:
        print(f"[HATA] Hava durumu: {e}")

    # YEDEK JSON
    tum = yem_veriler + hayvan_veriler
    Path(__file__).parent.joinpath("fiyatlar_yedek.json").write_text(
        json.dumps(tum, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nToplam: {len(tum)} kayit yazildi.")


if __name__ == "__main__":
    main()
