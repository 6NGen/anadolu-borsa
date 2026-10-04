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
import sys
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


# --- SAGLIK KONTROLU ---
# 26.08-04.10 TOBB 38 gun veri vermedi ama workflow hep yesildi (hata yalniz
# scraper_log'a yaziliyordu). Bir kaynak ust uste SESSIZ_ESIK kosu boyunca hata
# verir YA DA 0 kayit dondururse kosu kirmizi biter -> GitHub e-posta atar.
# Esik 3: KTB cumartesi/tatil gunu dogal olarak 0 doner; tek bos gun alarm degil.
SESSIZ_ESIK = 3


def sessiz_kaynaklar(loglar: dict[str, list], esik: int = SESSIZ_ESIK) -> list[str]:
    """loglar: kaynak -> en yeniden eskiye scraper_log satirlari.
    Son `esik` kosunun hepsi hata ya da 0 kayit olan kaynaklari dondurur."""
    sessiz = []
    for kaynak, satirlar in loglar.items():
        son = satirlar[:esik]
        if len(son) >= esik and all(
            r.get("durum") == "hata" or not r.get("kayit_sayisi") for r in son
        ):
            sessiz.append(kaynak)
    return sessiz


def saglik_kontrol() -> list[str]:
    izlenen = [f"TOBB_{ad}" for ad in TOBB_BORSALAR] + ["KTB_KONYA", "ESK_KARKAS", "USK_SUT", "UKON", "OPET_MAZOT"]
    loglar = {}
    for kaynak in izlenen:
        try:
            loglar[kaynak] = (
                get_supabase().table("scraper_log")
                .select("durum,kayit_sayisi,hata_mesaji")
                .eq("kaynak", kaynak)
                .order("calisma_tarihi", desc=True)
                .limit(SESSIZ_ESIK)
                .execute()
            ).data or []
        except Exception as e:
            print(f"[UYARI] saglik kontrolu okunamadi ({kaynak}): {e}")
    sessiz = sessiz_kaynaklar(loglar)
    for k in sessiz:
        son_hata = next((r.get("hata_mesaji") for r in loglar[k] if r.get("hata_mesaji")), None)
        print(f"[KRITIK] {k}: son {SESSIZ_ESIK} kosuda veri yok" + (f" — {son_hata}" if son_hata else " (0 kayit)"))
    return sessiz


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
# ANKARA (5AN10) cikarildi: TOBB sayfasinda yalniz et urunleri (dana/kuzu karkas,
# but, kol) var, hububat yok -> Haziran'dan beri her gece 0 kayit donuyordu.
TOBB_BORSALAR = {
    "ESKISEHIR": "5ES10",
    "CORUM":     "5CO20",
    "ILGIN":     "5IL10",
}


# borsa.tobb.org.tr ara sertifikayi (Sectigo DV R36) gondermiyor (26.08.2026
# sertifika yenilemesinden beri). Tarayicilar AIA ile tamamliyor, requests
# tamamlamiyor -> CERTIFICATE_VERIFY_FAILED. verify=False yerine certifi koklerine
# eksik ara sertifikayi ekleyip dogrulamayi koruyoruz.
TOBB_ARA_SERTIFIKA = Path(__file__).parent / "certs" / "sectigo_dv_r36.pem"
_tobb_ca_yolu: str | None = None


def tobb_ca_bundle() -> str:
    global _tobb_ca_yolu
    if _tobb_ca_yolu is None:
        import certifi
        import tempfile
        yol = Path(tempfile.gettempdir()) / "anadolu_tobb_ca.pem"
        yol.write_text(
            Path(certifi.where()).read_text(encoding="utf-8") + "\n"
            + TOBB_ARA_SERTIFIKA.read_text(encoding="utf-8"),
            encoding="utf-8",
        )
        _tobb_ca_yolu = str(yol)
    return _tobb_ca_yolu


