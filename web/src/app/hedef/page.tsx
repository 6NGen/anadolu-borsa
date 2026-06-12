import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import { YEM_RENK, HAYVAN_RENK } from "@/lib/theme";
import { KARKAS_KG, HAYVAN_AD, karkasLabel } from "@/lib/karkas";
import { VARLIKLAR } from "@/lib/varliklar";
import HedefClient, { UrunItem } from "@/components/HedefClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hedef Hesabı — 1 Traktör Kaç Ton Arpa? | Anadolu Borsa",
  description: "Güncel fiyatlarla hedef hesabı: traktör, araç ve diğer varlıklar kaç ton ürün ya da kaç baş hayvan ediyor?",
};

// Baş hesabında kullanılacak hayvanlar (karkas kg tek kaynaktan: lib/karkas)
const HEDEF_HAYVANLAR = ["TOSUN", "INEK", "KUZU", "TOKLU", "KOYUN"];

export default async function HedefPage() {
  const [{ data: yem }, { data: hayvan }] = await Promise.all([
    supabaseServer.from("son_fiyatlar").select("urun_norm, urun_ad, ortalama, cekilme_tarihi").order("urun_norm"),
    supabaseServer.from("son_hayvan_fiyatlari").select("hayvan_norm, hayvan, fiyat, cekilme_tarihi").order("hayvan_norm"),
  ]);

  const urunler: UrunItem[] = [];

  // Tahıllar (canlı): ton hesabı
  for (const r of yem ?? []) {
    if (r.ortalama == null) continue;
    urunler.push({ norm: r.urun_norm, ad: r.urun_ad ?? r.urun_norm, renk: YEM_RENK[r.urun_norm] ?? "#D4A843", son: Number(r.ortalama), tip: "yem", tarih: r.cekilme_tarihi ?? null });
  }

  // Hayvan (canlı, karkas tanımlı olanlar): baş hesabı
  const gorulen = new Set<string>();
  for (const r of hayvan ?? []) {
    if (r.fiyat == null || !HEDEF_HAYVANLAR.includes(r.hayvan_norm) || gorulen.has(r.hayvan_norm)) continue;
    gorulen.add(r.hayvan_norm);
    urunler.push({
      norm: r.hayvan_norm,
      ad: HAYVAN_AD[r.hayvan_norm] ?? r.hayvan_norm,
      renk: HAYVAN_RENK[r.hayvan_norm] ?? "#E05840",
      son: Number(r.fiyat),
      tip: "hayvan",
      tarih: r.cekilme_tarihi ?? null,
      karkasKg: KARKAS_KG[r.hayvan_norm],
      karkasLabel: karkasLabel(r.hayvan_norm),
    });
  }

  return <HedefClient urunler={urunler} varliklar={VARLIKLAR} />;
}
