import { useId } from 'react'
import type { Sex } from '../lib/types'

/**
 * Figurita genérica de cuerpo de mujer (silueta).
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

export default function Avatar({ fat, ghostFat, width = 160 }: { fat: number; ghostFat?: number; sex?: Sex; width?: number }) {
  const F = Math.max(0, Math.min(1, fat))
  const b = body(F, 'm')
  const g = ghostFat !== undefined && ghostFat - F > 0.03 ? body(Math.min(1, ghostFat), 'm') : null
  const id = useId().replace(/:/g, '')
  const anim = { transition: 'd .8s cubic-bezier(.3,.8,.3,1)' }
  const fill = `url(#g-${id})`

  return (
    <svg viewBox="0 0 200 410" width={width} height={width * 2.05} role="img" aria-label="Tu figura">
      <defs>
        <linearGradient id={`g-${id}`} gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="160" y2="410">
          <stop offset="0" stopColor="#FF8A66" />
          <stop offset="1" stopColor="#F0533A" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="402" rx={lerp(34, 56, F)} ry="5" fill="#2A1F1A" opacity=".1" />

      {/* así eras el día uno */}
      {g && (
        <g fill="none" stroke="#2A1F1A" strokeOpacity=".3" strokeWidth="1.4" strokeDasharray="3 4">
          <path d={g.armL} />
          <path d={g.armR} />
          <path d={g.outline} />
        </g>
      )}

      <g className="breathe">
        <path d={b.armL} fill={fill} style={anim} />
        <path d={b.armR} fill={fill} style={anim} />
        <path d={b.outline} fill={fill} style={anim} />
        {/* cabeza con chongo */}
        <circle cx="100" cy="14" r="9" fill={fill} />
        <ellipse cx="100" cy="39" rx="17" ry="21" fill={fill} />
      </g>
    </svg>
  )
}
