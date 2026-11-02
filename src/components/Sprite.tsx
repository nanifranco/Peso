import { useEffect, useState } from 'react'
import type { Sex } from '../lib/types'

/**
 * Avatar en pixel art, generado por código.
 * El ancho de cada fila sale de tu % de grasa y se redondea a pixeles, así que
 * el sprite "salta" de versión cuando cruzas un rango, como en los juegos viejitos.
 */

export const COLS = 28
export const ROWS = 42
const C = 14 // columna central

type Cell = string | null
type Grid = Cell[][]

const P = {
  out: '#0b0b1a',
  skin: '#ffc89a',
  skinD: '#e89a6c',
  hair: '#3a2416',
  shirt: '#00e5ff',
  shirtD: '#00a7c2',
  shorts: '#ff3fa4',
  shortsD: '#c42a7c',
  shoe: '#f4f4ff',
  shoeD: '#9a9ac4',
  eye: '#0b0b1a',
  blush: '#ff8a8a',
  band: '#ff3b3b',
  gold: '#ffe600',
  goldD: '#c9a800',
  cape: '#7a2cff',
  capeD: '#4f1bb0',
}

export interface PowerUps {
  headband?: boolean
  wrist?: boolean
  shoes?: boolean
  cape?: boolean
  crown?: boolean
}

function build(F: number, sex: Sex, pu: PowerUps): Grid {
  const g: Grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) g[y][x] = c
  }
  const span = (y: number, x0: number, x1: number, c: string) => {
    for (let x = x0; x <= x1; x++) set(x, y, c)
  }
  const w = sex === 'm'

  // --- capa (detrás de todo) ---
  if (pu.cape) {
    for (let y = 11; y <= 34; y++) {
      const h = 6 + Math.round(F * 4) + Math.floor((y - 11) / 5)
      span(y, C - h, C + h - 1, y % 2 ? P.cape : P.capeD)
    }
  }

  // --- torso (filas 11..26) ---
  const torsoTop = 11, torsoBot = 26
  const half: number[] = []
  for (let y = torsoTop; y <= torsoBot; y++) {
    const t = (y - torsoTop) / (torsoBot - torsoTop)
    let base = t < 0.15 ? 5 : t < 0.35 ? 4.6 : 4.1
    if (w) base += t < 0.3 ? -0.4 : t > 0.75 ? 0.9 : -0.3
    const belly = F * (1.2 + 4.6 * Math.exp(-(((t - 0.66) / 0.24) ** 2)))
    const chest = w ? F * 0.8 * Math.exp(-(((t - 0.25) / 0.12) ** 2)) : 0
    half.push(Math.round(base + belly + chest))
  }
  const maxHalf = Math.max(...half)

  // --- brazos ---
  const armW = F > 0.55 ? 3 : 2
  for (let y = 12; y <= 25; y++) {
    const i = y - torsoTop
    const t = Math.min(1, (y - 12) / 6)
    const reach = Math.max(half[i], Math.round(half[1] + (maxHalf - half[1]) * t))
    const xL = C - reach - armW, xR = C + reach
    const isHand = y >= 24
    const col = isHand ? P.skin : y <= 13 ? P.shirt : P.skin
    span(y, xL, xL + armW - 1, col)
    span(y, xR, xR + armW - 1, y <= 13 ? P.shirtD : isHand ? P.skin : P.skinD)
    if (pu.wrist && (y === 22 || y === 23)) {
      span(y, xL, xL + armW - 1, P.band)
      span(y, xR, xR + armW - 1, P.band)
    }
  }

  // torso con playera / top
  half.forEach((h, i) => {
    const y = torsoTop + i
    const top = w ? i <= 6 : true
    for (let x = C - h; x <= C + h - 1; x++) {
      const right = x >= C + h - 2
      if (top) set(x, y, right ? P.shirtD : P.shirt)
      else set(x, y, right ? P.skinD : P.skin)
    }
  })
  // ombligo / panza
  if (w || F > 0.5) {
    set(C, torsoTop + 11, w ? P.skinD : P.shirtD)
  }
  if (F > 0.6) span(torsoTop + 14, C - half[14] + 2, C + half[14] - 3, P.shirtD) // pliegue

  // --- short (filas 27..30) ---
  const hip = half[half.length - 1] + (w ? 1 : 0)
  for (let y = 27; y <= 30; y++) {
    span(y, C - hip, C + hip - 1, P.shorts)
    set(C + hip - 1, y, P.shortsD)
  }
  set(C - 1, 30, P.shortsD)
  set(C, 30, P.shortsD)

  // --- piernas (31..38) ---
  const legW = 3 + Math.round(F * 2.4)
  const gap = F > 0.62 ? 0 : 1
  for (let y = 31; y <= 38; y++) {
    const narrow = y >= 35 ? 1 : 0
    const lw = legW - narrow
    span(y, C - gap - lw, C - gap - 1, P.skin)
    span(y, C + gap, C + gap + lw - 1, P.skin)
    set(C + gap + lw - 1, y, P.skinD)
  }
  // --- tenis (39..40) ---
  const sc = pu.shoes ? P.gold : P.shoe
  const sd = pu.shoes ? P.goldD : P.shoeD
  for (let y = 39; y <= 40; y++) {
    span(y, C - gap - legW - 1, C - gap - 1, y === 40 ? sd : sc)
    span(y, C + gap, C + gap + legW, y === 40 ? sd : sc)
  }

  // --- cabeza (0..10) ---
  const jaw = F > 0.7 ? 1 : 0
  const headRows = [3, 4, 5, 5, 5, 5, 5, 5, 4 + jaw, 3 + jaw]
  headRows.forEach((h, i) => span(i + 1, C - h, C + h - 1, P.skin))
  for (let i = 1; i <= 10; i++) set(C + headRows[i - 1] - 1, i, P.skinD)
  set(C - 1, 11, P.skin) // cuello
  set(C, 11, P.skinD)
  // cabello
  span(0, C - 3, C + 2, P.hair)
  span(1, C - 4, C + 3, P.hair)
  span(2, C - 5, C + 4, P.hair)
  set(C - 5, 3, P.hair)
  set(C + 4, 3, P.hair)
  if (w) for (let y = 3; y <= 11; y++) { set(C - 6, y, P.hair); set(C + 5, y, P.hair); if (y < 9) { set(C - 5, y, P.hair); set(C + 4, y, P.hair) } }
  if (pu.headband) span(3, C - 5, C + 4, P.band)
  // cara
  set(C - 3, 5, P.eye); set(C - 3, 6, P.eye)
  set(C + 2, 5, P.eye); set(C + 2, 6, P.eye)
  set(C - 4, 7, P.blush); set(C + 3, 7, P.blush)
  span(8, C - 2, C + 1, P.out)
  set(C - 3, 7, P.out); set(C + 2, 7, P.out)
  // corona
  if (pu.crown) span(0, C - 3, C + 2, P.gold)

  // --- contorno negro: cualquier celda vacía junto a una pintada ---
  const out: Grid = g.map((r) => [...r])
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (g[y][x]) continue
      const n = [g[y - 1]?.[x], g[y + 1]?.[x], g[y]?.[x - 1], g[y]?.[x + 1]]
      if (n.some((c) => c && c !== P.cape && c !== P.capeD)) out[y][x] = P.out
    }
  return out
}

