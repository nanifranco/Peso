import { useEffect, useState } from 'react'
import type { Achievement, State } from './lib/types'
import { bmiCategory, daysBetween, estBodyFat, fatness, fmt, predictFor, sortByDate, type Summary } from './lib/calc'
import { KIND_LABEL, nextWeightMilestone, withHistory } from './lib/achievements'
import { todayISO } from './lib/store'
import { blip, setSound, soundOn } from './lib/sound'
import Sprite, { type PowerUps } from './components/Sprite'
import PixelEmoji from './components/PixelEmoji'
import BmiGauge from './components/BmiGauge'
import Chart from './components/Chart'
import { Progress } from './components/ui'

const dateLabel = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
const pad = (n: number, w = 3) => {
  const [i, d] = fmt(Math.abs(n)).split('.')
  return i.padStart(w, '0') + (d !== undefined ? '.' + d : '')
}

/** Nivel = 1 + un nivel cada 3 logros. Los power-ups se ganan por nivel. */
export function levelInfo(state: State) {
  const all = withHistory(state)
  const got = all.filter((a) => a.unlocked).length
  const level = 1 + Math.floor(got / 3)
  const goal = all.some((a) => a.unlocked && (a.id.startsWith('meta8') || a.id === 'imc25'))
  const power: PowerUps = { headband: level >= 2, wrist: level >= 3, shoes: level >= 5, cape: level >= 7, crown: goal }
  const names = [power.crown && 'CORONA', power.cape && 'CAPA', power.shoes && 'TENIS DORADOS', power.wrist && 'MUÑEQUERAS', power.headband && 'BANDA'].filter(Boolean) as string[]
  const nextAt = [2, 3, 5, 7].find((l) => l > level)
  return { level, got, power, names, toNext: nextAt ? (nextAt - 1) * 3 - got : 0 }
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - k, 3)) * 10) / 10)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

function Delta({ v, unit, goodWhen }: { v?: number; unit: string; goodWhen: 'down' | 'up' }) {
  if (v === undefined || Math.abs(v) < 0.05) return <span className="text-lg text-mute">—</span>
  const good = goodWhen === 'down' ? v < 0 : v > 0
  return <span className={`text-lg ${good ? 'text-leaf' : 'text-pink'}`}>{v > 0 ? '▲' : '▼'} {fmt(Math.abs(v))} {unit}</span>
}

function Bar({ value, color }: { value: number; color: string }) {
  const n = 12
  const on = Math.round(Math.max(0, Math.min(1, value)) * n)
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-3 flex-1" style={{ background: i < on ? color : '#1c1c44', boxShadow: i < on ? `0 0 6px ${color}` : undefined }} />
      ))}
    </div>
  )
}

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="font-display text-[12px] text-sky glow-c">{children}</h2>

