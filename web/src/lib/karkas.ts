// Karkas ağırlıkları için TEK kaynak: hesap da dipnot da buradan okur.
// Karkas kg ırka/besiye göre 220-300 arası değişir; TOSUN için 250 orta değer
// seçildi (ESK 1. Kalite ~250-260 bandı). Tahmin etiketi dipnotta her zaman var.
// TODO(PART6): Sürü değeri hesaplayıcıda ağırlık KULLANICI AYARLI olacak —
// "ortalama karkas: [250] kg" düzenlenebilir alan (auth'suz kişiselleştirme).
export const KARKAS_KG: Record<string, number> = {
  TOSUN: 250,
  DANA: 180,
  INEK: 250,
  MANDA: 250,
  KUZU: 17,
  TOKLU: 22,
  KOYUN: 25,
  OGLAK: 12,
};

export const HAYVAN_AD: Record<string, string> = {
  TOSUN: "Tosun", DANA: "Dana", INEK: "İnek", MANDA: "Manda",
  KUZU: "Kuzu", TOKLU: "Toklu", KOYUN: "Koyun", OGLAK: "Oğlak",
};

// "baş (ort. 450kg, %50 karkas)" — canlı ağırlık = karkas × 2 varsayımı
export function karkasLabel(norm: string): string {
  const kg = KARKAS_KG[norm];
  return kg ? `baş (ort. ${kg * 2}kg, %50 karkas)` : "baş";
}

// Dipnot metni dinamik üretilir; sabit metin kod ile çelişemez.
export function karkasDipnot(normlar: string[] = ["KUZU", "TOSUN"]): string {
  const parcalar = normlar
    .filter((n) => KARKAS_KG[n])
    .map((n) => `${n} ~${KARKAS_KG[n]}kg`);
  return `Ortalama karkas ağırlığı (${parcalar.join(", ")} vb.) ve güncel ESK karkas fiyatı üzerinden tahmindir.`;
}