/** Silueta del "fantasma": solo el borde, para mostrar cómo empezaste */
function ghostCells(F: number, sex: Sex) {
  const g = build(F, sex, {})
  const cells: [number, number][] = []
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y][x] === P.out) cells.push([x, y])
  return cells
}

export default function Sprite({
  fat,
  ghostFat,
  sex = 'h',
  power = {},
  px = 7,
  bob = true,
}: {
  fat: number
  ghostFat?: number
  sex?: Sex
  power?: PowerUps
  px?: number
  bob?: boolean
}) {
  const F = Math.max(0, Math.min(1, fat))
  const grid = build(F, sex, power)
  const ghost = ghostFat !== undefined && ghostFat - F > 0.04 ? ghostCells(ghostFat, sex) : []
  // Cuando cambia la "versión" del sprite, parpadea como transformación
  const sig = grid.map((r) => r.filter(Boolean).length).join(',')
  const [flick, setFlick] = useState(0)
  useEffect(() => setFlick((f) => f + 1), [sig])

  return (
    <svg className="pixel" viewBox={`0 -1 ${COLS} ${ROWS + 1}`} width={COLS * px} height={(ROWS + 1) * px} role="img" aria-label="Tu personaje">
      {ghost.map(([x, y]) => (
        <rect key={`g${x}-${y}`} x={x} y={y} width="1" height="1" fill="#2a2aff" opacity={(x + y) % 2 ? 0.75 : 0.35} />
      ))}
      <g key={flick} className={`${flick > 1 ? 'flicker' : ''}`}>
        <g className={bob ? 'bob' : ''} style={{ transformBox: 'fill-box' }}>
          {power.crown && [C - 3, C - 1, C, C + 2].map((x) => <rect key={`c${x}`} x={x} y={-1} width="1" height="1" fill="#ffe600" />)}
          {grid.flatMap((row, y) =>
            row.map((c, x) => (c ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={c} /> : null)),
          )}
        </g>
      </g>
    </svg>
  )
}