def istek_tekrarla(url: str, deneme: int = 3, bekleme: float = 10, **kw) -> requests.Response:
    """Baglanti kesilmesine karsi yeniden dener (TOBB sik istekte reset atiyor).
    HTTP 4xx/5xx yeniden denenmez, dogrudan hata firlatilir."""
    for i in range(deneme):
        try:
            resp = requests.get(url, **kw)
            resp.raise_for_status()
            return resp
        except (requests.ConnectionError, requests.Timeout) as e:
            if i == deneme - 1:
                raise
            print(f"[TEKRAR] {url} ({type(e).__name__}) — {bekleme * (i + 1):.0f} sn sonra")
            time.sleep(bekleme * (i + 1))
    raise RuntimeError("ulasilamaz")


def _tobb_tarih(s: str) -> str | None:
    """'02.10.2026 16:31' -> '2026-10-02'"""
    m = re.match(r"(\d{2})\.(\d{2})\.(\d{4})", s or "")
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def tobb_birlestir(borsa_adi: str, satirlar: list[list[str]], bugun: str) -> list:
    """TOBB sayfasi gunluk bulten DEGIL: her urun SINIFININ en son islem gordugu
    fiyati listeler (ayni tabloda Mayis'tan kalma arpa sinifi da olabilir).
    Eskiden ilk satir alinip bugunun tarihiyle yaziliyordu -> aylar onceki
    fiyatlar "bugun" gorunuyordu. Simdi her urun_norm icin:
      - yalniz EN SON ISLEM GUNUNUN siniflari alinir,
      - ortalama islem miktarina gore agirlikli (miktar yoksa esit agirlik),
      - cekilme_tarihi = son_tarih = o islem gunu (ayni gun tekrar cekilirse
        upsert ayni satiri gunceller; tarihce gercek islem gunlerinden olusur)."""
    gruplar: dict[str, list] = {}
    for h in satirlar:
        if len(h) < 6:
            continue
        norm = urun_norm_bul(h[0])
        tarih = _tobb_tarih(h[2])
        ortalama = sinirla(ton_to_kg(parse_fiyat(h[5])), YEM_FIYAT_SINIR)
        if not norm or not tarih or tarih > bugun or ortalama is None:
            continue  # bozuk/gelecek tarihli satir: sessizce yazma
        miktar = parse_fiyat(h[6]) if len(h) > 6 else None
        gruplar.setdefault(norm, []).append({
            "ad": h[0], "birim": h[1] or "KG", "tarih": tarih, "ort": ortalama,
            "az": sinirla(ton_to_kg(parse_fiyat(h[3])), YEM_FIYAT_SINIR),
            "cok": sinirla(ton_to_kg(parse_fiyat(h[4])), YEM_FIYAT_SINIR),
            "miktar": miktar if miktar and miktar > 0 else None,
        })
    sonuclar = []
    for norm, rs in gruplar.items():
        son = max(r["tarih"] for r in rs)
        gun = [r for r in rs if r["tarih"] == son]
        agirlik = [r["miktar"] or 1.0 for r in gun]
        ortalama = sum(r["ort"] * a for r, a in zip(gun, agirlik)) / sum(agirlik)
        azlar = [r["az"] for r in gun if r["az"] is not None]
        coklar = [r["cok"] for r in gun if r["cok"] is not None]
        miktarlar = [r["miktar"] for r in gun if r["miktar"] is not None]
        ana = max(gun, key=lambda r: r["miktar"] or 0)
        sonuclar.append({
            "borsa":          borsa_adi,
            "urun":           ana["ad"] + (f" +{len(gun) - 1} sinif (agirlikli ort.)" if len(gun) > 1 else ""),
            "urun_norm":      norm,
            "birim":          ana["birim"],
            "son_tarih":      son,
            "en_az":          min(azlar) if azlar else None,
            "en_cok":         max(coklar) if coklar else None,
            "ortalama":       round(ortalama, 4),
            "islem_miktari":  sum(miktarlar) if miktarlar else None,
            "cekilme_tarihi": son,
        })
    return sonuclar


