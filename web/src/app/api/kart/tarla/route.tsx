// 1080×1080 sanal tarla hasat kartı (M6).
// GET /api/kart/tarla?urun=BUGDAY&dekar=10&maliyet=24042
import { ImageResponse } from "next/og";
import { supabaseServer } from "@/lib/supabase";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { VERIM_TUIK } from "@/lib/maliyet";

export const revalidate = 1800;

const AD: Record<string, string> = { BUGDAY: "BUĞDAY", ARPA: "ARPA" };
const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#4A7050", txt: "#DDF0DE", yesil: "#68B890", kirmizi: "#E87060" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urun = (searchParams.get("urun") ?? "BUGDAY").toUpperCase();
  const dekar = Math.max(1, Number(searchParams.get("dekar") ?? "1") || 1);
  const maliyet = Math.max(0, Number(searchParams.get("maliyet") ?? "0") || 0);
  if (!VERIM_TUIK[urun]) return Response.json({ error: "Ürün desteklenmiyor" }, { status: 404 });

  const { data: bf } = await supabaseServer.from("son_fiyatlar")
    .select("ortalama, borsa, cekilme_tarihi").eq("urun_norm", urun).maybeSingle();
  if (!bf?.ortalama) return Response.json({ error: "Canlı fiyat yok" }, { status: 404 });

  const deger = Math.round(VERIM_TUIK[urun] * dekar * Number(bf.ortalama));
  const net = deger - maliyet;
  const netPoz = net >= 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 5, marginTop: 6 }}>🌱 SANAL TARLA</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.mut }}>Veri: {kisaTarih(bf.cekilme_tarihi)}</div>
        </div>

        <div style={{ display: "flex", fontSize: 58, fontWeight: 700, color: C.txt, margin: "30px 0 6px" }}>{dekar} DEKAR {AD[urun] ?? urun}</div>
        <div style={{ display: "flex", fontSize: 20, color: C.mut, marginBottom: 30 }}>verim {VERIM_TUIK[urun]} kg/dekar (TÜİK ort.) · bugünkü fiyatla</div>

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16, padding: "24px 16px" }}>
            <div style={{ display: "flex", fontSize: 22, color: C.mut }}>AÇILIŞ MALİYETİ</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: C.kirmizi, marginTop: 6 }}>{formatFiyat(maliyet, 0)} ₺</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16, padding: "24px 16px" }}>
            <div style={{ display: "flex", fontSize: 22, color: C.mut }}>HASAT DEĞERİ</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: C.yesil, marginTop: 6 }}>{formatFiyat(deger, 0)} ₺</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, color: C.mut }}>NET</div>
          <div style={{ display: "flex", fontSize: 116, fontWeight: 700, color: netPoz ? C.yesil : C.kirmizi, letterSpacing: -4 }}>
            {netPoz ? "+" : ""}{formatFiyat(net, 0)} ₺
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 18, color: C.mut }}>{AD[urun] ?? urun} {formatFiyat(Number(bf.ortalama))} ₺/kg · {bf.borsa} · maliyet tahmindir</div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>borsanadolu.6ngen.com/tarla</div>
        </div>
      </div>
    ),
    {
      width: 1080, height: 1080, fonts: await ogFontConfig(),
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600",
        "Content-Disposition": `inline; filename="anadolu-borsa-tarla-${urun.toLowerCase()}.png"`,
      },
    }
  );
}
