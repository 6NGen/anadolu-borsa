import { supabaseServer } from "@/lib/supabase";
import UrunKarti from "@/components/UrunKarti";
import HavaDurumu from "@/components/HavaDurumu";
import SaatGosterg from "@/components/SaatGosterg";
import VeriTazelik from "@/components/VeriTazelik";
import { RENKLER, HAYVAN_RENK } from "@/lib/theme";
import { formatFiyat } from "@/lib/format";
import KurbanSayaci from "@/components/KurbanSayaci";
import SinyalMotoru from "@/components/SinyalMotoru";
import Link from "next/link";

export const revalidate = 300;

export default async function Dashboard() {
  const [{ data: sonFiyatlar }, { data: sonHayvan }] = await Promise.all([
    supabaseServer.from("son_fiyatlar").select("*").order("urun_norm"),
    supabaseServer.from("son_hayvan_fiyatlari").select("*").order("hayvan_norm"),
  ]);

  // 3.3: her ticker öğesi TEK string — parça kopması/yetim birim olmaz
  const tickerItems = [
    ...(sonFiyatlar ?? []).map((f) => `${f.urun_norm} ${formatFiyat(f.ortalama)} TL/KG`),
    ...(sonHayvan ?? []).map((h) => `${h.hayvan_norm} ${formatFiyat(h.fiyat)} ${h.birim ?? "TL/kg"}`),
  ];

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "12px 16px", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
        <div>
          <span style={{ fontFamily: "var(--font-syne)", fontSize: "18px", fontWeight: 700, color: RENKLER.green, letterSpacing: "0.08em" }}>ANADOLU BORSA</span>
          <span className="hidden sm:inline" style={{ marginLeft: "10px", fontSize: "10px", color: RENKLER.muted }}>Türkiye Tarım & Hayvancılık Fiyat Platformu</span>
        </div>
        <SaatGosterg />
      </div>

      {/* Ticker */}
      {tickerItems.length > 0 && (
        <div style={{ overflow: "hidden", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "7px 0", marginBottom: "16px" }}>
          <div style={{ display: "flex", animation: "ticker 40s linear infinite", width: "max-content" }}>
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{ fontSize: "11px", color: RENKLER.muted, padding: "0 24px", whiteSpace: "nowrap", borderRight: `1px solid ${RENKLER.border}` }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Kurban sayacı */}
      <KurbanSayaci />

      {/* Sekmeler */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { href: "/tarim",  label: "TARIM BORSASI" },
          { href: "/hayvan", label: "HAYVAN BORSASI" },
          { href: "/parite", label: "PARİTE ENDEKSİ" },
          { href: "/hedef",  label: "HEDEF PANEL" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{ padding: "7px 14px", fontSize: "11px", color: RENKLER.muted, background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "3px", textDecoration: "none", letterSpacing: "0.05em" }}>
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div>
          {/* Sinyal motoru */}
          <SinyalMotoru />

          {/* Yem */}
          {(sonFiyatlar ?? []).length > 0 && (
            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.12em" }}>YEM FİYATLARI</span>
                <Link href="/tarim" style={{ fontSize: "10px", color: RENKLER.green, textDecoration: "none" }}>Grafik & Detay →</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: "8px" }}>
                {(sonFiyatlar ?? []).map((f) => (
                  <UrunKarti key={f.urun_norm} urun_norm={f.urun_norm} urun_ad={f.urun_ad ?? f.urun_norm} renk={f.renk ?? RENKLER.green} ortalama={f.ortalama} en_az={f.en_az} en_cok={f.en_cok} borsa={f.borsa} tarih={f.cekilme_tarihi} birim={f.birim ?? "TL/KG"} />
                ))}
              </div>
            </section>
          )}

          {/* Hayvan */}
          {(sonHayvan ?? []).length > 0 && (
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.12em" }}>HAYVAN FİYATLARI</span>
                <Link href="/hayvan" style={{ fontSize: "10px", color: RENKLER.green, textDecoration: "none" }}>Grafik & Detay →</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: "8px" }}>
                {(sonHayvan ?? []).map((h) => {
                  const renk = HAYVAN_RENK[h.hayvan_norm] ?? RENKLER.red;
                  return (
                    <div key={`${h.kaynak}-${h.hayvan_norm}`} style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px", display: "flex", gap: "10px" }}>
                      <div style={{ width: "3px", background: renk, borderRadius: "2px", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "9px", color: RENKLER.muted, letterSpacing: "0.12em" }}>{h.hayvan_norm}</div>
                        <div style={{ fontSize: "13px", color: RENKLER.text, fontWeight: 600, margin: "2px 0" }}>{h.hayvan}</div>
                        <div style={{ fontSize: "22px", color: renk, fontWeight: 700, lineHeight: 1 }}>{formatFiyat(h.fiyat)}</div>
                        <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "2px" }}>{h.birim}</div>
                        <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${RENKLER.border}`, display: "flex", justifyContent: "space-between", gap: "6px", flexWrap: "wrap" }}>
                          <span>{h.kaynak} · {h.cekilme_tarihi}</span>
                          <VeriTazelik tarih={h.cekilme_tarihi} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(sonFiyatlar ?? []).length === 0 && (sonHayvan ?? []).length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: RENKLER.muted, fontSize: "13px", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>📊</div>
              Henüz fiyat verisi yok.<br />Scraper çalıştıktan sonra veriler burada görünür.
            </div>
          )}
        </div>

        {/* Sağ panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <HavaDurumu />
          <div style={{ padding: "14px", background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px" }}>
            <div style={{ fontSize: "10px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "10px" }}>ARAÇLAR</div>
            {[
              { href: "/fiyat-bildir", label: "Fiyat Bildir", desc: "Gerçek piyasa fiyatını gir" },
              { href: "/parite",       label: "Parite",       desc: "Mazot/Süt, Mazot/Arpa oranı" },
              { href: "/hedef",        label: "Hedef Panel",  desc: "Kaç ton buğday = 1 traktör?" },
            ].map(({ href, label, desc }) => (
              <Link key={href} href={href} style={{ display: "block", padding: "9px 10px", marginBottom: "4px", background: "#080E09", borderRadius: "3px", textDecoration: "none", border: `1px solid ${RENKLER.border}` }}>
                <div style={{ fontSize: "12px", color: RENKLER.text }}>{label}</div>
                <div style={{ fontSize: "10px", color: RENKLER.muted }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
