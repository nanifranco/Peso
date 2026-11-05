import { useMemo, type ReactNode } from 'react'
import type { Achievement } from '../lib/types'

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
      <div className="fade-in mt-2 flex max-w-md gap-3 rounded-[24px] border border-white/15 bg-ink/90 px-5 py-4 text-white shadow-xl backdrop-blur-xl">
        <span className="text-2xl">🗣️</span>
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

/** Íconos de línea para la barra inferior */
export type IconName = 'home' | 'chart' | 'list' | 'trophy' | 'gear'
const PATHS: Record<IconName, ReactNode> = {
  home: <><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" /></>,
  chart: <><path d="M5 20V11" /><path d="M10 20V6" /><path d="M15 20v-7" /><path d="M20 20V9" /></>,
  list: <><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 3v2.5h6V3" /><path d="M9 11h6M9 15h4" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4M8.5 20h7M10 17h4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></>,
}
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  )
}
