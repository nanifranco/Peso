import { useState } from 'react'
import type { InBody, Profile, WeighIn } from '../lib/types'
import { addDays, todayISO, uid } from '../lib/store'
import { Badge } from './icons'

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'))
  return isFinite(n) ? n : undefined
}

export function WeighInForm({ last, onSave }: { last?: number; onSave: (w: WeighIn) => void }) {
  const [kg, setKg] = useState(last ? String(last) : '')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const v = num(kg)
  const bump = (d: number) => setKg(String(Math.round(((v ?? last ?? 70) + d) * 10) / 10))
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (v && v > 20 && v < 400) onSave({ id: uid(), date, kg: v, note: note.trim() || undefined })
      }}
      className="space-y-4 pb-4"
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => bump(-0.1)} className="bubble h-14 w-14 text-2xl font-bold">−</button>
        <div className="relative flex-1">
          <input autoFocus inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="0.0" className="field text-center font-display text-5xl! font-extrabold py-4!" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mute">kg</span>
        </div>
        <button type="button" onClick={() => bump(0.1)} className="bubble h-14 w-14 text-2xl font-bold">+</button>
      </div>
      <div>
        <label className="label">Fecha</label>
        <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="field" />
      </div>
      <div>
        <label className="label">Nota (opcional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Empecé el gym, semana de exámenes…" className="field" />
      </div>
      <button disabled={!v} className="btn-primary w-full text-lg disabled:opacity-40">Guardar</button>
    </form>
  )
}

const IB_FIELDS: { k: keyof InBody; label: string; unit: string; hint: string }[] = [
  { k: 'kg', label: 'Peso', unit: 'kg', hint: 'Weight' },
  { k: 'fatPct', label: '% de grasa', unit: '%', hint: 'PBF · Percent Body Fat' },
  { k: 'fatKg', label: 'Masa grasa', unit: 'kg', hint: 'Body Fat Mass' },
  { k: 'muscleKg', label: 'Músculo esquelético', unit: 'kg', hint: 'SMM · Skeletal Muscle Mass' },
  { k: 'visceral', label: 'Grasa visceral', unit: 'nivel', hint: 'Visceral Fat Level' },
  { k: 'bmr', label: 'Metabolismo basal', unit: 'kcal', hint: 'BMR' },
]

export function InBodyForm({ onSave }: { onSave: (ib: InBody) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [date, setDate] = useState(todayISO())
  const filled = Object.values(vals).filter((v) => num(v) !== undefined).length
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const ib: InBody = { id: uid(), date }
        for (const f of IB_FIELDS) {
          const n = num(vals[f.k] ?? '')
          if (n !== undefined) (ib as unknown as Record<string, number>)[f.k] = n
        }
        // Completa lo que se pueda deducir
        if (ib.kg && ib.fatPct && !ib.fatKg) ib.fatKg = Math.round(ib.kg * ib.fatPct) / 100
        if (ib.kg && ib.fatKg && !ib.fatPct) ib.fatPct = Math.round((ib.fatKg / ib.kg) * 1000) / 10
        onSave(ib)
      }}
      className="space-y-4 pb-4"
    >
      <p className="tile flex gap-3 p-3 text-sm text-ink/80">
        <span className="shrink-0"><Badge icon="doc" tone="sky" size={36} /></span>
        <span>
        Copia los números de tu hoja de InBody. Llena solo los que tengas; con <b>peso</b> y <b>% de grasa</b> ya se desbloquean muchos logros.</span>
      </p>
      <div>
        <label className="label">Fecha del estudio</label>
        <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="field" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {IB_FIELDS.map((f) => (
          <div key={f.k} className="min-w-0">
            <label className="label">{f.label}</label>
            <div className="relative">
              <input inputMode="decimal" value={vals[f.k] ?? ''} onChange={(e) => setVals({ ...vals, [f.k]: e.target.value })} className="field pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">{f.unit}</span>
            </div>
            <div className="mt-1 text-[10px] text-mute">{f.hint}</div>
          </div>
        ))}
      </div>
      <button disabled={filled === 0} className="btn-primary w-full text-lg disabled:opacity-40">Guardar InBody</button>
    </form>
  )
}

