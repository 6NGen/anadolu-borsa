"use client";
// Header'daki 📍 bölge seçici — tüm sayfalarda görünür (Nav içinde).
// Seçim localStorage'a yazılır; hava durumu ve tarım borsası buna göre kişiselleşir.
import { ILLER } from "@/lib/iller";
import { useBolgem } from "@/lib/bolgem";
import { RENKLER } from "@/lib/theme";

export default function BolgemSecici() {
  const [il, setIl] = useBolgem();
  return (
    <label
      title="Bölgeni seç — hava durumu ve borsa fiyatı kişiselleşir"
      style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: RENKLER.muted, cursor: "pointer" }}
    >
      <span aria-hidden>📍</span>
      <select
        value={il ?? ""}
        onChange={(e) => setIl(e.target.value)}
        aria-label="Bölge seç"
        style={{ background: "transparent", border: "none", color: il ? RENKLER.text : RENKLER.muted, fontSize: "12px", fontFamily: "var(--font-mono)", cursor: "pointer", outline: "none", maxWidth: "104px" }}
      >
        <option value="" disabled>Bölge seç</option>
        {ILLER.map((i) => (
          <option key={i} value={i} style={{ background: RENKLER.surface, color: RENKLER.text }}>{i}</option>
        ))}
      </select>
    </label>
  );
}
