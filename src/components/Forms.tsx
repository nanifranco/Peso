import { useState } from 'react'
import type { InBody, PlannedEvent, Profile, Sex, WeighIn } from '../lib/types'
import { todayISO, uid } from '../lib/store'

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
        <button type="button" onClick={() => bump(-0.1)} className="h-14 w-14 shrink-0 rounded-2xl bg-line/70 text-2xl font-bold">−</button>
        <div className="relative flex-1">
          <input autoFocus inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="0.0" className="field text-center font-display text-5xl! font-extrabold py-4!" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mute">kg</span>
        </div>
        <button type="button" onClick={() => bump(0.1)} className="h-14 w-14 shrink-0 rounded-2xl bg-line/70 text-2xl font-bold">+</button>
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
      <p className="rounded-2xl bg-sky/10 p-3 text-sm text-ink/80">
        📄 Copia los números de tu hoja de InBody. Llena solo los que tengas; con <b>peso</b> y <b>% de grasa</b> ya se desbloquean muchos logros.
      </p>
      <div>
        <label className="label">Fecha del estudio</label>
        <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="field" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {IB_FIELDS.map((f) => (
          <div key={f.k}>
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

export function EventForm({ onSave }: { onSave: (e: PlannedEvent) => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (name && date) onSave({ id: uid(), name, date }) }} className="space-y-4 pb-4">
      <div>
        <label className="label">¿Qué viene?</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Viaje, boda, regreso a México…" className="field" />
      </div>
      <div>
        <label className="label">Fecha</label>
        <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="field" />
      </div>
      <button disabled={!name || !date} className="btn-primary w-full text-lg disabled:opacity-40">Agregar</button>
    </form>
  )
}

export function ProfileForm({ initial, onSave, withWeight, cta }: { initial?: Profile; withWeight?: boolean; cta: string; onSave: (p: Profile, kg?: number) => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sex, setSex] = useState<Sex>(initial?.sex ?? 'h')
  const [h, setH] = useState(initial ? String(initial.heightCm) : '')
  const [goal, setGoal] = useState(initial?.goalKg ? String(initial.goalKg) : '')
  const [kg, setKg] = useState('')
  const ok = name && num(h) && (!withWeight || num(kg))
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (ok) onSave({ name: name.trim(), sex, heightCm: num(h)!, goalKg: num(goal) }, num(kg)) }} className="space-y-4">
      <div>
        <label className="label">¿Cómo te digo?</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="field" />
      </div>
      <div>
        <label className="label">Sexo (para rangos de grasa)</label>
        <div className="grid grid-cols-2 gap-2">
          {(['h', 'm'] as Sex[]).map((s) => (
            <button type="button" key={s} onClick={() => setSex(s)} className={`btn ${sex === s ? 'bg-ink text-cream' : 'bg-line/60'}`}>{s === 'h' ? 'Hombre' : 'Mujer'}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Estatura (cm)</label>
          <input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} placeholder="175" className="field" />
        </div>
        {withWeight && (
          <div>
            <label className="label">Peso hoy (kg)</label>
            <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="90.0" className="field" />
          </div>
        )}
        <div className={withWeight ? 'col-span-2' : ''}>
          <label className="label">Meta (kg, opcional)</label>
          <input inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Sin meta: solo celebrar hitos" className="field" />
        </div>
      </div>
      <button disabled={!ok} className="btn-primary w-full text-lg disabled:opacity-40">{cta}</button>
    </form>
  )
}
