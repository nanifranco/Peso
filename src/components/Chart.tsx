import { daysBetween, fmt } from '../lib/calc'

interface P { date: string; kg: number; trend: number }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export default function Chart({ data, goal, inbodyDates = [] }: { data: P[]; goal?: number; inbodyDates?: string[] }) {
  if (data.length < 2) return <p className="py-8 text-center text-sm text-mute">Anota otro peso para ver tu gráfica.</p>
  const W = 340, H = 180, pl = 30, pr = 8, pt = 10, pb = 22
  const d0 = data[0].date
  const span = Math.max(1, daysBetween(d0, data[data.length - 1].date))
  const vals = data.flatMap((d) => [d.kg, d.trend]).concat(goal && goal > Math.min(...data.map((d) => d.kg)) - 6 ? [goal] : [])
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1)
  const x = (date: string) => pl + (daysBetween(d0, date) / span) * (W - pl - pr)
  const y = (kg: number) => pt + ((hi - kg) / (hi - lo)) * (H - pt - pb)
  const trend = data.map((d, i) => `${i ? 'L' : 'M'} ${x(d.date).toFixed(1)} ${y(d.trend).toFixed(1)}`).join(' ')
  const area = `${trend} L ${x(data[data.length - 1].date)} ${H - pb} L ${pl} ${H - pb} Z`
  const ticks = 4
  const months: { x: number; l: string }[] = []
  const s = new Date(d0 + 'T12:00:00')
  for (let m = new Date(s.getFullYear(), s.getMonth() + 1, 1); daysBetween(d0, iso(m)) <= span; m.setMonth(m.getMonth() + 1)) {
    months.push({ x: x(iso(m)), l: MONTHS[m.getMonth()] })
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE600" stopOpacity=".22" />
          <stop offset="1" stopColor="#FFE600" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = lo + ((hi - lo) * i) / ticks
        return (
          <g key={i}>
            <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="#1C1C44" />
            <text x={pl - 5} y={y(v) + 3} fontSize="13" textAnchor="end" fill="#8A8AC4">{Math.round(v)}</text>
          </g>
        )
      })}
      {months.map((m) => (
        <text key={m.x} x={m.x} y={H - 6} fontSize="13" textAnchor="middle" fill="#8A8AC4">{m.l}</text>
      ))}
      {goal && goal >= lo && goal <= hi && (
        <g>
          <line x1={pl} x2={W - pr} y1={y(goal)} y2={y(goal)} stroke="#39FF7A" strokeDasharray="4 4" strokeWidth="1.5" />
          <text x={W - pr} y={y(goal) - 4} fontSize="13" textAnchor="end" fill="#39FF7A" fontWeight="600">meta {fmt(goal)}</text>
        </g>
      )}
      {inbodyDates.map((d) => d >= d0 && (
        <line key={d} x1={x(d)} x2={x(d)} y1={pt} y2={H - pb} stroke="#00E5FF" strokeOpacity=".4" strokeDasharray="2 3" />
      ))}
      <path d={area} fill="url(#area)" />
      {data.map((d) => (
        <circle key={d.date + d.kg} cx={x(d.date)} cy={y(d.kg)} r="2.6" fill="#F3EBE1" opacity=".35" />
      ))}
      <path d={trend} fill="none" stroke="#FFE600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
