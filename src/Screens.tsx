import { useState } from 'react'
import type { Achievement, State } from './lib/types'
import { bmiCategory, daysBetween, fatness, fmt, predictFor, sortByDate, type Summary } from './lib/calc'
import { KIND_LABEL, nextWeightMilestone, withHistory } from './lib/achievements'
import { todayISO } from './lib/store'
import Avatar from './components/Avatar'
import BmiGauge from './components/BmiGauge'
import Chart from './components/Chart'
import { Progress } from './components/ui'

const dateLabel = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

function Delta({ v, unit, goodWhen }: { v?: number; unit: string; goodWhen: 'down' | 'up' }) {
  if (v === undefined || Math.abs(v) < 0.05) return <span className="text-xs text-mute">—</span>
  const good = goodWhen === 'down' ? v < 0 : v > 0
  return (
    <span className={`text-xs font-semibold ${good ? 'text-leaf' : 'text-coral'}`}>
      {v > 0 ? '▲' : '▼'} {fmt(Math.abs(v))} {unit}
    </span>
  )
}

export function Home({ state, sum, onAdd, onAddInBody, onOpenLogros, onDeleteEvent }: {
  state: State; sum: Summary; onAdd: () => void; onAddInBody: () => void; onOpenLogros: () => void; onDeleteEvent: (id: string) => void
}) {
  const all = withHistory(state)
  const next = nextWeightMilestone(state)
  const lastEq = all.filter((a) => a.kind === 'equivalencia' && a.unlocked).pop()
  const { p, firstIB, lastIB } = sum
  const ibDelta = (k: 'fatPct' | 'fatKg' | 'muscleKg' | 'visceral') =>
    sum.ib.length > 1 && firstIB?.[k] != null && lastIB?.[k] != null ? (lastIB[k] as number) - (firstIB[k] as number) : undefined
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const cat = bmiCategory(sum.curBmi)
  const events = sortByDate(state.events).filter((e) => e.date >= todayISO())
  const lost = Math.max(0, sum.lost)

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between px-1 pb-1">
        <div>
          <div className="text-sm text-mute">{greet}</div>
          <h1 className="font-display text-3xl font-extrabold">{p.name}</h1>
        </div>
        {sum.daysSinceLast > 0 && <div className="text-right text-xs text-mute">último registro<br />hace {sum.daysSinceLast} {sum.daysSinceLast === 1 ? 'día' : 'días'}</div>}
      </header>

      {/* Héroe */}
      <section className="hero relative overflow-hidden rounded-[32px] p-5 pb-4">
        <div className="relative flex items-stretch gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/50">Llevas</div>
            <div className="font-display text-[64px] font-extrabold leading-[0.9] tracking-tight">
              {sum.lost >= 0 ? '−' : '+'}{fmt(Math.abs(sum.lost))}
            </div>
            <div className="font-display text-xl font-bold text-ink/60">kilos</div>
            <div className="mt-4 space-y-2.5 text-sm">
              <Stat label="Hoy" value={`${fmt(sum.current)} kg`} />
              <Stat label="Empezaste" value={`${fmt(sum.startKg)} kg`} muted />
              <Stat label="Grasa" value={`${fmt(sum.fatNow)}%`} hint={lastIB ? 'InBody' : 'estimada'} />
              {sum.rate !== undefined && <Stat label="Ritmo" value={`${sum.rate <= 0 ? '−' : '+'}${fmt(Math.abs(sum.rate), 2)} kg/sem`} />}
            </div>
            {lastEq && lost > 0.5 && (
              <div className="mt-auto pt-4 text-[13px] leading-snug text-ink/70">
                <span className="text-xl">{lastEq.emoji}</span> Ya no cargas {lastEq.title.split(': ')[1]}
              </div>
            )}
          </div>
          <div className="relative -my-1 -mr-2 shrink-0">
            <Avatar fat={fatness(sum.fatNow, p.sex)} ghostFat={fatness(sum.fatStart, p.sex)} sex={p.sex} width={142} />
          </div>
        </div>
        <button onClick={onAdd} className="btn-primary relative mt-3 w-full text-lg">+ Anotar peso</button>
        {sum.shape > 0.03 && <p className="relative mt-2 text-center text-[11px] text-ink/45">La línea punteada eres tú el día uno</p>}
      </section>

      {/* Siguiente logro */}
      {next && (
        <button onClick={onOpenLogros} className="card flex w-full items-center gap-4 p-4 text-left">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream text-3xl">{next.emoji}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-coral">Siguiente logro</div>
            <div className="truncate font-display text-lg font-bold">{next.title}</div>
            <div className="mb-2 text-sm text-mute">{next.remaining}{(next.remainingKg ?? 9) < 1 ? ' · ¡ya casi! 👀' : ''}</div>
            <Progress value={next.progress ?? 0} />
          </div>
        </button>
      )}

      {/* IMC compacto */}
      <section className="card flex items-center gap-4 p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-extrabold text-white" style={{ background: cat.color }}>{fmt(sum.curBmi)}</div>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-mute">IMC</div>
          <div className="font-display text-lg font-bold">{cat.label}</div>
          <div className="text-sm text-mute">empezaste en {fmt(sum.startBmi)} ({bmiCategory(sum.startBmi).label})</div>
        </div>
      </section>

      {/* Cuerpo */}
      {lastIB ? (
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Tu cuerpo</h2>
            <button onClick={onAddInBody} className="rounded-full bg-sky/15 px-3 py-1.5 text-sm font-semibold text-sky">+ InBody</button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { l: '% grasa', v: lastIB.fatPct, u: '%', d: ibDelta('fatPct'), g: 'down' as const, du: 'pts' },
              { l: 'Masa grasa', v: lastIB.fatKg, u: 'kg', d: ibDelta('fatKg'), g: 'down' as const, du: 'kg' },
              { l: 'Músculo', v: lastIB.muscleKg, u: 'kg', d: ibDelta('muscleKg'), g: 'up' as const, du: 'kg' },
              { l: 'Visceral', v: lastIB.visceral, u: 'nivel', d: ibDelta('visceral'), g: 'down' as const, du: '' },
            ].filter((x) => x.v != null).map((x) => (
              <div key={x.l} className="rounded-2xl bg-cream p-3">
                <div className="text-xs text-mute">{x.l}</div>
                <div className="font-display text-2xl font-bold">{fmt(x.v!, x.u === 'nivel' ? 0 : 1)}<span className="text-sm font-medium text-mute"> {x.u}</span></div>
                <Delta v={x.d} unit={x.du} goodWhen={x.g} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">
            {dateLabel(lastIB.date)}{sum.ib.length > 1 ? ` · vs. tu primer InBody (${dateLabel(firstIB!.date)})` : ' · sube otro para comparar'}
          </p>
        </section>
      ) : (
        <button onClick={onAddInBody} className="card flex w-full items-center gap-4 p-4 text-left">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sky/15 text-2xl">🔬</div>
          <div className="flex-1">
            <div className="font-display text-lg font-bold">¿Tienes un InBody?</div>
            <div className="text-sm text-mute">Súbelo y celebramos la grasa que pierdes y el músculo que ganas</div>
          </div>
        </button>
      )}

      {/* Eventos */}
      {events.map((e) => {
        const pr = predictFor(sum, e.date)
        const days = daysBetween(todayISO(), e.date)
        return (
          <section key={e.id} className="card flex items-center gap-4 p-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sun/40 text-center leading-none">
              <div><div className="font-display text-xl font-extrabold">{days}</div><div className="text-[10px] font-semibold">días</div></div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-bold">{e.name}</div>
              <div className="text-sm text-mute">{pr ? <>llegarías con <b className="text-ink">~{fmt(pr.kg)} kg</b></> : 'anota más para predecir'}</div>
            </div>
            <button onClick={() => onDeleteEvent(e.id)} className="px-1 text-lg text-mute" aria-label="Borrar evento">×</button>
          </section>
        )
      })}
    </div>
  )
}