export function Home({ state, sum, onAdd, onAddInBody, onAddEvent, onOpenLogros, onDeleteEvent }: {
  state: State; sum: Summary; onAdd: () => void; onAddInBody: () => void; onAddEvent: () => void; onOpenLogros: () => void; onDeleteEvent: (id: string) => void
}) {
  const all = withHistory(state)
  const next = nextWeightMilestone(state)
  const items = all.filter((a) => a.kind === 'equivalencia')
  const recent = all
    .filter((a) => a.unlocked && state.unlocked[a.id])
    .sort((a, b) => state.unlocked[b.id].localeCompare(state.unlocked[a.id]))
    .slice(0, 8)
  const { p, firstIB, lastIB } = sum
  const ibDelta = (k: 'fatPct' | 'fatKg' | 'muscleKg' | 'visceral') =>
    sum.ib.length > 1 && firstIB?.[k] != null && lastIB?.[k] != null ? (lastIB[k] as number) - (firstIB[k] as number) : undefined
  const lv = levelInfo(state)
  const [sound, setSnd] = useState(soundOn())

  // Replay: ver tu personaje en cualquier registro
  const last = sum.ws.length - 1
  const [idx, setIdx] = useState<number | null>(null) // null = siempre el más reciente
  const i = idx === null ? last : Math.min(idx, last)
  const pt = sum.ws[i]
  const kgAt = pt.trend
  const lostAt = Math.max(0, sum.startKg - kgAt)
  const isToday = i === last
  const bfAt = isToday && lastIB?.fatPct && lastIB.date >= pt.date ? lastIB.fatPct : estBodyFat(kgAt, state)
  const bfStart = estBodyFat(sum.startKg, state)
  const score = useCountUp(lostAt)
  const hi = Math.min(...sum.ws.map((w) => w.kg))
  const cat = bmiCategory(sum.curBmi)

  return (
    <div className="space-y-4">
      {/* HUD */}
      <header className="flex items-start justify-between px-1 font-display text-[10px] leading-relaxed">
        <div>
          <div className="text-pink glow-p">1UP</div>
          <div className="uppercase">{p.name}</div>
        </div>
        <div className="text-center">
          <div className="text-pink glow-p">HI-SCORE</div>
          <div>{fmt(hi)} KG</div>
        </div>
        <button
          onClick={() => { const n = !sound; setSound(n); setSnd(n); if (n) blip() }}
          className="rounded border-2 border-wall px-2 py-1.5 text-[10px]"
          aria-label={sound ? 'Apagar sonido' : 'Prender sonido'}
        >
          {sound ? '♪ ON' : '♪ OFF'}
        </button>
      </header>

      {/* Pantalla principal */}
      <section className="stage relative overflow-hidden rounded-[10px] px-4 pb-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-[10px] text-mute">SCORE · KG FUERA</div>
            <div className="mt-2 font-display text-[34px] leading-none text-coral glow-y">{pad(score)}</div>
          </div>
          <div className="text-right font-display text-[10px] leading-loose">
            <div className="text-mute">NIVEL</div>
            <div className="text-xl text-leaf" style={{ textShadow: '0 0 10px rgba(57,255,122,.7)' }}>{String(lv.level).padStart(2, '0')}</div>
          </div>
        </div>
        <div className="mt-2 flex justify-between gap-3 whitespace-nowrap text-xl">
          <span className="text-mute">{fmt(sum.startKg)} → <span className="text-ink">{fmt(kgAt)} kg</span></span>
          <span className="text-mute">grasa{isToday && lastIB?.fatPct ? '' : ' est.'} <span className="text-ink">{fmt(bfAt)}%</span></span>
        </div>

        <div className="relative mt-2 flex justify-center">
          <Sprite fat={fatness(bfAt, p.sex)} ghostFat={i > 0 ? fatness(bfStart, p.sex) : undefined} sex={p.sex} power={lv.power} px={6} />
          {/* piso tipo laberinto */}
          <div className="absolute inset-x-6 bottom-0 h-[3px] bg-wall shadow-[0_0_10px_#2a2aff]" />
        </div>
        <p className="mt-2 text-center text-lg leading-tight text-mute">
          {i > 0 ? <>El contorno azul es <span className="text-sky">tu fantasma del día uno</span></> : <>Cada kilo que bajes cambia tu personaje</>}
        </p>
        {lv.names.length > 0 && (
          <p className="mt-1 text-center text-lg text-coral">⚡ {lv.names.join(' · ')}</p>
        )}

        {last > 0 && (
          <div className="mt-3 rounded-md border-2 border-line px-3 pb-1 pt-2">
            <div className="flex items-center justify-between font-display text-[9px]">
              <span className="text-sky">◀ REPLAY ▶</span>
              <span>{isToday ? 'HOY' : i === 0 ? 'DÍA 1' : dateLabel(pt.date).toUpperCase()}</span>
            </div>
            <input
              type="range"
              className="time"
              min={0}
              max={last}
              value={i}
              onChange={(e) => { const v = Number(e.target.value); setIdx(v === last ? null : v) }}
              style={{ ['--p' as string]: `${(i / last) * 100}%` }}
              aria-label="Ver tu personaje en otra fecha"
            />
          </div>
        )}

        <button onClick={onAdd} className="btn-primary mt-4 w-full">▶ Anotar peso</button>
        {sum.daysSinceLast >= 7 && <div className="blink mt-3 text-center font-display text-[10px] text-pink">INSERT COIN · {sum.daysSinceLast} DÍAS SIN JUGAR</div>}
      </section>

      {/* Números */}
      <section className="grid grid-cols-3 gap-2">
        {[
          { l: 'IMC', v: fmt(sum.curBmi), s: cat.label, c: cat.color },
          { l: 'MENOS', v: `${fmt(Math.max(0, sum.lostPct))}%`, s: 'de tu peso', c: undefined },
          { l: 'RITMO', v: sum.rate !== undefined ? fmt(Math.abs(sum.rate), 2) : '—', s: sum.rate !== undefined ? (sum.rate <= 0 ? 'kg/sem ▼' : 'kg/sem ▲') : 'anota más', c: undefined },
        ].map((x) => (
          <div key={x.l} className="card p-3 text-center">
            <div className="font-display text-[9px] text-sky">{x.l}</div>
            <div className="mt-2 font-display text-[15px]">{x.v}</div>
            <div className="mt-1 text-lg leading-none" style={{ color: x.c ?? 'var(--color-mute)' }}>{x.s}</div>
          </div>
        ))}
      </section>

      {/* Próximo logro */}
      {next && (
        <button onClick={onOpenLogros} className="card flex w-full items-center gap-4 p-4 text-left">
          <PixelEmoji e={next.emoji} size={48} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[9px] text-pink glow-p">PRÓXIMO LOGRO</div>
            <div className="mt-1.5 text-2xl leading-none">{next.title}</div>
            <div className="mb-2 text-lg text-mute">{next.remaining}{(next.remainingKg ?? 9) < 1 ? ' · ¡ya casi!' : ''}</div>
            <Bar value={next.progress ?? 0} color="#ffe600" />
          </div>
        </button>
      )}

      {/* Inventario */}
      <section className="card p-4">
        <div className="mb-3">
          <H2>INVENTARIO</H2>
          <div className="mt-1 text-lg text-mute">Todo lo que ya no cargas</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {items.map((a) => (
            <div key={a.id} className={`flex flex-col items-center rounded-md border-2 p-1.5 ${a.unlocked ? 'border-coral/70 bg-coral/5' : 'border-line'}`}>
              {a.unlocked ? <PixelEmoji e={a.emoji} size={36} /> : <div className="grid h-9 w-9 place-items-center font-display text-sm text-mute">?</div>}
              <div className="mt-1 font-display text-[8px] text-mute">{a.title.split(' kg')[0]} KG</div>
            </div>
          ))}
        </div>
        {(() => {
          const lastEq = items.filter((a) => a.unlocked).pop()
          return lastEq ? <p className="mt-3 text-xl leading-tight">Ya no cargas <span className="text-coral">{lastEq.title.split(': ')[1]}</span>.</p> : null
        })()}
      </section>

      {/* Stats RPG */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <H2>STATS</H2>
          <button onClick={onAddInBody} className="rounded border-2 border-sky px-2 py-1 font-display text-[9px] text-sky">+ INBODY</button>
        </div>
        {lastIB ? (
          <div className="space-y-3">
            {[
              { l: 'GRASA', v: lastIB.fatPct, u: '%', bar: 1 - (lastIB.fatPct ?? 0) / 50, c: '#ff3fa4', d: ibDelta('fatPct'), g: 'down' as const, du: 'pts' },
              { l: 'FUERZA', v: lastIB.muscleKg, u: 'kg músc.', bar: ((lastIB.muscleKg ?? 0) - 20) / 30, c: '#39ff7a', d: ibDelta('muscleKg'), g: 'up' as const, du: 'kg' },
              { l: 'DEFENSA', v: lastIB.visceral, u: 'visceral', bar: 1 - (lastIB.visceral ?? 0) / 20, c: '#00e5ff', d: ibDelta('visceral'), g: 'down' as const, du: '' },
            ].filter((x) => x.v != null).map((x) => (
              <div key={x.l}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="font-display text-[10px]" style={{ color: x.c }}>{x.l}</span>
                  <span className="whitespace-nowrap text-lg"><span className="text-ink">{fmt(x.v!, x.l === 'DEFENSA' ? 0 : 1)}</span> <span className="text-mute">{x.u}</span> · <Delta v={x.d} unit={x.du} goodWhen={x.g} /></span>
                </div>
                <Bar value={x.bar} color={x.c} />
              </div>
            ))}
            {lastIB.fatKg != null && firstIB?.fatKg != null && sum.ib.length > 1 && (
              <p className="text-xl leading-tight">Grasa total: <span className="text-coral">{fmt(lastIB.fatKg)} kg</span> <Delta v={ibDelta('fatKg')} unit="kg" goodWhen="down" /></p>
            )}
            <p className="text-lg leading-tight text-mute">
              Último: {dateLabel(lastIB.date)}{sum.ib.length > 1 ? ` · vs. el primero (${dateLabel(firstIB!.date)})` : ' · sube otro para comparar'}
            </p>
          </div>
        ) : (
          <p className="text-xl leading-tight text-mute">Sube un InBody para desbloquear tus stats: grasa, fuerza (músculo) y defensa (grasa visceral). Tu personaje se vuelve más exacto.</p>
        )}
      </section>

      {/* Misiones */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <H2>MISIONES</H2>
          <button onClick={onAddEvent} className="rounded border-2 border-line px-2 py-1 font-display text-[9px]">+ NUEVA</button>
        </div>
        {state.events.filter((e) => e.date >= todayISO()).length === 0 && <p className="text-xl leading-tight text-mute">Agrega un viaje o una fecha importante y te digo cómo llegarías a tu ritmo actual.</p>}
        <div className="space-y-2">
          {sortByDate(state.events).filter((e) => e.date >= todayISO()).map((e) => {
            const pr = predictFor(sum, e.date)
            const days = daysBetween(todayISO(), e.date)
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-md border-2 border-line p-3">
                <div className="flex-1">
                  <div className="text-2xl leading-none">{e.name}</div>
                  <div className="text-lg text-mute">{dateLabel(e.date)} · en {days} días</div>
                </div>
                <div className="text-right">
                  {pr ? <><div className="font-display text-[13px] text-coral">~{fmt(pr.kg)}</div><div className="text-lg text-leaf">{pr.kg < sum.current ? `−${fmt(sum.current - pr.kg)} kg más` : 'a este ritmo'}</div></> : <div className="text-lg leading-tight text-mute">anota más<br />para predecir</div>}
                </div>
                <button onClick={() => onDeleteEvent(e.id)} className="text-2xl text-mute" aria-label="Borrar misión">×</button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recientes */}
      {recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <H2>LOGROS RECIENTES</H2>
            <button onClick={onOpenLogros} className="font-display text-[9px] text-coral">VER TODOS ▶</button>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {recent.map((a) => (
              <div key={a.id} className="card w-36 shrink-0 p-3">
                <PixelEmoji e={a.emoji} size={36} />
                <div className="mt-1 text-lg leading-none">{a.title}</div>
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
  const lv = levelInfo(state)
  return (
    <div className="space-y-5">
      <header className="px-1">
        <h1 className="font-display text-lg text-coral glow-y">LOGROS</h1>
        <p className="mt-2 text-xl text-mute">{got} de {all.length} desbloqueados · nivel {lv.level}{lv.toNext > 0 ? ` · ${lv.toNext} para el próximo power-up` : ''}</p>
        <div className="mt-3"><Bar value={all.length ? got / all.length : 0} color="#39ff7a" /></div>
      </header>
      {kinds.map((k) => {
        const list = all.filter((a) => a.kind === k)
        if (!list.length) return null
        return (
          <section key={k}>
            <div className="mb-2 px-1"><H2>{KIND_LABEL[k].toUpperCase()}</H2></div>
            <div className="grid grid-cols-2 gap-3">
              {list.map((a) => (
                <button key={a.id} onClick={() => setOpen(a)} className={`card p-3 text-left ${a.unlocked ? '' : 'opacity-70'}`}>
                  {a.unlocked ? <PixelEmoji e={a.emoji} size={36} /> : <PixelEmoji e="🔒" size={36} dim />}
                  <div className="mt-1.5 text-xl leading-none">{a.title}</div>
                  {a.unlocked ? (
                    <div className="mt-1 text-lg text-leaf">✓ {state.unlocked[a.id] ? new Date(state.unlocked[a.id] + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'logrado'}</div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {a.progress !== undefined && <Progress value={a.progress} color="#8a8ac4" />}
                      <div className="text-lg leading-none text-mute">{a.remaining}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )
      })}
      {open && (
        <div className="fade-in fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6" onClick={() => setOpen(null)}>
          <div className="pop-in card w-full max-w-sm p-6 text-center">
            {open.unlocked ? <PixelEmoji e={open.emoji} size={80} /> : <PixelEmoji e="🔒" size={80} dim />}
            <h3 className="mt-4 font-display text-[13px] leading-relaxed">{open.title}</h3>
            <p className="mt-3 text-xl leading-tight text-ink/80">{open.unlocked ? open.body : `Todavía no: ${open.remaining ?? 'sigue así'}.`}</p>
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
        <h1 className="font-display text-lg text-coral glow-y">HISTORIAL</h1>
        <p className="mt-2 text-xl leading-tight text-mute">Puntos: lo que marcó la báscula · Línea: tu tendencia real</p>
      </header>
      <section className="card p-4">
        <Chart data={sum.ws} goal={sum.p.goalKg} inbodyDates={state.inbodies.map((i) => i.date)} />
      </section>
      <section className="card p-4">
        <H2>IMC</H2>
        <BmiGauge value={sum.curBmi} start={sum.startBmi} />
        <p className="mt-1 text-center text-lg text-mute">El círculo punteado es donde empezaste ({fmt(sum.startBmi)})</p>
      </section>
      <section className="card divide-y-2 divide-line overflow-hidden">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-14 shrink-0 text-lg leading-tight text-mute">{new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}<br />{r.date.slice(0, 4)}</div>
            {r.t === 'w' ? (
              <div className="flex-1">
                <div><span className="font-display text-[13px]">{fmt(r.w.kg)}</span> <span className="text-lg text-mute">kg · tend. {fmt(trendByDate[r.date] ?? r.w.kg)}</span></div>
                {r.w.note && <div className="text-lg leading-tight text-ink/70">✎ {r.w.note}</div>}
              </div>
            ) : (
              <div className="flex-1">
                <div className="font-display text-[11px] text-sky">INBODY</div>
                <div className="text-lg leading-tight text-ink/70">
                  {[r.i.kg && `${fmt(r.i.kg)} kg`, r.i.fatPct && `${fmt(r.i.fatPct)}% grasa`, r.i.muscleKg && `${fmt(r.i.muscleKg)} kg músculo`, r.i.visceral && `visceral ${r.i.visceral}`].filter(Boolean).join(' · ')}
                </div>
              </div>
            )}
            {armed === r.id ? (
              <button onClick={() => { (r.t === 'w' ? onDeleteWeighIn : onDeleteInBody)(r.id); setArmed(null) }} className="rounded bg-pink px-2 py-1 font-display text-[9px] text-white">BORRAR</button>
            ) : (
              <button onClick={() => setArmed(r.id)} className="px-2 text-2xl text-mute" aria-label="Opciones">×</button>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
