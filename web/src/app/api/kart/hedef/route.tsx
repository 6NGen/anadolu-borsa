// 1080×1080 hedef kartı: "1 TRAKTÖR = 164 ton arpa"
// GET /api/kart/hedef?urun=ARPA&varlik=traktor|daire|arsa|tarla
// Ürün fiyatı canlı; varlık fiyatı referans/tahmindir ve kartta öyle etiketlenir.
import { ImageResponse } from "next/og";
import { hedefKartVeri } from "@/lib/kart-veri";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { kartUretilebilir, gunFarki, BAYAT_ESIK_GUN } from "@/lib/tazelik";

export const revalidate = 3600;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", yesil: "#68B890", vurgu: "#E86040" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urunKey = searchParams.get("urun") ?? "ARPA";
  const varlikKey = searchParams.get("varlik") ?? "traktor";

  const veri = await hedefKartVeri(urunKey, varlikKey);
  if (!veri) {
    return Response.json({ error: "Ürün/varlık için veri yok" }, { status: 404 });
  }
  // KARAR 2026-06-12: ürün verisi >ESIK gün bayatsa kart üretilmez
  if (!kartUretilebilir(veri.urun.urun.tarih)) {
    return Response.json(
      { error: `Veri bayat (${gunFarki(veri.urun.urun.tarih)} gün önce) — kart üretilmiyor. Eşik: ${BAYAT_ESIK_GUN} gün.` },
      { status: 409 }
    );
  }

  const { urun, varlik, kacBirim, miktarBirim, karkasKg } = veri;
  const kaynakTemiz = urun.urun.kaynak.replace("_SUT", "");
  const kacGoster = formatFiyat(kacBirim, miktarBirim === "baş" ? 0 : 1);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        {/* Üst: marka + veri tarihi */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 6, marginTop: 6 }}>ÜRETİCİ HEDEF HESABI</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.mut }}>Veri: {kisaTarih(urun.urun.tarih)}.{urun.urun.tarih.slice(0, 4)}</div>
        </div>

        {/* Orta: 1 varlık = X ton/baş ürün */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 44 }}>
            <div style={{ display: "flex", fontSize: 76 }}>{varlik.ikon}</div>
            <div style={{ display: "flex", color: C.txt }}>1 {varlik.ad.toLowerCase()}</div>
          </div>

          <div style={{ display: "flex", fontSize: 40, color: C.mut }}>=</div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ display: "flex", fontSize: 160, fontWeight: 700, color: C.vurgu, letterSpacing: -8 }}>
              {kacGoster}
            </div>
            <div style={{ display: "flex", fontSize: 44, color: C.mut }}>{miktarBirim}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 44 }}>
            <div style={{ display: "flex", fontSize: 76 }}>{urun.ikon}</div>
            <div style={{ display: "flex", color: C.txt }}>{urun.ad.toLowerCase()}</div>
          </div>
        </div>

        {/* Alt: kaynak şeridi — canlı fiyat + tahmin etiketli varlık */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 20, color: C.mut, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16, padding: "18px 26px" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {urun.ad} {formatFiyat(urun.urun.fiyat)} ₺/{urun.birim.replace("TL/", "")} · {kaynakTemiz} · {kisaTarih(urun.urun.tarih)}
              {karkasKg ? ` | karkas ~${karkasKg} kg (tahmin)` : ""}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {varlik.ad} {formatFiyat(varlik.fiyat, 0)} ₺ · {varlik.aciklama} (referans/tahmin)
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>
            borsanadolu.6ngen.com/hedef
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      emoji: "twemoji",
      fonts: await ogFontConfig(),
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        "Content-Disposition": `inline; filename="anadolu-borsa-hedef-${urun.norm.toLowerCase()}-${varlikKey}.png"`,
      },
    }
  );
}
