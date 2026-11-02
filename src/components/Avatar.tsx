import { useId } from 'react'
import type { Sex } from '../lib/types'

/**
 * Avatar con proporciones reales, estilo ilustración plana.
 * `fat` va de 0 (definido) a 1 (mucha grasa) y sale de tu % de grasa (estimado o del InBody),
 * así que la silueta se parece a tu composición, no a una barra de progreso.
 * `ghostFat` dibuja con línea punteada cómo eras el día uno.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
type Pt = [number, number]

/** Catmull-Rom → curvas Bézier suaves (como un spline en CAD) */
function smooth(pts: Pt[]) {
  const n = pts.length
  const get = (i: number) => pts[(i + n) % n]
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2)
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + ' Z'
}

function body(F: number, sex: Sex) {
  const w = sex === 'm'
  const C = 100
  // [y, distancia al centro]: contorno exterior del lado izquierdo, de cuello a pies
  const outer: [number, number][] = [
    [60, 7 + 3.5 * F],
    [76, 11 + 6 * F],
    [84, (w ? 22 : 25) + 5 * F],
    [93, (w ? 29 : 35) + 6 * F],
    [106, (w ? 30 : 35) + 8 * F],
    [122, (w ? 27 : 29) + 12 * F],
    [140, (w ? 26 : 28) + 15 * F],
    [162, (w ? 22 : 24) + 22 * F],
    [182, (w ? 26 : 25) + 29 * F],
    [202, (w ? 33 : 28) + 22 * F],
    [224, (w ? 34 : 29) + 19 * F],
    [252, (w ? 28 : 26) + 15 * F],
    [290, 17 + 8 * F],
    [306, 15.5 + 6 * F],
    [332, 17 + 6 * F],
    [362, 11 + 3 * F],
    [380, 9 + 1.5 * F],
    [392, 15],
    [399, 15],
  ]
  const inner: [number, number][] = [
    [399, 3],
    [384, 4.5],
    [350, 3.5],
    [308, 4.5],
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

  // Brazos: el eje se abre lo justo para librar panza y cadera
  const sh = at(93)
  const wU = 8 + 6 * F, wE = 5.5 + 3.2 * F, wF = 5.8 + 3.8 * F, wW = 3.8 + 1.2 * F
  const elbow = Math.max(sh + 4, at(178) + wE + 1.5)
  const wrist = Math.max(elbow + 4, at(232) + wW + 3)
  const axis: [number, number, number][] = [
    [90, sh - 6, wU + 1.5],
    [110, lerp(sh - 5, elbow, 0.25), wU],
    [140, lerp(sh - 5, elbow, 0.62), wU - 1.2],
    [176, elbow, wE],
    [200, lerp(elbow, wrist, 0.38), wF],
    [238, wrist, wW],
    [252, wrist + 1.5, 5.4],
    [266, wrist + 1.8, 4.8],
    [276, wrist + 1, 2.5],
  ]
  const arm = (side: -1 | 1) => {
    const out: Pt[] = axis.map(([y, a, ww]) => [C + side * (a + ww), y])
    const inn: Pt[] = [...axis].reverse().map(([y, a, ww]) => [C + side * (a - ww), y])
    return smooth([...out, ...inn])
  }
  return { outline, armL: arm(-1), armR: arm(1), at, crotch }
}

const SKIN = '#E7A57E'
const SKIN_SH = '#CC845D'
const HAIR = '#2B1D16'
const TEE = '#FF6B4A'
const SHORTS = '#2A1F1A'

export default function Avatar({ fat, ghostFat, sex = 'h', width = 160 }: { fat: number; ghostFat?: number; sex?: Sex; width?: number }) {
  const F = Math.max(0, Math.min(1, fat))
  const b = body(F, sex)
  const g = ghostFat !== undefined && ghostFat - F > 0.03 ? body(Math.min(1, ghostFat), sex) : null
  const w = sex === 'm'
  const id = useId().replace(/:/g, '')
  const teeEnd = 204 + F * 3
  const anim = { transition: 'd .8s cubic-bezier(.3,.8,.3,1)' }

  return (
    <svg viewBox="0 0 200 410" width={width} height={width * 2.05} role="img" aria-label="Tu avatar">
      <defs>
        <clipPath id={`b-${id}`}><path d={b.outline} style={anim} /></clipPath>
        <clipPath id={`a-${id}`}><path d={b.armL} style={anim} /><path d={b.armR} style={anim} /></clipPath>
        <linearGradient id={`fl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* piso */}
      <ellipse cx="100" cy="401" rx={lerp(36, 60, F)} ry="5" fill="#2A1F1A" opacity=".1" />

      {/* tú el día uno */}
      {g && (
        <g fill="none" stroke="#2A1F1A" strokeOpacity=".28" strokeWidth="1.3" strokeDasharray="3 4">
          <path d={g.armL} />
          <path d={g.armR} />
          <path d={g.outline} />
        </g>
      )}

      {/* cabello largo (atrás) */}
      {w && <path d="M 81 30 C 77 60, 80 86, 86 100 Q 100 106 114 100 C 120 86, 123 60, 119 30 Z" fill={HAIR} />}

      {/* brazos */}
      <g>
        <path d={b.armL} fill={SKIN} style={anim} />
        <path d={b.armR} fill={SKIN_SH} style={anim} />
        <g clipPath={`url(#a-${id})`}>
          <rect x="0" y="80" width="100" height="50" fill={TEE} />
          <rect x="100" y="80" width="100" height="50" fill="#E2512F" />
          <rect x="0" y="128" width="200" height="2.5" fill="#000" opacity=".08" />
        </g>
      </g>

      {/* cuerpo */}
      <path d={b.outline} fill={SKIN} style={anim} />
      <g clipPath={`url(#b-${id})`}>
        {/* sombra plana del lado derecho: luz desde la izquierda */}
        <rect x={100 + 6} y="0" width="100" height="410" fill={SKIN_SH} opacity=".55" />
        {/* playera */}
        <path d={`M 0 82 L 86 82 Q 100 ${96} 114 82 L 200 82 L 200 ${teeEnd} L 0 ${teeEnd} Z`} fill={TEE} />
        <path d={`M ${100 + 8} 82 L 200 82 L 200 ${teeEnd} L ${100 + 8} ${teeEnd} Z`} fill="#000" opacity=".1" />
        <path d={`M 86 82 Q 100 96 114 82`} stroke="#E2512F" strokeWidth="2.4" fill="none" />
        {/* pliegue suave de la playera sobre la panza */}
        <path d={`M ${100 - b.at(185) + 8} ${186 + F * 4} Q 100 ${192 + F * 10} ${100 + b.at(185) - 8} ${186 + F * 4}`} stroke="#000" strokeOpacity={0.05 + F * 0.1} strokeWidth="2" fill="none" />
        {/* short */}
        <rect x="0" y={teeEnd} width="200" height={258 - teeEnd} fill={SHORTS} />
        <rect x="100" y={teeEnd} width="100" height={258 - teeEnd} fill="#000" opacity=".25" />
        <rect x="0" y={teeEnd} width="200" height="4" fill="#3B2E27" />
        {/* tenis */}
        <rect x="0" y="386" width="200" height="14" fill="#F4EEE6" />
        <rect x="0" y="396" width="200" height="4" fill="#C9BFB3" />
        <rect x="0" y="0" width="200" height="410" fill={`url(#fl-${id})`} />
      </g>

      {/* cabeza */}
      <ellipse cx="100" cy="62" rx="9" ry="3.2" fill={SKIN_SH} opacity=".7" />
      <path d="M 100 17 C 115 17, 118 30, 117.5 40 C 117 51, 110 60, 100 61 C 90 60, 83 51, 82.5 40 C 82 30, 85 17, 100 17 Z" fill={SKIN} />
      <path d="M 100 17 C 115 17, 118 30, 117.5 40 C 117 51, 110 60, 100 61 Z" fill={SKIN_SH} opacity=".45" />
      <ellipse cx="82.5" cy="41" rx="2.6" ry="4.6" fill={SKIN} />
      <ellipse cx="117.5" cy="41" rx="2.6" ry="4.6" fill={SKIN_SH} />
      {w ? (
        <path d="M 82 40 C 79 20, 91 12, 101 12 C 113 12, 122 21, 118 40 C 116 30, 110 24, 103 24 C 96 26, 88 30, 82 40 Z" fill={HAIR} />
      ) : (
        <path d="M 83 36 C 80 19, 92 12, 102 12.5 C 114 13, 121 21, 117 36 C 115 28, 109 24.5, 100 25.5 C 93 25.5, 87 29, 83 36 Z" fill={HAIR} />
      )}
    </svg>
  )
}
