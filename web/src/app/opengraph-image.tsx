// Kök OG görseli: link önizlemesi (WhatsApp/X) — marka kartı.
import { ImageResponse } from "next/og";
import { ogFontConfig } from "@/lib/og-font";
import { SITE_AD } from "@/lib/urun-tanim";

export const alt = "Anadolu Borsa — Türkiye Tarım ve Hayvancılık Fiyatları";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = { bg: "#060E08", brd: "#1A3020", mut: "#7BA98C", txt: "#DDF0DE", yesil: "#68B890" };

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: C.bg, color: C.txt, fontFamily: "IBM Plex Mono", gap: 28 }}>
        <div style={{ display: "flex", fontSize: 30, gap: 24 }}>🌾 🐂 🥛 ⛽ 🚜</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: C.yesil, letterSpacing: 8 }}>{SITE_AD}</div>
        <div style={{ display: "flex", fontSize: 28, color: C.txt }}>Türkiye Tarım &amp; Hayvancılık Fiyat Platformu</div>
        <div style={{ display: "flex", fontSize: 22, color: C.mut, border: `2px solid ${C.brd}`, borderRadius: 14, padding: "14px 28px", gap: 22 }}>
          <div style={{ display: "flex" }}>TOBB · ESK · USK canlı verisi</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>Parite endeksi · Günlük güncel</div>
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji", fonts: await ogFontConfig() }
  );
}
