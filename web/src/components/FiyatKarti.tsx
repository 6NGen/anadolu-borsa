import { alfa } from "@/lib/theme";
import Link from "next/link";
import { formatFiyat } from "@/lib/format";
import VeriTazelik from "./VeriTazelik";

// Ortak fiyat kartı (hububat + hayvan). Sunucu bileşeni: hover CSS ile.
interface Props {
  href?: string;
  ad: string;
  renk: string;
  fiyat: number | null;
  birim: string;
  kaynak: string;
  tarih: string;
  enAz?: number | null;
  enCok?: number | null;
  donemBaslangic?: string | null;
}

export default function FiyatKarti({ href, ad, renk, fiyat, birim, kaynak, tarih, enAz, enCok, donemBaslangic }: Props) {
  const aralik = enAz != null && enCok != null && enAz !== enCok;
  // Aralık çubuğunda ortalamanın konumu (0–100)
  const konum = aralik && fiyat != null ? Math.min(100, Math.max(0, ((fiyat - enAz!) / (enCok! - enAz!)) * 100)) : null;

  const icerik = (
    <div className="ab-card ab-card-hover" style={{ padding: "14px", height: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: renk, flexShrink: 0, boxShadow: `0 0 0 3px ${alfa(renk, 0.13)}` }} />
          <span style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad}</span>
        </span>
        <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "2px 7px", whiteSpace: "nowrap" }}>
          {kaynak}
        </span>
      </div>

      <div>
        <div className="ab-num" style={{ fontSize: "clamp(22px, 2.4vw, 28px)", fontWeight: 700, color: "var(--text)", lineHeight: 1.05 }}>
          {formatFiyat(fiyat)}
        </div>
        <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "4px" }}>{birim}</div>
      </div>

      {aralik && (
        <div>
          <div style={{ position: "relative", height: "4px", borderRadius: "4px", background: "var(--border)" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "4px", background: `linear-gradient(90deg, ${alfa(renk, 0.2)}, ${alfa(renk, 0.67)})` }} />
            {konum != null && (
              <span style={{ position: "absolute", top: "50%", left: `${konum}%`, width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: "50%", background: "var(--text)", border: `2px solid ${renk}` }} />
            )}
          </div>
          <div className="ab-num" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--faint)", marginTop: "6px" }}>
            <span>En az {formatFiyat(enAz!)}</span>
            <span>En çok {formatFiyat(enCok!)}</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
        <VeriTazelik tarih={tarih} donemBaslangic={donemBaslangic} />
      </div>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>{icerik}</Link>
  ) : icerik;
}
