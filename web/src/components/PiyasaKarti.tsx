import { RENKLER } from "@/lib/theme";
import { formatFiyat } from "@/lib/format";
import VeriTazelik from "./VeriTazelik";

interface BorsaVeri { kaynak: string; fiyat: number | null; birim: string; tarih: string; }
interface PiyasaVeri { agirlikli_ortalama: number | null; en_az: number | null; en_cok: number | null; bildirim_sayisi: number; il: string; }

interface Props {
  urun_ad: string;
  borsa: BorsaVeri;
  piyasa?: PiyasaVeri | null;
}

export default function PiyasaKarti({ urun_ad, borsa, piyasa }: Props) {
  const piyasaAralik = piyasa && piyasa.en_az != null && piyasa.en_cok != null && piyasa.en_az !== piyasa.en_cok;
  return (
    <div style={{ background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px" }}>
      <div style={{ fontSize: "12px", color: RENKLER.text, fontWeight: 600, marginBottom: "10px" }}>{urun_ad}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ padding: "10px", background: "#080E09", borderRadius: "3px", border: `1px solid ${RENKLER.border}` }}>
          <div style={{ fontSize: "9px", color: RENKLER.muted, letterSpacing: "0.1em", marginBottom: "4px" }}>BORSA · {borsa.kaynak}</div>
          <div style={{ fontSize: "20px", color: RENKLER.green, fontWeight: 700 }}>{formatFiyat(borsa.fiyat)}</div>
          <div style={{ fontSize: "9px", color: RENKLER.muted }}>{borsa.birim}</div>
          <div style={{ fontSize: "9px", color: RENKLER.muted, marginTop: "4px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span>{borsa.tarih}</span>
            <VeriTazelik tarih={borsa.tarih} />
          </div>
        </div>
        {piyasa ? (
          <div style={{ padding: "10px", background: "#080E09", borderRadius: "3px", border: "1px solid #2A4545" }}>
            <div style={{ fontSize: "9px", color: "#506A6A", letterSpacing: "0.1em", marginBottom: "4px" }}>PİYASA · {piyasa.il} · {piyasa.bildirim_sayisi} bildirim</div>
            <div style={{ fontSize: "20px", color: "#70D0D0", fontWeight: 700 }}>{formatFiyat(piyasa.agirlikli_ortalama)}</div>
            <div style={{ fontSize: "9px", color: "#506A6A" }}>TL/KG · ağırlıklı</div>
            {piyasaAralik && (
              <div style={{ fontSize: "9px", color: "#506A6A", marginTop: "4px" }}>↓{formatFiyat(piyasa.en_az)} ↑{formatFiyat(piyasa.en_cok)}</div>
            )}
          </div>
        ) : (
          <div style={{ padding: "10px", background: "#080E09", borderRadius: "3px", border: `1px solid ${RENKLER.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "9px", color: RENKLER.muted, textAlign: "center" }}>Piyasa verisi yok<br />(min 3 bildirim)</div>
          </div>
        )}
      </div>
    </div>
  );
}
