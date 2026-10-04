// Veri tazelik rozeti: bayat veri kullanıcıdan gizlenmez, etiketlenir.
// Eşik lib/tazelik'ten okunur — kart üretim guard'ıyla AYNI sabit (KARAR 2026-06-12).
//   bugün                    → "Bugün"                 (yeşil)
//   0-1 iş günü (son işlem)  → "02.10 · son işlem"     (yeşil — en taze olası veri)
//   2 iş günü                → "02.10 işlemi"          (sarı)
//   ESIK+ iş günü            → "02.10 · n gün önce"    (kırmızı)
// donemBaslangic: ESK/USK gibi DÖNEMSEL resmî fiyatlar her gün yeniden ilan
// edilmez; "bugün güncellendi" demek yanıltıcı olur. Kontrol taze ise
// "Resmî · 12.06.2026 itibarıyla" gösterilir (kayıtlarımızdaki ilk gün).
import { BAYAT_ESIK_GUN, gunFarki, isGunuFarki } from "@/lib/tazelik";

interface Props {
  tarih: string | null | undefined;
  donemBaslangic?: string | null;
}

function gunAy(t: string): string {
  const [y, a, g] = t.slice(0, 10).split("-");
  return y && a && g ? `${g}.${a}` : t;
}

function gunAyYil(t: string): string {
  const [y, a, g] = t.slice(0, 10).split("-");
  return y && a && g ? `${g}.${a}.${y}` : t;
}

export default function VeriTazelik({ tarih, donemBaslangic }: Props) {
  const takvim = gunFarki(tarih);
  const is = isGunuFarki(tarih);
  if (takvim == null || is == null || takvim < 0) return null;

  let renk = "#4CC38A";
  let metin = "Bugün";
  let baslik = `Veri tarihi: ${tarih!.slice(0, 10)}`;
  if (is >= BAYAT_ESIK_GUN) {
    renk = "#F07167";
    metin = `${gunAy(tarih!)} · ${takvim} gün önce`;
  } else if (donemBaslangic && donemBaslangic.slice(0, 10) < tarih!.slice(0, 10)) {
    metin = `Resmî · ${gunAyYil(donemBaslangic)} itibarıyla`;
    baslik = `Dönemsel resmî fiyat: her gün yeniden ilan edilmez. Son kontrol ${tarih!.slice(0, 10)}; bu değer kayıtlarımızda ${donemBaslangic.slice(0, 10)} tarihinden beri değişmedi.`;
  } else if (is >= 2) {
    renk = "#E9B949";
    metin = `${gunAy(tarih!)} işlemi`;
  } else if (takvim >= 1) {
    metin = `${gunAy(tarih!)} · son işlem`;
    baslik = `Son işlem günü: ${tarih!.slice(0, 10)}`;
  }

  return (
    <span
      title={baslik}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px", maxWidth: "100%",
        fontSize: "12px", fontWeight: 500, color: renk,
        padding: "4px 8px", borderRadius: "10px", lineHeight: 1.3, background: `${renk}1A`, border: `1px solid ${renk}33`,
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: renk, flexShrink: 0 }} />
      {metin}
    </span>
  );
}
