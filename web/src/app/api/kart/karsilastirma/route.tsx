// 1080×1080 karşılaştırma kartı: RESMİ (borsa) vs PİYASA (kullanıcı bildirimi).
// GET /api/kart/karsilastirma?urun=ARPA — ancak piyasa verisi (min 3 bildirim) varken üretilir.
import { ImageResponse } from "next/og";
import { karsilastirmaKartVeri } from "@/lib/kart-veri";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { kartUretilebilir, gunFarki, BAYAT_ESIK_GUN } from "@/lib/tazelik";

export const revalidate = 3600;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", borsa: "#68B890", piyasa: "#70D0D0" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urunKey = searchParams.get("urun") ?? "ARPA";

  const veri = await karsilastirmaKartVeri(urunKey);
  if (!veri) {
    return Response.json({ error: "Piyasa verisi yok (min 3 bildirim) veya ürün bulunamadı" }, { status: 404 });
  }
  if (!kartUretilebilir(veri.urun.urun.tarih)) {
    return Response.json(
      { error: `Borsa verisi bayat (${gunFarki(veri.urun.urun.tarih)} gün önce). Eşik: ${BAYAT_ESIK_GUN} gün.` },
      { status: 409 }
    );
  }

  const { urun, piyasa } = veri;
  const birimKisa = urun.birim.replace("TL/", "");
  const borsaFiyat = urun.urun.fiyat;
  const fark = ((piyasa.ortalama - borsaFiyat) / borsaFiyat) * 100;
  const kaynakTemiz = urun.urun.kaynak.replace("_SUT", "");

  const Sutun = (etiket: string, deger: number, renk: string, altyazi: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flex: 1 }}>
      <div style={{ display: "flex", fontSize: 26, color: C.mut, letterSpacing: 4 }}>{etiket}</div>
      <div style={{ display: "flex", fontSize: 120, fontWeight: 700, color: renk, letterSpacing: -4 }}>{formatFiyat(deger, 2)}</div>
      <div style={{ display: "flex", fontSize: 22, color: C.mut }}>{altyazi}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 64, fontFamily: "IBM Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.borsa, letterSpacing: 4 }}>{SITE_AD}</div>
            <div style={{ display: "flex", fontSize: 18, color: C.mut, letterSpacing: 6, marginTop: 6 }}>RESMİ vs PİYASA · {urun.ad.toUpperCase()}</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: C.mut }}>Veri: {kisaTarih(urun.urun.tarih)}.{urun.urun.tarih.slice(0, 4)}</div>
        </div>

        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 30 }}>
          {Sutun("RESMİ", borsaFiyat, C.borsa, `₺/${birimKisa} · ${kaynakTemiz}`)}
          <div style={{ display: "flex", fontSize: 60, color: C.mut }}>—</div>
          {Sutun("PİYASA", piyasa.ortalama, C.piyasa, `₺/${birimKisa} · ${piyasa.il}`)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 30, color: fark >= 0 ? "#E86040" : "#4AE870" }}>
            Piyasa %{formatFiyat(Math.abs(fark), 1)} {fark >= 0 ? "↑" : "↓"}
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 19, color: C.mut }}>
            Resmi: {kaynakTemiz} · Piyasa: {piyasa.bildirim} kullanıcı bildirimi ({piyasa.il})
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: 22, color: C.borsa }}>borsanadolu.6ngen.com</div>
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
        "Content-Disposition": `inline; filename="anadolu-borsa-karsilastirma-${urun.norm.toLowerCase()}.png"`,
      },
    }
  );
}
