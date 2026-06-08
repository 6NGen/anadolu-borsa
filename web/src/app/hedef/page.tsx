import { supabaseServer } from "@/lib/supabase";
import { YEM_RENK, HAYVAN_RENK } from "@/lib/theme";
import HedefClient, { UrunItem, VarlikItem } from "@/components/HedefClient";

export const revalidate = 3600;

// Karkas ağırlıkları (kullanıcı spec'i): baş hesabı için
const HAYVAN_KARKAS: Record<string, { karkasKg: number; label: string; ad: string }> = {
  TOSUN: { karkasKg: 225, label: "baş (ort. 450kg, %50 karkas)", ad: "Tosun" },
  INEK: { karkasKg: 250, label: "baş (ort. 500kg, %50 karkas)", ad: "İnek" },
  KUZU: { karkasKg: 17, label: "baş (ort. 35kg, %50 karkas)", ad: "Kuzu" },
  TOKLU: { karkasKg: 22, label: "baş (ort. 45kg, %50 karkas)", ad: "Toklu" },
  KOYUN: { karkasKg: 25, label: "baş (ort. 50kg, %50 karkas)", ad: "Koyun" },
};

// Varlık fiyatları + tarihsel seri — hedef_varlik_fiyat anon RLS ile bloklu
// olduğundan DB seed değerleriyle birebir aynı sabitleri kullanıyoruz.
const VARLIKLAR: Record<string, VarlikItem> = {
  daire: { ad: "Daire", ikon: "🏠", birim: "m²", renk: "#7090E8", aciklama: "100m² Konya orta segment", fiyat: 38000, hist: [{ y: "2015", f: 2800 }, { y: "2018", f: 5500 }, { y: "2020", f: 9000 }, { y: "2022", f: 18000 }, { y: "2024", f: 30000 }, { y: "2026", f: 38000 }] },
  arsa: { ad: "Arsa", ikon: "🏗", birim: "m²", renk: "#E8A040", aciklama: "Konya merkez m²", fiyat: 4500, hist: [{ y: "2015", f: 450 }, { y: "2018", f: 900 }, { y: "2020", f: 1800 }, { y: "2022", f: 2800 }, { y: "2024", f: 3800 }, { y: "2026", f: 4500 }] },
  tarla: { ad: "Tarla", ikon: "🌾", birim: "m²", renk: "#60A870", aciklama: "Konya tarla m²", fiyat: 1180, hist: [{ y: "2015", f: 180 }, { y: "2018", f: 280 }, { y: "2020", f: 450 }, { y: "2022", f: 750 }, { y: "2024", f: 980 }, { y: "2026", f: 1180 }] },
  traktor: { ad: "Traktör", ikon: "🚜", birim: "adet", renk: "#E86040", aciklama: "New Holland T4.90 sıfır", fiyat: 2500000, hist: [{ y: "2010", f: 280000 }, { y: "2015", f: 420000 }, { y: "2018", f: 680000 }, { y: "2020", f: 950000 }, { y: "2022", f: 1600000 }, { y: "2024", f: 2100000 }, { y: "2026", f: 2500000 }] },
};

export default async function HedefPage() {
  const [{ data: yem }, { data: hayvan }] = await Promise.all([
    supabaseServer.from("son_fiyatlar").select("urun_norm, urun_ad, ortalama").order("urun_norm"),
    supabaseServer.from("son_hayvan_fiyatlari").select("hayvan_norm, hayvan, fiyat").order("hayvan_norm"),
  ]);

  const urunler: UrunItem[] = [];

  // Tahıllar (canlı): ton hesabı
  for (const r of yem ?? []) {
    if (r.ortalama == null) continue;
    urunler.push({ norm: r.urun_norm, ad: r.urun_ad ?? r.urun_norm, renk: YEM_RENK[r.urun_norm] ?? "#D4A843", son: Number(r.ortalama), tip: "yem" });
  }

  // Hayvan (canlı, karkas tanımlı olanlar): baş hesabı
  const gorulen = new Set<string>();
  for (const r of hayvan ?? []) {
    const k = HAYVAN_KARKAS[r.hayvan_norm];
    if (r.fiyat == null || !k || gorulen.has(r.hayvan_norm)) continue;
    gorulen.add(r.hayvan_norm);
    urunler.push({ norm: r.hayvan_norm, ad: k.ad, renk: HAYVAN_RENK[r.hayvan_norm] ?? "#E05840", son: Number(r.fiyat), tip: "hayvan", karkasKg: k.karkasKg, karkasLabel: k.label });
  }

  return <HedefClient urunler={urunler} varliklar={VARLIKLAR} />;
}
