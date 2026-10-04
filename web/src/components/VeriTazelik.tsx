// Veri tazelik rozeti: bayat veri kullanıcıdan gizlenmez, etiketlenir.
// Eşik lib/tazelik'ten okunur — kart üretim guard'ıyla AYNI sabit (KARAR 2026-06-12).
//   bugün                    → "● bugün"            (yeşil)
//   0-1 iş günü (son işlem)  → "● 02.10"            (yeşil — en taze olası veri)
//   2 iş günü                → "⏱ 02.10"            (sarı)
//   ESIK+ iş günü            → "⚠ 02.10 · n gün önce" (kırmızı)
// donemBaslangic: ESK/USK gibi DÖNEMSEL resmî fiyatlar her gün yeniden ilan
// edilmez; "bugün güncellendi" demek yanıltıcı olur. Kontrol taze ise
// "● resmî · 12.06.2026 tarihinden beri aynı" gösterilir (kayıtlarımızdaki ilk gün).
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

  let renk = "#4AE870";
  let metin = "● bugün";
  let baslik = `Veri tarihi: ${tarih!.slice(0, 10)}`;
  if (is >= BAYAT_ESIK_GUN) {
    renk = "#E87060";
    metin = `⚠ ${gunAy(tarih!)} · ${takvim} gün önce`;
  } else if (donemBaslangic && donemBaslangic.slice(0, 10) < tarih!.slice(0, 10)) {
    metin = `● resmî · ${gunAyYil(donemBaslangic)} tarihinden beri aynı`;
    baslik = `Dönemsel resmî fiyat: her gün yeniden ilan edilmez. Son kontrol ${tarih!.slice(0, 10)}; bu değer kayıtlarımızda ${donemBaslangic.slice(0, 10)}'den beri değişmedi.`;
  } else if (is >= 2) {
    renk = "#E8C840";
    metin = `⏱ ${gunAy(tarih!)}`;
  } else if (takvim >= 1) {
    metin = `● ${gunAy(tarih!)}`;
    baslik = `Son işlem günü: ${tarih!.slice(0, 10)}`;
  }

  return (
    <span style={{ fontSize: "12px", color: renk, whiteSpace: "nowrap" }} title={baslik}>
      {metin}
    </span>
  );
}
