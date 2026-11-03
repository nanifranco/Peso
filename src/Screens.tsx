import { useState } from 'react'
import type { Achievement, State } from './lib/types'
import { bmiCategory, daysBetween, estBodyFat, fmt, predictFor, sortByDate, type Summary } from './lib/calc'
import { KIND_LABEL, nextWeightMilestone, withHistory } from './lib/achievements'
import { todayISO } from './lib/store'
import { BodyDonut, CompositionChart, GapChart, GoalRing, MetricChart, MonthlyBars, ProgressRing, WeightChart } from './components/Charts'
import BmiGauge from './components/BmiGauge'
import { Progress } from './components/ui'

const dateLabel = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

function Delta({ v, unit, goodWhen }: { v?: number; unit: string; goodWhen: 'down' | 'up' }) {
  if (v === undefined || Math.abs(v) < 0.05) return <span className="text-xs text-mute">—</span>
  const good = goodWhen === 'down' ? v < 0 : v > 0
  return (
    <span className={`text-xs font-semibold ${good ? 'text-leaf' : 'text-mute'}`}>
      {v > 0 ? '▲' : '▼'} {fmt(Math.abs(v))} {unit}
    </span>
  )
}

export function Home({ state, sum, onAdd, onAddInBody, onOpenLogros, onOpenCharts, onDeleteEvent }: {
  state: State; sum: Summary; onAdd: () => void; onAddInBody: () => void; onOpenLogros: () => void; onOpenCharts: () => void; onDeleteEvent: (id: string) => void
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
  // Con meta: avance a la meta. Sin meta: avance al siguiente escalón de 5% (−5%, −10%, −15%…)
  const hasGoal = !!p.goalKg && sum.startKg > p.goalKg
  const nextStep = Math.max(5, Math.ceil((Math.max(0, sum.lostPct) + 0.01) / 5) * 5)
  const ringPct = hasGoal ? sum.lost / (sum.startKg - p.goalKg!) : sum.lostPct / nextStep

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between px-1 pb-1">
        <div>
          <div className="text-sm text-mute">{greet}</div>
          <h1 className="font-display text-3xl font-extrabold">{p.name}</h1>
        </div>
        {sum.daysSinceLast > 0 && <div className="text-right text-xs text-mute">último registro<br />hace {sum.daysSinceLast} {sum.daysSinceLast === 1 ? 'día' : 'días'}</div>}
      </header>

      {/* Héroe: anillo de progreso */}
      <section className="hero relative overflow-hidden rounded-[32px] p-5">
        <div className="flex justify-center">
          <ProgressRing pct={ringPct} lostKg={sum.lost} caption={hasGoal ? 'de tu meta' : `hacia −${nextStep}%`} size={210} />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          <Tile label="Hoy" value={fmt(sum.current)} unit="kg" />
          <Tile label="Inicio" value={fmt(sum.startKg)} unit="kg" />
          <Tile label="Grasa" value={fmt(sum.fatNow, 0)} unit="%" />
          <Tile label="Ritmo" value={sum.rate !== undefined ? `${sum.rate <= 0 ? '−' : '+'}${fmt(Math.abs(sum.rate))}` : '—'} unit="kg/sem" />
        </div>
        {lastEq && lost > 0.5 && (
          <div className="mt-3 rounded-2xl bg-white/60 px-3 py-2 text-center text-[13px] text-ink/75">
            {lastEq.emoji} Ya no cargas {lastEq.title.split(': ')[1]}
          </div>
        )}
        <button onClick={onAdd} className="btn-primary mt-3 w-full text-lg">+ Anotar peso</button>
      </section>

      {/* Mini gráfica */}
      {sum.ws.length > 1 && (
        <button onClick={onOpenCharts} className="card block w-full p-4 text-left">
          <div className="mb-1 flex items-center justify-between">
            <div className="font-display text-lg font-bold">Tu tendencia</div>
            <div className="text-sm font-semibold text-coral">Ver gráficas →</div>
          </div>
          <WeightChart data={sum.ws} compact height={90} />
        </button>
      )}

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

function Tile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-white/60 px-1 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink/45">{label}</div>
      <div className="font-display text-lg font-extrabold leading-tight">{value}</div>
      <div className="text-[10px] text-ink/50">{unit}</div>
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

export function Historial({ state, sum, onDeleteWeighIn, onDeleteInBody, onOpenSettings }: { state: State; sum: Summary; onDeleteWeighIn: (id: string) => void; onDeleteInBody: (id: string) => void; onOpenSettings: () => void }) {
  const [armed, setArmed] = useState<string | null>(null)
  const rows = [
    ...state.weighIns.map((w) => ({ t: 'w' as const, id: w.id, date: w.date, w })),
    ...state.inbodies.map((i) => ({ t: 'i' as const, id: i.id, date: i.date, i })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  const trendByDate = Object.fromEntries(sum.ws.map((x) => [x.date, x.trend]))
  return (
    <div className="space-y-4">
      <header className="px-1">
        <h1 className="font-display text-3xl font-extrabold">Gráficas</h1>
        <p className="text-sm text-mute">Toca o desliza sobre las gráficas para ver cada dato</p>
      </header>
      <section className="card p-4">
        <h2 className="font-display text-lg font-bold">Peso</h2>
        <p className="mb-2 text-xs text-mute">
          <Key c="#E2512F" /> tendencia · <Key c="#2A1F1A" o=".3" dot /> báscula{sum.rate !== undefined && sum.rate < 0 ? <> · <Key c="#E2512F" dash /> a tu ritmo</> : null}
        </p>
        <WeightChart data={sum.ws} goal={sum.p.goalKg} rate={sum.rate} inbodyDates={state.inbodies.map((i) => i.date)} />
      </section>
      <section className="card p-4">
        <h2 className="font-display text-lg font-bold">Kilos por mes</h2>
        <p className="mb-2 text-xs text-mute">Cuánto cambió tu peso cada mes</p>
        <MonthlyBars data={state.weighIns} />
      </section>
      <section className="card p-5">
        <h2 className="mb-1 font-display text-lg font-bold">IMC</h2>
        <BmiGauge value={sum.curBmi} start={sum.startBmi} />
        <p className="mt-1 text-center text-xs text-mute">El círculo punteado es donde empezaste ({fmt(sum.startBmi)})</p>
      </section>
      <BodySection state={state} sum={sum} onOpenSettings={onOpenSettings} />
      <h2 className="px-1 pt-2 font-display text-lg font-bold">Registros</h2>
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

function Key({ c, o = '1', dot, dash }: { c: string; o?: string; dot?: boolean; dash?: boolean }) {
  if (dot) return <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: c, opacity: o }} />
  return <span className="inline-block w-4 align-middle" style={{ borderTop: `2.5px ${dash ? 'dotted' : 'solid'} ${c}` }} />
}

/* ------------------------------------------------------------------ */
/* Tu cuerpo: ideales + gráficas del InBody                            */
/* ------------------------------------------------------------------ */
function BodySection({ state, sum, onOpenSettings }: { state: State; sum: Summary; onOpenSettings: () => void }) {
  const p = sum.p
  const ib = sortByDate(state.inbodies)
  const f = sum.firstIB, l = sum.lastIB
  if (!l) {
    return (
      <section className="card p-5 text-sm text-mute">
        <h2 className="mb-1 font-display text-lg font-bold text-ink">Tu cuerpo</h2>
        Sube un InBody (botón +) y aquí aparecen tus gráficas de grasa, músculo, visceral y metabolismo, y puedes ponerte ideales.
      </section>
    )
  }
  const series = (k: 'fatPct' | 'fatKg' | 'muscleKg' | 'visceral' | 'bmr') => ib.filter((i) => i[k] != null).map((i) => ({ date: i.date, v: i[k] as number }))
  // Peso al que llegarías con tus ideales: masa magra actual (+ el músculo que quieras ganar) ÷ (1 − grasa ideal)
  const leanNow = l.kg != null && l.fatPct != null ? l.kg * (1 - l.fatPct / 100) : undefined
  const leanIdeal = leanNow !== undefined ? leanNow + (p.goalMuscleKg && l.muscleKg != null ? Math.max(0, p.goalMuscleKg - l.muscleKg) : 0) : undefined
  const idealWeight = leanIdeal !== undefined && p.goalFatPct ? leanIdeal / (1 - p.goalFatPct / 100) : undefined
  const idealFatKg = idealWeight !== undefined && p.goalFatPct ? idealWeight * (p.goalFatPct / 100) : undefined
  const weightIdeal = idealWeight ?? (p.goalKg && sum.startKg > p.goalKg ? p.goalKg : undefined)
  const fatSeries = sortByDate(state.weighIns).map((w) => ({ date: w.date, v: estBodyFat(w.kg, state) }))
  const fatStart = fatSeries[0]?.v ?? sum.fatNow

  return (
    <>
      <section className="card space-y-4 p-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Tus ideales</h2>
            <button onClick={onOpenSettings} className="text-sm font-semibold text-coral">Cambiar en Ajustes</button>
          </div>
        </div>
        {(weightIdeal !== undefined || p.goalFatPct || p.goalMuscleKg) && (
          <div className="grid grid-cols-3 gap-2">
            {weightIdeal !== undefined && <GoalRing title="Peso" start={sum.startKg} now={sum.current} ideal={weightIdeal} better="down" unit="kg" color="#E2512F" />}
            {p.goalFatPct && <GoalRing title="Grasa" start={fatStart} now={sum.fatNow} ideal={p.goalFatPct} better="down" unit="%" color="#F08A24" />}
            {p.goalMuscleKg && l.muscleKg != null && <GoalRing title="Músculo" start={f?.muscleKg ?? l.muscleKg} now={l.muscleKg} ideal={p.goalMuscleKg} better="up" unit="kg" color="#3F6FD8" />}
          </div>
        )}
        {idealWeight !== undefined && (
          <p className="rounded-2xl bg-sun/25 p-3 text-[13px] leading-relaxed">
            Tu <b>peso ideal</b> sale de tus ideales: con {fmt(p.goalFatPct!, 0)}% de grasa{p.goalMuscleKg ? <> y {fmt(p.goalMuscleKg)} kg de músculo</> : null} pesarías unos <b>{fmt(idealWeight)} kg</b>. Se calcula con tu masa magra del InBody del {dateLabel(l.date)}; es una aproximación.
          </p>
        )}
        {!p.goalFatPct && !p.goalMuscleKg && <button onClick={onOpenSettings} className="btn-ghost w-full text-sm">Pon tu grasa y músculo ideales en Ajustes →</button>}
      </section>

      {weightIdeal !== undefined && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Camino a tu peso ideal</h2>
          <p className="mb-1 text-xs text-mute">La franja es lo que te falta; la línea punteada, a dónde llegas a tu ritmo.</p>
          <GapChart points={state.weighIns.map((w) => ({ date: w.date, v: w.kg }))} ideal={weightIdeal} better="down" unit="kg" color="#E2512F" />
        </section>
      )}
      {p.goalFatPct && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Camino a tu grasa ideal</h2>
          <p className="mb-1 text-xs text-mute">% de grasa estimado con cada peso que anotaste y tu masa magra del InBody.</p>
          <GapChart points={fatSeries} ideal={p.goalFatPct} better="down" unit="%" color="#F08A24" estimated />
        </section>
      )}
      {p.goalMuscleKg && series('muscleKg').length > 0 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Camino a tu músculo ideal</h2>
          <p className="mb-1 text-xs text-mute">Músculo esquelético de cada InBody.</p>
          <GapChart points={series('muscleKg')} ideal={p.goalMuscleKg} better="up" unit="kg" color="#3F6FD8" />
        </section>
      )}


      <section className="card p-4">
        <h2 className="font-display text-lg font-bold">De qué estás hecha</h2>
        <p className="mb-3 text-xs text-mute">Tu último InBody ({dateLabel(l.date)})</p>
        <BodyDonut ib={l} />
      </section>

      {series('fatPct').length > 0 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">% de grasa</h2>
          <MetricChart points={series('fatPct')} color="#E2512F" unit="%" ideal={p.goalFatPct} better="down" />
        </section>
      )}
      {series('muscleKg').length > 0 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Músculo esquelético</h2>
          <MetricChart points={series('muscleKg')} color="#3F6FD8" unit="kg" ideal={p.goalMuscleKg} better="up" />
        </section>
      )}
      {series('fatKg').length > 0 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Masa grasa</h2>
          <MetricChart points={series('fatKg')} color="#E2512F" unit="kg" ideal={idealFatKg} better="down" />
        </section>
      )}
      {ib.length > 1 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Grasa vs. músculo</h2>
          <p className="mb-2 text-xs text-mute"><Key c="#E2512F" /> grasa · <Key c="#3F6FD8" /> músculo (kg)</p>
          <CompositionChart ib={state.inbodies} />
        </section>
      )}
      {series('visceral').length > 0 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Grasa visceral</h2>
          <p className="text-xs text-mute">La que rodea tus órganos. En InBody, menos de 10 es el rango sano.</p>
          <MetricChart points={series('visceral')} color="#C2407A" unit="nivel" healthyBelow={10} better="down" decimals={0} />
        </section>
      )}
      {series('bmr').length > 0 && (
        <section className="card p-4">
          <h2 className="font-display text-lg font-bold">Metabolismo basal</h2>
          <p className="text-xs text-mute">Lo que tu cuerpo quema en reposo. El músculo lo sostiene.</p>
          <MetricChart points={series('bmr')} color="#3F6FD8" unit="kcal" better="up" decimals={0} />
        </section>
      )}
    </>
  )
}
