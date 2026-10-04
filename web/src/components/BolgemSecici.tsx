"use client";
// Header'daki bölge seçici — tüm sayfalarda görünür (Nav içinde).
// Seçim localStorage'a yazılır; hava durumu ve tarım borsası buna göre kişiselleşir.
import { MapPin, ChevronDown } from "lucide-react";
import { ILLER } from "@/lib/iller";
import { useBolgem } from "@/lib/bolgem";
import { RENKLER } from "@/lib/theme";

export default function BolgemSecici() {
  const [il, setIl] = useBolgem();
  return (
    <label
      title="Bölgeni seç — hava durumu ve borsa fiyatı kişiselleşir"
      className="ab-btn"
      style={{ position: "relative", gap: "6px", padding: "0 10px 0 10px", cursor: "pointer", color: il ? "var(--text)" : "var(--muted)", fontWeight: 500 }}
    >
      <MapPin size={15} style={{ color: "var(--green)", flexShrink: 0 }} />
      <span style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis" }}>{il ? il.charAt(0) + il.slice(1).toLocaleLowerCase("tr") : "Bölge seç"}</span>
      <ChevronDown size={14} style={{ color: "var(--faint)" }} />
      {/* Görünmez yerel select: erişilebilir + mobilde sistem seçicisi açılır */}
      <select
        value={il ?? ""}
        onChange={(e) => setIl(e.target.value)}
        aria-label="Bölge seç"
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
      >
        <option value="" disabled>Bölge seç</option>
        {ILLER.map((i) => (
          <option key={i} value={i} style={{ background: RENKLER.surface, color: RENKLER.text }}>{i}</option>
        ))}
      </select>
    </label>
  );
}
