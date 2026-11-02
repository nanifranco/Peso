import { useEffect, useMemo, type ReactNode } from 'react'
import PixelEmoji from './PixelEmoji'
import type { Achievement } from '../lib/types'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="fade-in absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="sheet-up safe-bottom relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[12px] border-x-[3px] border-t-[3px] border-wall bg-cream px-5 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[13px] text-coral glow-y uppercase">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border-2 border-line text-2xl" aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const COLORS = ['#ffe600', '#ff3fa4', '#00e5ff', '#39ff7a', '#2a2aff']

export function Celebration({ queue, onNext, onShow }: { queue: Achievement[]; onNext: () => void; onShow?: (a: Achievement) => void }) {
  const a = queue[0]
  const confetti = useMemo(
    () => Array.from({ length: a?.big ? 60 : 30 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 2,
      color: COLORS[i % COLORS.length],
    })),
    [a?.id],
  )
  useEffect(() => { if (a) onShow?.(a) }, [a?.id])
  if (!a) return null
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/85 px-6">
      {confetti.map((c, i) => (
        <span key={i} className="confetti" style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, borderRadius: 0, width: 8, height: 8, animationTimingFunction: 'steps(24)' }} />
      ))}
      <div key={a.id} className="pop-in card relative w-full max-w-sm p-6 text-center">
        <div className="blink font-display text-[22px] text-coral glow-y">{a.big ? 'LEVEL UP!' : '¡LOGRO!'}</div>
        <div className="my-5 flex justify-center"><PixelEmoji e={a.emoji} size={96} res={16} /></div>
        <h2 className="font-display text-[14px] leading-relaxed">{a.title}</h2>
        <p className="mt-3 text-2xl leading-tight text-ink/80">{a.body}</p>
        <button onClick={onNext} className="btn-primary mt-6 w-full">
          {queue.length > 1 ? `Siguiente (${queue.length - 1}) ▶` : 'Continuar ▶'}
        </button>
      </div>
    </div>
  )
}

export function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 safe-top" onClick={onClose}>
      <div className="fade-in mt-2 flex max-w-md items-start gap-3 rounded-md border-[3px] border-coral bg-cream px-4 py-3 text-ink shadow-[0_0_20px_-4px_#ffe600]">
        <span className="font-display text-[10px] leading-6 text-coral">P1&gt;</span>
        <p className="text-xl leading-tight">{text}</p>
      </div>
    </div>
  )
}

export function Progress({ value, color = '#FF7A50' }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden bg-line">
      <div className="h-full transition-all duration-700" style={{ width: `${Math.max(3, value * 100)}%`, background: color }} />
    </div>
  )
}
