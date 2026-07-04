"""Scraper parse fonksiyonlari birim testleri.

Calistirma: pip install pytest && pytest scraper/ -v
Not: scraper.py import'u DB baglantisi ACMAZ (lazy client) — env gerekmez.
"""

import pytest

from scraper import (
    parse_fiyat,
    ton_to_kg,
    sinirla,
    normalize,
    urun_norm_bul,
    YEM_FIYAT_SINIR,
    HAYVAN_FIYAT_SINIR,
)


class TestParseFiyat:
    # Sahada gorulen gercek formatlar
    @pytest.mark.parametrize("girdi, beklenen", [
        ("15.206,000", 15206.0),   # TOBB Eskisehir: nokta binlik, virgul ondalik
        ("11,550", 11.55),         # TOBB Corum: virgul ondalik
        ("331,00", 331.0),         # ESK karkas
        ("12.000", 12000.0),       # islem miktari: nokta binlik (3 hane)
        ("14.50", 14.5),           # nokta ondalik (2 hane) — eski kod 1450 yapiyordu!
        ("14.5", 14.5),            # nokta ondalik (1 hane)
        ("9.50", 9.5),             # eski kod 950 yapiyordu
        ("1.234.567", 1234567.0),  # coklu nokta: binlik
        ("182.472,00", 182472.0),  # islem tutari
        ("67.02", 67.02),          # mazot pompa fiyati
        ("19,5", 19.5),            # sut
        ("480", 480.0),            # duz tamsayi
        ("0", 0.0),
    ])
    def test_gercek_formatlar(self, girdi, beklenen):
        assert parse_fiyat(girdi) == pytest.approx(beklenen)

    def test_bosluk_ve_nbsp(self):
        assert parse_fiyat(" 14,50 ") == pytest.approx(14.5)
        assert parse_fiyat("1\xa0234,5") == pytest.approx(1234.5)

    def test_gecersiz(self):
        assert parse_fiyat("") is None
        assert parse_fiyat("abc") is None
        assert parse_fiyat(None) is None
        assert parse_fiyat("--") is None

    def test_negatif(self):
        assert parse_fiyat("-14,5") == pytest.approx(-14.5)


class TestTonToKg:
    def test_ton_degeri_kg_olur(self):
        assert ton_to_kg(15206.0) == pytest.approx(15.206)
        assert ton_to_kg(12000.0) == pytest.approx(12.0)

    def test_kg_degeri_dokunulmaz(self):
        assert ton_to_kg(11.55) == pytest.approx(11.55)
        assert ton_to_kg(999.99) == pytest.approx(999.99)

    def test_sinir(self):
        assert ton_to_kg(1000.0) == pytest.approx(1.0)  # tam sinir ton sayilir
        assert ton_to_kg(None) is None


class TestSinirla:
    def test_yem_siniri(self):
        assert sinirla(14.5, YEM_FIYAT_SINIR) == 14.5
        assert sinirla(0.1, YEM_FIYAT_SINIR) is None      # absurt dusuk
        assert sinirla(1450.0, YEM_FIYAT_SINIR) is None   # eski 10x parse hatasi yakalanir
        assert sinirla(None, YEM_FIYAT_SINIR) is None

    def test_hayvan_siniri(self):
        assert sinirla(331.0, HAYVAN_FIYAT_SINIR) == 331.0
        assert sinirla(19.5, HAYVAN_FIYAT_SINIR) is None  # sut bu siniri kullanmaz
        assert sinirla(2026.0, HAYVAN_FIYAT_SINIR) == 2026.0  # yil yakalanamaz; ust sinir 5000


class TestNormalize:
    def test_turkce_karakterler(self):
        assert normalize("Buğday") == "BUGDAY"
        assert normalize("çiğ süt") == "CIG SUT"
        assert normalize("  Mısır ") == "MISIR"

    def test_buyuk_i(self):
        assert normalize("İnek") == "INEK"


class TestUrunNormBul:
    @pytest.mark.parametrize("ad, beklenen", [
        ("ARPA BEYAZ (1. GRUP)", "ARPA"),
        ("BUĞDAY ANADOLU KIRMIZI SERT", "BUGDAY"),
        ("Mısır (Dane)", "MISIR"),
        ("FASULYE", None),
    ])
    def test_eslesme(self, ad, beklenen):
        assert urun_norm_bul(ad) == beklenen


class TestUskFiyatAyikla:
    """USK cig sut tavsiye fiyati duyuru metni ayiklamasi."""

    def test_gercek_duyuru_cumlesi(self):
        # 2026 Mayis duyurusundan gercek cumle (sadelestirilmis)
        from scraper import _usk_fiyat_ayikla
        metin = ("%3,6 yağlı, %3,2 proteinli çiğ inek sütü tavsiye satış fiyatı "
                 "üreticinin eline litre başına net geçecek şekilde "
                 "(çiğ süt desteği hariç) 24,30 TL olarak oy birliği ile belirlenmiştir.")
        assert _usk_fiyat_ayikla(metin) == pytest.approx(24.30)

    def test_tavsiye_fiyati_kalibi(self):
        from scraper import _usk_fiyat_ayikla
        assert _usk_fiyat_ayikla("Çiğ süt tavsiye fiyatı 22,22 TL olarak açıklandı.") == pytest.approx(22.22)

    def test_litre_kalibi(self):
        from scraper import _usk_fiyat_ayikla
        assert _usk_fiyat_ayikla("1 litre çiğ süt için 19,60 TL ödenecek.") == pytest.approx(19.60)

    def test_fiyatsiz_metin(self):
        from scraper import _usk_fiyat_ayikla
        assert _usk_fiyat_ayikla("Ulusal Süt Konseyi yönetim kurulu toplandı.") is None

    def test_sinir_disi_deger_reddedilir(self):
        from scraper import _usk_fiyat_ayikla
        # 1,50 TL gibi absurt dusuk deger SUT_FIYAT_SINIR disinda kalir
        assert _usk_fiyat_ayikla("tavsiye fiyatı 1,50 TL olarak") is None


