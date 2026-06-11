// Veri tazelik rozeti: bayat veri kullanıcıdan gizlenmez, etiketlenir.
// gun 0 → "● bugün" (yeşil) · 1-2 → "⏱ n gün önce" (sarı) · 3+ → "⚠ n gün önce" (turuncu)
interface Props {
  tarih: string | null | undefined;
}

export default function VeriTazelik({ tarih }: Props) {
  if (!tarih) return null;
  const gun = Math.floor((Date.now() - new Date(tarih.slice(0, 10) + "T00:00:00").getTime()) / 86400000);
  if (!Number.isFinite(gun) || gun < 0) return null;

  let renk = "#4AE870";
  let metin = "● bugün";
  if (gun >= 3) {
    renk = "#E87060";
    metin = `⚠ ${gun} gün önce`;
  } else if (gun >= 1) {
    renk = "#E8C840";
    metin = `⏱ ${gun} gün önce`;
  }

  return (
    <span style={{ fontSize: "9px", color: renk, whiteSpace: "nowrap" }} title={`Veri tarihi: ${tarih.slice(0, 10)}`}>
      {metin}
    </span>
  );
}
