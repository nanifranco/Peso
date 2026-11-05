import type { InBody, Profile, State, WeighIn } from './types'
import { todayISO } from './store'

export const sortByDate = <T extends { date: string }>(a: T[]) =>
  [...a].sort((x, y) => x.date.localeCompare(y.date))

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000)

export const round1 = (n: number) => Math.round(n * 10) / 10
export const fmt = (n: number, d = 1) => n.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d })

/**
 * Tendencia: media móvil exponencial ajustada por días entre registros.
 * Como un filtro pasa-bajas sobre un sensor ruidoso: si llevas días sin pesarte,
 * el nuevo dato pesa más (alfa crece con el hueco).
 */
export function trendSeries(w: WeighIn[]) {
  const s = sortByDate(w)
  const out: { date: string; kg: number; trend: number }[] = []
  let t = 0
  s.forEach((e, i) => {
    if (i === 0) t = e.kg
    else {
      const gap = Math.max(1, daysBetween(s[i - 1].date, e.date))
      const a = 1 - Math.pow(0.9, gap)
      t = t + a * (e.kg - t)
    }
    out.push({ date: e.date, kg: e.kg, trend: t })
  })
  return out
}

/** kg por semana (negativo = bajando), regresión lineal sobre las últimas ~6 semanas */
export function weeklyRate(w: WeighIn[]): number | undefined {
  const s = sortByDate(w)
  if (s.length < 2) return undefined
  const last = s[s.length - 1].date
  let pts = s.filter((e) => daysBetween(e.date, last) <= 42)
  if (pts.length < 3 || daysBetween(pts[0].date, last) < 10) pts = s
  if (daysBetween(pts[0].date, last) < 5) return undefined
  const xs = pts.map((p) => daysBetween(pts[0].date, p.date))
  const ys = pts.map((p) => p.kg)
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2 })
  if (den === 0) return undefined
  return (num / den) * 7
}

export const bmi = (kg: number, heightCm: number) => kg / (heightCm / 100) ** 2

export function bmiCategory(b: number) {
  if (b < 18.5) return { label: 'Bajo peso', color: '#9AB0AA' }
  if (b < 25) return { label: 'Saludable', color: '#3BAA7E' }
  if (b < 30) return { label: 'Sobrepeso', color: '#EDB54A' }
  if (b < 35) return { label: 'Obesidad I', color: '#E8793A' }
  if (b < 40) return { label: 'Obesidad II', color: '#D65A4A' }
  return { label: 'Obesidad III', color: '#B4506E' }
}

/** Todo lo que la app necesita saber de un vistazo */
export function summary(state: State) {
  const p = state.profile as Profile
  const ws = trendSeries(state.weighIns)
  const ib = sortByDate(state.inbodies)
  const startKg = ws.length ? ws[0].kg : 0
  // Para alguien que se pesa de vez en cuando, el último dato real es lo más claro.
  // La tendencia suavizada se usa en la gráfica y para el ritmo.
  const current = ws.length ? ws[ws.length - 1].kg : 0
  const lastRaw = ws.length ? ws[ws.length - 1].kg : 0
  const lost = startKg - current
  const lostPct = startKg ? (lost / startKg) * 100 : 0
  const rate = weeklyRate(state.weighIns)
  const startBmi = bmi(startKg, p.heightCm)
  const curBmi = bmi(current, p.heightCm)
  const firstIB: InBody | undefined = ib[0]
  const lastIB: InBody | undefined = ib[ib.length - 1]

  // Qué tan "transformado" va el avatar (0 = como empezaste, 1 = meta)
  let shape = 0
  if (lastIB?.fatPct && firstIB?.fatPct && ib.length > 1) {
    const target = p.sex === 'h' ? 15 : 23
    shape = (firstIB.fatPct - lastIB.fatPct) / Math.max(1, firstIB.fatPct - target)
  } else if (p.goalKg && startKg > p.goalKg) {
    shape = lost / (startKg - p.goalKg)
  } else {
    shape = lost / Math.max(1, startKg * 0.15)
  }
  shape = Math.max(0, Math.min(1, shape))

  const fatNow = estBodyFat(current, state)
  const fatStart = estBodyFat(startKg, state)
  const daysSinceLast = ws.length ? daysBetween(ws[ws.length - 1].date, todayISO()) : 0

  return { p, ws, ib, startKg, current, lastRaw, lost, lostPct, rate, startBmi, curBmi, firstIB, lastIB, shape, daysSinceLast, fatNow, fatStart }
}

