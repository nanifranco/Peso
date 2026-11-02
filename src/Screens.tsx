import { useState } from 'react'
import type { Achievement, State } from './lib/types'
import { daysBetween, fmt, predictFor, sortByDate, type Summary } from './lib/calc'
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

export function Home({ state, sum, onAdd, onAddInBody, onAddEvent, onOpenLogros, onDeleteEvent }: {
  state: State; sum: Summary; onAdd: () => void; onAddInBody: () => void; onAddEvent: () => void; onOpenLogros: () => void; onDeleteEvent: (id: string) => void
}) {
  const all = withHistory(state)
  const next = nextWeightMilestone(state)
  const lastEq = all.filter((a) => a.kind === 'equivalencia' && a.unlocked).pop()
  const recent = all
    .filter((a) => a.unlocked && state.unlocked[a.id])
    .sort((a, b) => state.unlocked[b.id].localeCompare(state.unlocked[a.id]))
    .slice(0, 8)
  const { p, firstIB, lastIB } = sum
  const ibDelta = (k: 'fatPct' | 'fatKg' | 'muscleKg' | 'visceral') =>
    sum.ib.length > 1 && firstIB?.[k] != null && lastIB?.[k] != null ? (lastIB[k] as number) - (firstIB[k] as number) : undefined
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between px-1">
        <div>
          <div className="text-sm text-mute">{greet}</div>
          <h1 className="font-display text-3xl font-extrabold">{p.name} 👋</h1>
        </div>
        {sum.daysSinceLast > 0 && <div className="text-right text-xs text-mute">último registro<br />hace {sum.daysSinceLast} {sum.daysSinceLast === 1 ? 'día' : 'días'}</div>}
      </header>

      {/* Héroe: avatar */}
      <section className="card relative overflow-hidden px-5 pb-5 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mute">Llevas</div>
            <div className="font-display text-6xl font-extrabold leading-none tracking-tight">
              {sum.lost >= 0 ? '−' : '+'}{fmt(Math.abs(sum.lost))}<span className="text-2xl"> kg</span>
            </div>
            <div className="mt-1 text-sm text-mute">{fmt(sum.startKg)} → <b className="text-ink">{fmt(sum.current)}</b> kg</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-sun/40 px-3 py-1 text-xs font-bold">{fmt(Math.max(0, sum.lostPct))}% menos</span>
            {sum.rate !== undefined && <span className="rounded-full bg-line/70 px-3 py-1 text-xs font-semibold">{sum.rate <= 0 ? '▼' : '▲'} {fmt(Math.abs(sum.rate), 2)} kg/sem</span>}
          </div>
        </div>
        <div className="-mb-2 mt-1 flex justify-center">
          <Avatar shape={sum.shape} lostKg={Math.max(0, sum.lost)} size={190} />
        </div>
        <div className="text-center text-xs text-mute">
          {sum.shape > 0.03 ? <>La línea punteada eres tú el día uno · {Math.round(sum.shape * 100)}% del camino</> : <>Tu avatar cambia conforme avanzas</>}
        </div>
        <button onClick={onAdd} className="btn-primary mt-4 w-full text-lg">+ Anotar peso</button>
      </section>

      {/* Siguiente hito */}
      {next && (
        <button onClick={onOpenLogros} className="card flex w-full items-center gap-4 p-4 text-left">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream text-3xl">{next.emoji}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-coral">Siguiente logro</div>
            <div className="truncate font-display text-lg font-bold">{next.title}</div>
            <div className="mb-2 text-sm text-mute">{next.remaining}{(next.remainingKg ?? 9) < 1 ? ' 👀 ¡ya casi!' : ''}</div>
            <Progress value={next.progress ?? 0} />
          </div>
        </button>
      )}

      {/* Equivalencia */}
      {lastEq && (
        <section className="card flex items-center gap-4 bg-sun/25! p-4">
          <div className="text-5xl">{lastEq.emoji}</div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mute">Ya no cargas</div>
            <div className="font-display text-xl font-bold leading-tight">{lastEq.title.split(': ')[1]}</div>
          </div>
        </section>
      )}

      {/* Cuerpo */}
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Tu cuerpo</h2>
          <button onClick={onAddInBody} className="rounded-full bg-sky/15 px-3 py-1.5 text-sm font-semibold text-sky">+ InBody</button>
        </div>
        {lastIB ? (
          <>
            <div className="grid grid-cols-2 gap-3">
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
              Último InBody: {dateLabel(lastIB.date)}{sum.ib.length > 1 ? ` · comparado con el primero (${dateLabel(firstIB!.date)})` : ' · sube otro para comparar'}
            </p>
          </>
        ) : (
          <p className="text-sm text-mute">Cuando tengas un InBody, súbelo aquí. Celebramos la grasa que pierdes y el músculo que ganas, no solo el peso.</p>
        )}
      </section>

      {/* IMC */}
      <section className="card p-5">
        <h2 className="mb-2 font-display text-xl font-bold">IMC</h2>
        <BmiGauge value={sum.curBmi} start={sum.startBmi} />
        <p className="mt-1 text-center text-xs text-mute">El círculo punteado es donde empezaste ({fmt(sum.startBmi)})</p>
      </section>

      {/* Eventos */}
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Lo que viene</h2>
          <button onClick={onAddEvent} className="rounded-full bg-line/70 px-3 py-1.5 text-sm font-semibold">+ Evento</button>
        </div>
        {state.events.filter((e) => e.date >= todayISO()).length === 0 && <p className="text-sm text-mute">Agrega un viaje o una fecha importante y te digo cómo llegarías a ese ritmo.</p>}
        <div className="space-y-2">
          {sortByDate(state.events).filter((e) => e.date >= todayISO()).map((e) => {
            const pr = predictFor(sum, e.date)
            const days = daysBetween(todayISO(), e.date)
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-cream p-3">
                <div className="flex-1">
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs text-mute">{dateLabel(e.date)} · en {days} días</div>
                </div>
                <div className="text-right">
                  {pr ? <><div className="font-display text-xl font-bold">~{fmt(pr.kg)} kg</div><div className="text-[11px] text-leaf">{pr.kg < sum.current ? `−${fmt(sum.current - pr.kg)} kg más` : 'a este ritmo'}</div></> : <div className="text-xs text-mute">anota más<br />para predecir</div>}
                </div>
                <button onClick={() => onDeleteEvent(e.id)} className="text-mute" aria-label="Borrar evento">×</button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recientes */}
      {recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-display text-xl font-bold">Logros recientes</h2>
            <button onClick={onOpenLogros} className="text-sm font-semibold text-coral">Ver todos</button>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {recent.map((a) => (
              <div key={a.id} className="card w-36 shrink-0 p-3">
                <div className="text-3xl">{a.emoji}</div>
                <div className="mt-1 text-sm font-semibold leading-tight">{a.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}
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
