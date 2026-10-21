import veri from "../../public/sponsorlar.json";

// Sponsor reklam alanı — mobil uygulamayla aynı dosyadan (public/sponsorlar.json).
// İzleme/çerez yok; yalnızca gösterilir. Aktif reklam yoksa "buraya reklam verin".

type Sponsor = {
  firma?: string; baslik?: string; metin?: string; link?: string;
  yerler?: string[]; baslangic?: string; bitis?: string;
};

const REKLAM_EPOSTA = "omerfarukdurna3442@gmail.com";

function aktif(s: Sponsor, yer: string, bugun: string) {
  return !!s.baslik && !!s.link?.startsWith("http")
    && (!s.yerler?.length || s.yerler.includes(yer))
    && (!s.baslangic || s.baslangic <= bugun)
    && (!s.bitis || bugun <= s.bitis);
}

export default function SponsorKarti({ yer }: { yer: "ana" | "tarim" | "hayvan" }) {
  const bugun = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const uygun = (veri.sponsorlar as Sponsor[]).filter((s) => aktif(s, yer, bugun));
  // Birden çok sponsor varsa güne göre sırayla döner (sayfa önbelleğiyle tutarlı).
  const gun = Math.floor(Date.parse(bugun) / 86400000);
  const s = uygun.length ? uygun[gun % uygun.length] : null;

  const baslik = s?.baslik ?? "Bu alanda reklamınız olsun";
  const metin = s?.metin ?? "Yem, gübre, tohum ve ekipman firmaları: her gün fiyata bakan üreticiye ulaşın.";
  const link = s?.link ?? `mailto:${REKLAM_EPOSTA}?subject=${encodeURIComponent("Rayiç reklam")}`;

  return (
    <a
      href={link}
      target={s ? "_blank" : undefined}
      rel={s ? "sponsored noopener" : undefined}
      className="ab-card ab-card-hover"
      style={{ display: "block", padding: "14px 16px", textDecoration: "none" }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--faint)", border: "1px solid var(--border-2)", borderRadius: "4px", padding: "1px 6px" }}>
          {s ? "SPONSORLU" : "REKLAM ALANI"}
        </span>
        {s?.firma && <span style={{ fontSize: "12px", color: "var(--faint)" }}>{s.firma}</span>}
      </span>
      <span style={{ display: "block", fontSize: "14.5px", fontWeight: 650, color: "var(--text)" }}>{baslik}</span>
      <span style={{ display: "block", fontSize: "13px", color: "var(--muted)", marginTop: "4px", lineHeight: 1.5 }}>{metin}</span>
      <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--green)", marginTop: "8px" }}>
        {s ? "İncele →" : "İletişime geç →"}
      </span>
    </a>
  );
}
