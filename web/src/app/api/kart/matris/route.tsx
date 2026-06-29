// 1080×1080 parite matrisi kartı — tüm ürünlerin mazot paritesi tek görselde.
// GET /api/kart/matris?yon=ug|gu  (ug: 1 ürün = X litre mazot, varsayılan)
import { ImageResponse } from "next/og";
import { supabaseServer } from "@/lib/supabase";
import { tekHayvanKaynak } from "@/lib/guncel";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih, oranBicim } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { kartUretilebilir } from "@/lib/tazelik";

export const revalidate = 3600;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#4A7050", txt: "#DDF0DE", yesil: "#68B890", sari: "#E8C040", mavi: "#6090E8" };

const URUNLER = [
  { norm: "BUGDAY", ad: "Buğday", emoji: "🌿", birim: "kg", tip: "yem" },
  { norm: "ARPA", ad: "Arpa", emoji: "🌾", birim: "kg", tip: "yem" },
  { norm: "MISIR", ad: "Mısır", emoji: "🌽", birim: "kg", tip: "yem" },
  { norm: "SUT", ad: "Çiğ Süt", emoji: "🥛", birim: "litre", tip: "hayvan" },
  { norm: "KUZU", ad: "Kuzu", emoji: "🐑", birim: "kg", tip: "hayvan" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yon = searchParams.get("yon") === "gu" ? "gu" : "ug";

  const [{ data: mazotRows }, { data: yem }, { data: hayHam }] = await Promise.all([
    supabaseServer.from("girdi_fiyat").select("fiyat, gecerlilik_tarihi").eq("girdi_turu", "mazot").order("gecerlilik_tarihi", { ascending: false }).limit(1),
    supabaseServer.from("son_fiyatlar").select("urun_norm, ortalama, cekilme_tarihi").in("urun_norm", ["BUGDAY", "ARPA", "MISIR"]),
    supabaseServer.from("son_hayvan_fiyatlari").select("hayvan_norm, fiyat, kaynak, cekilme_tarihi").in("hayvan_norm", ["SUT", "KUZU"]),
  ]);

  const mazot = Number(mazotRows?.[0]?.fiyat ?? 0);
  if (!mazot) return Response.json({ error: "Mazot fiyatı yok" }, { status: 404 });

  const fiyat: Record<string, { f: number; tarih: string }> = {};
  for (const r of yem ?? []) if (r.ortalama != null) fiyat[r.urun_norm] = { f: Number(r.ortalama), tarih: r.cekilme_tarihi };
  for (const r of tekHayvanKaynak(hayHam ?? [])) if (r.fiyat != null) fiyat[r.hayvan_norm] = { f: Number(r.fiyat), tarih: r.cekilme_tarihi };

  const satirlar = URUNLER.filter((u) => fiyat[u.norm]);
  if (satirlar.length === 0) return Response.json({ error: "Ürün verisi yok" }, { status: 404 });

  const enGuncel = satirlar.map((u) => fiyat[u.norm].tarih).sort().at(-1)!;
  if (!kartUretilebilir(enGuncel)) return Response.json({ error: "Veri bayat" }, { status: 409 });

  const baslik = yon === "ug" ? "1 BİRİM ÜRÜN = KAÇ LİTRE MOTORİN" : "1 LİTRE MOTORİN = KAÇ BİRİM ÜRÜN";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 60, fontFamily: "IBM Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 17, color: C.mut, letterSpacing: 4, marginTop: 6 }}>PARİTE MATRİSİ</div>
          </div>
          <div style={{ display: "flex", fontSize: 20, color: C.mut }}>Veri: {kisaTarih(enGuncel)}</div>
        </div>

        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: C.txt, margin: "26px 0 6px" }}>{baslik}</div>
        <div style={{ display: "flex", fontSize: 18, color: C.mut, marginBottom: 22 }}>⛽ motorin {formatFiyat(mazot)} ₺/litre · çiftçi alım gücü</div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 12 }}>
          {satirlar.map((u) => {
            const pf = fiyat[u.norm].f;
            const deger = yon === "ug" ? pf / mazot : mazot / pf;
            const sonucBirim = yon === "ug" ? "litre motorin" : u.birim;
            return (
              <div key={u.norm} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16, padding: "20px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", fontSize: 44 }}>{u.emoji}</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", fontSize: 30, color: C.sari, fontWeight: 700 }}>{u.ad}</div>
                    <div style={{ display: "flex", fontSize: 16, color: C.mut }}>{formatFiyat(pf)} ₺/{u.birim}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ display: "flex", fontSize: 54, fontWeight: 700, color: C.txt }}>{oranBicim(deger)}</div>
                  <div style={{ display: "flex", fontSize: 20, color: C.mut }}>{sonucBirim}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 17, color: C.mut }}>Kaynak: TOBB/KTB hububat · ESK karkas · USK süt · matris yalnızca oranı gösterir</div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>borsanadolu.6ngen.com/parite</div>
        </div>
      </div>
    ),
    {
      width: 1080, height: 1080, emoji: "twemoji", fonts: await ogFontConfig(),
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        "Content-Disposition": `inline; filename="anadolu-borsa-parite-matris.png"`,
      },
    }
  );
}
