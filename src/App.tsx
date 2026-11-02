import { useEffect, useMemo, useRef, useState } from 'react'
import type { Achievement, State } from './lib/types'
import { coachMessage, summary } from './lib/calc'
import { syncUnlocked } from './lib/achievements'
import { demoState, emptyState, loadState, saveState, todayISO, uid } from './lib/store'
import { Celebration, Sheet, Toast } from './components/ui'
import { EventForm, InBodyForm, ProfileForm, WeighInForm } from './components/Forms'
import { Historial, Home, Logros } from './Screens'
import Avatar from './components/Avatar'

type Tab = 'inicio' | 'logros' | 'historial' | 'ajustes'
type SheetKind = null | 'peso' | 'inbody' | 'evento' | 'menu'

export default function App() {
  const [state, setState] = useState<State>(loadState)
  const [tab, setTab] = useState<Tab>('inicio')
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [queue, setQueue] = useState<Achievement[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => { saveState(state) }, [state])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 7000)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }) }, [tab])

  const ready = !!state.profile && state.weighIns.length > 0
  const sum = useMemo(() => (ready ? summary(state) : undefined), [state, ready])

  /** Aplica un cambio, detecta logros nuevos y los celebra */
  const commit = (next: State, message?: (after: ReturnType<typeof summary>) => string) => {
    const { state: synced, fresh } = syncUnlocked(next)
    setState(synced)
    if (fresh.length) setQueue((q) => [...q, ...fresh.sort((a, b) => Number(!!b.big) - Number(!!a.big))])
    if (message && synced.profile && synced.weighIns.length) setToast(message(summary(synced)))
  }

  if (!ready) {
    return (
      <div className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-md flex-col px-5">
        <div className="flex flex-col items-center pt-4 text-center">
          <Avatar fat={0.55} width={96} />
          <h1 className="mt-2 font-display text-4xl font-extrabold">Peso</h1>
          <p className="mt-2 text-mute">Anota cuando quieras. Yo me encargo de celebrar cada cosa que logres: kilos, grasa, músculo y salud.</p>
        </div>
        <div className="card mt-6 p-5">
          <ProfileForm
            withWeight
            cta="Empezar"
            onSave={(p, kg) => {
              const s = { ...emptyState(), profile: p, weighIns: [{ id: uid(), date: todayISO(), kg: kg! }] }
              const { state: synced } = syncUnlocked(s)
              setState(synced)
              setToast(coachMessage(undefined, summary(synced)))
            }}
          />
        </div>
        <button
          onClick={() => {
            const { state: synced, fresh } = syncUnlocked(demoState())
            setState(synced)
            setQueue(fresh.filter((a) => a.big).slice(0, 2))
          }}
          className="mx-auto mt-4 text-sm font-semibold text-coral underline underline-offset-4"
        >
          Ver con datos de ejemplo
        </button>
      </div>
    )
  }

  const s = sum!

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <div ref={scroller} className="safe-top flex-1 overflow-y-auto px-4 pb-32">
        {tab === 'inicio' && (
          <Home
            state={state}
            sum={s}
            onAdd={() => setSheet('peso')}
            onAddInBody={() => setSheet('inbody')}
            onOpenLogros={() => setTab('logros')}
            onDeleteEvent={(id) => setState({ ...state, events: state.events.filter((e) => e.id !== id) })}
          />
        )}
        {tab === 'logros' && <Logros state={state} />}
        {tab === 'historial' && (
          <Historial
            state={state}
            sum={s}
            onDeleteWeighIn={(id) => state.weighIns.length > 1 && setState({ ...state, weighIns: state.weighIns.filter((w) => w.id !== id) })}
            onDeleteInBody={(id) => setState({ ...state, inbodies: state.inbodies.filter((i) => i.id !== id) })}
          />
        )}
        {tab === 'ajustes' && <Ajustes state={state} onChange={(n) => commit(n)} onReset={() => { setState(emptyState()); setTab('inicio') }} />}
      </div>

      {/* Barra inferior */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4">
        <div className="flex items-center gap-2 rounded-[28px] border border-line bg-paper/90 p-1.5 shadow-lg backdrop-blur">
          {([
            ['inicio', '🏠', 'Inicio'],
            ['logros', '🏆', 'Logros'],
            ['historial', '📈', 'Historial'],
            ['ajustes', '⚙️', 'Ajustes'],
          ] as [Tab, string, string][]).map(([t, ic, l]) => (
            <button key={t} onClick={() => setTab(t)} className={`flex flex-1 flex-col items-center rounded-3xl py-1.5 text-[11px] font-semibold transition ${tab === t ? 'bg-cream text-ink' : 'text-mute'}`}>
              <span className={`text-lg ${tab === t ? '' : 'grayscale opacity-70'}`}>{ic}</span>
              {l}
            </button>
          ))}
          <button onClick={() => setSheet('menu')} className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-coral text-3xl font-light text-white shadow-md active:scale-95" aria-label="Agregar">+</button>
        </div>
      </nav>

      <Sheet open={sheet === 'menu'} onClose={() => setSheet(null)} title="¿Qué anotamos?">
        <div className="grid gap-3 pb-4">
          <button onClick={() => setSheet('peso')} className="card flex items-center gap-4 p-4 text-left">
            <span className="text-4xl">⚖️</span>
            <span><b className="font-display text-lg">Peso</b><br /><span className="text-sm text-mute">Lo de la báscula, con nota si quieres</span></span>
          </button>
          <button onClick={() => setSheet('inbody')} className="card flex items-center gap-4 p-4 text-left">
            <span className="text-4xl">🔬</span>
            <span><b className="font-display text-lg">InBody</b><br /><span className="text-sm text-mute">Grasa, músculo y visceral</span></span>
          </button>
          <button onClick={() => setSheet('evento')} className="card flex items-center gap-4 p-4 text-left">
            <span className="text-4xl">📅</span>
            <span><b className="font-display text-lg">Evento</b><br /><span className="text-sm text-mute">Una fecha para la que quieres llegar bien</span></span>
          </button>
        </div>
      </Sheet>
      <Sheet open={sheet === 'peso'} onClose={() => setSheet(null)} title="Anotar peso">
        <WeighInForm
          last={s.lastRaw}
          onSave={(w) => {
            setSheet(null)
            commit({ ...state, weighIns: [...state.weighIns, w] }, (after) => coachMessage(s, after))
          }}
        />
      </Sheet>
      <Sheet open={sheet === 'inbody'} onClose={() => setSheet(null)} title="Subir InBody">
        <InBodyForm
          onSave={(ib) => {
            setSheet(null)
            const n: State = { ...state, inbodies: [...state.inbodies, ib] }
            // Si el InBody trae peso y ese día no hay registro, también cuenta como pesada
            if (ib.kg && !state.weighIns.some((w) => w.date === ib.date)) n.weighIns = [...state.weighIns, { id: uid(), date: ib.date, kg: ib.kg, note: 'InBody' }]
            commit(n, () => (state.inbodies.length ? '¡InBody guardado! Ya lo comparé con el primero: revisa “Tu cuerpo”.' : '¡Primer InBody guardado! Con el siguiente empezamos a comparar grasa y músculo.'))
          }}
        />
      </Sheet>
      <Sheet open={sheet === 'evento'} onClose={() => setSheet(null)} title="Nuevo evento">
        <EventForm onSave={(e) => { setSheet(null); setState({ ...state, events: [...state.events, e] }) }} />
      </Sheet>

      {toast && queue.length === 0 && <Toast text={toast} onClose={() => setToast(null)} />}
      <Celebration queue={queue} onNext={() => setQueue((q) => q.slice(1))} />
    </div>
  )
}

