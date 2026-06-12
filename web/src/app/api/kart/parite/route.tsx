// 1080×1080 paylaşım kartı (WhatsApp/Instagram formatı).
// GET /api/kart/parite?urun=sut|arpa|kuzu|bugday|misir
// Veri canlı (sayfayla aynı kaynak); 1 saat CDN cache.
import { ImageResponse } from "next/og";
import { pariteKartVeri } from "@/lib/kart-veri";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";

export const revalidate = 3600;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#4A7050", txt: "#DDF0DE", yesil: "#68B890", mazot: "#E86040" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urunKey = searchParams.get("urun") ?? "sut";

  const veri = await pariteKartVeri(urunKey);
  if (!veri) {
    return Response.json({ error: "Ürün için canlı veri yok" }, { status: 404 });
  }
  const { tanim, urun, mazot, parite } = veri;
  const birimKisa = tanim.birim.replace("TL/", "");
  const kaynakTemiz = urun.kaynak.replace("_SUT", ""); // ESK_SUT → ESK (teknik kod kullanıcıya gösterilmez)

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        {/* Üst: marka */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 6, marginTop: 6 }}>ÇİFTÇİ SATIN ALMA GÜCÜ ENDEKSİ</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.mut }}>Veri: {kisaTarih(urun.tarih)}.2026</div>
        </div>

        {/* Orta: büyük parite */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 44 }}>
            <div style={{ display: "flex", fontSize: 72 }}>⛽</div>
            <div style={{ display: "flex", color: C.txt }}>1 litre motorin</div>
          </div>

          <div style={{ display: "flex", fontSize: 40, color: C.mut }}>=</div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ display: "flex", fontSize: 170, fontWeight: 700, color: C.mazot, letterSpacing: -8 }}>
              {formatFiyat(parite, 2)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 44 }}>
            <div style={{ display: "flex", fontSize: 72 }}>{tanim.ikon}</div>
            <div style={{ display: "flex", color: C.txt }}>{birimKisa} {tanim.ad.toLowerCase()}</div>
          </div>
        </div>

        {/* Alt: kaynak şeridi — sayı kaynağıyla birlikte taşınır */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 30, fontSize: 22, color: C.mut, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 16, padding: "20px 28px" }}>
            <div style={{ display: "flex" }}>Motorin {formatFiyat(mazot.fiyat)} ₺/lt · EPDK</div>
            <div style={{ display: "flex" }}>{tanim.ad} {formatFiyat(urun.fiyat)} ₺/{birimKisa} · {kaynakTemiz} · {kisaTarih(urun.tarih)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>
            borsanadolu.6ngen.com/parite
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
        "Content-Disposition": `inline; filename="anadolu-borsa-parite-${urunKey}.png"`,
      },
    }
  );
}
