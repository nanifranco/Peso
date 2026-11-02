const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Silueta paramétrica: w=1 cómo empezaste, w=0 la meta */
function bodyPath(w: number) {
  const cx = 100
  const sh = lerp(30, 42, w) // hombros
  const ch = lerp(25, 48, w) // pecho
  const bh = lerp(20, 68, w) // panza (lo que más cambia)
  const hh = lerp(24, 50, w) // cadera
  return `M ${cx - 9} 80
    C ${cx - 20} 84, ${cx - sh} 86, ${cx - sh} 100
    C ${cx - ch - 2} 116, ${cx - bh} 128, ${cx - bh} 150
    C ${cx - bh} 170, ${cx - hh - 4} 178, ${cx - hh} 192
    L ${cx + hh} 192
    C ${cx + hh + 4} 178, ${cx + bh} 170, ${cx + bh} 150
    C ${cx + bh} 128, ${cx + ch + 2} 116, ${cx + sh} 100
    C ${cx + sh} 86, ${cx + 20} 84, ${cx + 9} 80 Z`
}

function limbs(w: number) {
  const sh = lerp(30, 42, w)
  const bh = lerp(20, 68, w)
  const arm = lerp(13, 19, w)
  const leg = lerp(17, 26, w)
  const legX = lerp(13, 20, w)
  return { sh, bh, arm, leg, legX }
}

export default function Avatar({ shape, lostKg, size = 220 }: { shape: number; lostKg: number; size?: number }) {
  const w = 1 - shape
  const L = limbs(w)
  const G = limbs(1)
  const blobs = Math.min(9, Math.max(shape > 0.02 ? 2 : 0, Math.floor(lostKg / 1.5)))
  const smile = lerp(4, 11, shape)

  return (
    <svg viewBox="0 0 200 265" width={size} height={size * 1.325} aria-label="Tu avatar">
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A66" />
          <stop offset="1" stopColor="#F2553A" />
        </linearGradient>
        <radialGradient id="halo">
          <stop offset="0" stopColor="#FFD166" stopOpacity=".55" />
          <stop offset="1" stopColor="#FFD166" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="150" rx="98" ry="110" fill="url(#halo)" />
      <ellipse cx="100" cy="254" rx={lerp(42, 64, w)} ry="6" fill="#2A1F1A" opacity=".08" />

      {/* Fantasma: cómo empezaste */}
      {shape > 0.03 && (
        <g fill="none" stroke="#2A1F1A" strokeOpacity=".22" strokeWidth="1.6" strokeDasharray="4 5">
          <path d={bodyPath(1)} />
          <rect x={100 - G.legX - G.leg / 2} y="186" width={G.leg} height="64" rx={G.leg / 2} />
          <rect x={100 + G.legX - G.leg / 2} y="186" width={G.leg} height="64" rx={G.leg / 2} />
        </g>
      )}

      <g className="breathe">
        {/* piernas */}
        <rect x={100 - L.legX - L.leg / 2} y="184" width={L.leg} height="66" rx={L.leg / 2} fill="#2A1F1A" />
        <rect x={100 + L.legX - L.leg / 2} y="184" width={L.leg} height="66" rx={L.leg / 2} fill="#2A1F1A" />
        {/* brazos */}
        <line x1={100 - L.sh + 4} y1="102" x2={100 - L.sh - 6 - L.bh * 0.2} y2="172" stroke="#F2553A" strokeWidth={L.arm} strokeLinecap="round" />
        <line x1={100 + L.sh - 4} y1="102" x2={100 + L.sh + 6 + L.bh * 0.2} y2="172" stroke="#F2553A" strokeWidth={L.arm} strokeLinecap="round" />
        {/* cuerpo */}
        <path d={bodyPath(w)} fill="url(#skin)" style={{ transition: 'd .8s ease' }} />
        {/* cabeza */}
        <circle cx="100" cy="50" r="27" fill="url(#skin)" />
        <circle cx="90" cy="47" r="3" fill="#2A1F1A" />
        <circle cx="110" cy="47" r="3" fill="#2A1F1A" />
        <circle cx="84" cy="57" r="4.5" fill="#FFD166" opacity=".6" />
        <circle cx="116" cy="57" r="4.5" fill="#FFD166" opacity=".6" />
        <path d={`M 91 ${58} Q 100 ${58 + smile} 109 ${58}`} stroke="#2A1F1A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>

      {/* grasa saliendo */}
      {Array.from({ length: blobs }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const y = 120 + ((i * 17) % 60)
        const x = 100 + side * (L.bh * 0.7)
        return (
          <circle
            key={i}
            className="blob"
            cx={x}
            cy={y}
            r={4 + (i % 3) * 1.8}
            fill="#FFD166"
            style={{ ['--dx' as string]: `${side * (34 + (i % 3) * 14)}px`, ['--dy' as string]: `${-30 - (i % 4) * 12}px`, animationDelay: `${i * 0.5}s` }}
          />
        )
      })}
    </svg>
  )
}