def tobb_scrape(borsa_adi: str, borsa_kod: str) -> list:
    url = f"https://borsa.tobb.org.tr/fiyat_borsa.php?borsakod={borsa_kod}"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"}
    try:
        resp = istek_tekrarla(url, headers=headers, timeout=20, verify=tobb_ca_bundle())
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")
        tablo = soup.find("table")
        if not tablo:
            raise Exception("Tablo bulunamadi")
        satirlar = [
            [td.get_text(strip=True) for td in tr.find_all("td")]
            for tr in tablo.find_all("tr")[1:]
        ]
        sonuclar = tobb_birlestir(borsa_adi, satirlar, bugun_tr())
        log_yaz(f"TOBB_{borsa_adi}", "basarili", len(sonuclar))
        print(f"[OK] TOBB {borsa_adi}: {len(sonuclar)} urun")
        return sonuclar
    except Exception as e:
        log_yaz(f"TOBB_{borsa_adi}", "hata", hata=e)
        fallback_kontrol(f"TOBB_{borsa_adi}")
        print(f"[HATA] TOBB {borsa_adi}: {e}")
        return []


# --- KTB SCRAPER (Konya Ticaret Borsasi API) ---
# Site Angular SPA; eski Playwright yolu "anlik bulten" tablosunu okuyordu ki gece
# 23:00'te bos (ve sutunlari yanlis eslenmisti: ortalama yerine "En Cok") -> hic veri
# gelmedi. Resmi gunluk tescil bulteni JSON olarak acik: ayni gunun kapanis verisi.
KTB_BULTEN_URL = "https://www.ktb.org.tr/api/v1/Alpha.WebPanel/OnlineKullaniciBulten/GetTescilGunlukBulten/{tarih}"


def ktb_birlestir(satirlar: list, tarih: str) -> list:
    """Tescil satirlarini urun_norm basina birlestirir: ortalama islem miktarina
    gore agirlikli, en_az/en_cok tum siniflarin min/max'i, islem_miktari toplam kg."""
    gruplar: dict[str, list] = {}
    for r in satirlar:
        norm = urun_norm_bul(r.get("GrupAdi") or "") or urun_norm_bul(r.get("UrunGrubu") or "")
        ort, kg = parse_fiyat(r.get("AvgFiyat")), r.get("TopMiktar")
        if not norm or ort is None or not kg:
            continue
        gruplar.setdefault(norm, []).append((r, ort, float(kg)))
    sonuclar = []
    for norm, rs in gruplar.items():
        toplam = sum(kg for _, _, kg in rs)
        ortalama = sinirla(sum(o * kg for _, o, kg in rs) / toplam, YEM_FIYAT_SINIR)
        if ortalama is None:
            continue
        minler = [v for v in (parse_fiyat(r.get("MinFiyat")) for r, _, _ in rs) if v is not None]
        maxlar = [v for v in (parse_fiyat(r.get("MaxFiyat")) for r, _, _ in rs) if v is not None]
        sonuclar.append({
            "borsa":          "KONYA",  # diger borsalar gibi il adi: bolgem eslesmesi + gorunen ad
            "urun":           rs[0][0].get("UrunGrubu") or norm,
            "urun_norm":      norm,
            "birim":          "KG",
            "son_tarih":      None,
            "en_az":          sinirla(min(minler), YEM_FIYAT_SINIR) if minler else None,
            "en_cok":         sinirla(max(maxlar), YEM_FIYAT_SINIR) if maxlar else None,
            "ortalama":       round(ortalama, 4),
            "islem_miktari":  toplam,
            "cekilme_tarihi": tarih,
        })
    return sonuclar


