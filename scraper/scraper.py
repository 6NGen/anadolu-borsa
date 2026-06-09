"""
Anadolu Borsa — Ana Scraper
Calistirilacak: python scraper/scraper.py
Ortam: scraper/.env dosyasindan SUPABASE_URL ve SUPABASE_SERVICE_KEY okunur
"""

import json
import time
import os
from datetime import date, datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=False)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY"),
)


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
    try:
        return float(str(s).replace(".", "").replace(",", ".").strip())
    except Exception:
        return None


def ton_to_kg(v: float | None) -> float | None:
    """TOBB borsalari ayni urunu farkli birimle yayinlayabiliyor:
      - Eskisehir 'ARPA' = '15.206,000' -> 15206 TL/ton
      - Corum     'ARPA' = '11,550'     -> 11.55 TL/kg
    Tahil TL/kg ~8-30, TL/ton ~8000-30000 araliginda; aradaki bosluk genis
    oldugu icin >=1000 olan degerleri ton kabul edip /1000 ile TL/kg'a ceviriyoruz."""
    if v is None:
        return None
    return round(v / 1000, 4) if v >= 1000 else round(v, 4)


# --- LOG ---
def log_yaz(kaynak: str, durum: str, kayit_sayisi: int = 0, hata=None):
    supabase.table("scraper_log").insert({
        "kaynak":       kaynak,
        "durum":        durum,
        "kayit_sayisi": kayit_sayisi,
        "hata_mesaji":  str(hata) if hata else None,
    }).execute()


# --- FALLBACK KONTROL ---
def fallback_kontrol(kaynak: str, gun_esik: int = 3):
    """3 gun ust uste hata varsa kritik uyari yaz."""
    result = (
        supabase.table("scraper_log")
        .select("*")
        .eq("kaynak", kaynak)
        .order("calisma_tarihi", desc=True)
        .limit(gun_esik)
        .execute()
    )
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
    supabase.table("fiyat_snapshot").upsert(
        veriler, on_conflict="borsa,urun_norm,cekilme_tarihi"
    ).execute()


