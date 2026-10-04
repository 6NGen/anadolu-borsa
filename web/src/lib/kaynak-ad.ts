// DB'deki ASCII büyük harf borsa/kaynak kodlarının görünen adları.
const AD: Record<string, string> = {
  ESKISEHIR: "Eskişehir", CORUM: "Çorum", ILGIN: "Ilgın", KONYA: "Konya", ANKARA: "Ankara",
  ESK: "ESK", USK: "USK", UKON: "UKON", ESK_SUT: "ESK",
};

export function kaynakAd(kod: string | null | undefined): string {
  if (!kod) return "";
  return AD[kod] ?? kod.charAt(0) + kod.slice(1).toLocaleLowerCase("tr");
}
