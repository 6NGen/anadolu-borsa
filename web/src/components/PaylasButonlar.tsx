"use client";
// Ortak paylaşım butonları: WhatsApp + X + görsel kart.
// pngUrl null ise kart butonu PASİF gösterilir (KARAR 2026-06-12: bayat veride
// kart üretilmez) ve pasifNot ile nedeni açıkça yazılır — buton gizlenmez.
import { useCallback } from "react";
import { ImageDown, Lock, MessageCircle } from "lucide-react";

interface Props {
  metin: string;            // WhatsApp/X paylaşım metni
  pngUrl: string | null;    // kart endpoint'i; null → pasif
  pasifNot?: string;        // pasifken gösterilen açıklama
}

// X logosu (lucide'de marka ikonu yok)
function XLogo() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function PaylasButonlar({ metin, pngUrl, pasifNot = "veri güncellenince paylaşım açılır" }: Props) {
  const paylas = useCallback((kanal: "whatsapp" | "x" | "png") => {
    const m = encodeURIComponent(metin);
    if (kanal === "whatsapp") window.open(`https://wa.me/?text=${m}`, "_blank");
    // X paylaşım intent'i: intent/tweet kararlı çalışır (x.com'a yönlenir). intent/post açılmıyordu.
    else if (kanal === "x") window.open(`https://twitter.com/intent/tweet?text=${m}`, "_blank");
    else if (pngUrl) window.open(pngUrl, "_blank");
  }, [metin, pngUrl]);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button onClick={() => paylas("whatsapp")} className="ab-btn" style={{ height: 34 }}>
        <MessageCircle size={15} color="#25D366" /> WhatsApp
      </button>
      <button onClick={() => paylas("x")} className="ab-btn" style={{ height: 34 }}>
        <XLogo /> Paylaş
      </button>
      <button
        onClick={() => paylas("png")}
        disabled={!pngUrl}
        className="ab-btn"
        style={{ height: 34, ...(pngUrl ? {} : { opacity: 0.5, cursor: "not-allowed" }) }}
        title={pngUrl ? "Paylaşım görselini indir" : pasifNot}
      >
        <ImageDown size={15} /> Görsel kart
      </button>
      {!pngUrl && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--warn)" }}>
          <Lock size={13} /> {pasifNot}
        </span>
      )}
    </div>
  );
}
