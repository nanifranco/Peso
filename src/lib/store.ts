import type { State, WeighIn } from './types'

const KEY = 'peso:v1'

export const emptyState = (): State => ({ weighIns: [], inbodies: [], events: [], unlocked: {} })

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    return normalize({ ...emptyState(), ...JSON.parse(raw) })
  } catch {
    return emptyState()
  }
}

export function saveState(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* sin espacio o modo privado: seguimos en memoria */
  }
}

/** La app siempre es de Nani (mujer) */
export function normalize(s: State): State {
  return s.profile ? { ...s, profile: { ...s.profile, name: 'Nani', sex: 'm' } } : s
}

export const START_ID = 'start'

/** Guarda (o reemplaza) el peso con el que empezaste como un registro más */
export function upsertStart(s: State, kg: number, date: string): State {
  const rest = s.weighIns.filter((w) => w.id !== START_ID)
  return { ...s, weighIns: [...rest, { id: START_ID, date, kg, note: 'Cuando empecé' }] }
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function todayISO(d = new Date()) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return todayISO(d)
}

/** Datos de ejemplo: ~5 meses de registros esporádicos y 3 InBody */
export function demoState(): State {
  const start = addDays(todayISO(), -150)
  const weighIns: WeighIn[] = []
  let kg = 86.4
  let day = 0
  let seed = 7
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  while (day <= 150) {
    weighIns.push({ id: uid(), date: addDays(start, day), kg: Math.round((kg + (rnd() - 0.5) * 1.2) * 10) / 10 })
    const gap = 3 + Math.floor(rnd() * 9)
    day += gap
    kg -= gap * 0.075
  }
  weighIns[2].note = 'Empecé a caminar a la uni'
  weighIns[6].note = 'Semana de exámenes, comí fatal'
  return {
    profile: { name: 'Nani', sex: 'm', heightCm: 165, goalKg: 68 },
    weighIns,
    inbodies: [
      { id: uid(), date: addDays(start, 2), kg: 86.1, fatPct: 41.2, fatKg: 35.5, muscleKg: 27.4, visceral: 12, bmr: 1480 },
      { id: uid(), date: addDays(start, 70), kg: 81.6, fatPct: 38.3, fatKg: 31.3, muscleKg: 27.8, visceral: 10, bmr: 1468 },
      { id: uid(), date: addDays(start, 140), kg: 76.9, fatPct: 34.6, fatKg: 26.6, muscleKg: 28.3, visceral: 8, bmr: 1462 },
    ],
    events: [{ id: uid(), name: 'Regreso a México', date: addDays(todayISO(), 45) }],
    unlocked: {},
  }
}
