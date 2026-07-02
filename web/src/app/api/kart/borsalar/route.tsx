// 1080×1080 borsalar kartı: aynı ürün, tüm borsalar yan yana (M2).
// GET /api/kart/borsalar?urun=ARPA — "Aynı gün, aynı arpa: Çorum 11,55 / Eskişehir 15,21"
import { ImageResponse } from "next/og";
import { borsalarKartVeri } from "@/lib/kart-veri";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD, YEM_AD } from "@/lib/urun-tanim";
import { kartUretilebilir, gunFarki, BAYAT_ESIK_GUN } from "@/lib/tazelik";

export const revalidate = 3600;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", yesil: "#68B890", sari: "#E8C040" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urunKey = searchParams.get("urun") ?? "ARPA";

  const veri = await borsalarKartVeri(urunKey);
  if (!veri) {
    return Response.json({ error: "Bu ürün için çok borsalı veri yok" }, { status: 404 });
  }
  if (!kartUretilebilir(veri.enGuncelTarih)) {
    return Response.json(
      { error: `Veri bayat (${gunFarki(veri.enGuncelTarih)} gün önce). Eşik: ${BAYAT_ESIK_GUN} gün.` },
      { status: 409 }
    );
  }

  const { ad, satirlar, fark } = veri;
  const gosterilen = satirlar.slice(0, 6); // sığması için en fazla 6 borsa

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 5, marginTop: 6 }}>AYNI ÜRÜN · BORSA FARKI</div>
          </div>
          {fark != null && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: C.sari }}>%{formatFiyat(fark, 1)}</div>
              <div style={{ display: "flex", fontSize: 16, color: C.mut }}>en düşük–yüksek fark</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 54, fontWeight: 700, color: C.txt, margin: "24px 0 18px" }}>{ad.toUpperCase()}</div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 12 }}>
          {gosterilen.map((s) => (
            <div key={s.borsa} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 14, padding: "18px 26px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 30, color: C.txt }}>{s.borsa}</div>
                <div style={{ display: "flex", fontSize: 18, color: C.mut }}>
                  {kisaTarih(s.tarih)}{s.hacim != null ? ` · ${formatFiyat(s.hacim / 1000, s.hacim < 10000 ? 1 : 0)} ton` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: C.yesil }}>{formatFiyat(s.fiyat)}</div>
                <div style={{ display: "flex", fontSize: 20, color: C.mut }}>₺/kg</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 19, color: C.mut }}>Kaynak: TOBB / KTB borsa bültenleri · hacim = günlük işlem</div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.yesil }}>borsanadolu.6ngen.com/tarim</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: await ogFontConfig(),
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        "Content-Disposition": `inline; filename="anadolu-borsa-borsalar-${(YEM_AD[veri.norm] ?? veri.norm).toLowerCase()}.png"`,
      },
    }
  );
}