function Ajustes({ state, onChange, onReset }: { state: State; onChange: (s: State) => void; onReset: () => void }) {
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `peso-respaldo-${todayISO()}.json`
    a.click()
  }
  return (
    <div className="space-y-4">
      <h1 className="px-1 font-display text-3xl font-extrabold">Ajustes</h1>
      <section className="card p-5">
        <ProfileForm initial={state.profile} cta={saved ? '✓ Guardado' : 'Guardar cambios'} onSave={(p) => { onChange({ ...state, profile: p }); setSaved(true); setTimeout(() => setSaved(false), 1500) }} />
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-display text-xl font-bold">Tus datos</h2>
        <p className="text-sm text-mute">Todo vive solo en este teléfono. Haz un respaldo de vez en cuando.</p>
        <button onClick={exportData} className="btn-ghost w-full">⬇️ Descargar respaldo</button>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full">⬆️ Restaurar respaldo</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          try { onChange({ ...emptyState(), ...JSON.parse(await f.text()) }) } catch { /* archivo inválido */ }
        }} />
        {confirm ? (
          <button onClick={onReset} className="btn w-full bg-coral text-white">Sí, borrar todo</button>
        ) : (
          <button onClick={() => setConfirm(true)} className="btn w-full text-coral">Borrar todo y empezar de nuevo</button>
        )}
      </section>
      <p className="px-1 pb-4 text-center text-xs text-mute">Los mensajes de salud son orientativos, no sustituyen a un médico.</p>
    </div>
  )
}
