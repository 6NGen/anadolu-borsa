import type { Metadata } from "next";
import { RENKLER } from "@/lib/theme";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Anadolu Borsa",
  description: "Hesap bilgisi işleme amacı, saklama süresi ve silme talebi yöntemi.",
};

const S = {
  h2: { fontSize: "12px", color: RENKLER.green, letterSpacing: "0.12em", margin: "24px 0 8px", fontWeight: 700 } as const,
  p: { fontSize: "12px", color: RENKLER.text, lineHeight: 1.7, margin: "6px 0" } as const,
  mut: { fontSize: "11px", color: RENKLER.muted, lineHeight: 1.7 } as const,
};

export default function KvkkPage() {
  return (
    <main style={{ maxWidth: "720px", margin: "32px auto", padding: "0 16px", fontFamily: "var(--font-mono)" }}>
      <h1 style={{ fontSize: "16px", color: RENKLER.text, fontWeight: 700, fontFamily: "var(--font-syne)" }}>
        KVKK AYDINLATMA METNİ
      </h1>
      <p style={S.mut}>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, Anadolu Borsa
        olarak kişisel verilerinizi aşağıdaki şekilde işliyoruz.
      </p>

      <h2 style={S.h2}>İŞLENEN VERİ</h2>
      <p style={S.p}>
        Google ile giriş yaptığınızda hesabınızdan gelen <b>e-posta adresiniz</b> (ve görünen adınız).
        Fiyat bildiriminde bulunduğunuzda girdiğiniz ürün, il ve fiyat bilgileri topluluk
        ortalamasına katkı için tutulur; bu bilgiler kimliğinizle birlikte kamuya gösterilmez.
      </p>

      <h2 style={S.h2}>İŞLEME AMACI</h2>
      <p style={S.p}>
        Hesap bilgileriniz yalnızca (1) <b>kimlik doğrulama</b> ve (2) kurduğunuz fiyat
        alarmlarına dair <b>bildirim gönderimi</b> amacıyla işlenir.
        Pazarlama amacıyla kullanılmaz, üçüncü kişilerle paylaşılmaz, satılmaz.
      </p>

      <h2 style={S.h2}>SAKLAMA SÜRESİ</h2>
      <p style={S.p}>
        Hesabınız aktif olduğu sürece saklanır. Hesabınızı sildirdiğinizde e-posta
        adresiniz ve hesabınıza bağlı kişisel veriler en geç 30 gün içinde kalıcı olarak silinir.
      </p>

      <h2 style={S.h2}>HAKLARINIZ VE SİLME TALEBİ</h2>
      <p style={S.p}>
        KVKK madde 11 uyarınca verilerinize erişme, düzeltme ve silinmesini isteme hakkınız vardır.
        Silme veya bilgi talebi için:{" "}
        <a href="mailto:omerfarukdurna3442@gmail.com" style={{ color: RENKLER.green }}>
          omerfarukdurna3442@gmail.com
        </a>
        {" "}adresine başvurabilirsiniz.
      </p>

      <h2 style={S.h2}>VERİ SORUMLUSU</h2>
      <p style={S.mut}>
        Anadolu Borsa · borsanadolu.6ngen.com · omerfarukdurna3442@gmail.com
      </p>
    </main>
  );
}
