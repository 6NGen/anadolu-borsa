import type { Metadata } from "next";
import { RENKLER } from "@/lib/theme";
import { KARKAS_KG, HAYVAN_AD } from "@/lib/karkas";

// Güven çapası + hukuki kalkan: ne çekilir, nereden, ne sıklıkta, ne tahmindir.
// Statik sayfa — fiyat verisi yok, sadece yöntem anlatımı.

export const metadata: Metadata = {
  title: "Metodoloji — Anadolu Borsa",
  description:
    "Anadolu Borsa veri kaynakları, çekim sıklığı, parite hesabı ve tahmin/referans değerlerin yöntemi.",
};

const KAYNAKLAR = [
  {
    ad: "TOBB Borsa Bültenleri",
    ne: "Hububat fiyatları (arpa, buğday, mısır vb.) — Ankara, Eskişehir, Çorum, Ilgın ticaret borsaları",
    siklik: "Her gün 23:00 (TSİ)",
  },
  {
    ad: "KTB (Konya Ticaret Borsası)",
    ne: "Hububat anlık fiyatları",
    siklik: "Her gün 23:00 (TSİ)",
  },
  {
    ad: "ESK (Et ve Süt Kurumu)",
    ne: "Karkas et ALIM (taban) fiyatları (tosun, kuzu, toklu vb.) — kurumun alım fiyatıdır; serbest piyasa genelde üzerindedir",
    siklik: "Her gün 23:00 (TSİ)",
  },
  {
    ad: "USK (Ulusal Süt Konseyi)",
    ne: "Çiğ süt TAVSİYE fiyatı (üreticiden sanayiye, dönemsel) — doğrudan satış/saha fiyatı belirgin farklı olabilir",
    siklik: "Her gün 23:00 (TSİ)",
  },
  {
    ad: "UKON (Ulusal Kırmızı Et Konseyi)",
    ne: "Serbest piyasa karkas fiyatı (dana/kuzu, 7 bölge ortalaması) — ESK taban fiyatıyla kıyas için",
    siklik: "Her gün 23:00 (TSİ)",
  },
  {
    ad: "Open-Meteo",
    ne: "Tarım bölgeleri hava durumu (sıcaklık, yağış)",
    siklik: "Her gün 23:00 (TSİ)",
  },
];

const ROZETLER = [
  { isaret: "●", renk: RENKLER.pos, anlam: "bugün — veri bugün çekildi" },
  { isaret: "⏱", renk: "#E8C040", anlam: "1-2 gün önce — kaynak henüz yeni veri yayınlamadı" },
  { isaret: "⚠", renk: RENKLER.red, anlam: "3+ gün önce — veri bayat, kaynak yayını kesilmiş olabilir" },
];

const S = {
  h2: { fontSize: "12px", color: RENKLER.green, letterSpacing: "0.15em", margin: "28px 0 10px", fontWeight: 700 } as const,
  p: { fontSize: "12px", color: RENKLER.text, lineHeight: 1.7, margin: "6px 0" } as const,
  mut: { fontSize: "13px", color: RENKLER.muted, lineHeight: 1.7 } as const,
  kutu: { background: RENKLER.surface, border: `1px solid ${RENKLER.border}`, borderRadius: "4px", padding: "14px 16px" } as const,
  td: { padding: "8px 10px", borderBottom: `1px solid ${RENKLER.border}`, verticalAlign: "top" as const },
};

