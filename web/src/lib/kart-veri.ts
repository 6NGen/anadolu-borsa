// Paylaşım kartı / OG görselleri için canlı parite verisi.
// Sayfayla aynı deterministik seçim (lib/guncel) → kart = sayfa, aynı sayı.
import { supabaseServer } from "@/lib/supabase";
import { enGuncelYem, enGuncelHayvan, GuncelFiyat } from "@/lib/guncel";
import { PARITE_URUNLER, UrunTanim } from "@/lib/urun-tanim";

export interface KartVeri {
  tanim: UrunTanim;
  urun: GuncelFiyat;          // canlı ürün fiyatı + kaynak + tarih
  mazot: { fiyat: number; tarih: string };
  parite: number;             // 1 litre mazot = X birim ürün
}

export async function pariteKartVeri(urunKey: string): Promise<KartVeri | null> {
  const tanim = PARITE_URUNLER[urunKey];
  if (!tanim) return null;

  const [{ data: mazotRows }, urunSorgu] = await Promise.all([
    supabaseServer.from("girdi_fiyat").select("fiyat, gecerlilik_tarihi")
      .eq("girdi_turu", "mazot").order("gecerlilik_tarihi", { ascending: false }).limit(1),
    tanim.tip === "yem"
      ? supabaseServer.from("son_30_gun").select("urun_norm, borsa, cekilme_tarihi, ortalama").eq("urun_norm", tanim.norm)
      : supabaseServer.from("son_30_gun_hayvan").select("hayvan_norm, kaynak, cekilme_tarihi, fiyat").eq("hayvan_norm", tanim.norm),
  ]);

  const mazotRow = mazotRows?.[0];
  if (!mazotRow?.fiyat) return null;

  const urun = tanim.tip === "yem"
    ? enGuncelYem((urunSorgu.data ?? []) as { urun_norm: string; borsa: string; cekilme_tarihi: string; ortalama: number | null }[])
    : enGuncelHayvan((urunSorgu.data ?? []) as { hayvan_norm: string; kaynak: string; cekilme_tarihi: string; fiyat: number | null }[]);
  if (!urun) return null;

  return {
    tanim,
    urun,
    mazot: { fiyat: Number(mazotRow.fiyat), tarih: String(mazotRow.gecerlilik_tarihi) },
    parite: +(Number(mazotRow.fiyat) / urun.fiyat).toFixed(2),
  };
}