def ktb_scrape() -> list:
    tarih = bugun_tr()
    try:
        resp = requests.get(
            KTB_BULTEN_URL.format(tarih=tarih),
            headers={"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"},
            timeout=20,
        )
        resp.raise_for_status()
        # Islem olmayan gun (hafta sonu/tatil) bos liste ya da 204 doner
        satirlar = resp.json() if resp.status_code == 200 and resp.content else []
        sonuclar = ktb_birlestir(satirlar, tarih)
        log_yaz("KTB_KONYA", "basarili", len(sonuclar))
        print(f"[OK] KTB: {len(sonuclar)} urun")
        return sonuclar
    except Exception as e:
        log_yaz("KTB_KONYA", "hata", hata=e)
        fallback_kontrol("KTB_KONYA")
        print(f"[HATA] KTB: {e}")
        return []


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
# Sayfa duzeni (2026-07 itibariyle): satir = BOLGE, sutunlar = Dana / Kuzu
# "Bicak Yagsiz TL/KG". Eski parser satir=hayvan bekledigi icin 0 donuyordu.
# Yalniz "Ortalama" satiri alinir (Turkiye bolge ortalamasi) — bolgesel 7 satir
# view'da ayni (kaynak,norm) icin cift kayit yaratirdi. UKON = SERBEST PIYASA
# karkasi; ESK alim/taban fiyatiyla yan yana "yari fiyat" farkini gosterir.
def _ukon_tablo_ayikla(soup) -> list:
    tablo = soup.find("table")
    if not tablo:
        return []
    satirlar = tablo.find_all("tr")
    if not satirlar:
        return []

    # Kolon -> norm eslemesi basliktan (sutun sirasi degisirse de calissin)
    baslik = [c.get_text(strip=True) for c in satirlar[0].find_all(["td", "th"])]
    kolon_norm = {}
    for i, b in enumerate(baslik):
        nb = normalize(b)
        if "DANA" in nb:
            kolon_norm[i] = ("DANA", b)
        elif "KUZU" in nb:
            kolon_norm[i] = ("KUZU", b)
    if not kolon_norm:
        return []

    # Sayfadaki veri tarihi ("Fiyatlari (TL/KG) - 02.07.2026") — bulunamazsa bugun.
    # Sayfa birkac gun eski olabilir; gercek tarihi yazmak tazelik rozetiyle durust.
    tarih = bugun_tr()
    m = re.search(r"Fiyatlar[^-]{0,30}-\s*(\d{2})\.(\d{2})\.(\d{4})", soup.get_text(" ", strip=True))
    if m:
        tarih = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    sonuclar = []
    for satir in satirlar[1:]:
        h = [td.get_text(strip=True) for td in satir.find_all("td")]
        if not h or normalize(h[0]) != "ORTALAMA":
            continue  # bolge satirlari ve % degisim satirlari atlanir
        for i, (norm, kolon_ad) in kolon_norm.items():
            if i >= len(h):
                continue
            fiyat = sinirla(parse_fiyat(h[i]), HAYVAN_FIYAT_SINIR)
            if not fiyat:
                continue
            ad = re.sub(r"\s*TL\s*/\s*KG\s*$", "", kolon_ad, flags=re.I).strip()
            sonuclar.append({
                "kaynak":         "UKON",
                "hayvan":         ad,  # "Dana Bicak Yagsiz"
                "hayvan_norm":    norm,
                "kategori":       "buyukbas" if norm == "DANA" else "kucukbas",
                "bolge":          "Türkiye (bölge ort.)",
                "fiyat":          fiyat,
                "birim":          "TL/kg karkas",
                "cekilme_tarihi": tarih,
            })
        break  # tek Ortalama satiri yeter
    return sonuclar


def ukon_scrape() -> list:
    url = "https://www.ukon.org.tr/fiyatlar"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.encoding = "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")
        sonuclar = _ukon_tablo_ayikla(soup)
        if not sonuclar:
            sonuclar = ukon_playwright()
        if not sonuclar:
            raise ValueError("tabloda Ortalama satiri / Dana-Kuzu kolonu bulunamadi")
        log_yaz("UKON", "basarili", len(sonuclar))
        print(f"[OK] UKON: {len(sonuclar)} fiyat ({sonuclar[0]['cekilme_tarihi']})")
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
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("https://www.ukon.org.tr/fiyatlar", timeout=30000)
            page.wait_for_selector("table", timeout=15000)
            soup = BeautifulSoup(page.content(), "html.parser")
            return _ukon_tablo_ayikla(soup)
        except Exception:
            return []
        finally:
            browser.close()


