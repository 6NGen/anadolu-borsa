import Link from "next/link";
import Logo from "./Logo";

// Tüm sayfalarda alt bilgi: metodoloji (güven çapası) + kaynak atfı + site haritası.
const SUTUNLAR = [
  { baslik: "Piyasalar", linkler: [["/tarim", "Tarım borsası"], ["/hayvan", "Hayvan ve süt"], ["/girdiler", "Girdi fiyatları"], ["/parite", "Parite matrisi"]] },
  { baslik: "Araçlar", linkler: [["/maliyet", "Ekim maliyeti"], ["/tarla", "Sanal tarla"], ["/hasat", "Hasat paneli"], ["/hedef", "Hedef panel"]] },
  { baslik: "Kurumsal", linkler: [["/metodoloji", "Metodoloji"], ["/fiyat-bildir", "Fiyat bildir"], ["/kvkk", "KVKK ve gizlilik"]] },
];

export default function Footer() {
  return (
    <footer style={{ marginTop: "auto", borderTop: "1px solid var(--border)", background: "var(--inset)" }}>
      <div className="ab-container" style={{ paddingTop: "40px", paddingBottom: "28px", marginTop: "48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "28px" }}>
          <div style={{ minWidth: "220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Logo boyut={26} />
              <span style={{ fontWeight: 700, fontSize: "15px" }}>Anadolu Borsa</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, maxWidth: "300px" }}>
              Resmî borsa ve kurum verilerinden derlenen hububat, hayvan, süt ve girdi fiyatları. Tavsiye vermez; kaynak ve tarih her fiyatın yanında yazar.
            </p>
          </div>
          {SUTUNLAR.map((s) => (
            <div key={s.baslik}>
              <div className="ab-eyebrow" style={{ marginBottom: "12px" }}>{s.baslik}</div>
              <ul style={{ listStyle: "none", display: "grid", gap: "8px" }}>
                {s.linkler.map(([href, ad]) => (
                  <li key={href}>
                    <Link href={href} style={{ fontSize: "13.5px", color: "var(--muted)", textDecoration: "none" }}>{ad}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "32px", paddingTop: "18px", borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "8px 24px", fontSize: "12.5px", color: "var(--faint)" }}>
          <span>Veri kaynakları: TOBB · Konya Ticaret Borsası · ESK · USK · UKON · Opet · Open-Meteo</span>
          <span style={{ marginLeft: "auto" }}>© {new Date().getFullYear()} Anadolu Borsa · 6NGen</span>
        </div>
      </div>
    </footer>
  );
}
