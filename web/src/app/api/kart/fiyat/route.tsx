// 1080×1080 günlük fiyat kartı — hasat dönemi ana kartı.
// GET /api/kart/fiyat?urun=ARPA|BUGDAY|MISIR|TOSUN|KUZU|SUT|...
// Veri canlı (sayfayla aynı deterministik seçim); bayat veride üretilmez (409).
import { ImageResponse } from "next/og";
import { fiyatKartVeri } from "@/lib/kart-veri";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { kartUretilebilir, gunFarki, BAYAT_ESIK_GUN } from "@/lib/tazelik";

export const revalidate = 3600;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", yesil: "#68B890" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urunKey = searchParams.get("urun") ?? "ARPA";

  const veri = await fiyatKartVeri(urunKey);
  if (!veri) {
    return Response.json({ error: "Ürün için canlı veri yok" }, { status: 404 });
  }
  // KARAR 2026-06-12: veri >ESIK gün bayatsa kart üretilmez
  if (!kartUretilebilir(veri.urun.tarih)) {
    return Response.json(
      { error: `Veri bayat (${gunFarki(veri.urun.tarih)} gün önce) — kart üretilmiyor. Eşik: ${BAYAT_ESIK_GUN} gün.` },
      { status: 409 }
    );
  }

  const { ad, ikon, renk, birim, urun } = veri;
  const kaynakTemiz = urun.kaynak.replace("_SUT", "");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        {/* Üst: marka + veri tarihi */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 6, marginTop: 6 }}>GÜNLÜK BORSA FİYATI</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.mut }}>Veri: {kisaTarih(urun.tarih)}.{urun.tarih.slice(0, 4)}</div>
        </div>

        {/* Orta: ürün + büyük fiyat */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", fontSize: 80 }}>{ikon}</div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: renk, letterSpacing: 4 }}>{ad.toUpperCase()}</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 190, fontWeight: 700, color: C.txt, letterSpacing: -8 }}>
              {formatFiyat(urun.fiyat, 2)}
            </div>
            <div style={{ display: "flex", fontSize: 40, color: C.mut }}>₺/{birim.replace("TL/", "")}</div>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: C.yesil, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 14, padding: "12px 28px" }}>
            {kaynakTemiz} · {kisaTarih(urun.tarih)}
          </div>
        </div>

        {/* Alt: atıf + adres — sayı kaynağıyla birlikte taşınır */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 20, color: C.mut }}>
            Veriler ilgili kurumların kamuya açık yayınlarından derlenir — kaynak: {kaynakTemiz}
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>
            borsanadolu.6ngen.com
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
        "Content-Disposition": `inline; filename="anadolu-borsa-fiyat-${veri.norm.toLowerCase()}.png"`,
      },
    }
  );
}
