import { useId } from 'react'
import type { Sex } from '../lib/types'

/**
 * Avatar realista estilo escultura de barro.
 * `fat` va de 0 (definido) a 1 (mucha grasa) y sale del % de grasa estimado,
 * así que la figura se parece a TU composición, no a una barra de progreso.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
type Pt = [number, number]

/** Catmull-Rom cerrado → curvas Bézier suaves */
function smooth(pts: Pt[], closed = true) {
  const n = pts.length
  const get = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2)
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + (closed ? ' Z' : '')
}

function body(F: number, sex: Sex) {
  const m = sex === 'm'
  const C = 100
  // [y, distancia al centro] — contorno exterior del lado izquierdo
  const outer: [number, number][] = [
    [60, 7 + 3.5 * F],
    [76, 11 + 6 * F],
    [84, (m ? 23 : 27) + 5 * F],
    [93, (m ? 31 : 37) + 6 * F],
    [106, (m ? 33 : 39) + 8 * F],
    [122, (m ? 28 : 31) + 12 * F],
    [140, (m ? 30 : 29) + 15 * F],
    [162, (m ? 22 : 24) + 22 * F],
    [182, (m ? 26 : 25) + 29 * F],
    [202, (m ? 33 : 28) + 22 * F],
    [224, (m ? 34 : 29) + 19 * F],
    [252, (m ? 28 : 25) + 15 * F],
    [290, 17 + 8 * F],
    [306, 15.5 + 6 * F],
    [332, 17 + 6 * F],
    [362, 11 + 3 * F],
    [380, 8.5 + 1.5 * F],
    [392, 15],
    [398, 14],
  ]
  const inner: [number, number][] = [
    [398, 3],
    [384, 5],
    [350, 3.5],
    [308, 5],
    [272, Math.max(1, 3.5 - 2.5 * F)],
    [242, Math.max(0.6, 3 - 3 * F)],
  ]
  const crotch = 228 + 4 * F
  const L: Pt[] = outer.map(([y, o]) => [C - o, y])
  const Li: Pt[] = inner.map(([y, o]) => [C - o, y])
  const R: Pt[] = [...outer].reverse().map(([y, o]) => [C + o, y])
  const Ri: Pt[] = [...inner].reverse().map(([y, o]) => [C + o, y])
  const outline = smooth([...L, ...Li, [C, crotch], ...Ri, ...R])

  const at = (y: number) => {
    for (let i = 0; i < outer.length - 1; i++) {
      const [y0, o0] = outer[i], [y1, o1] = outer[i + 1]
      if (y >= y0 && y <= y1) return lerp(o0, o1, (y - y0) / (y1 - y0))
    }
    return outer[outer.length - 1][1]
  }

  // Brazos: eje que se abre lo necesario para librar la panza y la cadera
  const sh = at(93)
  const wU = 8.5 + 6 * F, wE = 5.5 + 3.2 * F, wF = 6 + 3.8 * F, wW = 3.8 + 1.2 * F
  const elbow = Math.max(sh + 5, at(178) + wE + 1.5)
  const wrist = Math.max(elbow + 5, at(232) + wW + 3)
  const axis: [number, number, number][] = [
    [92, sh - 5, wU + 1],
    [110, lerp(sh - 5, elbow, 0.25), wU],
    [140, lerp(sh - 5, elbow, 0.62), wU - 1.2],
    [176, elbow, wE],
    [200, lerp(elbow, wrist, 0.38), wF],
    [238, wrist, wW],
    [252, wrist + 1.5, 5.6],
    [266, wrist + 1.8, 5],
    [276, wrist + 1, 2.5],
  ]
  const arm = (side: -1 | 1) => {
    const out: Pt[] = axis.map(([y, a, w]) => [C + side * (a + w), y])
    const inn: Pt[] = [...axis].reverse().map(([y, a, w]) => [C + side * (a - w), y])
    return smooth([...out, ...inn])
  }
  return { outline, armL: arm(-1), armR: arm(1), at, crotch }
}

