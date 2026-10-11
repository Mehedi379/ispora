// ISPora brand logo — scalable SVG (kono external image chara, crisp sob size-e).
// Mark = gold squircle-e ekta network hub (center node + 3 connected node) —
// connectivity/ISP bojhay. Wordmark = ISP (white) + ora (gold).

export function LogoMark({ size = 40, className = "" }) {
  const id = "ispg";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} role="img" aria-label="ISPora logo">
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f6d784" />
          <stop offset="1" stopColor="#c9971f" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${id})`} />
      {/* connections */}
      <g stroke="#0b1220" strokeWidth="2.6" strokeLinecap="round" opacity="0.95">
        <line x1="24" y1="23" x2="24" y2="12" />
        <line x1="24" y1="23" x2="13.5" y2="32" />
        <line x1="24" y1="23" x2="34.5" y2="32" />
      </g>
      {/* nodes */}
      <g fill="#0b1220">
        <circle cx="24" cy="23" r="5.4" />
        <circle cx="24" cy="11" r="3.4" />
        <circle cx="12.5" cy="33" r="3.4" />
        <circle cx="35.5" cy="33" r="3.4" />
      </g>
      <circle cx="24" cy="23" r="2.1" fill={`url(#${id})`} />
    </svg>
  );
}

export default function Logo({ size = 40, text = true, sub = false, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} className="shrink-0 drop-shadow-[0_2px_8px_rgba(201,151,46,0.35)]" />
      {text && (
        <div className="leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight text-white">
            ISP<span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">ora</span>
          </span>
          {sub && <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Smart ISP Billing &amp; Management</p>}
        </div>
      )}
    </div>
  );
}
