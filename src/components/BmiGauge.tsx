import { bmiCategory, fmt } from '../lib/calc'

const MIN = 16, MAX = 42
const SEGS: [number, number, string][] = [
  [16, 18.5, '#C9CFD6'],
  [18.5, 25, '#2FB37A'],
  [25, 30, '#F5B83D'],
  [30, 35, '#FF8A4C'],
  [35, 40, '#F0564A'],
  [40, 42, '#C2407A'],
]

const pt = (v: number, r: number) => {
  const a = Math.PI * (1 - (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN))
  return [100 + r * Math.cos(a), 100 - r * Math.sin(a)]
}
const arc = (a: number, b: number, r: number) => {
  const [x1, y1] = pt(a, r)
  const [x2, y2] = pt(b, r)
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
}

export default function BmiGauge({ value, start }: { value: number; start: number }) {
  const cat = bmiCategory(value)
  const [nx, ny] = pt(value, 80)
  const [sx, sy] = pt(start, 80)
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-full max-w-[260px]">
        {SEGS.map(([a, b, c]) => (
          <path key={a} d={arc(a + 0.15, b - 0.15, 80)} stroke={c} strokeWidth="16" fill="none" strokeLinecap="butt" />
        ))}
        {Math.abs(start - value) > 0.3 && <circle cx={sx} cy={sy} r="5" fill="none" stroke="#2A1F1A" strokeOpacity=".35" strokeWidth="2" strokeDasharray="2 2" />}
        <circle cx={nx} cy={ny} r="11" fill="#fff" stroke={cat.color} strokeWidth="5" />
        <text x="100" y="86" textAnchor="middle" className="font-display" fontSize="30" fontWeight="800" fill="#2A1F1A">{fmt(value)}</text>
        <text x="100" y="106" textAnchor="middle" fontSize="12" fontWeight="600" fill={cat.color}>{cat.label}</text>
      </svg>
    </div>
  )
}
