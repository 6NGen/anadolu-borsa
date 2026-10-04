// Marka işareti: yükselen üç başak/çubuk + trend çizgisi (fiyat + tarım).
// Saf SVG — dış görsel bağımlılığı yok.
export default function Logo({ boyut = 28 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 32 32" aria-hidden role="img">
      <defs>
        <linearGradient id="ab-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ED39A" />
          <stop offset="1" stopColor="#2E9D66" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ab-logo-g)" />
      <g fill="#06120B">
        <rect x="7.5" y="17" width="4" height="8" rx="1.4" />
        <rect x="14" y="13" width="4" height="12" rx="1.4" />
        <rect x="20.5" y="9" width="4" height="16" rx="1.4" />
      </g>
      <path d="M7 13.5 L13 9.5 L17.5 11.5 L25 6" fill="none" stroke="#F4FFF8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
