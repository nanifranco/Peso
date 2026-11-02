import type { Achievement, State } from './types'
import { daysBetween, fmt, sortByDate, summary } from './calc'

const EQUIV: [number, string, string][] = [
  [1, '🍚', 'un paquete de arroz'],
  [2, '🍍', 'una piña grande'],
  [4, '🐈', 'un gato'],
  [5, '🍉', 'una sandía'],
  [7, '🎳', 'una bola de boliche'],
  [10, '🛞', 'una llanta de coche'],
  [12, '🐕', 'un beagle'],
  [15, '🎒', 'una mochila de viaje llena'],
  [20, '💧', 'un garrafón de agua lleno'],
  [23, '🧳', 'una maleta documentada al límite'],
  [30, '🐕‍🦺', 'un pastor alemán'],
  [50, '🧱', 'un bulto de cemento'],
]

/**
 * Calcula todos los logros (desbloqueados y por desbloquear).
 * Los de peso usan la TENDENCIA, no el dato crudo, para que no se "desbloqueen"
 * por un día deshidratado.
 */
export function computeAchievements(state: State): Achievement[] {
  if (!state.profile || state.weighIns.length === 0) return []
  const s = summary(state)
  const { p, startKg, current } = s
  const h2 = (p.heightCm / 100) ** 2
  const out: Achievement[] = []

  const byWeight = (a: Omit<Achievement, 'unlocked' | 'progress' | 'remaining' | 'remainingKg'>, targetKg: number) => {
    const unlocked = current <= targetKg
    const total = startKg - targetKg
    const progress = total > 0 ? Math.max(0, Math.min(1, (startKg - current) / total)) : 1
    const rem = current - targetKg
    out.push({ ...a, unlocked, progress, remainingKg: unlocked ? 0 : rem, remaining: unlocked ? undefined : `te faltan ${fmt(rem)} kg` })
  }

  // --- Salud: categorías de IMC ---
  const bmiSteps: [number, string, string, string][] = [
    [40, 'imc40', 'Bajaste de obesidad grado III', 'Cruzaste el IMC 40. Es el salto que más alivia a tus articulaciones y a tu corazón.'],
    [35, 'imc35', 'Bajaste de obesidad grado II', 'IMC por debajo de 35. Tu cuerpo ya trabaja bastante menos para todo.'],
    [30, 'imc30', '¡Saliste de obesidad!', 'Tu IMC ya está por debajo de 30. Esto es enorme: muchos riesgos de salud bajan de categoría contigo.'],
    [25, 'imc25', '¡Llegaste a peso saludable!', 'IMC por debajo de 25. Lo que hace un tiempo era la meta lejana, hoy es tu realidad.'],
  ]
  for (const [lim, id, title, body] of bmiSteps) {
    if (s.startBmi >= lim) byWeight({ id, kind: 'salud', emoji: lim === 25 ? '💚' : '🏅', title, body, big: true }, lim * h2 - 0.05)
  }

  // --- Salud: % de peso perdido ---
  const pctSteps: [number, string, string][] = [
    [3, 'Primer cambio real', 'Perdiste 3% de tu peso. Ya no es casualidad, es una tendencia.'],
    [5, '5% menos: tu cuerpo lo nota', 'Con alrededor de 5% menos suelen empezar a mejorar la presión, el azúcar y los triglicéridos.'],
    [7, '7% menos', 'Este rango se asocia con mucho menos riesgo de desarrollar diabetes tipo 2.'],
    [10, '10% menos: protección de corazón', 'Perder 10% es de los cambios con más impacto en tu salud cardiovascular, tu hígado y tu sueño.'],
    [15, '15% menos', 'Eres literalmente 15% más ligero que cuando empezaste. Pocas personas llegan aquí.'],
    [20, '20% menos', 'Una quinta parte. Esto ya es otra vida.'],
  ]
  for (const [pct, title, body] of pctSteps) {
    byWeight({ id: `pct${pct}`, kind: 'salud', emoji: pct >= 10 ? '❤️' : '📉', title, body, big: pct === 5 || pct === 10 }, startKg * (1 - pct / 100))
  }

  // --- Mini-metas hacia la meta final ---
  if (p.goalKg && startKg > p.goalKg) {
    const steps = 8
    for (let i = 1; i <= steps; i++) {
      const t = startKg - ((startKg - p.goalKg) * i) / steps
      const last = i === steps
      byWeight(
        {
          id: `meta${i}-${p.goalKg}`,
          kind: 'meta',
          emoji: last ? '🏆' : '🎯',
          title: last ? '¡META CUMPLIDA!' : `Escalón ${i} de ${steps}`,
          body: last ? `Llegaste a ${fmt(p.goalKg)} kg. Lo dijiste, lo hiciste.` : `Llegaste a ${fmt(t)} kg. ${steps - i} escalones más y llegas.`,
          big: last,
        },
        t,
      )
    }
  }

  // --- Equivalencias ---
  for (const [kg, emoji, what] of EQUIV) {
    if (kg > startKg * 0.45) continue
    byWeight({ id: `eq${kg}`, kind: 'equivalencia', emoji, title: `${kg} kg: ${what}`, body: `Ya no cargas el peso de ${what}. Imagina subir escaleras con eso en la espalda… eso ya no está.` }, startKg - kg)
  }

  // --- Cuerpo (InBody) ---
  const ib = sortByDate(state.inbodies)
  if (ib.length) {
    out.push({ id: 'ib1', kind: 'cuerpo', emoji: '🔬', title: 'Primer InBody', body: 'Ahora sabes qué hay detrás del número: grasa, músculo y agua. Desde aquí lo medimos de verdad.', unlocked: true })
  }
  const f = ib[0], l = ib[ib.length - 1]
  if (ib.length >= 2) {
    out.push({ id: 'ib2', kind: 'cuerpo', emoji: '🔁', title: 'Segundo InBody', body: 'Ya hay con qué comparar. Los logros de cuerpo se desbloquean desde ahora.', unlocked: true })
  }
  const cmp = (key: 'fatKg' | 'muscleKg' | 'fatPct' | 'visceral') => (ib.length >= 2 && f[key] != null && l[key] != null ? (l[key] as number) - (f[key] as number) : undefined)
  const dFat = cmp('fatKg')
  const dMus = cmp('muscleKg')
  const dPct = cmp('fatPct')
  const dVis = cmp('visceral')
  const hasFat = f?.fatKg != null
  if (hasFat) {
    for (const kg of [1, 2, 3, 5, 8, 10, 15]) {
      const done = dFat !== undefined && -dFat >= kg
      out.push({ id: `fat${kg}`, kind: 'cuerpo', emoji: '🔥', title: `${kg} kg de grasa fuera`, body: `Esto es grasa pura, no agua ni músculo. ${kg} kg de grasa son casi ${Math.round(kg * 7700).toLocaleString('es-MX')} kcal que tu cuerpo quemó.`, unlocked: done, progress: dFat !== undefined ? Math.max(0, Math.min(1, -dFat / kg)) : 0, remaining: done ? undefined : 'en tu próximo InBody' })
    }
  }
  if (f?.muscleKg != null) {
    for (const kg of [0.5, 1, 2, 3]) {
      const done = dMus !== undefined && dMus >= kg
      out.push({ id: `mus${kg}`, kind: 'cuerpo', emoji: '💪', title: `+${fmt(kg, kg < 1 ? 1 : 0)} kg de músculo`, body: 'Bajar de peso y ganar músculo al mismo tiempo es lo más difícil y lo más valioso. Tu metabolismo te lo agradece.', unlocked: done, progress: dMus !== undefined ? Math.max(0, Math.min(1, dMus / kg)) : 0, remaining: done ? undefined : 'en tu próximo InBody' })
    }
  }
  if (f?.fatPct != null) {
    const lims = p.sex === 'h' ? [30, 25, 20, 15] : [40, 35, 30, 25]
    for (const lim of lims) {
      if (f.fatPct < lim) continue
      const done = l.fatPct != null && l.fatPct < lim
      out.push({ id: `pct-grasa${lim}`, kind: 'cuerpo', emoji: '📐', title: `Grasa corporal menor a ${lim}%`, body: `Tu porcentaje de grasa ya bajó de ${lim}%. Este número dice más de tu salud que la báscula.`, unlocked: done, progress: l.fatPct != null ? Math.max(0, Math.min(1, (f.fatPct - l.fatPct) / Math.max(0.1, f.fatPct - lim + 0.1))) : 0, remaining: done ? undefined : `vas en ${fmt(l.fatPct ?? f.fatPct)}%`, big: true })
    }
  }
  if (f?.visceral != null && f.visceral >= 10) {
    const done = l.visceral != null && l.visceral < 10
    out.push({ id: 'visceral', kind: 'cuerpo', emoji: '🫀', title: 'Grasa visceral en rango sano', body: 'Bajaste de nivel 10. La grasa visceral es la que rodea tus órganos y la que más se relaciona con el riesgo cardiovascular. Esta es de las mejores noticias posibles.', unlocked: done, remaining: done ? undefined : `vas en nivel ${l.visceral}`, big: true })
  }
  if (dVis !== undefined && dVis <= -2) {
    out.push({ id: 'visceral-2', kind: 'cuerpo', emoji: '🫀', title: 'Visceral −2 niveles', body: 'Tu grasa visceral bajó 2 niveles. Tus órganos tienen más espacio para trabajar.', unlocked: true })
  }
  if (dFat !== undefined && ib.length >= 2 && f.kg != null && l.kg != null) {
    const dW = l.kg - f.kg
    if (-dFat >= 1 && -dFat > -dW + 0.8) {
      out.push({ id: 'recomp', kind: 'cuerpo', emoji: '🪄', title: 'Recomposición corporal', body: `Bajaste ${fmt(-dFat)} kg de grasa aunque la báscula solo marcó ${fmt(-dW)} kg. Estás cambiando lo que hay dentro, no solo el número.`, unlocked: true, big: true })
    }
  }
  void dPct

  // --- Constancia ---
  const ws = sortByDate(state.weighIns)
  const span = daysBetween(ws[0].date, ws[ws.length - 1].date)
  out.push({ id: 'start', kind: 'constancia', emoji: '🌱', title: 'Día uno', body: 'Anotaste tu punto de partida. Todo empieza aquí.', unlocked: true })
  for (const [d, t] of [[30, '1 mes'], [90, '3 meses'], [180, 'Medio año'], [365, '1 año']] as [number, string][]) {
    const done = span >= d
    out.push({ id: `span${d}`, kind: 'constancia', emoji: '📆', title: `${t} en esto`, body: `Llevas ${t.toLowerCase()} cuidándote. La constancia le gana a la intensidad.`, unlocked: done, progress: Math.min(1, span / d), remaining: done ? undefined : `faltan ${d - span} días` })
  }
  for (const n of [5, 15, 30, 60]) {
    const done = ws.length >= n
    out.push({ id: `n${n}`, kind: 'constancia', emoji: '✍️', title: `${n} registros`, body: `Has anotado ${n} veces. Sin obsesionarte, pero sin soltarlo.`, unlocked: done, progress: Math.min(1, ws.length / n), remaining: done ? undefined : `faltan ${n - ws.length}` })
  }
  let comeback = false
  for (let i = 1; i < ws.length; i++) if (daysBetween(ws[i - 1].date, ws[i].date) >= 21) comeback = true
  if (comeback) out.push({ id: 'comeback', kind: 'constancia', emoji: '🔄', title: 'El regreso', body: 'Pasaron semanas y volviste. Eso es lo que separa a quien lo logra de quien no: regresar.', unlocked: true })
  const lows = ws.reduce((acc, w, i) => (i === 0 || w.kg < Math.min(...ws.slice(0, i).map((x) => x.kg)) ? acc + 1 : acc), 0) - 1
  if (lows >= 5) out.push({ id: 'lows5', kind: 'constancia', emoji: '⬇️', title: '5 nuevos mínimos', body: 'Cinco veces rompiste tu propio récord.', unlocked: true })

  return out
}

