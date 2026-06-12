"use client";
// Ortak paylaşım butonu üçlüsü: WhatsApp + X + PNG kart (parite tasarımıyla aynı).
// pngUrl null ise PNG butonu PASİF gösterilir (KARAR 2026-06-12: bayat veride
// kart üretilmez) ve pasifNot ile nedeni açıkça yazılır — buton gizlenmez.
import { useCallback } from "react";

interface Props {
  metin: string;            // WhatsApp/X paylaşım metni
  pngUrl: string | null;    // kart endpoint'i; null → pasif
  pasifNot?: string;        // pasifken gösterilen açıklama
}

export default function PaylasButonlar({ metin, pngUrl, pasifNot = "veri güncellenince paylaşım açılır" }: Props) {
  const paylas = useCallback((kanal: "whatsapp" | "x" | "png") => {
    const m = encodeURIComponent(metin);
    if (kanal === "whatsapp") window.open(`https://wa.me/?text=${m}`, "_blank");
    else if (kanal === "x") window.open(`https://x.com/intent/post?text=${m}`, "_blank");
    else if (pngUrl) window.open(pngUrl, "_blank");
  }, [metin, pngUrl]);

  const stil = (renk: string, aktif = true): React.CSSProperties => ({
    background: "transparent",
    border: `1px solid ${aktif ? renk : "#2A4030"}`,
    color: aktif ? renk : "#3A5040",
    padding: "8px 18px", borderRadius: 20, cursor: aktif ? "pointer" : "not-allowed",
    fontSize: 11, fontFamily: "var(--font-mono), monospace",
  });

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <button onClick={() => paylas("whatsapp")} style={stil("#25D366")}>📱 WhatsApp</button>
      <button onClick={() => paylas("x")} style={stil("#E7E9EA")}>𝕏 X</button>
      <button onClick={() => paylas("png")} disabled={!pngUrl} style={stil("#E86040", !!pngUrl)} title={pngUrl ? undefined : pasifNot}>
        📷 PNG İndir
      </button>
      {!pngUrl && (
        <span style={{ fontSize: 9, color: "#E8C040" }}>🔒 {pasifNot}</span>
      )}
    </div>
  );
}
