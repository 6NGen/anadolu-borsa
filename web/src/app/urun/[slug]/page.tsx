import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import UrunKarti from "@/components/UrunKarti";
import FiyatGrafik from "@/components/FiyatGrafik";
import { RENKLER, YEM_RENK, HAYVAN_RENK } from "@/lib/theme";
import { formatFiyat } from "@/lib/format";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const norm = slug.toUpperCase();
  const { data } = await supabaseServer.from("son_fiyatlar").select("*").eq("urun_norm", norm).single();
  if (!data) return { title: "Anadolu Borsa" };
  // SEO M6: fiyat başlıkta — arama sonucunda görünür, revalidate ile günlük tazelenir
  return {
    title: `${data.urun_ad} Fiyatı Bugün — ${formatFiyat(data.ortalama)} ₺/kg | Anadolu Borsa`,
    description: `Güncel ${data.urun_ad} fiyatı: ${formatFiyat(data.ortalama)} TL/kg (${data.borsa}, ${data.cekilme_tarihi}). TOBB ve Konya Ticaret Borsası verisi. Günlük güncellenir.`,
    openGraph: {
      title: `${data.urun_ad} Fiyatı`,
      description: `${formatFiyat(data.ortalama)} TL/kg — ${data.cekilme_tarihi}`,
    },
  };
}

export async function generateStaticParams() {
  const { data } = await supabaseServer.from("urun_meta").select("urun_norm");
  return (data ?? []).map((r) => ({ slug: r.urun_norm.toLowerCase() }));
}

export default async function UrunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const norm = slug.toUpperCase();

  const [{ data: guncel }, { data: grafik30 }, { data: meta }] = await Promise.all([
    supabaseServer.from("son_fiyatlar").select("*").eq("urun_norm", norm).single(),
    supabaseServer.from("son_30_gun").select("*").eq("urun_norm", norm).order("cekilme_tarihi"),
    supabaseServer.from("urun_meta").select("*").eq("urun_norm", norm).single(),
  ]);

  const renk = YEM_RENK[norm] ?? HAYVAN_RENK[norm] ?? RENKLER.green;
  const grafikVeri = (grafik30 ?? []).map((g) => ({ tarih: g.cekilme_tarihi, ortalama: g.ortalama ?? 0, en_az: g.en_az ?? 0, en_cok: g.en_cok ?? 0 }));

  if (!guncel && !meta) {
    return (
      <main style={{ maxWidth: "900px", margin: "32px auto", padding: "16px" }}>
        <div style={{ padding: "40px", textAlign: "center", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
          Ürün bulunamadı: {norm}
        </div>
      </main>
    );
  }

  // SEO M6: schema.org Product+Offer (JSON-LD) — ürün adı, güncel fiyat, tarih, kaynak.
  // Yalnız canlı fiyat varsa basılır; tahmini değerle yapılandırılmış veri üretilmez.
  const jsonLd = guncel?.ortalama != null && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${guncel.urun_ad ?? norm} (borsa fiyatı)`,
    description: `Güncel ${guncel.urun_ad ?? norm} borsa fiyatı — kaynak: ${guncel.borsa}`,
    url: `https://borsanadolu.6ngen.com/urun/${slug}`,
    offers: {
      "@type": "Offer",
      price: Number(guncel.ortalama),
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main style={{ maxWidth: "900px", margin: "32px auto", padding: "16px" }}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      {/* Breadcrumb */}
      <div style={{ fontSize: "12px", color: RENKLER.muted, marginBottom: "16px" }}>
        Anadolu Borsa / {meta?.kategori ?? "ürün"} / {norm}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", marginBottom: "24px" }}>
        {guncel && (
          <UrunKarti
            urun_norm={guncel.urun_norm}
            urun_ad={guncel.urun_ad ?? norm}
            renk={renk}
            ortalama={guncel.ortalama}
            en_az={guncel.en_az}
            en_cok={guncel.en_cok}
            borsa={guncel.borsa}
            tarih={guncel.cekilme_tarihi}
            birim={guncel.birim ?? "TL/KG"}
          />
        )}
        <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: RENKLER.muted, marginBottom: "8px", letterSpacing: "0.1em" }}>SON 30 GÜN</div>
          <FiyatGrafik data={grafikVeri} renk={renk} birim={guncel?.birim ?? "TL/KG"} urun_ad={guncel?.urun_ad ?? norm} />
        </div>
      </div>

      {/* SEO içerik */}
      <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "20px", fontSize: "13px", color: RENKLER.muted, lineHeight: 1.8 }}>
        <h2 style={{ fontSize: "14px", color: RENKLER.text, marginBottom: "12px" }}>{guncel?.urun_ad ?? norm} Fiyatı Hakkında</h2>
        <p>
          Güncel {guncel?.urun_ad ?? norm} fiyatı <strong style={{ color: RENKLER.green }}>{formatFiyat(guncel?.ortalama)} TL/kg</strong> olarak TOBB ve Konya Ticaret Borsası verilerine göre güncellenmektedir.
          Son veri tarihi: {guncel?.cekilme_tarihi ?? "—"}.
        </p>
        <p style={{ marginTop: "10px" }}>
          Anadolu Borsa, Türkiye genelinde tarım ve hayvancılık ürünlerinin borsa fiyatlarını günlük olarak takip eden bir veri platformudur.
          Fiyatlar TOBB, KTB ve ESK kaynaklarından otomatik olarak çekilmektedir.
        </p>
      </div>
    </main>
  );
}
