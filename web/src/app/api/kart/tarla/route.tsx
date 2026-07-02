// 1080×1080 sanal tarla kartı (M6) — durum (izle) ya da hasat.
// GET /api/kart/tarla?urun=guzluk_bugday&dekar=10&maliyet=24042&afiyat=12&hasat=0|1
import { ImageResponse } from "next/og";
import { supabaseServer } from "@/lib/supabase";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { VERIM_TUIK } from "@/lib/maliyet";
import { tarlaUrunBul } from "@/lib/tarla";

export const revalidate = 1800;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", yesil: "#68B890", kirmizi: "#E87060" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const u = tarlaUrunBul(searchParams.get("urun") ?? "guzluk_bugday");
  const dekar = Math.max(1, Number(searchParams.get("dekar") ?? "1") || 1);
  const maliyet = Math.max(0, Number(searchParams.get("maliyet") ?? "0") || 0);
  const afiyat = Number(searchParams.get("afiyat") ?? "0") || 0;
  const hasat = searchParams.get("hasat") === "1";
  if (!u) return Response.json({ error: "Ürün desteklenmiyor" }, { status: 404 });

  const { data: bf } = await supabaseServer.from("son_fiyatlar")
    .select("ortalama, borsa, cekilme_tarihi").eq("urun_norm", u.urunNorm).maybeSingle();
  if (!bf?.ortalama) return Response.json({ error: "Canlı fiyat yok" }, { status: 404 });

  const guncelFiyat = Number(bf.ortalama);
  const deger = Math.round((VERIM_TUIK[u.urunNorm] ?? 0) * dekar * guncelFiyat);
  const net = deger - maliyet;
  const netPoz = net >= 0;
  const degisim = afiyat > 0 ? ((guncelFiyat - afiyat) / afiyat) * 100 : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 5, marginTop: 6 }}>🌱 SANAL TARLA{hasat ? " · HASAT" : ""}</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.mut }}>Veri: {kisaTarih(bf.cekilme_tarihi)}</div>
        </div>

        <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: C.txt, margin: "28px 0 4px" }}>{dekar} DEKAR {u.ad.toUpperCase()}</div>
        <div style={{ display: "flex", fontSize: 20, color: C.mut, marginBottom: 26 }}>verim {VERIM_TUIK[u.urunNorm]} kg/dekar (TÜİK ort.) · bugünkü fiyatla</div>

        {/* Açılıştan beri değişim — asıl hikaye */}
        {degisim != null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 18, padding: "22px", marginBottom: 18 }}>
            <div style={{ display: "flex", fontSize: 22, color: C.mut }}>AÇILIŞTAN BERİ DEĞER</div>
            <div style={{ display: "flex", fontSize: 92, fontWeight: 700, color: degisim >= 0 ? C.yesil : C.kirmizi, letterSpacing: -3 }}>{degisim >= 0 ? "+" : "-"}%{formatFiyat(Math.abs(degisim), 1)}</div>
            <div style={{ display: "flex", fontSize: 20, color: C.mut }}>{formatFiyat(afiyat)} → {formatFiyat(guncelFiyat)} ₺/kg</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 16, flexGrow: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16 }}>
            <div style={{ display: "flex", fontSize: 22, color: C.mut }}>AÇILIŞ MALİYETİ</div>
            <div style={{ display: "flex", fontSize: 50, fontWeight: 700, color: C.kirmizi, marginTop: 6 }}>{formatFiyat(maliyet, 0)} ₺</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16 }}>
            <div style={{ display: "flex", fontSize: 22, color: C.mut }}>{hasat ? "HASAT DEĞERİ" : "BUGÜNKÜ DEĞER"}</div>
            <div style={{ display: "flex", fontSize: 50, fontWeight: 700, color: C.yesil, marginTop: 6 }}>{formatFiyat(deger, 0)} ₺</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 28, color: netPoz ? C.yesil : C.kirmizi, fontWeight: 700 }}>Net {netPoz ? "+" : ""}{formatFiyat(net, 0)} ₺</div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 18, color: C.mut }}>{u.urunNorm} {formatFiyat(guncelFiyat)} ₺/kg · {bf.borsa} · maliyet tahmindir</div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>borsanadolu.6ngen.com/tarla</div>
        </div>
      </div>
    ),
    {
      width: 1080, height: 1080, fonts: await ogFontConfig(),
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600",
        "Content-Disposition": `inline; filename="anadolu-borsa-tarla-${u.key}.png"`,
      },
    }
  );
}
