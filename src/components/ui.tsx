import { useMemo, type ReactNode } from 'react'
import type { Achievement } from '../lib/types'
import { Badge, Icon, KIND_TONE } from './icons'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="fade-in absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="sheet-up safe-bottom relative max-h-[92vh] w-full max-w-md overflow-y-auto sheet-glass rounded-t-[32px] px-5 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <button onClick={onClose} className="bubble h-9 w-9 text-lg" aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const COLORS = ['#14524B', '#6FB8A9', '#E8793A', '#F2BD76', '#FFFFFF', '#3C9A93']

export function Celebration({ queue, onNext }: { queue: Achievement[]; onNext: () => void }) {
  const a = queue[0]
  const confetti = useMemo(
    () => Array.from({ length: a?.big ? 70 : 36 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 2,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
    })),
    [a?.id],
  )
  if (!a) return null
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink/55 px-6 backdrop-blur-sm">
      {confetti.map((c, i) => (
        <span key={i} className="confetti" style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, rotate: `${c.rot}deg` }} />
      ))}
      <div key={a.id} className="pop-in glass relative w-full max-w-sm rounded-[32px]! p-7 text-center">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-ember">{a.big ? '¡Logro grande!' : 'Logro desbloqueado'}</div>
        <div className={`tone-${KIND_TONE[a.kind] ?? 'teal'} relative mx-auto my-6 grid h-28 w-28 place-items-center`}>
          <span className="halo" /><span className="halo d2" /><span className="halo d3" />
          <Badge icon={a.icon} tone={KIND_TONE[a.kind] ?? 'teal'} size={112} />
          <svg className="pointer-events-none absolute -inset-6 overflow-visible" viewBox="0 0 160 160" aria-hidden>
            {[[14, 30, 9], [142, 22, 7], [150, 118, 10], [10, 128, 6]].map(([x, y, r], i) => (
              <path key={i} className="twinkle" style={{ animationDelay: `${i * 0.5}s` }} fill="#F2BD76"
                d={`M ${x} ${y - r} L ${x + r * 0.3} ${y - r * 0.3} L ${x + r} ${y} L ${x + r * 0.3} ${y + r * 0.3} L ${x} ${y + r} L ${x - r * 0.3} ${y + r * 0.3} L ${x - r} ${y} L ${x - r * 0.3} ${y - r * 0.3} Z`} />
            ))}
          </svg>
        </div>
        <h2 className="font-display text-3xl font-extrabold leading-tight">{a.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{a.body}</p>
        <button onClick={onNext} className="btn-primary mt-6 w-full text-lg">
          {queue.length > 1 ? `Siguiente (${queue.length - 1} más) →` : '¡Vamos!'}
        </button>
      </div>
    </div>
  )
}

export function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 safe-top" onClick={onClose}>
      <div className="fade-in mt-2 flex max-w-md items-center gap-3 rounded-[24px] border border-white/15 bg-ink/90 px-5 py-4 text-white shadow-xl backdrop-blur-xl">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white"><Icon name="chat" size={18} /></span>
        <p className="text-[15px] leading-snug">{text}</p>
      </div>
    </div>
  )
}

export function Progress({ value, color = '#14524B' }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(3, value * 100)}%`, background: color }} />
    </div>
  )
}

