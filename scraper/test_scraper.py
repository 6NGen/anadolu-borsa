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
