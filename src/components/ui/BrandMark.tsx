interface BrandMarkProps {
  small?: boolean;
}

export function BrandMark({ small = false }: BrandMarkProps) {
  const sz = small ? 24 : 38;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: small ? 10 : 14 }}>
      <svg width={sz} height={sz} viewBox="0 0 40 40" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
        <defs>
          <linearGradient id="bm-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fbf6ea" />
            <stop offset="100%" stopColor="#c5b89c" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="32" height="32" rx="6" fill="url(#bm-grad)" stroke="#a89870" strokeWidth="1" />
        <circle cx="13" cy="13" r="2.5" fill="#1a1208" />
        <circle cx="27" cy="13" r="2.5" fill="#1a1208" />
        <circle cx="20" cy="20" r="2.5" fill="#1a1208" />
        <circle cx="13" cy="27" r="2.5" fill="#1a1208" />
        <circle cx="27" cy="27" r="2.5" fill="#1a1208" />
      </svg>
      <span
        className="font-cinzel font-bold"
        style={{
          fontSize: small ? 16 : 24,
          letterSpacing: '0.32em',
          color: '#f3d989',
          textShadow: '0 2px 6px rgba(0,0,0,0.6), 0 0 18px rgba(232,195,116,0.25)',
        }}
      >
        FARKLE
      </span>
    </div>
  );
}