export default function MetodolojiPage() {
  return (
    <main style={{ maxWidth: "760px", margin: "32px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>METODOLOJİ</h1>
      <p style={S.mut}>
        Fiyatlar ilgili kurumların kamuya açık yayınlarından derlenir; kaynak ve veri tarihi her kartta belirtilir.
      </p>

      <h2 style={S.h2}>VERİ KAYNAKLARI</h2>
      <div style={{ ...S.kutu, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ color: RENKLER.muted, textAlign: "left", letterSpacing: "0.08em" }}>
              <th style={S.td}>KAYNAK</th>
              <th style={S.td}>NE ÇEKİLİR</th>
              <th style={S.td}>SIKLIK</th>
            </tr>
          </thead>
          <tbody>
            {KAYNAKLAR.map((k) => (
              <tr key={k.ad} style={{ color: RENKLER.text }}>
                <td style={{ ...S.td, whiteSpace: "nowrap", color: RENKLER.green }}>{k.ad}</td>
                <td style={S.td}>{k.ne}</td>
                <td style={{ ...S.td, whiteSpace: "nowrap", color: RENKLER.muted }}>{k.siklik}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={S.mut}>
        Çekim, her gün 23:00 (TSİ) çalışan otomatik bir görevle yapılır. Bir kaynak o gün veri
        yayınlamamışsa son bilinen değer gösterilmeye devam eder ve kartındaki tazelik rozeti bunu açıkça belirtir.
      </p>

      <h2 style={S.h2}>PARİTE HESABI</h2>
      <div style={S.kutu}>
        <p style={{ ...S.p, fontWeight: 700 }}>parite = girdi fiyatı ÷ ürün fiyatı</p>
        <p style={S.mut}>
          Örnek: motorin 67,02 ₺/litre ve çiğ süt 24,30 ₺/litre ise 1 litre motorin = 67,02 ÷ 24,30 ≈ 2,76 litre çiğ süt.
          İki fiyat da kartta kaynağı ve tarihiyle birlikte gösterilir.
        </p>
      </div>

      <h2 style={S.h2}>TAHMİN VE REFERANS DEĞERLER</h2>
      <p style={S.p}>
        Aşağıdaki değerler ölçüm değil <b>tahmindir</b> ve kullanıldıkları her yerde &quot;tahmin&quot; olarak etiketlenir:
      </p>
      <div style={S.kutu}>
        <p style={S.mut}>
          <b style={{ color: RENKLER.text }}>Karkas ağırlıkları</b> — sürü değeri ve hedef hesaplarında kullanılır;
          ESK 1. kalite bandı orta değerleri esas alınmıştır (ırka ve besiye göre değişir):
        </p>
        <p style={{ ...S.mut, marginTop: "8px" }}>
          {Object.entries(KARKAS_KG).map(([n, kg]) => `${HAYVAN_AD[n] ?? n} ~${kg} kg`).join(" · ")}
        </p>
        <p style={{ ...S.mut, marginTop: "8px" }}>
          <b style={{ color: RENKLER.text }}>Varlık fiyatları</b> (traktör vb. hedef hesaplarında) piyasa ilanlarından
          derlenen yaklaşık referanslardır. <b style={{ color: RENKLER.text }}>Mazot fiyatı</b> EPDK/pompa
          fiyatlarından elle güncellenir; geçerlilik tarihi kartta yazar.
          Ürünlerin uzun dönem tarihsel serilerinde TÜİK tahmini taban kullanılır; gerçek günlük seri
          yayın tarihinden itibaren birikmektedir.
        </p>
      </div>

      <h2 style={S.h2}>VERİ TAZELİK ROZETLERİ</h2>
      <div style={S.kutu}>
        {ROZETLER.map((r) => (
          <p key={r.isaret} style={S.p}>
            <span style={{ color: r.renk }}>{r.isaret}</span>{" "}
            <span style={{ color: RENKLER.muted }}>{r.anlam}</span>
          </p>
        ))}
        <p style={{ ...S.mut, marginTop: "8px" }}>
          İlke: bayat veya tahmini veri asla gizlenmez, her zaman etiketlenir.
        </p>
      </div>

      <h2 style={S.h2}>HATA BİLDİRİMİ</h2>
      <p style={S.p}>
        Yanlış veya eksik veri fark ederseniz:{" "}
        <a href="mailto:omerfarukdurna3442@gmail.com" style={{ color: RENKLER.green }}>
          omerfarukdurna3442@gmail.com
        </a>
      </p>
    </main>
  );
}
