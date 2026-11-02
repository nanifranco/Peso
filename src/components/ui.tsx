import { useMemo, type ReactNode } from 'react'
import type { Achievement } from '../lib/types'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="fade-in absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="sheet-up safe-bottom relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-cream px-5 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-line/70 text-lg" aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const COLORS = ['#FF6B4A', '#FFD166', '#2FB37A', '#5B8DEF', '#C2407A']

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
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink/70 px-6 backdrop-blur-sm">
      {confetti.map((c, i) => (
        <span key={i} className="confetti" style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, rotate: `${c.rot}deg` }} />
      ))}
      <div key={a.id} className="pop-in relative w-full max-w-sm rounded-[32px] bg-paper p-7 text-center">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-coral">{a.big ? '¡Logro grande!' : 'Logro desbloqueado'}</div>
        <div className="my-4 text-7xl">{a.emoji}</div>
        <h2 className="font-display text-3xl font-extrabold leading-tight">{a.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{a.body}</p>
        <button onClick={onNext} className="btn-primary mt-6 w-full text-lg">
          {queue.length > 1 ? `Siguiente (${queue.length - 1} más) →` : '¡Vamos! 🙌'}
        </button>
      </div>
    </div>
  )
}

export function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 safe-top" onClick={onClose}>
      <div className="fade-in mt-2 flex max-w-md gap-3 rounded-3xl bg-ink px-5 py-4 text-cream shadow-xl">
        <span className="text-2xl">🗣️</span>
        <p className="text-[15px] leading-snug">{text}</p>
      </div>
    </div>
  )
}

export function Progress({ value, color = '#FF6B4A' }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(3, value * 100)}%`, background: color }} />
    </div>
  )
}