def hayvan_kaydet(veriler: list):
    if not veriler:
        return
    veriler = _dedup(veriler, ["kaynak", "hayvan_norm", "cekilme_tarihi"])
    supabase.table("hayvan_fiyat_snapshot").upsert(
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
            sonuclar.append({
                "borsa":          borsa_adi,
                "urun":           h[0],
                "urun_norm":      norm,
                "birim":          h[1] if len(h) > 1 else "KG",
                "son_tarih":      None,
                "en_az":          ton_to_kg(parse_fiyat(h[3])) if len(h) > 3 else None,
                "en_cok":         ton_to_kg(parse_fiyat(h[4])) if len(h) > 4 else None,
                "ortalama":       ton_to_kg(parse_fiyat(h[5])) if len(h) > 5 else None,
                "islem_miktari":  parse_fiyat(h[6]) if len(h) > 6 else None,
                "cekilme_tarihi": date.today().isoformat(),
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
                    sonuclar.append({
                        "borsa":          "KTB_KONYA",
                        "urun":           h[0],
                        "urun_norm":      norm,
                        "birim":          "KG",
                        "son_tarih":      None,
                        "en_az":          ton_to_kg(parse_fiyat(h[2])) if len(h) > 2 else None,
                        "en_cok":         ton_to_kg(parse_fiyat(h[3])) if len(h) > 3 else None,
                        "ortalama":       ton_to_kg(parse_fiyat(h[2])) if len(h) > 2 else None,
                        "islem_miktari":  None,
                        "cekilme_tarihi": date.today().isoformat(),
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
                fiyat = parse_fiyat(h[-1])
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
                    "cekilme_tarihi": date.today().isoformat(),
                })
        log_yaz("ESK_KARKAS", "basarili", len(sonuclar))
        print(f"[OK] ESK karkas: {len(sonuclar)} hayvan")
        return sonuclar
    except Exception as e:
        log_yaz("ESK_KARKAS", "hata", hata=e)
        fallback_kontrol("ESK_KARKAS")
        print(f"[HATA] ESK karkas: {e}")
        return []


# --- ESK SCRAPER (Cig Sut) ---
ESK_SUT_URLS = [
    "https://www.esk.gov.tr/tr/11932/Cig-Sut-Alim-Fiyatlari",
    "https://www.esk.gov.tr/tr/Hizmetler/Cig-Sut-Alim-Fiyatlari",
    "https://www.esk.gov.tr/tr/11861/Fiyatlarimiz",
    "https://www.esk.gov.tr/tr/Hizmetler",
]

def _sut_fiyat_bul(soup) -> float | None:
    """Herhangi bir HTML yapısından süt fiyatı çıkar."""
    # 1. Tablo yaklaşımı
    for tablo in soup.find_all("table"):
        for satir in tablo.find_all("tr"):
            metin = satir.get_text(" ", strip=True).lower()
            if "süt" in metin or "sut" in metin or "litre" in metin:
                tds = satir.find_all("td")
                for td in reversed(tds):
                    f = parse_fiyat(td.get_text(strip=True))
                    if f and 5 < f < 200:
                        return f
    # 2. Serbest metin: "X TL/litre" veya "litre: X"
    import re
    metin = soup.get_text(" ")
    for pat in [
        r"[çc]i[gğ]\s*s[üu]t[^\d]{0,30}(\d{1,3}[,\.]\d{1,4})\s*(?:TL|tl)",
        r"(\d{1,3}[,\.]\d{1,4})\s*TL\s*/\s*litre",
        r"litre\s*[:\-]?\s*(\d{1,3}[,\.]\d{1,4})",
    ]:
        m = re.search(pat, metin, re.IGNORECASE)
        if m:
            f = parse_fiyat(m.group(1))
            if f and 5 < f < 200:
                return f
    return None


def esk_sut_scrape() -> list:
    """Parite hesabi icin ZORUNLU. SUT norm kodu ile hayvan_fiyat_snapshot'a yazilir."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"}

    # 1. requests ile dene
    for url in ESK_SUT_URLS:
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code != 200:
                continue
            resp.encoding = "utf-8"
            soup = BeautifulSoup(resp.text, "html.parser")
            fiyat = _sut_fiyat_bul(soup)
            if fiyat:
                kayit = [{
                    "kaynak":         "ESK_SUT",
                    "hayvan":         "Cig Sut",
                    "hayvan_norm":    "SUT",
                    "kategori":       "sut",
                    "bolge":          None,
                    "fiyat":          fiyat,
                    "birim":          "TL/litre",
                    "cekilme_tarihi": date.today().isoformat(),
                }]
                log_yaz("ESK_SUT", "basarili", 1)
                print(f"[OK] ESK sut ({url}): {fiyat} TL/litre")
                return kayit
        except Exception:
            continue

    # 2. Playwright ile dene
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            pg = browser.new_page()
            for url in ESK_SUT_URLS:
                try:
                    pg.goto(url, timeout=20000)
                    pg.wait_for_load_state("networkidle", timeout=10000)
                    soup = BeautifulSoup(pg.content(), "html.parser")
                    fiyat = _sut_fiyat_bul(soup)
                    if fiyat:
                        browser.close()
                        kayit = [{
                            "kaynak":         "ESK_SUT",
                            "hayvan":         "Cig Sut",
                            "hayvan_norm":    "SUT",
                            "kategori":       "sut",
                            "bolge":          None,
                            "fiyat":          fiyat,
                            "birim":          "TL/litre",
                            "cekilme_tarihi": date.today().isoformat(),
                        }]
                        log_yaz("ESK_SUT", "basarili", 1)
                        print(f"[OK] ESK sut (Playwright): {fiyat} TL/litre")
                        return kayit
                except Exception:
                    continue
            browser.close()
    except ImportError:
        pass

    log_yaz("ESK_SUT", "hata", hata="Sut fiyati bulunamadi (tum URL'ler denendi)")
    fallback_kontrol("ESK_SUT")
    print("[HATA] ESK sut: fiyat bulunamadi")
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
            fiyat = parse_fiyat(h[2])
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
                "cekilme_tarihi": date.today().isoformat(),
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
                    fiyat = parse_fiyat(h[2])
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
                        "cekilme_tarihi": date.today().isoformat(),
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
        supabase.table("hava_durumu").upsert(
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
    hayvan_veriler.extend(esk_sut_scrape())
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