export default function Avatar({
  fat,
  ghostFat,
  sex = 'h',
  lostKg = 0,
  width = 220,
  animate = true,
}: {
  fat: number
  ghostFat?: number
  sex?: Sex
  lostKg?: number
  width?: number
  animate?: boolean
}) {
  const F = Math.max(0, Math.min(1, fat))
  const b = body(F, sex)
  const g = ghostFat !== undefined && ghostFat - F > 0.03 ? body(ghostFat, sex) : null
  const m = sex === 'm'
  const lean = Math.max(0, (0.42 - F) / 0.42) // definición muscular
  const soft = F // pliegues y redondez
  const kg = Math.max(0, lostKg)
  // Montón de barro: crece con la raíz de los kilos (área ~ kg)
  const pileW = kg > 0.2 ? Math.min(60, 14 + Math.sqrt(kg) * 11) : 0
  const pileH = pileW * 0.42
  const pileX = 152
  const chips = Math.min(14, Math.round(kg * 1.1))
  const id = useId().replace(/:/g, '')

  return (
    <svg viewBox="0 0 200 410" width={width} height={width * 2.05} role="img" aria-label="Tu escultura">
      <defs>
        <linearGradient id={`clay-${id}`} gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="170" y2="0">
          <stop offset="0" stopColor="#7A3A22" />
          <stop offset=".22" stopColor="#B9603D" />
          <stop offset=".42" stopColor="#E89A72" />
          <stop offset=".58" stopColor="#D57E58" />
          <stop offset=".82" stopColor="#A4512F" />
          <stop offset="1" stopColor="#6A311C" />
        </linearGradient>
        <linearGradient id={`top-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD9C2" stopOpacity=".35" />
          <stop offset=".35" stopColor="#FFD9C2" stopOpacity="0" />
          <stop offset="1" stopColor="#2B120A" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id={`cloth-${id}`} gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="170" y2="0">
          <stop offset="0" stopColor="#15110F" />
          <stop offset=".45" stopColor="#3A302B" />
          <stop offset="1" stopColor="#120E0C" />
        </linearGradient>
        <radialGradient id={`spot-${id}`} cx=".5" cy=".42" r=".6">
          <stop offset="0" stopColor="#FF9A6B" stopOpacity=".22" />
          <stop offset=".6" stopColor="#FF7A50" stopOpacity=".05" />
          <stop offset="1" stopColor="#FF7A50" stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${id}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={`blur2-${id}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
        <clipPath id={`torso-${id}`}><path d={b.outline} /></clipPath>
      </defs>

      {/* luz de estudio y piso */}
      <ellipse cx="100" cy="190" rx="100" ry="200" fill={`url(#spot-${id})`} />
      <ellipse cx="100" cy="401" rx={lerp(38, 62, F)} ry="5" fill="#000" opacity=".45" filter={`url(#blur-${id})`} />

      {/* fantasma: tú el día uno */}
      {g && (
        <g fill="none" stroke="#F3EBE1" strokeOpacity=".28" strokeWidth="1.1" strokeDasharray="3 4">
          <path d={g.armL} />
          <path d={g.armR} />
          <path d={g.outline} />
        </g>
      )}

      {/* cabello largo (atrás) */}
      {m && <path d="M 78 36 C 76 66, 74 84, 80 96 L 120 96 C 126 84, 124 66, 122 36 Z" fill="#2A1A14" />}

      {/* brazos detrás del torso */}
      <path d={b.armL} fill={`url(#clay-${id})`} style={{ transition: 'd .7s ease' }} />
      <path d={b.armR} fill={`url(#clay-${id})`} style={{ transition: 'd .7s ease' }} />

      {/* torso + piernas */}
      <path d={b.outline} fill={`url(#clay-${id})`} style={{ transition: 'd .7s ease' }} />

      <g clipPath={`url(#torso-${id})`}>
        <rect x="0" y="0" width="200" height="410" fill={`url(#top-${id})`} />

        {/* clavículas */}
        <g opacity={0.25 + lean * 0.5} filter={`url(#blur-${id})`}>
          <path d="M 96 84 Q 84 82 70 88" stroke="#5A2716" strokeWidth="2.2" fill="none" />
          <path d="M 104 84 Q 116 82 130 88" stroke="#5A2716" strokeWidth="2.2" fill="none" />
        </g>
        <g opacity={0.3 + lean * 0.4}>
          <path d="M 96 82 Q 84 80 71 86" stroke="#FFD2B8" strokeWidth=".9" fill="none" />
          <path d="M 104 82 Q 116 80 129 86" stroke="#FFD2B8" strokeWidth=".9" fill="none" />
        </g>

        {/* pecho */}
        {!m ? (
          <g filter={`url(#blur-${id})`} opacity={0.35 + soft * 0.25}>
            <path d={`M ${100 - b.at(140) + 4} ${140 + soft * 6} Q ${84} ${150 + soft * 10} 99 ${142 + soft * 6}`} stroke="#4E2111" strokeWidth={2.5 + soft * 3} fill="none" />
            <path d={`M ${100 + b.at(140) - 4} ${140 + soft * 6} Q ${116} ${150 + soft * 10} 101 ${142 + soft * 6}`} stroke="#4E2111" strokeWidth={2.5 + soft * 3} fill="none" />
            <line x1="100" y1="108" x2="100" y2="140" stroke="#4E2111" strokeWidth={1.5} opacity={lean} />
          </g>
        ) : (
          <g>
            <g filter={`url(#blur-${id})`} opacity=".5">
              <ellipse cx="86" cy={142 + soft * 4} rx={11 + soft * 5} ry="4" fill="#4E2111" />
              <ellipse cx="114" cy={142 + soft * 4} rx={11 + soft * 5} ry="4" fill="#4E2111" />
            </g>
            {/* top deportivo */}
            <rect x="0" y="116" width="200" height={34 + soft * 5} fill={`url(#cloth-${id})`} />
            <path d="M 80 116 L 76 92 M 120 116 L 124 92" stroke="#2A221E" strokeWidth="4" />
          </g>
        )}

        {/* abdomen marcado (aparece al bajar grasa) */}
        {lean > 0 && (
          <g opacity={lean * 0.75} filter={`url(#blur-${id})`} stroke="#5A2716" fill="none">
            <line x1="100" y1={m ? 158 : 150} x2="100" y2="198" strokeWidth="1.6" />
            {(m ? [170, 184] : [162, 176, 190]).map((y) => (
              <g key={y}>
                <path d={`M 90 ${y} Q 95 ${y + 1.5} 99 ${y}`} strokeWidth="1.4" />
                <path d={`M 101 ${y} Q 105 ${y + 1.5} 110 ${y}`} strokeWidth="1.4" />
              </g>
            ))}
            <path d={`M ${100 - b.at(170) + 6} 168 Q ${100 - b.at(190) + 14} 192 92 206`} strokeWidth="2" />
            <path d={`M ${100 + b.at(170) - 6} 168 Q ${100 + b.at(190) - 14} 192 108 206`} strokeWidth="2" />
          </g>
        )}

        {/* panza: pliegue inferior y luz superior */}
        <g opacity={soft * 0.7}>
          <path d={`M ${100 - b.at(196) + 6} 196 Q 100 ${210 + soft * 6} ${100 + b.at(196) - 6} 196`} stroke="#3F1A0D" strokeWidth={3 + soft * 3} fill="none" filter={`url(#blur-${id})`} />
          <ellipse cx="94" cy="172" rx={14 + soft * 16} ry={10 + soft * 8} fill="#FFD9C2" opacity=".18" filter={`url(#blur2-${id})`} />
        </g>
        <ellipse cx="100" cy={186 + soft * 4} rx="1.4" ry={2 + soft} fill="#4A1E10" opacity=".8" />

        {/* short */}
        <rect x="0" y={204 + soft * 2} width="200" height={44 - soft * 2} fill={`url(#cloth-${id})`} />
        <path d={`M 100 ${b.crotch - 8} L 100 ${b.crotch}`} stroke="#000" strokeWidth="1" opacity=".5" />
        <rect x="0" y={204 + soft * 2} width="200" height="3" fill="#FF7A50" opacity=".85" />

        {/* rodillas y piernas */}
        <g opacity=".45" filter={`url(#blur-${id})`} stroke="#4E2111" fill="none" strokeWidth="1.6">
          <path d="M 80 300 Q 84 306 90 300" />
          <path d="M 110 300 Q 116 306 120 300" />
          <path d={`M ${100 - b.at(262) + 5} 262 Q ${100 - b.at(262) + 9} 284 ${88} 296`} opacity={lean} />
          <path d={`M ${100 + b.at(262) - 5} 262 Q ${100 + b.at(262) - 9} 284 ${112} 296`} opacity={lean} />
        </g>
      </g>

      {/* cabeza */}
      <g>
        <ellipse cx="100" cy="58" rx={7 + soft * 5} ry="5" fill="#5A2716" opacity={0.25 + soft * 0.35} filter={`url(#blur-${id})`} />
        <path
          d={`M 100 18 C ${114 + soft * 2} 18, ${117 + soft * 2} 30, ${116.5 + soft * 2} 40 C ${116 + soft * 3} 50, ${110 + soft * 3} ${59 + soft * 2}, 100 ${60 + soft * 2} C ${90 - soft * 3} ${59 + soft * 2}, ${84 - soft * 3} 50, ${83.5 - soft * 2} 40 C ${83 - soft * 2} 30, ${86 - soft * 2} 18, 100 18 Z`}
          fill={`url(#clay-${id})`}
        />
        <ellipse cx="96" cy="32" rx="9" ry="10" fill="#FFD9C2" opacity=".18" filter={`url(#blur-${id})`} />
        {/* orejas */}
        <ellipse cx={83.5 - soft * 2} cy="41" rx="2.4" ry="4.5" fill="#A4512F" />
        <ellipse cx={116.5 + soft * 2} cy="41" rx="2.4" ry="4.5" fill="#8E4528" />
        {/* cabello */}
        {m ? (
          <path d="M 83 38 C 80 20, 92 12, 102 13 C 114 14, 121 22, 117 38 C 114 28, 104 23, 92 26 C 88 28, 85 33, 83 38 Z" fill="#2A1A14" />
        ) : (
          <path d="M 84 34 C 82 20, 92 13, 101 13 C 112 13, 119 20, 116 34 C 114 27, 108 23, 100 24 C 92 24, 87 28, 84 34 Z" fill="#2A1A14" />
        )}
        {/* rostro sereno, como escultura */}
        <g stroke="#3F1A0D" strokeLinecap="round" fill="none">
          <path d="M 89 36 Q 93 34.5 96 36" strokeWidth="1.4" />
          <path d="M 104 36 Q 107 34.5 111 36" strokeWidth="1.4" />
          <path d="M 90 41 Q 93 42.6 96 41" strokeWidth="1.3" />
          <path d="M 104 41 Q 107 42.6 110 41" strokeWidth="1.3" />
          <path d="M 100 41 Q 98.5 47 99 48.5 Q 100 49.4 101.5 48.6" strokeWidth="1" opacity=".7" />
          <path d={`M 95.5 ${53.5 + soft} Q 100 ${55.5 + soft} 104.5 ${53.5 + soft}`} strokeWidth="1.3" />
        </g>
        <ellipse cx={91 - soft * 2} cy="47" rx="3.5" ry="2.2" fill="#FF8D66" opacity=".35" />
        <ellipse cx={109 + soft * 2} cy="47" rx="3.5" ry="2.2" fill="#FF8D66" opacity=".35" />
      </g>

      {/* montón de barro: la grasa que ya quitaste */}
      {pileW > 0 && (
        <g>
          <path
            d={`M ${pileX - pileW / 2} 399 C ${pileX - pileW / 3} ${399 - pileH}, ${pileX + pileW / 4} ${399 - pileH * 1.15}, ${pileX + pileW / 2} 399 Z`}
            fill={`url(#clay-${id})`}
          />
          <path d={`M ${pileX - pileW / 4} ${399 - pileH * 0.55} Q ${pileX} ${399 - pileH * 0.95} ${pileX + pileW / 5} ${399 - pileH * 0.6}`} stroke="#FFD2B8" strokeOpacity=".35" strokeWidth="1" fill="none" />
          {Array.from({ length: chips }).map((_, i) => {
            const t = (i * 0.618) % 1
            const x = pileX - pileW / 2 + 4 + t * (pileW - 8)
            const hAt = pileH * Math.sin(Math.PI * t) * 0.9
            const y = 399 - hAt * ((i * 0.37) % 1) - 1
            const s = 1.4 + (i % 3) * 0.8
            return <path key={i} d={`M ${x} ${y} l ${s} ${-s * 1.2} l ${s * 1.3} ${s * 0.4} l ${-s * 0.4} ${s * 1.1} Z`} fill={i % 2 ? '#C86A45' : '#9E4D2D'} />
          })}
        </g>
      )}

      {/* pedacitos cayendo del cuerpo al montón */}
      {animate && kg > 0.2 &&
        [0, 1, 2].map((i) => {
          const sx = 100 + b.at(176 + i * 12) - 4
          return (
            <path
              key={i}
              className="chip-fall"
              d={`M ${sx} ${176 + i * 12} l 2 -2.4 l 2.6 .8 l -.8 2.2 Z`}
              fill="#C86A45"
              style={{ ['--tx' as string]: `${pileX - sx - 4 + i * 5}px`, ['--ty' as string]: `${399 - pileH - (176 + i * 12)}px`, animationDelay: `${i * 1.3}s` }}
            />
          )
        })}
    </svg>
  )
}
