"""
Girdi fiyatini (elektrik / ure / DAP / mazot) tek komutla guncelle.

Kullanim:
  python scraper/girdi_guncelle.py --tur elektrik --fiyat 3,10
  python scraper/girdi_guncelle.py --tur ure --fiyat 17,50 --tarih 2026-07-03 --evet

Ne yapar:
  girdi_fiyat tablosuna bugun (veya --tarih) tarihli kayit upsert eder
  (girdi_turu+gecerlilik_tarihi unique — ayni gun tekrar calistirmak gunceller).
  Degerler ELLE girilir (resmi kaynaktan bakip) — parite matrisi sutunu
  veri geldigi anda otomatik acilir.

Kaynaklar (matris GUNCELLEME 2 karari):
  elektrik: EPDK tarimsal sulama tarifesi (ceyrekte bir degisir)
  ure/dap : Tarim Kredi Koop. / Gubretas liste fiyati (haftalik bakilabilir)
  mazot   : EPDK/pompa (mazot_guncelle.py de kullanilabilir)

Ortam: scraper/.env icinden SUPABASE_URL + SUPABASE_SERVICE_KEY (scraper ile ayni).
"""

import argparse
import sys
from datetime import date

from scraper import get_supabase, parse_fiyat, bugun_tr

# tur -> (birim, kaynak etiketi, makul aralik) — yanlis birim/typo yakalar
TURLER = {
    "mazot":    ("TL/litre", "EPDK/pompa (manuel)",              (10.0, 300.0)),
    "elektrik": ("TL/kWh",   "EPDK tarimsal sulama (manuel)",    (0.5, 50.0)),
    "ure":      ("TL/kg",    "Tarim Kredi/Gubretas (manuel)",    (3.0, 200.0)),
    "dap":      ("TL/kg",    "Tarim Kredi/Gubretas (manuel)",    (3.0, 300.0)),
}


def main() -> int:
    p = argparse.ArgumentParser(description="girdi_fiyat tablosunda girdi fiyatini guncelle")
    p.add_argument("--tur", required=True, choices=sorted(TURLER), help="girdi turu")
    p.add_argument("--fiyat", required=True, help="fiyat — '3.10' veya '3,10'")
    p.add_argument("--tarih", default=None, help="gecerlilik tarihi (YYYY-AA-GG, varsayilan: bugun TR)")
    p.add_argument("--evet", action="store_true", help="onay sorma")
    args = p.parse_args()

    birim, kaynak, sinir = TURLER[args.tur]
    fiyat = parse_fiyat(args.fiyat)
    if fiyat is None or not (sinir[0] <= fiyat <= sinir[1]):
        print(f"[HATA] Gecersiz fiyat: {args.fiyat!r} (beklenen aralik {sinir[0]}-{sinir[1]} {birim})")
        return 1

    tarih = args.tarih or bugun_tr()
    try:
        date.fromisoformat(tarih)
    except ValueError:
        print(f"[HATA] Gecersiz tarih: {args.tarih!r} (beklenen YYYY-AA-GG)")
        return 1

    sb = get_supabase()
    mevcut = (sb.table("girdi_fiyat").select("fiyat, gecerlilik_tarihi")
              .eq("girdi_turu", args.tur).order("gecerlilik_tarihi", desc=True).limit(1)
              .execute().data)
    if mevcut:
        print(f"Mevcut son kayit: {mevcut[0]['fiyat']} {birim} ({mevcut[0]['gecerlilik_tarihi']})")
    else:
        print(f"Ilk kayit olacak: {args.tur}")

    print(f"Yazilacak: {args.tur} {fiyat} {birim}, gecerlilik {tarih}, kaynak {kaynak!r}")
    if not args.evet:
        cevap = input("Devam? [y/N] ").strip().lower()
        if cevap not in ("y", "e", "yes", "evet"):
            print("Iptal edildi.")
            return 0

    sb.table("girdi_fiyat").upsert(
        {
            "girdi_turu":        args.tur,
            "fiyat":             fiyat,
            "birim":             birim,
            "kaynak":            kaynak,
            "gecerlilik_tarihi": tarih,
        },
        on_conflict="girdi_turu,gecerlilik_tarihi",
    ).execute()
    print(f"[OK] {args.tur} guncellendi: {fiyat} {birim} ({tarih})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