function Stat({ label, value, hint, muted }: { label: string; value: string; hint?: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-ink/10 pb-1.5">
      <span className="text-ink/55">{label}{hint && <span className="text-[10px] text-ink/40"> · {hint}</span>}</span>
      <span className={`font-semibold ${muted ? 'text-ink/50' : ''}`}>{value}</span>
    </div>
  )
}

export function Logros({ state }: { state: State }) {
  const all = withHistory(state)
  const [open, setOpen] = useState<Achievement | null>(null)
  const kinds = ['salud', 'cuerpo', 'meta', 'equivalencia', 'constancia']
  const got = all.filter((a) => a.unlocked).length
  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="font-display text-3xl font-extrabold">Logros</h1>
        <p className="text-sm text-mute">{got} de {all.length} desbloqueados</p>
        <div className="mt-3"><Progress value={all.length ? got / all.length : 0} color="#2FB37A" /></div>
      </header>
      {kinds.map((k) => {
        const list = all.filter((a) => a.kind === k)
        if (!list.length) return null
        return (
          <section key={k}>
            <h2 className="mb-2 px-1 font-display text-lg font-bold">{KIND_LABEL[k]}</h2>
            <div className="grid grid-cols-2 gap-3">
              {list.map((a) => (
                <button key={a.id} onClick={() => setOpen(a)} className={`card p-3.5 text-left ${a.unlocked ? '' : 'opacity-60'}`}>
                  <div className={`text-3xl ${a.unlocked ? '' : 'grayscale'}`}>{a.unlocked ? a.emoji : '🔒'}</div>
                  <div className="mt-1.5 text-sm font-semibold leading-tight">{a.title}</div>
                  {a.unlocked ? (
                    <div className="mt-1 text-[11px] text-leaf">✓ {state.unlocked[a.id] ? new Date(state.unlocked[a.id] + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'logrado'}</div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {a.progress !== undefined && <Progress value={a.progress} color="#8A7D72" />}
                      <div className="text-[11px] text-mute">{a.remaining}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )
      })}
      {open && (
        <div className="fade-in fixed inset-0 z-40 flex items-center justify-center bg-ink/50 px-6" onClick={() => setOpen(null)}>
          <div className="pop-in w-full max-w-sm rounded-[28px] bg-paper p-6 text-center">
            <div className="text-6xl">{open.unlocked ? open.emoji : '🔒'}</div>
            <h3 className="mt-3 font-display text-2xl font-extrabold">{open.title}</h3>
            <p className="mt-2 text-sm text-ink/75">{open.unlocked ? open.body : `Todavía no: ${open.remaining ?? 'sigue así'}.`}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function Historial({ state, sum, onDeleteWeighIn, onDeleteInBody }: { state: State; sum: Summary; onDeleteWeighIn: (id: string) => void; onDeleteInBody: (id: string) => void }) {
  const [armed, setArmed] = useState<string | null>(null)
  const rows = [
    ...state.weighIns.map((w) => ({ t: 'w' as const, id: w.id, date: w.date, w })),
    ...state.inbodies.map((i) => ({ t: 'i' as const, id: i.id, date: i.date, i })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  const trendByDate = Object.fromEntries(sum.ws.map((x) => [x.date, x.trend]))
  return (
    <div className="space-y-4">
      <header className="px-1">
        <h1 className="font-display text-3xl font-extrabold">Historial</h1>
        <p className="text-sm text-mute">Puntos: lo que marcó la báscula · Línea: tu tendencia real</p>
      </header>
      <section className="card p-5">
        <h2 className="mb-1 font-display text-lg font-bold">IMC</h2>
        <BmiGauge value={sum.curBmi} start={sum.startBmi} />
        <p className="mt-1 text-center text-xs text-mute">El círculo punteado es donde empezaste ({fmt(sum.startBmi)})</p>
      </section>
      <section className="card p-4">
        <Chart data={sum.ws} goal={sum.p.goalKg} inbodyDates={state.inbodies.map((i) => i.date)} />
      </section>
      <section className="card divide-y divide-line overflow-hidden">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-14 shrink-0 text-xs text-mute">{new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}<br />{r.date.slice(0, 4)}</div>
            {r.t === 'w' ? (
              <div className="flex-1">
                <div className="font-display text-lg font-bold">{fmt(r.w.kg)} kg <span className="text-xs font-normal text-mute">tendencia {fmt(trendByDate[r.date] ?? r.w.kg)}</span></div>
                {r.w.note && <div className="text-sm text-ink/70">📝 {r.w.note}</div>}
              </div>
            ) : (
              <div className="flex-1">
                <div className="font-semibold text-sky">🔬 InBody</div>
                <div className="text-xs text-ink/70">
                  {[r.i.kg && `${fmt(r.i.kg)} kg`, r.i.fatPct && `${fmt(r.i.fatPct)}% grasa`, r.i.muscleKg && `${fmt(r.i.muscleKg)} kg músculo`, r.i.visceral && `visceral ${r.i.visceral}`].filter(Boolean).join(' · ')}
                </div>
              </div>
            )}
            {armed === r.id ? (
              <button onClick={() => { (r.t === 'w' ? onDeleteWeighIn : onDeleteInBody)(r.id); setArmed(null) }} className="rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">Borrar</button>
            ) : (
              <button onClick={() => setArmed(r.id)} className="px-2 text-lg text-mute" aria-label="Opciones">×</button>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