# --- MAZOT (Opet pompa fiyati) ---
# 2026-10-04'e kadar mazot elle giriliyordu (mazot_guncelle.py); son kayit
# 08.06'da 67,02 kalmisti, pompa 96,06 olmustu -> tum parite oranlari ~%30 yanlis.
# Opet'in acik fiyat API'si il bazinda ilce fiyatlarini verir. Referans: borsalarimizin
# oldugu illerdeki standart motorin (EcoForce) ilce fiyatlarinin medyani.
OPET_FIYAT_URL = "https://api.opet.com.tr/api/fuelprices/prices?ProvinceCode={il}&IncludeAllProducts=true"
OPET_ILLER = {"ANKARA": 6, "ESKISEHIR": 26, "CORUM": 19, "KONYA": 42}
OPET_MOTORIN_KODU = "A128"  # Motorin EcoForce (standart motorin)
MAZOT_SINIR = (10.0, 300.0)


def opet_motorin_medyan(il_yanitlari: list[list]) -> float | None:
    """Saf: her il yanitindaki tum ilcelerin standart motorin fiyatlarinin medyani."""
    import statistics
    fiyatlar = [
        float(p["amount"])
        for yanit in il_yanitlari
        for ilce in (yanit or [])
        for p in ilce.get("prices", [])
        if p.get("productCode") == OPET_MOTORIN_KODU and p.get("amount")
    ]
    if not fiyatlar:
        return None
    return sinirla(round(statistics.median(fiyatlar), 2), MAZOT_SINIR)


def mazot_guncelle_otomatik():
    try:
        yanitlar = []
        for il in OPET_ILLER.values():
            r = istek_tekrarla(OPET_FIYAT_URL.format(il=il), timeout=20,
                               headers={"User-Agent": "Mozilla/5.0 (compatible; AnadoluBot/1.0)"})
            yanitlar.append(r.json())
            time.sleep(1)
        fiyat = opet_motorin_medyan(yanitlar)
        if fiyat is None:
            raise Exception("Opet yanitinda motorin fiyati yok/makul degil")
        get_supabase().table("girdi_fiyat").upsert(
            {
                "girdi_turu":        "mazot",
                "fiyat":             fiyat,
                "birim":             "TL/litre",
                "kaynak":            "Opet pompa (Ankara/Eskisehir/Corum/Konya medyan)",
                "gecerlilik_tarihi": bugun_tr(),
            },
            on_conflict="girdi_turu,gecerlilik_tarihi",
        ).execute()
        log_yaz("OPET_MAZOT", "basarili", 1)
        print(f"[OK] Mazot (Opet): {fiyat} TL/litre")
    except Exception as e:
        log_yaz("OPET_MAZOT", "hata", hata=e)
        print(f"[HATA] Mazot (Opet): {e}")


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

    # MAZOT (parite + gunluk ozet bundan once guncel olmali)
    mazot_guncelle_otomatik()

    # HAVA
    try:
        hava_guncelle()
    except Exception as e:
        print(f"[HATA] Hava durumu: {e}")

    # FIYAT ALARMLARI (M6b) — fiyatlar yazildiktan sonra; asla scraper'i durdurmaz
    try:
        from alarm import alarmlari_kontrol_et
        alarmlari_kontrol_et(get_supabase())
    except Exception as e:
        print(f"[HATA] Alarm kontrol: {e}")

    # GUNLUK OZET PUSH (mobil v1.3) — 'gunluk_ozet' konusuna tek bildirim
    try:
        from alarm import gunluk_ozet_gonder
        gunluk_ozet_gonder(get_supabase())
    except Exception as e:
        print(f"[HATA] Gunluk ozet: {e}")

    # YEDEK JSON
    tum = yem_veriler + hayvan_veriler
    Path(__file__).parent.joinpath("fiyatlar_yedek.json").write_text(
        json.dumps(tum, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nToplam: {len(tum)} kayit yazildi.")

    # Her sey yazildiktan SONRA: sessiz kaynak varsa kosu kirmizi biter
    if saglik_kontrol():
        sys.exit(1)


if __name__ == "__main__":
    main()
