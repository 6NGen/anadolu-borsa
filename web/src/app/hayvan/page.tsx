import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import HayvanClient from "@/components/HayvanClient";
import SuruDegeri from "@/components/SuruDegeri";
import { RENKLER } from "@/lib/theme";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Canlı Hayvan ve Karkas Fiyatları — Tosun, Kuzu, Süt | Anadolu Borsa",
  description: "ESK karkas alım fiyatları (tosun, kuzu, toklu) ve USK çiğ süt tavsiye fiyatı — günlük, kaynaklı, grafikli.",
};

export default async function HayvanPage() {
  const [{ data: fiyatlar }, { data: grafik }] = await Promise.all([
    supabaseServer.from("son_hayvan_fiyatlari").select("*").order("hayvan_norm"),
    supabaseServer.from("son_30_gun_hayvan").select("*").order("cekilme_tarihi"),
  ]);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>HAYVAN BORSASI</h1>
        <p style={{ fontSize: "11px", color: RENKLER.muted, marginTop: "4px" }}>ESK karkas alım fiyatları + Çiğ süt · Günlük güncellenir</p>
      </div>

      {(fiyatlar ?? []).length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
          Henüz veri yok. Scraper çalıştıktan sonra fiyatlar burada görünür.
        </div>
      ) : (
        <>
          <HayvanClient fiyatlar={fiyatlar ?? []} grafik={grafik ?? []} />
          <SuruDegeri fiyatlar={fiyatlar ?? []} />
        </>
      )}
    </main>
  );
}
