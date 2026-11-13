import type { State } from './types'

const KEY = 'peso:v1'

export const emptyState = (): State => ({ weighIns: [], inbodies: [], events: [], unlocked: {} })

/**
 * Historial personal opcional (src/seed.json: tu historial real de antes de usar la app).
 * Si existe en el build, se mezcla una sola vez con lo que haya en el teléfono:
 * solo agrega los registros cuyas fechas no estén ya.
 */
const seedFiles = import.meta.glob<{ default: State }>('../seed.json', { eager: true })
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
  return mergeBaseline(mergeSeed(s))
}

/**
 * El baseline (mediciones de hace años) se mezcla en cada carga, aparte del historial:
 * así llega también a teléfonos donde el historial ya se había cargado. Sin duplicar fechas.
 */
function mergeBaseline(s: State): State {
  const seed = SEED?.baseline ?? []
  const mine = s.baseline ?? []
  const have = new Set(mine.map((b) => b.date))
  const add = seed.filter((b) => !have.has(b.date))
  return add.length || !s.baseline ? { ...s, baseline: [...mine, ...add] } : s
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
  // también al restaurar un respaldo viejo sin baseline
  return mergeBaseline(s.profile ? { ...s, profile: { ...s.profile, name: 'Nani', sex: 'm' } } : s)
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
