import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Eski ad (Anadolu Borsa) → Rayiç. WhatsApp'ta paylaşılmış eski linkler ve
  // Google'daki sıralama kaybolmasın diye eski alan adı kalıcı (308) yönlenir.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "borsanadolu.6ngen.com" }],
        destination: "https://rayic.6ngen.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
