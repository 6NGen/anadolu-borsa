// /parite link önizlemesi: CANLI mazot/süt paritesi — viral kanalın kendisi.
// WhatsApp'ta "borsanadolu.6ngen.com/parite" atılınca bu kart açılır.
import { ImageResponse } from "next/og";
import { pariteKartVeri } from "@/lib/kart-veri";
import { ogFontConfig } from "@/lib/og-font";
import { formatFiyat, kisaTarih } from "@/lib/format";
import { SITE_AD } from "@/lib/urun-tanim";
import { kartUretilebilir } from "@/lib/tazelik";

export const alt = "Mazot/Süt paritesi — Anadolu Borsa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const C = { bg: "#060E08", surf: "#0A140C", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", yesil: "#68B890", mazot: "#E86040" };

export default async function Image() {
  const veri = await pariteKartVeri("sut");
  const fontlar = await ogFontConfig();

  // Canlı veri yoksa VEYA bayatsa (>ESIK gün, KARAR 2026-06-12) marka kartına düş —
  // asla statik/bayat sayı gösterme (OG görseli 409 dönemez, fallback tek seçenek)
  if (!veri || !kartUretilebilir(veri.urun.tarih)) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", background: C.bg, color: C.yesil, fontSize: 72, fontWeight: 700, fontFamily: "IBM Plex Mono", letterSpacing: 8 }}>
          {SITE_AD}
        </div>
      ),
      { ...size, fonts: fontlar }
    );
  }

  const { tanim, urun, mazot, parite } = veri;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.txt, padding: 56, fontFamily: "IBM Plex Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: C.yesil, letterSpacing: 4 }}>{SITE_AD} · PARİTE</div>
          <div style={{ display: "flex", fontSize: 20, color: C.mut }}>Veri: {kisaTarih(urun.tarih)}.2026</div>
        </div>

        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 44 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", fontSize: 80 }}>⛽</div>
            <div style={{ display: "flex", fontSize: 26 }}>1 litre motorin</div>
          </div>
          <div style={{ display: "flex", fontSize: 44, color: C.mut }}>=</div>
          <div style={{ display: "flex", fontSize: 140, fontWeight: 700, color: C.mazot, letterSpacing: -6 }}>
            {formatFiyat(parite, 2)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", fontSize: 80 }}>{tanim.ikon}</div>
            <div style={{ display: "flex", fontSize: 26 }}>{tanim.birim.replace("TL/", "")} {tanim.ad.toLowerCase()}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 26, fontSize: 19, color: C.mut, background: C.surf, border: `2px solid ${C.brd}`, borderRadius: 14, padding: "16px 24px" }}>
          <div style={{ display: "flex" }}>Motorin {formatFiyat(mazot.fiyat)} ₺/lt · EPDK</div>
          <div style={{ display: "flex" }}>{tanim.ad} {formatFiyat(urun.fiyat)} ₺/{tanim.birim.replace("TL/", "")} · {urun.kaynak.replace("_SUT", "")} · {kisaTarih(urun.tarih)}</div>
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji", fonts: fontlar }
  );
}
