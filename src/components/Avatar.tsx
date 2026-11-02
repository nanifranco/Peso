import { useId } from 'react'
import type { Sex } from '../lib/types'

/**
 * Personajita: niña güera estilo chibi (cabeza grande, cuerpo chiquito).
 * `fat` va de 0 (delgadita) a 1 (gordita) y sale de tu % de grasa (InBody o estimado).
 * El cuerpo se "desinfla" conforme avanzas; `ghostFat` dibuja con línea punteada cómo era el día uno.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
type Pt = [number, number]

/** Catmull-Rom cerrado → Bézier suaves (como un spline en CAD) */
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

function shape(F: number) {
  const C = 100
  const ws = lerp(20, 27, F) // hombros
  const wb = lerp(19, 50, F) // panza
  const wh = lerp(22, 40, F) // cadera
  const side: [number, number][] = [
    [144, ws - 6],
    [152, ws],
    [172, lerp(ws, wb, 0.6)],
    [194, wb],
    [216, wh],
    [234, wh - 3],
  ]
  const L: Pt[] = side.map(([y, o]) => [C - o, y])
  const R: Pt[] = [...side].reverse().map(([y, o]) => [C + o, y])
  const torso = smooth([...L, [C - wh + 8, 240], [C + wh - 8, 240], ...R])
  const leg = lerp(13, 22, F)
  const legX = lerp(10, 17, F)
  const arm = lerp(10, 15, F)
  const handX = wb * 0.62 + 20
  return { torso, ws, wb, wh, leg, legX, arm, handX }
}

const SKIN = '#FFDCC6'
const SKIN_SH = '#F6BFA0'
const HAIR = '#F7CE5B'
const HAIR_SH = '#E3A93A'
const HAIR_HI = '#FFE89A'
const TEE = '#FF6B4A'
const TEE_SH = '#E8553A'
const SHORTS = '#3B4A8C'
const BOW = '#FF8FB1'

