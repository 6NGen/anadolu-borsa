// Karkas ağırlıkları için TEK kaynak: hesap da dipnot da buradan okur.
// TODO: TOSUN karkas kg doğrulanacak (225 mi 280 mi?) — kullanıcı karar verecek.
export const KARKAS_KG: Record<string, number> = {
  TOSUN: 225,
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
