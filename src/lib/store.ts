import type { State, WeighIn } from './types'

const KEY = 'peso:v1'

export const emptyState = (): State => ({ weighIns: [], inbodies: [], events: [], unlocked: {} })

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    return { ...emptyState(), ...JSON.parse(raw) }
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
  let kg = 98.4
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
    profile: { name: 'Nani', sex: 'h', heightCm: 176, goalKg: 80 },
    weighIns,
    inbodies: [
      { id: uid(), date: addDays(start, 2), kg: 98.1, fatPct: 31.2, fatKg: 30.6, muscleKg: 37.4, visceral: 13, bmr: 1820 },
      { id: uid(), date: addDays(start, 70), kg: 93.6, fatPct: 28.4, fatKg: 26.6, muscleKg: 37.9, visceral: 11, bmr: 1812 },
      { id: uid(), date: addDays(start, 140), kg: 88.9, fatPct: 24.6, fatKg: 21.9, muscleKg: 38.6, visceral: 9, bmr: 1808 },
    ],
    events: [{ id: uid(), name: 'Regreso a México', date: addDays(todayISO(), 45) }],
    unlocked: {},
  }
}
