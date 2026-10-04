// Navbar altındaki kayan fiyat şeridi (tam genişlik). İçerik 2 kez dizilir,
// %50 kayınca başa sarar → dikişsiz. Fareyle üstüne gelince durur.
interface Oge { ad: string; fiyat: string; birim: string }

export default function FiyatSeridi({ ogeler }: { ogeler: Oge[] }) {
  if (ogeler.length === 0) return null;
  const sure = Math.max(30, ogeler.length * 4);
  return (
    <div className="ab-serit" aria-label="Güncel fiyatlar" style={{ borderBottom: "1px solid var(--border)", background: "var(--inset)", overflow: "hidden" }}>
      <div className="ab-serit-ic" style={{ display: "flex", width: "max-content", animation: `ticker ${sure}s linear infinite` }}>
        {[...ogeler, ...ogeler].map((o, i) => (
          <span key={i} aria-hidden={i >= ogeler.length} style={{ display: "inline-flex", alignItems: "baseline", gap: "8px", padding: "9px 22px", whiteSpace: "nowrap", fontSize: "13px", borderRight: "1px solid var(--border)" }}>
            <span style={{ color: "var(--muted)", fontWeight: 500 }}>{o.ad}</span>
            <span className="ab-num" style={{ color: "var(--text)", fontWeight: 650 }}>{o.fiyat}</span>
            <span style={{ color: "var(--faint)", fontSize: "12px" }}>{o.birim}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
