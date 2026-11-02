// Chiptune hecho con ondas cuadradas, sin archivos de audio
const KEY = 'peso:sonido'
let ctx: AudioContext | null = null

export const soundOn = () => {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}
export const setSound = (on: boolean) => {
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* */ }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.06) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(vol, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
  o.connect(g).connect(ctx.destination)
  o.start(ctx.currentTime + start)
  o.stop(ctx.currentTime + start + dur + 0.02)
}

function ready(force = false) {
  if (!force && !soundOn()) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return true
}

/** moneda: al guardar */
export function coin(force = false) {
  if (!ready(force)) return
  tone(988, 0, 0.08)
  tone(1319, 0.08, 0.3)
}

/** level up: al desbloquear un logro */
export function levelUp(big = false) {
  if (!ready()) return
  const notes = big ? [523, 659, 784, 1047, 784, 1047, 1319] : [523, 659, 784, 1047]
  notes.forEach((n, i) => tone(n, i * 0.09, 0.14))
  tone(big ? 131 : 262, 0, notes.length * 0.09 + 0.1, 'triangle', 0.08)
}

export function blip() {
  if (!ready()) return
  tone(660, 0, 0.04)
}
