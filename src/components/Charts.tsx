import { useId, useState, type PointerEvent } from 'react'
import type { InBody } from '../lib/types'
import { daysBetween, fmt, sortByDate } from '../lib/calc'

const INK = '#12302C'
const MUTE = '#6B837D'
const GRID = '#D3E1DC'
const CORAL = '#E8793A' // grasa
const ACCENT = '#14524B'
const MINT = '#6FB8A9'
const BLUE = '#3C9A93'
const GREEN = '#3BAA7E'
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const short = (s: string) => {
  const d = new Date(s + 'T12:00:00')
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
const addDaysISO = (s: string, n: number) => {
  const d = new Date(s + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return iso(d)
}

/* ------------------------------------------------------------------ */
/* Anillo de progreso con "tanque" de líquido adentro                  */
/* ------------------------------------------------------------------ */
/** remaining: kg que faltan · label: debajo del número · caption: línea de abajo (avance) */
export function ProgressRing({ pct, remaining, label, caption, size = 200 }: { pct: number; remaining: number; label: string; caption: string; size?: number }) {
  const id = useId().replace(/:/g, '')
  const p = Math.max(0, Math.min(1, pct))
  const R = 84, C = 2 * Math.PI * R
  const inner = 68
  const level = 100 + inner - p * inner * 2 // y del nivel del líquido
  const wave = (y: number, amp: number) =>
    `M -300 ${y} ${Array.from({ length: 16 }).map((_, i) => `q 20 ${i % 2 ? amp : -amp} 40 0`).join(' ')} V 260 H -300 Z`
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${Math.round(p * 100)}% ${caption}`}>
      <defs>
        <linearGradient id={`rg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={MINT} />
          <stop offset="1" stopColor={ACCENT} />
        </linearGradient>
        <clipPath id={`in-${id}`}><circle cx="100" cy="100" r={inner} /></clipPath>
      </defs>
      <circle cx="100" cy="100" r={R} fill="none" stroke={GRID} strokeWidth="14" />
      <circle
        cx="100" cy="100" r={R} fill="none" stroke={`url(#rg-${id})`} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${C * Math.max(0.005, p)} ${C}`} transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(.3,.8,.3,1)' }}
      />
      <circle cx="100" cy="100" r={inner} fill="#F2F7F5" />
      <g clipPath={`url(#in-${id})`}>
        <g style={{ transform: `translateY(${level - 100}px)`, transition: 'transform 1s cubic-bezier(.3,.8,.3,1)' }}>
          <path className="wave-a" d={wave(100, 5)} fill={MINT} opacity=".35" />
          <path className="wave-b" d={wave(103, 4)} fill={ACCENT} opacity=".28" />
        </g>
      </g>
      {remaining > 0.05 ? (
        <>
          <text x="100" y="70" textAnchor="middle" fontSize="11" fontWeight="600" fill={MUTE}>faltan</text>
          <text x="100" y="104" textAnchor="middle" fontSize="40" fontWeight="800" fill={INK} className="font-display">{fmt(remaining)}</text>
        </>
      ) : (
        <text x="100" y="104" textAnchor="middle" fontSize="34" fontWeight="800" fill={INK} className="font-display">¡Llegaste!</text>
      )}
      <text x="100" y="122" textAnchor="middle" fontSize="11" fontWeight="600" fill={MUTE}>{label}</text>
      <text x="100" y="140" textAnchor="middle" fontSize="11" fontWeight="700" fill={ACCENT}>{caption}</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Peso: puntos reales, línea de tendencia, meta y proyección          */
/* ------------------------------------------------------------------ */
interface WP { date: string; kg: number; trend: number }

export function WeightChart({ data, goal, rate, inbodyDates = [], height = 190, compact = false }: {
  data: WP[]; goal?: number; rate?: number; inbodyDates?: string[]; height?: number; compact?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')
  if (data.length < 2) return <p className="py-8 text-center text-sm text-mute">Anota otro peso para ver tu gráfica.</p>
  const W = 340, H = height, pl = compact ? 6 : 30, pr = compact ? 6 : 10, pt = 14, pb = compact ? 8 : 22
  const d0 = data[0].date
  const last = data[data.length - 1]
  // Proyección hasta la meta (o 8 semanas) si vas bajando
  let proj: { date: string; kg: number } | undefined
  if (!compact && rate !== undefined && rate < -0.02) {
    const target = goal && goal < last.kg ? goal : last.kg + rate * 8
    const weeks = Math.min(52, (target - last.kg) / rate)
    proj = { date: addDaysISO(last.date, Math.round(weeks * 7)), kg: last.kg + rate * weeks }
  }
  const endDate = proj?.date ?? last.date
  const span = Math.max(1, daysBetween(d0, endDate))
  const vals = data.flatMap((d) => [d.kg, d.trend]).concat(proj ? [proj.kg] : []).concat(goal && !compact ? [goal] : [])
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1)
  const x = (date: string) => pl + (daysBetween(d0, date) / span) * (W - pl - pr)
  const y = (kg: number) => pt + ((hi - kg) / (hi - lo)) * (H - pt - pb)
  const trend = data.map((d, i) => `${i ? 'L' : 'M'} ${x(d.date).toFixed(1)} ${y(d.trend).toFixed(1)}`).join(' ')
  const area = `${trend} L ${x(last.date)} ${H - pb} L ${pl} ${H - pb} Z`
  const months: { x: number; l: string }[] = []
  const s = new Date(d0 + 'T12:00:00')
  for (let m = new Date(s.getFullYear(), s.getMonth() + 1, 1); daysBetween(d0, iso(m)) <= span; m.setMonth(m.getMonth() + 1)) months.push({ x: x(iso(m)), l: MONTHS[m.getMonth()] })
  const ticks = 4
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    data.forEach((d, i) => { if (Math.abs(x(d.date) - px) < Math.abs(x(data[best].date) - px)) best = i })
    setHover(best)
  }
  const h = hover !== null ? data[hover] : null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
      <defs>
        <linearGradient id={`ar-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ACCENT} stopOpacity=".2" />
          <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {!compact && Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = lo + ((hi - lo) * i) / ticks
        return (
          <g key={i}>
            <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke={GRID} />
            <text x={pl - 5} y={y(v) + 3} fontSize="9" textAnchor="end" fill={MUTE}>{Math.round(v)}</text>
          </g>
        )
      })}
      {!compact && months.map((m) => <text key={m.x} x={m.x} y={H - 6} fontSize="9" textAnchor="middle" fill={MUTE}>{m.l}</text>)}
      {!compact && goal && goal >= lo && goal <= hi && (
        <g>
          <line x1={pl} x2={W - pr} y1={y(goal)} y2={y(goal)} stroke={GREEN} strokeDasharray="4 4" strokeWidth="1.5" />
          <text x={pl + 4} y={y(goal) - 4} fontSize="9" fill="#237A5C" fontWeight="700">meta {fmt(goal)}</text>
        </g>
      )}
      {!compact && inbodyDates.map((d) => d >= d0 && <line key={d} x1={x(d)} x2={x(d)} y1={pt} y2={H - pb} stroke={BLUE} strokeOpacity=".35" strokeDasharray="2 3" />)}
      <path d={area} fill={`url(#ar-${gid})`} />
      {proj && (
        <g>
          <line x1={x(last.date)} y1={y(last.trend)} x2={x(proj.date)} y2={y(proj.kg)} stroke={ACCENT} strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" />
          <circle cx={x(proj.date)} cy={y(proj.kg)} r="4" fill="#fff" stroke={ACCENT} strokeWidth="2" />
          <text x={x(proj.date) - 6} y={y(proj.kg) - 9} fontSize="9" textAnchor="end" fill={INK} fontWeight="700">~{short(proj.date)}</text>
        </g>
      )}
      {!compact && data.map((d) => <circle key={d.date + d.kg} cx={x(d.date)} cy={y(d.kg)} r="2.6" fill={INK} opacity=".28" />)}
      <path d={trend} fill="none" stroke={ACCENT} strokeWidth={compact ? 3 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last.date)} cy={y(last.trend)} r="4.5" fill={ACCENT} stroke="#fff" strokeWidth="2" />
      {h && (
        <g pointerEvents="none">
          <line x1={x(h.date)} x2={x(h.date)} y1={pt} y2={H - pb} stroke={INK} strokeOpacity=".25" />
          <circle cx={x(h.date)} cy={y(h.kg)} r="5" fill="#fff" stroke={INK} strokeWidth="2" />
          {(() => {
            const bx = Math.min(W - pr - 92, Math.max(pl, x(h.date) - 46))
            return (
              <g>
                <rect x={bx} y={pt - 2} width="92" height="34" rx="8" fill={INK} />
                <text x={bx + 46} y={pt + 12} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{fmt(h.kg)} kg</text>
                <text x={bx + 46} y={pt + 25} textAnchor="middle" fontSize="9" fill="#B8D0C9">{short(h.date)} · tend. {fmt(h.trend)}</text>
              </g>
            )
          })()}
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Kilos por mes (barras)                                              */
/* ------------------------------------------------------------------ */
export function MonthlyBars({ data }: { data: { date: string; kg: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const s = sortByDate(data)
  if (s.length < 2) return <p className="py-6 text-center text-sm text-mute">Necesitas registros en al menos dos fechas.</p>
  // último peso de cada mes; el cambio de cada mes es contra el último peso del mes anterior (o el primero)
  const byMonth = new Map<string, number>()
  s.forEach((w) => byMonth.set(w.date.slice(0, 7), w.kg))
  const keys = [...byMonth.keys()]
  let prev = s[0].kg
  const bars = keys.map((k) => {
    const v = byMonth.get(k)!
    const d = v - prev
    prev = v
    return { k, d }
  }).filter((b, i) => i > 0 || Math.abs(b.d) >= 0.05).slice(-8)
  const W = 340, H = 150, pt = 18, pb = 22
  const up = Math.max(0, ...bars.map((b) => b.d))
  const dn = Math.max(0, ...bars.map((b) => -b.d))
  const total = Math.max(0.5, up + dn)
  const zero = pt + ((H - pt - pb - 12) * up) / total
  const scale = (H - pt - pb - 12) / total
  const bw = Math.min(30, (W - 20) / bars.length - 10)
  const step = (W - 20) / bars.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      <line x1="6" x2={W - 6} y1={zero} y2={zero} stroke={GRID} strokeWidth="1.5" />
      {bars.map((b, i) => {
        const cx = 10 + step * i + step / 2
        const hgt = Math.max(2, Math.abs(b.d) * scale)
        const down = b.d <= 0
        const yTop = down ? zero : zero - hgt
        const hh = hgt
        const m = Number(b.k.slice(5)) - 1
        return (
          <g key={b.k} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onPointerDown={() => setHover(i)}>
            <rect x={cx - step / 2} y={pt - 14} width={step} height={H} fill="transparent" />
            <rect x={cx - bw / 2} y={yTop} width={bw} height={hh} rx="4" fill={down ? ACCENT : '#B9CBC5'} opacity={hover === null || hover === i ? 1 : 0.45} />
            <text x={cx} y={down ? zero + hh + 11 : yTop - 4} fontSize="9.5" fontWeight="700" textAnchor="middle" fill={INK}>
              {(hover === i || bars.length <= 6) ? `${b.d <= 0 ? '−' : '+'}${fmt(Math.abs(b.d))}` : ''}
            </text>
            <text x={cx} y={H - 5} fontSize="9" textAnchor="middle" fill={MUTE}>{MONTHS[m]}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* InBody: grasa vs músculo en el tiempo                               */
/* ------------------------------------------------------------------ */
export function CompositionChart({ ib }: { ib: InBody[] }) {
  const s = sortByDate(ib).filter((i) => i.fatKg != null || i.muscleKg != null)
  if (s.length < 2) return <p className="py-6 text-center text-sm text-mute">Con dos InBody o más aparece aquí cómo cambian tu grasa y tu músculo.</p>
  const W = 340, H = 170, pl = 30, pr = 78, pt = 12, pb = 22
  const vals = s.flatMap((i) => [i.fatKg, i.muscleKg].filter((v): v is number => v != null))
  const lo = Math.floor(Math.min(...vals) - 2), hi = Math.ceil(Math.max(...vals) + 2)
  const span = Math.max(1, daysBetween(s[0].date, s[s.length - 1].date))
  const x = (d: string) => pl + (daysBetween(s[0].date, d) / span) * (W - pl - pr)
  const y = (v: number) => pt + ((hi - v) / (hi - lo)) * (H - pt - pb)
  const line = (k: 'fatKg' | 'muscleKg') => s.filter((i) => i[k] != null).map((i, n) => `${n ? 'L' : 'M'} ${x(i.date)} ${y(i[k]!)}`).join(' ')
  const lastF = [...s].reverse().find((i) => i.fatKg != null)
  const lastM = [...s].reverse().find((i) => i.muscleKg != null)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 1, 2, 3].map((i) => {
        const v = lo + ((hi - lo) * i) / 3
        return (
          <g key={i}>
            <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke={GRID} />
            <text x={pl - 5} y={y(v) + 3} fontSize="9" textAnchor="end" fill={MUTE}>{Math.round(v)}</text>
          </g>
        )
      })}
      {s.map((i) => <text key={i.id} x={x(i.date)} y={H - 6} fontSize="9" textAnchor="middle" fill={MUTE}>{short(i.date)}</text>)}
      {(['fatKg', 'muscleKg'] as const).map((k) => (
        <g key={k}>
          <path d={line(k)} fill="none" stroke={k === 'fatKg' ? CORAL : BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {s.filter((i) => i[k] != null).map((i) => <circle key={i.id} cx={x(i.date)} cy={y(i[k]!)} r="4.5" fill={k === 'fatKg' ? CORAL : BLUE} stroke="#fff" strokeWidth="2" />)}
        </g>
      ))}
      {lastF && <text x={x(lastF.date) + 9} y={y(lastF.fatKg!) + 4} fontSize="10" fontWeight="700" fill={INK}>Grasa {fmt(lastF.fatKg!)}</text>}
      {lastM && <text x={x(lastM.date) + 9} y={y(lastM.muscleKg!) + 4} fontSize="10" fontWeight="700" fill={INK}>Músculo {fmt(lastM.muscleKg!)}</text>}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* De qué estás hecha (dona del último InBody)                         */
/* ------------------------------------------------------------------ */
export function BodyDonut({ ib }: { ib?: InBody }) {
  if (!ib?.kg || ib.fatKg == null) return null
  const fat = ib.fatKg, mus = ib.muscleKg ?? 0, rest = Math.max(0, ib.kg - fat - mus)
  const parts = [
    { l: 'Grasa', v: fat, c: CORAL },
    { l: 'Músculo', v: mus, c: BLUE },
    { l: 'Agua, hueso y órganos', v: rest, c: '#B9CBC5' },
  ].filter((p) => p.v > 0)
  const R = 46, C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" width="120" height="120" className="shrink-0">
        {parts.map((p) => {
          const len = (p.v / ib.kg!) * C
          const el = <circle key={p.l} cx="60" cy="60" r={R} fill="none" stroke={p.c} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-acc} transform="rotate(-90 60 60)" />
          acc += len
          return el
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="800" fill={INK}>{fmt(ib.kg)}</text>
        <text x="60" y="73" textAnchor="middle" fontSize="9" fill={MUTE}>kg</text>
      </svg>
      <div className="flex-1 space-y-2 text-sm">
        {parts.map((p) => (
          <div key={p.l} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: p.c }} />
            <span className="flex-1 text-ink/70">{p.l}</span>
            <b>{fmt(p.v)} kg</b>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Una métrica del InBody en el tiempo, con su ideal                   */
/* ------------------------------------------------------------------ */
export function MetricChart({ points, color, unit, ideal, idealLabel = 'ideal', better, healthyBelow, decimals = 1 }: {
  points: { date: string; v: number }[]
  color: string
  unit: string
  ideal?: number
  idealLabel?: string
  better: 'down' | 'up'
  healthyBelow?: number
  decimals?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const s = sortByDate(points)
  if (s.length === 0) return <p className="py-4 text-center text-sm text-mute">Sin datos todavía.</p>
  const W = 340, H = 140, pl = 30, pr = 12, pt = 16, pb = 20
  const ref = ideal ?? healthyBelow
  const vals = s.map((p) => p.v).concat(ref !== undefined ? [ref] : [])
  const pad = Math.max(0.5, (Math.max(...vals) - Math.min(...vals)) * 0.15)
  const lo = Math.min(...vals) - pad, hi = Math.max(...vals) + pad
  const span = Math.max(1, daysBetween(s[0].date, s[s.length - 1].date))
  const x = (d: string) => (s.length === 1 ? (pl + W - pr) / 2 : pl + (daysBetween(s[0].date, d) / span) * (W - pl - pr))
  const y = (v: number) => pt + ((hi - v) / (hi - lo)) * (H - pt - pb)
  const path = s.map((p, i) => `${i ? 'L' : 'M'} ${x(p.date)} ${y(p.v)}`).join(' ')
  const fmtv = (v: number) => fmt(v, decimals)
  const first = s[0], last = s[s.length - 1]
  const delta = last.v - first.v
  const good = better === 'down' ? delta < 0 : delta > 0
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    s.forEach((p, i) => { if (Math.abs(x(p.date) - px) < Math.abs(x(s[best].date) - px)) best = i })
    setHover(best)
  }
  const h = hover !== null ? s[hover] : null
  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-display text-2xl font-extrabold">{fmtv(last.v)}</span>
        <span className="text-sm text-mute">{unit}</span>
        {s.length > 1 && Math.abs(delta) >= 0.05 && (
          <span className={`text-xs font-bold ${good ? 'text-leaf' : 'text-mute'}`}>{delta > 0 ? '▲' : '▼'} {fmtv(Math.abs(delta))} desde {short(first.date)}</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
        {/* zona buena */}
        {ref !== undefined && (
          <rect x={pl} width={W - pl - pr}
            y={better === 'down' ? y(Math.min(ref, hi)) : pt}
            height={better === 'down' ? H - pb - y(Math.min(ref, hi)) : Math.max(0, y(Math.max(ref, lo)) - pt)}
            fill={GREEN} opacity=".08" />
        )}
        {[0, 1, 2].map((i) => {
          const v = lo + ((hi - lo) * i) / 2
          return (
            <g key={i}>
              <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke={GRID} />
              <text x={pl - 5} y={y(v) + 3} fontSize="9" textAnchor="end" fill={MUTE}>{fmt(v, v >= 100 ? 0 : decimals)}</text>
            </g>
          )
        })}
        {ref !== undefined && (
          <g>
            <line x1={pl} x2={W - pr} y1={y(ref)} y2={y(ref)} stroke={GREEN} strokeWidth="1.5" strokeDasharray="4 4" />
            <text x={W - pr} y={y(ref) - 4} fontSize="9" fontWeight="700" textAnchor="end" fill="#237A5C">{ideal !== undefined ? idealLabel : 'rango sano'} {fmtv(ref)}</text>
          </g>
        )}
        {s.map((p) => <text key={p.date} x={x(p.date)} y={H - 5} fontSize="9" textAnchor="middle" fill={MUTE}>{short(p.date)}</text>)}
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {s.map((p) => <circle key={p.date} cx={x(p.date)} cy={y(p.v)} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />)}
        {h && (() => {
          const bx = Math.min(W - pr - 80, Math.max(pl, x(h.date) - 40))
          return (
            <g pointerEvents="none">
              <line x1={x(h.date)} x2={x(h.date)} y1={pt} y2={H - pb} stroke={INK} strokeOpacity=".25" />
              <rect x={bx} y={0} width="80" height="22" rx="7" fill={INK} />
              <text x={bx + 40} y={15} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#fff">{fmtv(h.v)} {unit} · {short(h.date)}</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Barras de "qué tan cerca estás" de tus ideales                       */
/* ------------------------------------------------------------------ */
export function IdealBar({ label, unit, start, now, ideal, better, decimals = 1, note }: {
  label: string; unit: string; start: number; now: number; ideal: number; better: 'down' | 'up'; decimals?: number; note?: string
}) {
  // Siempre de izquierda (inicio) a derecha (ideal), sin importar si el ideal es bajar o subir
  const total = Math.abs(start - ideal)
  const done = better === 'down' ? start - now : now - start
  const reached = better === 'down' ? now <= ideal : now >= ideal
  const pct = reached ? 1 : total > 0 ? Math.max(0, Math.min(1, done / total)) : 0
  const left = Math.abs(now - ideal)
  const color = better === 'down' ? CORAL : BLUE
  const unitLeft = unit === '%' ? 'puntos' : unit
  return (
    <div className="tile p-3.5">
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Hoy</div>
          <div className="font-display text-3xl font-extrabold leading-none" style={{ color }}>{fmt(now, decimals)}<span className="text-base font-semibold text-mute"> {unit}</span></div>
        </div>
        <div className="pb-1 text-2xl text-mute">→</div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-mute">Ideal</div>
          <div className="font-display text-3xl font-extrabold leading-none text-leaf">{fmt(ideal, decimals)}<span className="text-base font-semibold text-mute"> {unit}</span></div>
        </div>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, pct * 100)}%`, background: reached ? GREEN : color }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-mute">
        <span>inicio {fmt(start, decimals)} {unit}</span>
        <span>ideal</span>
      </div>
      <div className="mt-2 text-sm">
        {reached ? (
          <b className="text-leaf">¡Llegaste a tu ideal! 🎉</b>
        ) : (
          <>Te faltan <b>{fmt(left, decimals)} {unitLeft}</b>{done > 0 ? <> · vas en el <b>{Math.round(pct * 100)}%</b> del camino</> : null}</>
        )}
      </div>
      {note && <div className="mt-1 text-[11px] text-mute">{note}</div>}
    </div>
  )
}

/** Pendiente (unidades por semana) de una serie, regresión lineal sobre las últimas ~8 semanas */
export function slopePerWeek(points: { date: string; v: number }[]) {
  const s = sortByDate(points)
  if (s.length < 2) return undefined
  const lastD = s[s.length - 1].date
  let pts = s.filter((p) => daysBetween(p.date, lastD) <= 56)
  if (pts.length < 2) pts = s.slice(-2)
  const xs = pts.map((p) => daysBetween(pts[0].date, p.date))
  if (xs[xs.length - 1] < 5) return undefined
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = pts.reduce((a, p) => a + p.v, 0) / n
  let num = 0, den = 0
  xs.forEach((x, i) => { num += (x - mx) * (pts[i].v - my); den += (x - mx) ** 2 })
  return den ? (num / den) * 7 : undefined
}

/* ------------------------------------------------------------------ */
/* Anillo "qué tan cerca": % del camino + cuánto falta en el centro     */
/* ------------------------------------------------------------------ */
export function GoalRing({ title, start, now, ideal, better, unit, color, decimals = 1 }: {
  title: string; start: number; now: number; ideal: number; better: 'down' | 'up'; unit: string; color: string; decimals?: number
}) {
  const total = Math.abs(start - ideal)
  const done = better === 'down' ? start - now : now - start
  const reached = better === 'down' ? now <= ideal : now >= ideal
  const pct = reached ? 1 : total > 0 ? Math.max(0, Math.min(1, done / total)) : 0
  const left = Math.abs(now - ideal)
  const R = 40, C = 2 * Math.PI * R
  const c = reached ? GREEN : color
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-mute">{title}</div>
      <svg viewBox="0 0 100 100" width="100%" className="max-w-[110px]">
        <circle cx="50" cy="50" r={R} fill="none" stroke={GRID} strokeWidth="9" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={c} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${C * Math.max(0.01, pct)} ${C}`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s' }} />
        {reached ? (
          <text x="50" y="58" textAnchor="middle" fontSize="26">🎉</text>
        ) : (
          <>
            <text x="50" y="40" textAnchor="middle" fontSize="9" fill={MUTE} fontWeight="600">faltan</text>
            <text x="50" y="59" textAnchor="middle" fontSize="20" fontWeight="800" fill={INK}>{fmt(left, decimals)}</text>
            <text x="50" y="71" textAnchor="middle" fontSize="9" fill={MUTE}>{unit === '%' ? 'puntos' : unit}</text>
          </>
        )}
      </svg>
      <div className="mt-1 font-display text-lg font-extrabold leading-none" style={{ color: c }}>{Math.round(pct * 100)}%</div>
      <div className="text-[11px] text-mute">del camino</div>
      <div className="mt-1 text-[11px] text-ink/70">{fmt(now, decimals)} → <b className="text-leaf">{fmt(ideal, decimals)}</b> {unit}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Camino hacia el ideal: historia + línea de ideal + "faltan" + fecha  */
/* ------------------------------------------------------------------ */
export function GapChart({ points, ideal, better, unit, color, decimals = 1, estimated = false }: {
  points: { date: string; v: number }[]; ideal: number; better: 'down' | 'up'; unit: string; color: string; decimals?: number; estimated?: boolean
}) {
  const gid = useId().replace(/:/g, '')
  const s = sortByDate(points)
  if (!s.length) return null
  const last = s[s.length - 1]
  const reached = better === 'down' ? last.v <= ideal : last.v >= ideal
  const rate = slopePerWeek(s)
  const goingRight = rate !== undefined && (better === 'down' ? rate < -0.01 : rate > 0.01)
  let eta: string | undefined
  if (!reached && goingRight) {
    const weeks = (ideal - last.v) / rate!
    if (weeks > 0 && weeks < 156) eta = addDaysISO(last.date, Math.round(weeks * 7))
  }
  const W = 340, H = 180, pl = 30, pr = 74, pt = 14, pb = 22
  const endDate = eta ?? last.date
  const span = Math.max(1, daysBetween(s[0].date, endDate))
  const vals = s.map((p) => p.v).concat([ideal])
  const pad = Math.max(0.5, (Math.max(...vals) - Math.min(...vals)) * 0.08)
  const lo = Math.min(...vals) - pad, hi = Math.max(...vals) + pad
  const x = (d: string) => (s.length === 1 && !eta ? pl + (W - pl - pr) / 2 : pl + (daysBetween(s[0].date, d) / span) * (W - pl - pr))
  const y = (v: number) => pt + ((hi - v) / (hi - lo)) * (H - pt - pb)
  const line = s.map((p, i) => `${i ? 'L' : 'M'} ${x(p.date).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
  const lx = x(last.date)
  const gap = Math.abs(last.v - ideal)
  const firstD = new Date(s[0].date + 'T12:00:00')
  const months: { x: number; l: string }[] = []
  for (let m = new Date(firstD.getFullYear(), firstD.getMonth() + 1, 1); daysBetween(s[0].date, iso(m)) <= span; m.setMonth(m.getMonth() + 1)) months.push({ x: x(iso(m)), l: MONTHS[m.getMonth()] })
  const bx = W - pr + 10 // columna derecha para la llave "faltan"
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id={`gap-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".16" />
            <stop offset="1" stopColor={color} stopOpacity=".04" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const v = lo + ((hi - lo) * i) / 3
          return <g key={i}><line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke={GRID} /><text x={pl - 5} y={y(v) + 3} fontSize="9" textAnchor="end" fill={MUTE}>{fmt(v, hi - lo < 8 ? 1 : 0)}</text></g>
        })}
        {months.map((m) => <text key={m.x} x={m.x} y={H - 6} fontSize="9" textAnchor="middle" fill={MUTE}>{m.l}</text>)}
        {/* lo que falta: banda entre tu valor de hoy y el ideal */}
        {!reached && <rect x={pl} y={Math.min(y(last.v), y(ideal))} width={W - pr - pl} height={Math.abs(y(last.v) - y(ideal))} fill={`url(#gap-${gid})`} />}
        {/* ideal */}
        <line x1={pl} x2={W - pr} y1={y(ideal)} y2={y(ideal)} stroke={GREEN} strokeWidth="2" strokeDasharray="5 4" />
        <text x={pl + 4} y={y(ideal) + (better === 'down' ? 12 : -5)} fontSize="9.5" fontWeight="700" fill="#237A5C">🚩 ideal {fmt(ideal, decimals)} {unit}</text>
        {/* historia */}
        <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {!estimated && s.map((p) => <circle key={p.date} cx={x(p.date)} cy={y(p.v)} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5" />)}
        {/* proyección */}
        {eta && (
          <g>
            <line x1={lx} y1={y(last.v)} x2={x(eta)} y2={y(ideal)} stroke={color} strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" />
            <circle cx={x(eta)} cy={y(ideal)} r="5" fill="#fff" stroke={GREEN} strokeWidth="2.5" />
          </g>
        )}
        {/* hoy */}
        <circle cx={lx} cy={y(last.v)} r="6" fill={color} stroke="#fff" strokeWidth="2.5" />
        <text x={lx} y={y(last.v) + (better === 'down' ? -11 : 17)} fontSize="10" fontWeight="800" textAnchor="middle" fill={INK}>hoy {fmt(last.v, decimals)}</text>
        {/* llave "faltan X" a la derecha */}
        {!reached ? (
          <g>
            <path d={`M ${bx} ${y(last.v)} h 6 V ${y(ideal)} h -6`} fill="none" stroke={INK} strokeOpacity=".5" strokeWidth="1.5" />
            <line x1={lx + 8} x2={bx - 2} y1={y(last.v)} y2={y(last.v)} stroke={INK} strokeOpacity=".2" strokeDasharray="2 3" />
            <text x={bx + 12} y={(y(last.v) + y(ideal)) / 2 - 4} fontSize="9" fill={MUTE}>faltan</text>
            <text x={bx + 12} y={(y(last.v) + y(ideal)) / 2 + 10} fontSize="14" fontWeight="800" fill={INK}>{fmt(gap, decimals)}</text>
            <text x={bx + 12} y={(y(last.v) + y(ideal)) / 2 + 22} fontSize="9" fill={MUTE}>{unit === '%' ? 'puntos' : unit}</text>
          </g>
        ) : (
          <text x={bx + 4} y={y(ideal) + 4} fontSize="12" fontWeight="800" fill="#237A5C">¡Llegaste!</text>
        )}
      </svg>
      <p className="mt-1 text-sm">
        {reached ? <b className="text-leaf">Ya estás en tu ideal 🎉</b>
          : eta ? <>A tu ritmo de los últimos meses llegarías por <b>{new Date(eta + 'T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</b>.</>
          : <>Te faltan <b>{fmt(gap, decimals)} {unit === '%' ? 'puntos' : unit}</b>. Con más registros te digo para cuándo llegarías.</>}
      </p>
    </div>
  )
}