/** Sincroniza los desbloqueados con el estado y regresa los nuevos */
export function syncUnlocked(state: State): { state: State; fresh: Achievement[] } {
  const all = computeAchievements(state)
  const today = new Date().toISOString().slice(0, 10)
  const unlocked = { ...state.unlocked }
  const fresh: Achievement[] = []
  for (const a of all) {
    if (a.unlocked && !unlocked[a.id]) {
      unlocked[a.id] = today
      fresh.push(a)
    }
  }
  return { state: { ...state, unlocked }, fresh }
}

/** Una vez desbloqueado, se queda desbloqueado (aunque la tendencia suba un poco) */
export function withHistory(state: State): Achievement[] {
  return computeAchievements(state).map((a) => (state.unlocked[a.id] ? { ...a, unlocked: true, progress: 1, remaining: undefined } : a))
}

export function nextWeightMilestone(state: State) {
  return withHistory(state)
    .filter((a) => !a.unlocked && a.remainingKg !== undefined && a.remainingKg > 0 && a.kind !== 'constancia')
    .sort((a, b) => (a.remainingKg ?? 0) - (b.remainingKg ?? 0))[0]
}

export const KIND_LABEL: Record<string, string> = {
  salud: 'Salud',
  cuerpo: 'Cuerpo (InBody)',
  meta: 'Mini-metas',
  equivalencia: 'Inventario',
  constancia: 'Constancia',
}