export interface ProfileInput {
  profile: Profile
  startKg?: number
  startDate: string
  todayKg?: number
}

export function ProfileForm({ initial, initialStart, onSave, withWeight, cta }: {
  initial?: Profile
  initialStart?: { kg: number; date: string }
  withWeight?: boolean
  cta: string
  onSave: (v: ProfileInput) => void
}) {
  const [h, setH] = useState(initial ? String(initial.heightCm) : '')
  const [goal, setGoal] = useState(initial?.goalKg ? String(initial.goalKg) : '')
  const [start, setStart] = useState(initialStart ? String(initialStart.kg) : '')
  const [startDate, setStartDate] = useState(initialStart?.date ?? addDays(todayISO(), -30))
  const [kg, setKg] = useState('')
  const [fatIdeal, setFatIdeal] = useState(initial?.goalFatPct ? String(initial.goalFatPct) : '')
  const [musIdeal, setMusIdeal] = useState(initial?.goalMuscleKg ? String(initial.goalMuscleKg) : '')
  const ok = num(h) && (!withWeight || num(kg)) && (withWeight || num(start))
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (ok) onSave({ profile: { ...initial, name: 'Nani', sex: 'm', heightCm: num(h)!, goalKg: num(goal), ...(withWeight ? {} : { goalFatPct: num(fatIdeal), goalMuscleKg: num(musIdeal) }) }, startKg: num(start), startDate, todayKg: num(kg) })
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="label">Estatura (cm)</label>
          <input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} placeholder="165" className="field" />
        </div>
        {withWeight && (
          <div className="min-w-0">
            <label className="label">Peso hoy (kg)</label>
            <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="88.0" className="field" />
          </div>
        )}
        <div className="min-w-0">
          <label className="label">Peso al empezar</label>
          <input inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} placeholder={withWeight ? 'Si ya bajaste' : 'kg'} className="field" />
        </div>
        {withWeight && (
          <div className={withWeight ? 'min-w-0' : 'col-span-2 min-w-0'}>
            <label className="label">Meta (kg, opcional)</label>
            <input inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Sin meta: solo celebrar" className="field" />
          </div>
        )}
        {/* La fecha va en su propia fila: en iPhone el campo de fecha no cabe en media columna */}
        <div className="col-span-2 min-w-0">
          <label className="label">¿Cuándo empezaste?</label>
          <input type="date" max={todayISO()} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field" />
        </div>
        {!withWeight && (
          <div className={withWeight ? 'min-w-0' : 'col-span-2 min-w-0'}>
            <label className="label">Meta (kg, opcional)</label>
            <input inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Sin meta: solo celebrar" className="field" />
          </div>
        )}
      </div>
      {!withWeight && (
        <div className="space-y-2 border-t border-white/80 pt-4">
          <div>
            <div className="font-display text-lg font-bold">Tus ideales de cuerpo</div>
            <p className="text-xs text-mute">Tu hoja de InBody trae el rango normal de grasa y músculo para ti; úsalo como guía. Se ven en Gráficas.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="label">Grasa ideal (%)</label>
              <input inputMode="decimal" value={fatIdeal} onChange={(e) => setFatIdeal(e.target.value)} placeholder="30" className="field" />
            </div>
            <div className="min-w-0">
              <label className="label">Músculo ideal (kg)</label>
              <input inputMode="decimal" value={musIdeal} onChange={(e) => setMusIdeal(e.target.value)} placeholder="31" className="field" />
            </div>
          </div>
        </div>
      )}
      {withWeight && <p className="-mt-1 text-xs text-mute">Si ya venías bajando antes de usar la app, pon tu peso de cuando empezaste para que cuente todo lo que llevas.</p>}
      <button disabled={!ok} className="btn-primary w-full text-lg disabled:opacity-40">{cta}</button>
    </form>
  )
}
