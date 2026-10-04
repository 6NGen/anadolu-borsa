import FiyatKarti from "./FiyatKarti";
import { YEM_AD } from "@/lib/urun-tanim";
import { kaynakAd } from "@/lib/kaynak-ad";

interface Props {
  urun_norm: string;
  urun_ad: string;
  renk: string;
  ortalama: number | null;
  en_az: number | null;
  en_cok: number | null;
  borsa: string;
  tarih: string;
  birim: string;
}

// Hububat fiyat kartı — ortak FiyatKarti üzerine ince sarmal (ürün sayfasına link).
export default function UrunKarti({ urun_norm, urun_ad, renk, ortalama, en_az, en_cok, borsa, tarih, birim }: Props) {
  return (
    <FiyatKarti
      href={`/urun/${urun_norm.toLowerCase()}`}
      ad={YEM_AD[urun_norm] ?? urun_ad}
      renk={renk}
      fiyat={ortalama}
      birim={birim.toUpperCase() === "KG" || birim === "TL/KG" ? "TL/kg" : birim}
      kaynak={kaynakAd(borsa)}
      tarih={tarih}
      enAz={en_az}
      enCok={en_cok}
    />
  );
}
