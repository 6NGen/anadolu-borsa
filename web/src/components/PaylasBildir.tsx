"use client";
import { useRef } from "react";
import { RENKLER } from "@/lib/theme";

interface Props {
  children: React.ReactNode;
  baslik: string;
}

export default function PaylasBildir({ children, baslik }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  async function gorselOlustur() {
    if (!ref.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(ref.current, { backgroundColor: RENKLER.bg, scale: 2, useCORS: true });
  }

  async function indir() {
    const canvas = await gorselOlustur();
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `anadoluborsa-${baslik.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  function xPaylas() {
    const text = encodeURIComponent(`${baslik} | Anadolu Borsa — anadoluborsa.com`);
    window.open(`https://x.com/intent/post?text=${text}`, "_blank");
  }

  function whatsappPaylas() {
    const text = encodeURIComponent(`${baslik} | anadoluborsa.com`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div>
      <div ref={ref} style={{ background: RENKLER.bg, padding: "20px", position: "relative", borderRadius: "4px" }}>
        {children}
        <div style={{ position: "absolute", bottom: "8px", right: "10px", fontSize: "9px", color: RENKLER.muted }}>
          anadoluborsa.com
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        <button onClick={whatsappPaylas} style={{ flex: 1, padding: "7px", fontSize: "11px", background: "#25D366", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer" }}>
          WhatsApp
        </button>
        <button onClick={xPaylas} style={{ flex: 1, padding: "7px", fontSize: "11px", background: "#000", color: "#E7E9EA", border: `1px solid ${RENKLER.border}`, borderRadius: "3px", cursor: "pointer" }}>
          𝕏 X
        </button>
        <button onClick={indir} style={{ flex: 1, padding: "7px", fontSize: "11px", background: RENKLER.surface, color: RENKLER.text, border: `1px solid ${RENKLER.border}`, borderRadius: "3px", cursor: "pointer" }}>
          İndir
        </button>
      </div>
    </div>
  );
}
