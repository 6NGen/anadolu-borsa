"""
Mazot (motorin) fiyatini tek komutla guncelle.

Kullanim:
  python scraper/mazot_guncelle.py --fiyat 68.50
  python scraper/mazot_guncelle.py --fiyat 68,50 --tarih 2026-06-12 --evet

Ne yapar:
  girdi_fiyat tablosuna bugun (veya --tarih) tarihli mazot kaydi upsert eder
  (girdi_turu+gecerlilik_tarihi unique — ayni gun tekrar calistirmak gunceller).
  Kaynak: EPDK/pompa fiyati, elle girilir. Onay sorar (--evet ile atlanir).

Ortam: scraper/.env icinden SUPABASE_URL + SUPABASE_SERVICE_KEY (scraper ile ayni).
"""

import argparse
import sys
from datetime import date

from scraper import get_supabase, parse_fiyat, bugun_tr

# Pompa motorin TL/litre icin makul aralik — yanlis birim/typo'yu yakalar
MAZOT_SINIR = (10.0, 300.0)


def main() -> int:
    p = argparse.ArgumentParser(description="girdi_fiyat tablosunda mazot fiyatini guncelle")
    p.add_argument("--fiyat", required=True, help="TL/litre — '68.50' veya '68,50'")
    p.add_argument("--tarih", default=None, help="gecerlilik tarihi (YYYY-AA-GG, varsayilan: bugun TR)")
    p.add_argument("--evet", action="store_true", help="onay sorma")
    args = p.parse_args()

    fiyat = parse_fiyat(args.fiyat)
    if fiyat is None or not (MAZOT_SINIR[0] <= fiyat <= MAZOT_SINIR[1]):
        print(f"[HATA] Gecersiz fiyat: {args.fiyat!r} (beklenen aralik {MAZOT_SINIR[0]}-{MAZOT_SINIR[1]} TL/litre)")
        return 1

    tarih = args.tarih or bugun_tr()
    try:
        date.fromisoformat(tarih)
    except ValueError:
        print(f"[HATA] Gecersiz tarih: {args.tarih!r} (beklenen YYYY-AA-GG)")
        return 1

    sb = get_supabase()
    mevcut = (sb.table("girdi_fiyat").select("fiyat, gecerlilik_tarihi")
              .eq("girdi_turu", "mazot").order("gecerlilik_tarihi", desc=True).limit(1)
              .execute().data)
    if mevcut:
        print(f"Mevcut son kayit: {mevcut[0]['fiyat']} TL/litre ({mevcut[0]['gecerlilik_tarihi']})")

    print(f"Yazilacak: mazot {fiyat} TL/litre, gecerlilik {tarih}, kaynak 'EPDK/pompa (manuel)'")
    if not args.evet:
        cevap = input("Devam? [y/N] ").strip().lower()
        if cevap not in ("y", "e", "yes", "evet"):
            print("Iptal edildi.")
            return 0

    sb.table("girdi_fiyat").upsert(
        {
            "girdi_turu":        "mazot",
            "fiyat":             fiyat,
            "birim":             "TL/litre",
            "kaynak":            "EPDK/pompa (manuel)",
            "gecerlilik_tarihi": tarih,
        },
        on_conflict="girdi_turu,gecerlilik_tarihi",
    ).execute()
    print(f"[OK] Mazot guncellendi: {fiyat} TL/litre ({tarih})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