class TestUskTabloFiyat:
    """USK yillik sayfa donem tablosu: en alttaki (acik uclu) donem gecerli."""

    HTML = """
    <table>
      <tr><th>DÖNEM</th><th>ÇİĞ İNEK SÜTÜ TAVSİYE FİYATI (TL/Lt)*</th><th>Fark</th></tr>
      <tr><td>1 Ocak 2026 – 21 Ocak 2026</td><td>19,60</td><td>± 29 Kuruş</td></tr>
      <tr><td>22 Ocak 2026 – 30 Nisan 2026</td><td>22,22</td><td>± 33 Kuruş</td></tr>
      <tr><td>1 Mayıs 2026 –</td><td>24,30</td><td>± 36 Kuruş</td></tr>
    </table>"""

    def test_son_donem_secilir(self):
        from bs4 import BeautifulSoup
        from scraper import _usk_tablo_fiyat
        soup = BeautifulSoup(self.HTML, "html.parser")
        assert _usk_tablo_fiyat(soup) == pytest.approx(24.30)

    def test_tavsiye_kolonu_olmayan_tablo(self):
        from bs4 import BeautifulSoup
        from scraper import _usk_tablo_fiyat
        soup = BeautifulSoup("<table><tr><th>AD</th></tr><tr><td>X</td></tr></table>", "html.parser")
        assert _usk_tablo_fiyat(soup) is None


class TestAlarmTetik:
    """Fiyat alarmı tetik koşulu (yön + eşik)."""

    def test_yukari_esige_ulasinca(self):
        from alarm import _tetik
        assert _tetik("yukari", 16.0, 16.0) is True   # eşik = fiyat
        assert _tetik("yukari", 16.5, 16.0) is True   # üstünde
        assert _tetik("yukari", 15.9, 16.0) is False  # altında

    def test_asagi_esige_inince(self):
        from alarm import _tetik
        assert _tetik("asagi", 14.0, 14.0) is True
        assert _tetik("asagi", 13.5, 14.0) is True
        assert _tetik("asagi", 14.1, 14.0) is False


class TestAlarmTetikleyen:
    """Hangi borsa tetikler: yukari->en yuksek, asagi->en dusuk."""

    def test_yukari_en_yuksek_borsa(self):
        from alarm import _tetikleyen
        # arpa: Corum 11.10, Ilgin 12.50, Eskisehir 15.21; esik 12 yukari
        f = [(11.10, "CORUM"), (12.50, "ILGIN"), (15.21, "ESKISEHIR")]
        t = _tetikleyen("yukari", f, 12.0)
        assert t == (15.21, "ESKISEHIR")  # en yuksek borsa tetikler

    def test_yukari_hicbiri_asmaz(self):
        from alarm import _tetikleyen
        f = [(11.10, "CORUM"), (11.50, "ILGIN")]
        assert _tetikleyen("yukari", f, 12.0) is None

    def test_asagi_en_dusuk_borsa(self):
        from alarm import _tetikleyen
        f = [(11.10, "CORUM"), (12.50, "ILGIN"), (15.21, "ESKISEHIR")]
        t = _tetikleyen("asagi", f, 11.5)
        assert t == (11.10, "CORUM")  # en dusuk borsa tetikler

    def test_bos_liste(self):
        from alarm import _tetikleyen
        assert _tetikleyen("yukari", [], 12.0) is None


class TestUkonTablo:
    """UKON sayfa duzeni: satir=bolge, sutun=Dana/Kuzu (2026-07 kirilma dersi)."""

    HTML = """
    <p>Dana ve Yagsiz Kuzu Fiyatlari (TL/KG) - 02.07.2026</p>
    <table>
      <tr><th>Bolge</th><th>Dana Bicak Yagsiz TL / KG</th><th>Kuzu Bicak Yagsiz TL / KG</th></tr>
      <tr><td>Ege Bolgesi</td><td>583,30</td><td>655,00</td></tr>
      <tr><td>Ortalama</td><td>584,76</td><td>608,57</td></tr>
      <tr><td>Gecen Aya Gore Degisim (%)</td><td>-1,5</td><td>-0,1</td></tr>
    </table>
    """

    def _ayikla(self, html):
        from bs4 import BeautifulSoup
        from scraper import _ukon_tablo_ayikla
        return _ukon_tablo_ayikla(BeautifulSoup(html, "html.parser"))

    def test_yalniz_ortalama_satiri_iki_kayit(self):
        kayitlar = self._ayikla(self.HTML)
        assert len(kayitlar) == 2  # bolgeler ve % satirlari atlanir
        normlar = {k["hayvan_norm"]: k["fiyat"] for k in kayitlar}
        assert normlar == {"DANA": 584.76, "KUZU": 608.57}

    def test_sayfa_tarihi_kullanilir(self):
        kayitlar = self._ayikla(self.HTML)
        assert all(k["cekilme_tarihi"] == "2026-07-02" for k in kayitlar)

    def test_ad_birimden_arindirilir(self):
        adlar = {k["hayvan_norm"]: k["hayvan"] for k in self._ayikla(self.HTML)}
        assert adlar["DANA"] == "Dana Bicak Yagsiz"

    def test_tablo_yoksa_bos(self):
        assert self._ayikla("<p>tablo yok</p>") == []
