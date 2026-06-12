import Link from "next/link";
import { RENKLER } from "@/lib/theme";

// Tüm sayfalarda görünen alt bilgi: metodoloji (güven çapası) + kaynak atfı.
export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${RENKLER.border}`, marginTop: "40px", padding: "20px 16px 28px", fontFamily: "var(--font-mono)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 20px", fontSize: "10px", color: RENKLER.muted }}>
        <span style={{ color: RENKLER.green, fontWeight: 700, letterSpacing: "0.1em" }}>ANADOLU BORSA</span>
        <Link href="/metodoloji" style={{ color: RENKLER.muted, textDecoration: "underline" }}>Metodoloji</Link>
        <span>Veriler: TOBB · KTB · ESK · USK · Open-Meteo</span>
        <span style={{ marginLeft: "auto" }}>borsanadolu.6ngen.com</span>
      </div>
    </footer>
  );
}