export type Summary = ReturnType<typeof summary>

export function predictFor(sum: Summary, date: string) {
  if (sum.rate === undefined || !sum.ws.length) return undefined
  const lastDate = sum.ws[sum.ws.length - 1].date
  const weeks = daysBetween(lastDate, date) / 7
  if (weeks <= 0) return undefined
  let kg = sum.current + sum.rate * weeks
  if (sum.p.goalKg && sum.rate < 0) kg = Math.max(kg, sum.p.goalKg)
  return { kg, weeks }
}

/** Mensaje de coach justo después de anotar */
export function coachMessage(before: Summary | undefined, after: Summary): string {
  if ((!before || before.ws.length === 0) && after.lost > 0.2) return `¡Arrancamos, ${after.p.name}! Ya traes ${fmt(after.lost)} kg menos desde que empezaste. Desde aquí lo seguimos celebrando.`
  if (!before || before.ws.length === 0) return `¡Arrancamos, ${after.p.name}! Este es tu punto de partida. Cada número que anotes a partir de aquí cuenta tu historia.`
  const prevMin = Math.min(...before.ws.map((w) => w.kg))
  const delta = after.lastRaw - before.current
  if (delta > 0) return `No pasa nada. Un día no define nada; lo que cuenta es la tendencia.`
  if (before.daysSinceLast >= 14) {
    return after.lost > 0
      ? `¡Qué gusto verte de vuelta! Sigues ${fmt(after.lost)} kg abajo de donde empezaste. Lo que importa es que regresaste.`
      : `¡Qué gusto verte de vuelta! Volver es la parte más difícil y ya la hiciste.`
  }
  if (after.lastRaw < prevMin) return `¡Nuevo mínimo! Nunca habías anotado un número tan bajo. Vas ${fmt(after.lost)} kg abajo en total.`
  if (delta < -0.3) return `Bien ahí, ${after.p.name}. Vas ${fmt(after.lost)} kg abajo y la tendencia sigue bajando.`
  return `Estable. Mantenerse también es avanzar: tu cuerpo se está acostumbrando a su nuevo peso.`
}

/**
 * % de grasa estimado para un peso dado.
 * Con InBody: se asume la masa magra del último estudio (lo que no es grasa casi no cambia).
 * Sin InBody: fórmula de Deurenberg a partir del IMC (edad asumida 25).
 */
export function estBodyFat(kg: number, state: State): number {
  const p = state.profile as Profile
  const ib = sortByDate(state.inbodies).filter((i) => i.fatPct != null && i.kg != null)
  if (ib.length) {
    const last = ib[ib.length - 1]
    const leanKg = last.kg! * (1 - last.fatPct! / 100)
    return Math.max(4, ((kg - leanKg) / kg) * 100)
  }
  const b = bmi(kg, p.heightCm)
  return Math.max(4, 1.2 * b + 0.23 * 25 - 10.8 * (p.sex === 'h' ? 1 : 0) - 5.4)
}

/** 0 = muy definido, 1 = mucha grasa: lo que usa el avatar para su forma */
export function fatness(bodyFatPct: number, sex: Profile['sex']) {
  const [lo, hi] = sex === 'h' ? [9, 42] : [17, 50]
  return Math.max(0, Math.min(1, (bodyFatPct - lo) / (hi - lo)))
}