export default function Avatar({ fat, ghostFat, width = 160 }: { fat: number; ghostFat?: number; sex?: Sex; width?: number }) {
  const F = Math.max(0, Math.min(1, fat))
  const s = shape(F)
  const g = ghostFat !== undefined && ghostFat - F > 0.03 ? shape(Math.min(1, ghostFat)) : null
  const id = useId().replace(/:/g, '')
  const anim = { transition: 'all .8s cubic-bezier(.3,.8,.3,1)' }

  return (
    <svg viewBox="0 0 200 290" width={width} height={width * 1.45} role="img" aria-label="Tu personajita">
      <defs>
        <clipPath id={`t-${id}`}><path d={s.torso} style={anim} /></clipPath>
      </defs>

      {/* piso */}
      <ellipse cx="100" cy="280" rx={lerp(34, 52, F)} ry="5" fill="#2A1F1A" opacity=".1" />

      {/* así era el día uno */}
      {g && (
        <g fill="none" stroke="#2A1F1A" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="3 4">
          <path d={g.torso} />
          <rect x={100 - g.legX - g.leg / 2} y="232" width={g.leg} height="40" rx={g.leg / 2} />
          <rect x={100 + g.legX - g.leg / 2} y="232" width={g.leg} height="40" rx={g.leg / 2} />
        </g>
      )}

      <g className="breathe">
        {/* coletas (atrás) */}
        <g className="sway-l">
          <path d="M 52 70 C 26 78, 22 118, 30 146 C 34 160, 46 166, 50 152 C 44 128, 52 100, 62 84 Z" fill={HAIR} />
          <path d="M 40 100 C 34 118, 36 138, 42 150" stroke={HAIR_SH} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        <g className="sway-r">
          <path d="M 148 70 C 174 78, 178 118, 170 146 C 166 160, 154 166, 150 152 C 156 128, 148 100, 138 84 Z" fill={HAIR} />
          <path d="M 160 100 C 166 118, 164 138, 158 150" stroke={HAIR_SH} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        {/* cabello de atrás */}
        <path d="M 50 92 C 46 40, 78 22, 100 22 C 122 22, 154 40, 150 92 C 150 108, 146 120, 138 126 Q 100 140 62 126 C 54 120, 50 108, 50 92 Z" fill={HAIR_SH} />

        {/* piernas y tenis */}
        <rect x={100 - s.legX - s.leg / 2} y="226" width={s.leg} height="46" rx={s.leg / 2} fill={SKIN} style={anim} />
        <rect x={100 + s.legX - s.leg / 2} y="226" width={s.leg} height="46" rx={s.leg / 2} fill={SKIN_SH} style={anim} />
        <ellipse cx={100 - s.legX - 1} cy="273" rx={s.leg / 2 + 5} ry="6.5" fill="#fff" stroke="#E6DCD0" strokeWidth="1.5" style={anim} />
        <ellipse cx={100 + s.legX + 1} cy="273" rx={s.leg / 2 + 5} ry="6.5" fill="#fff" stroke="#E6DCD0" strokeWidth="1.5" style={anim} />

        {/* bracitos */}
        <line x1={100 - s.ws + 4} y1="156" x2={100 - s.handX} y2="206" stroke={SKIN} strokeWidth={s.arm} strokeLinecap="round" style={anim} />
        <line x1={100 + s.ws - 4} y1="156" x2={100 + s.handX} y2="206" stroke={SKIN_SH} strokeWidth={s.arm} strokeLinecap="round" style={anim} />
        <line x1={100 - s.ws + 4} y1="154" x2={100 - s.ws - 3} y2="168" stroke={TEE} strokeWidth={s.arm + 4} strokeLinecap="round" style={anim} />
        <line x1={100 + s.ws - 4} y1="154" x2={100 + s.ws + 3} y2="168" stroke={TEE_SH} strokeWidth={s.arm + 4} strokeLinecap="round" style={anim} />

        {/* cuerpo: playera + short */}
        <path d={s.torso} fill={TEE} style={anim} />
        <g clipPath={`url(#t-${id})`}>
          <rect x="106" y="130" width="80" height="120" fill={TEE_SH} />
          <rect x="0" y="214" width="200" height="40" fill={SHORTS} />
          <rect x="106" y="214" width="80" height="40" fill="#000" opacity=".15" />
          <path d={`M ${100 - s.wb + 10} 200 Q 100 ${206 + F * 8} ${100 + s.wb - 10} 200`} stroke="#000" strokeOpacity={0.04 + F * 0.08} strokeWidth="2" fill="none" />
          {/* corazoncito en la playera */}
          <path d="M 100 186 C 92 180, 92 172, 97 172 C 99 172, 100 174, 100 175 C 100 174, 101 172, 103 172 C 108 172, 108 180, 100 186 Z" fill="#fff" opacity=".9" />
        </g>

        {/* cabeza */}
        <ellipse cx="100" cy="142" rx="14" ry="5" fill={SKIN_SH} />
        <ellipse cx="100" cy="92" rx="46" ry="44" fill={SKIN} />
        <ellipse cx="54" cy="96" rx="6" ry="8" fill={SKIN_SH} />
        <ellipse cx="146" cy="96" rx="6" ry="8" fill={SKIN_SH} />

        {/* carita */}
        <g className="blink">
          <ellipse cx="81" cy="101" rx="7" ry="9" fill="#3A2A22" />
          <ellipse cx="119" cy="101" rx="7" ry="9" fill="#3A2A22" />
          <circle cx="83.5" cy="97.5" r="2.8" fill="#fff" />
          <circle cx="121.5" cy="97.5" r="2.8" fill="#fff" />
          <circle cx="79" cy="105" r="1.3" fill="#fff" opacity=".8" />
          <circle cx="117" cy="105" r="1.3" fill="#fff" opacity=".8" />
        </g>
        <path d="M 72 88 Q 80 84 88 87" stroke={HAIR_SH} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M 112 87 Q 120 84 128 88" stroke={HAIR_SH} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <ellipse cx="70" cy="115" rx="8" ry="5" fill="#FF9AA8" opacity=".55" />
        <ellipse cx="130" cy="115" rx="8" ry="5" fill="#FF9AA8" opacity=".55" />
        <path d={`M 93 ${117} Q 100 ${123 + (1 - F) * 2} 107 ${117}`} stroke="#3A2A22" strokeWidth="2.6" fill={(1 - F) > 0.5 ? '#E8556A' : 'none'} strokeLinecap="round" strokeLinejoin="round" />

        {/* fleco */}
        <path d="M 52 96 C 46 50, 76 34, 100 34 C 126 34, 156 50, 148 96 C 142 82, 138 74, 132 68 C 128 80, 118 84, 108 78 C 106 72, 104 68, 103 64 C 96 76, 84 82, 72 80 C 66 84, 58 88, 52 96 Z" fill={HAIR} />
        <path d="M 80 44 C 92 38, 110 38, 122 44" stroke={HAIR_HI} strokeWidth="4" fill="none" strokeLinecap="round" opacity=".9" />
        <path d="M 103 64 C 104 56, 108 50, 114 46" stroke={HAIR_SH} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6" />

        {/* moñitos */}
        {[56, 144].map((x, i) => (
          <g key={x} transform={`translate(${x} 66) rotate(${i ? 18 : -18})`}>
            <path d="M 0 0 C -10 -12, -20 -6, -18 4 C -16 12, -6 8, 0 0 Z" fill={BOW} />
            <path d="M 0 0 C 10 -12, 20 -6, 18 4 C 16 12, 6 8, 0 0 Z" fill={BOW} />
            <circle r="4.5" fill="#FF6F97" />
          </g>
        ))}
      </g>
    </svg>
  )
}
