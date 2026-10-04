import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, PenLine, Scale, Tractor, Wheat } from "lucide-react";
import { supabaseServer } from "@/lib/supabase";
import UrunKarti from "@/components/UrunKarti";
import FiyatKarti from "@/components/FiyatKarti";
import HavaDurumu from "@/components/HavaDurumu";
import KurbanSayaci from "@/components/KurbanSayaci";
import SinyalMotoru from "@/components/SinyalMotoru";
import FiyatSeridi from "@/components/FiyatSeridi";
import { RENKLER, HAYVAN_RENK } from "@/lib/theme";
import { formatFiyat } from "@/lib/format";
import { tekHayvanKaynak } from "@/lib/guncel";
import { donemAnahtar, donemBaslangiclari } from "@/lib/donem";
import { hasatSezonuMu } from "@/lib/hasat-takvimi";
import { hayvanAd } from "@/lib/karkas";
import { YEM_AD } from "@/lib/urun-tanim";
import { kaynakAd } from "@/lib/kaynak-ad";

export const revalidate = 300;

function BolumBaslik({ baslik, aciklama, href, linkMetin }: { baslik: string; aciklama?: string; href?: string; linkMetin?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", marginBottom: "14px" }}>
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{baslik}</h2>
        {aciklama && <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>{aciklama}</p>}
      </div>
      {href && (
        <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13.5px", fontWeight: 600, color: "var(--green)", textDecoration: "none", whiteSpace: "nowrap" }}>
          {linkMetin ?? "Tümü"} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

const ARACLAR = [
  { href: "/parite", ad: "Parite matrisi", aciklama: "1 litre motorin kaç kg arpa eder?", Icon: Scale },
  { href: "/maliyet", ad: "Ekim maliyeti", aciklama: "Dekar başına maliyet ve başa baş fiyat", Icon: Calculator },
  { href: "/hedef", ad: "Hedef panel", aciklama: "Kaç ton buğday bir traktör eder?", Icon: Tractor },
  { href: "/fiyat-bildir", ad: "Fiyat bildir", aciklama: "Bölgendeki gerçek fiyatı paylaş", Icon: PenLine },
];

export default async function Dashboard() {
  const [{ data: sonFiyatlar }, { data: sonHayvanHam }, donem] = await Promise.all([
    supabaseServer.from("son_fiyatlar").select("*").order("urun_norm"),
    supabaseServer.from("son_hayvan_fiyatlari").select("*").order("hayvan_norm"),
    donemBaslangiclari(),
  ]);

  // Kaynağı değişen hayvanın (süt: ESK_SUT → USK) eski bayat kaydını ele —
  // hayvan_norm başına tek (en güncel) satır. Şerit ve kartlar bunu kullanır.
  const sonHayvan = tekHayvanKaynak(sonHayvanHam ?? []);
  const yem = sonFiyatlar ?? [];

  // Şerit: her öğe ad + fiyat + birim (parça kopması olmaz)
  const seritOgeleri = [
    ...yem.map((f) => ({ ad: YEM_AD[f.urun_norm] ?? f.urun_norm, fiyat: formatFiyat(f.ortalama), birim: "TL/kg" })),
    ...sonHayvan.map((h) => ({ ad: hayvanAd(h.hayvan_norm), fiyat: formatFiyat(h.fiyat), birim: (h.birim ?? "TL/kg").replace(" karkas", "") })),
  ];

  const bugun = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });

  return (
    <>
      <FiyatSeridi ogeler={seritOgeleri} />

      <main className="ab-container" style={{ paddingTop: "28px", paddingBottom: "8px" }}>
        {/* Giriş */}
        <section style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div className="ab-eyebrow" style={{ color: "var(--green)", marginBottom: "6px" }}>{bugun}</div>
            <h1 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 750, lineHeight: 1.15, color: "var(--text)" }}>
              Günün tarım ve hayvancılık fiyatları
            </h1>
            <p style={{ fontSize: "14.5px", color: "var(--muted)", marginTop: "8px", maxWidth: "620px" }}>
              Ticaret borsaları ve resmî kurumlardan derlenir. Her fiyatın yanında kaynağı ve işlem tarihi yazar.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link href="/tarim" className="ab-btn ab-btn-primary">Tarım borsası <ArrowRight size={15} /></Link>
            <Link href="/metodoloji" className="ab-btn"><BookOpen size={15} /> Veriler nereden geliyor?</Link>
          </div>
        </section>

        <KurbanSayaci />

        {/* Hasat dönemi girişi — yalnız Mayıs–Ağustos */}
        {hasatSezonuMu() && (
          <Link href="/hasat" className="ab-card ab-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 18px", marginBottom: "20px", textDecoration: "none" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-soft)", color: "var(--green)", display: "grid", placeItems: "center" }}><Wheat size={20} /></span>
              <span>
                <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600, color: "var(--text)" }}>Hasat paneli</span>
                <span style={{ display: "block", fontSize: "13px", color: "var(--muted)" }}>Bölge havası, fiyat trendi ve hasat takvimi</span>
              </span>
            </span>
            <ArrowRight size={18} style={{ color: "var(--green)" }} />
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]" style={{ gap: "28px" }}>
          <div style={{ minWidth: 0 }}>
            <SinyalMotoru />

            {yem.length > 0 && (
              <section style={{ marginBottom: "32px" }}>
                <BolumBaslik baslik="Hububat" aciklama="Ürün başına en güncel işlem gören borsa" href="/tarim" linkMetin="Grafik ve borsalar" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(158px, 1fr))", gap: "10px" }}>
                  {yem.map((f) => (
                    <UrunKarti key={f.urun_norm} urun_norm={f.urun_norm} urun_ad={f.urun_ad ?? f.urun_norm} renk={f.renk ?? RENKLER.green} ortalama={f.ortalama} en_az={f.en_az} en_cok={f.en_cok} borsa={f.borsa} tarih={f.cekilme_tarihi} birim={f.birim ?? "TL/KG"} />
                  ))}
                </div>
              </section>
            )}

            {sonHayvan.length > 0 && (
              <section style={{ marginBottom: "32px" }}>
                <BolumBaslik baslik="Hayvan ve süt" aciklama="ESK alım ve USK tavsiye fiyatları dönemseldir; UKON bölge ortalamasıdır" href="/hayvan" linkMetin="Grafik ve detay" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(158px, 1fr))", gap: "10px" }}>
                  {sonHayvan.map((h) => (
                    <FiyatKarti
                      key={`${h.kaynak}-${h.hayvan_norm}`}
                      href="/hayvan"
                      ad={hayvanAd(h.hayvan_norm)}
                      renk={HAYVAN_RENK[h.hayvan_norm] ?? RENKLER.red}
                      fiyat={h.fiyat}
                      birim={h.birim ?? "TL/kg"}
                      kaynak={kaynakAd(h.kaynak)}
                      tarih={h.cekilme_tarihi}
                      donemBaslangic={donem[donemAnahtar(h.kaynak, h.hayvan_norm)]}
                    />
                  ))}
                </div>
              </section>
            )}

            {yem.length === 0 && sonHayvan.length === 0 && (
              <div className="ab-card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
                Henüz fiyat verisi yok. Veriler her iş günü akşamı güncellenir.
              </div>
            )}
          </div>

          {/* Sağ panel */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <HavaDurumu />
            <div className="ab-card" style={{ padding: "16px" }}>
              <div className="ab-eyebrow" style={{ marginBottom: "10px" }}>Araçlar</div>
              <div style={{ display: "grid", gap: "4px" }}>
                {ARACLAR.map(({ href, ad, aciklama, Icon }) => (
                  <Link key={href} href={href} className="ab-arac">
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--green-soft)", color: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={17} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{ad}</span>
                      <span style={{ display: "block", fontSize: "12.5px", color: "var(--muted)" }}>{aciklama}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="ab-card" style={{ padding: "16px", background: "linear-gradient(160deg, rgba(76,195,138,0.08), transparent 60%), var(--surface)" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Tavsiye değil, kaynaklı veri</div>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                Fiyatlar TOBB, Konya Ticaret Borsası, ESK, USK ve UKON yayınlarından otomatik çekilir. Birden çok sınıf işlem gördüyse miktar ağırlıklı ortalama gösterilir.
              </p>
              <Link href="/metodoloji" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600, color: "var(--green)", textDecoration: "none", marginTop: "10px" }}>
                Metodoloji <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
