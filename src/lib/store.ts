import type { State, WeighIn } from './types'

const KEY = 'peso:v1'

export const emptyState = (): State => ({ weighIns: [], inbodies: [], events: [], unlocked: {} })

/**
 * Historial personal opcional (src/seed.local.json, fuera de git porque el repo es público).
 * Si existe en el build, se mezcla una sola vez con lo que haya en el teléfono:
 * solo agrega los registros cuyas fechas no estén ya.
 */
const seedFiles = import.meta.glob<{ default: State }>('../seed.local.json', { eager: true })
const SEED: State | undefined = Object.values(seedFiles)[0]?.default
const SEED_FLAG = 'peso:seed-v1'

function mergeSeed(s: State): State {
  if (!SEED) return s
  try {
    if (localStorage.getItem(SEED_FLAG)) return s
    localStorage.setItem(SEED_FLAG, '1')
  } catch { /* sin storage: se mezcla en memoria */ }
  const wDates = new Set(s.weighIns.map((w) => w.date))
  const iDates = new Set(s.inbodies.map((i) => i.date))
  // si ya existe un registro de inicio propio, el del historial no lo pisa
  // El historial es el registro real: si trae un inicio más antiguo que el que pusiste a mano, ese manda
  const mine = s.weighIns.find((w) => w.id === START_ID)
  const seedStart = SEED.weighIns.find((w) => w.id === START_ID)
  const base = mine && seedStart && seedStart.date < mine.date ? s.weighIns.filter((w) => w.id !== START_ID) : s.weighIns
  const hasStart = base.some((w) => w.id === START_ID)
  const weighIns = [
    ...base,
    ...SEED.weighIns.filter((w) => !wDates.has(w.date)).map((w) => (w.id === START_ID && hasStart ? { ...w, id: uid() } : w)),
  ]
  const inbodies = [...s.inbodies, ...SEED.inbodies.filter((i) => !iDates.has(i.date))]
  const profile = s.profile ?? SEED.profile
  return normalize({ ...s, profile, weighIns, inbodies })
}

export function loadState(): State {
  let s = emptyState()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) s = normalize({ ...emptyState(), ...JSON.parse(raw) })
  } catch { /* datos dañados: empezamos vacío */ }
  return mergeSeed(s)
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
