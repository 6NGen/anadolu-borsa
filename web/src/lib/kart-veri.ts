// Paylaşım kartı / OG görselleri için canlı veri.
// Sayfayla aynı deterministik seçim (lib/guncel) → kart = sayfa, aynı sayı.
import { supabaseServer } from "@/lib/supabase";
import { enGuncelYem, enGuncelHayvan, GuncelFiyat } from "@/lib/guncel";
import { PARITE_URUNLER, UrunTanim, YEM_AD } from "@/lib/urun-tanim";
import { YEM_RENK, HAYVAN_RENK, EMOJI } from "@/lib/theme";
import { HAYVAN_AD, KARKAS_KG } from "@/lib/karkas";
import { VARLIKLAR, Varlik } from "@/lib/varliklar";

export interface KartVeri {
  tanim: UrunTanim;
  urun: GuncelFiyat;          // canlı ürün fiyatı + kaynak + tarih
  mazot: { fiyat: number; tarih: string };
  parite: number;             // 1 litre mazot = X birim ürün
}

// --- Günlük fiyat kartı: herhangi bir yem/hayvan normu için en güncel fiyat ---
export interface UrunKartVeri {
  norm: string;
  ad: string;
  ikon: string;
  renk: string;
  birim: string;
  tip: "yem" | "hayvan";
  urun: GuncelFiyat;
}

export async function fiyatKartVeri(normGirdi: string): Promise<UrunKartVeri | null> {
  const norm = normGirdi.trim().toUpperCase();
  if (!/^[A-Z]{2,12}$/.test(norm)) return null;

  const { data: yemRows } = await supabaseServer
    .from("son_30_gun").select("urun_norm, borsa, cekilme_tarihi, ortalama").eq("urun_norm", norm);
  const yem = enGuncelYem((yemRows ?? []) as { urun_norm: string; borsa: string; cekilme_tarihi: string; ortalama: number | null }[]);
  if (yem) {
    return {
      norm, ad: YEM_AD[norm] ?? norm, ikon: EMOJI[norm] ?? "🌾",
      renk: YEM_RENK[norm] ?? "#68B890", birim: "TL/kg", tip: "yem", urun: yem,
    };
  }

  const { data: hayRows } = await supabaseServer
    .from("son_30_gun_hayvan").select("hayvan_norm, kaynak, cekilme_tarihi, fiyat").eq("hayvan_norm", norm);
  const hay = enGuncelHayvan((hayRows ?? []) as { hayvan_norm: string; kaynak: string; cekilme_tarihi: string; fiyat: number | null }[]);
  if (hay) {
    return {
      norm, ad: norm === "SUT" ? "Çiğ Süt" : (HAYVAN_AD[norm] ?? norm), ikon: EMOJI[norm] ?? "🐄",
      renk: HAYVAN_RENK[norm] ?? "#E87060", birim: norm === "SUT" ? "TL/litre" : "TL/kg karkas",
      tip: "hayvan", urun: hay,
    };
  }
  return null;
}

// --- Hedef kartı: "1 traktör = X ton arpa" ---
export interface HedefKartVeri {
  urun: UrunKartVeri;
  varlik: Varlik;
  kacBirim: number;         // 1 varlık için kaç ton/baş
  miktarBirim: "ton" | "baş";
  karkasKg: number | null;  // hayvansa hesapta kullanılan tahmin
}

export async function hedefKartVeri(normGirdi: string, varlikKey: string): Promise<HedefKartVeri | null> {
  const varlik = VARLIKLAR[varlikKey];
  if (!varlik) return null;
  const urun = await fiyatKartVeri(normGirdi);
  if (!urun) return null;
  // baş→karkas kg (tahmin, lib/karkas tek kaynak), ton→1000 kg; SUT gibi karkassız norm → kart yok
  const karkasKg = urun.tip === "hayvan" ? KARKAS_KG[urun.norm] ?? null : null;
  const olcek = urun.tip === "hayvan" ? karkasKg : 1000;
  if (!olcek) return null;
  return {
    urun, varlik,
    kacBirim: varlik.fiyat / (urun.urun.fiyat * olcek),
    miktarBirim: urun.tip === "hayvan" ? "baş" : "ton",
    karkasKg,
  };
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
