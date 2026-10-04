import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

// Tek yazı ailesi: Inter (latin-ext: ğ ş ı İ). Eski --font-mono/--font-syne
// değişkenleri globals.css'te buna bağlanır.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://borsanadolu.6ngen.com"),
  title: "Anadolu Borsa — Arpa, Buğday, Canlı Hayvan ve Süt Fiyatları",
  description: "Arpa, buğday, canlı hayvan ve süt fiyatları — günlük, kaynaklı, tek ekranda. TOBB, KTB, ESK, USK verileri.",
};

const TEMA_BETIGI = `try{var t=localStorage.getItem("tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Kayıtlı tema seçimini boyamadan önce uygula (yanıp sönme olmasın) */}
        <script dangerouslySetInnerHTML={{ __html: TEMA_BETIGI }} />
      </head>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Nav />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
