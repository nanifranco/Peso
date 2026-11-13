export type Sex = 'h' | 'm'

export interface Profile {
  name: string
  sex: Sex
  heightCm: number
  goalKg?: number
  /** % de grasa ideal (meta de cuerpo) */
  goalFatPct?: number
  /** músculo esquelético ideal en kg */
  goalMuscleKg?: number
}

export interface WeighIn {
  id: string
  date: string // YYYY-MM-DD
  kg: number
  note?: string
}

export interface InBody {
  id: string
  date: string
  kg?: number
  fatPct?: number
  fatKg?: number
  muscleKg?: number // masa muscular esquelética
  visceral?: number // nivel de grasa visceral
  bmr?: number // metabolismo basal (kcal)
}

/**
 * Medición de hace años (antes de este camino). Solo es referencia:
 * no cuenta como inicio, ni para la tendencia, ni para los logros.
 */
export interface Baseline {
  id: string
  date: string
  kg: number
  fatPct?: number
  source?: string
}

export interface PlannedEvent {
  id: string
  name: string
  date: string
}

export interface State {
  profile?: Profile
  weighIns: WeighIn[]
  inbodies: InBody[]
  events: PlannedEvent[]
  /** referencias de hace años (src/seed.json → baseline) */
  baseline?: Baseline[]
  unlocked: Record<string, string> // id de logro -> fecha en que se desbloqueó
}

export type AchievementKind = 'salud' | 'cuerpo' | 'equivalencia' | 'meta' | 'constancia'

export interface Achievement {
  id: string
  kind: AchievementKind
  /** nombre del ícono (src/components/icons.tsx) */
  icon: string
  title: string
  body: string
  unlocked: boolean
  /** 0..1 qué tan cerca estás (para los bloqueados) */
  progress?: number
  /** texto corto de lo que falta, p. ej. "te faltan 1.2 kg" */
  remaining?: string
  /** kg que faltan, para encontrar el siguiente hito de peso */
  remainingKg?: number
  big?: boolean
}
