import type { ReactNode } from 'react'

/**
 * Íconos de línea propios (24×24, trazo redondeado). Sustituyen a los emojis
 * para que toda la app tenga el mismo trazo y color.
 */
const P: Record<string, ReactNode> = {
  // navegación
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />,
  chart: <><path d="M5 20V11" /><path d="M10 20V6" /><path d="M15 20v-7" /><path d="M20 20V9" /></>,
  list: <><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 3v2.5h6V3" /><path d="M9 11h6M9 15h4" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4M8.5 20h7M10 17h4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></>,

  // registros y acciones
  plus: <path d="M12 5v14M5 12h14" />,
  scale: <><rect x="3.5" y="5" width="17" height="15" rx="4" /><path d="M8.5 11a3.5 3.5 0 0 1 7 0" /><path d="M12 11l1.6-2" /></>,
  composition: <><circle cx="12" cy="12" r="8" /><path d="M12 4v8l6.6 4.4" /><path d="M12 12l-7.6 2.4" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><path d="M12 14.5v2" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  sparkle: <><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" /><path d="M18.5 16v4M16.5 18h4" /></>,
  chat: <><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16A2.5 2.5 0 0 1 5 13.5z" /><path d="M9 9h6M9 12h4" /></>,
  pencil: <><path d="M15.5 4.5l4 4L9 19H5v-4z" /><path d="M13.5 6.5l4 4" /></>,
  download: <><path d="M12 4v11" /><path d="M7.5 10.5 12 15l4.5-4.5" /><path d="M5 19.5h14" /></>,
  upload: <><path d="M12 15V4" /><path d="M7.5 8.5 12 4l4.5 4.5" /><path d="M5 19.5h14" /></>,
  doc: <><path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5z" /><path d="M14 3.5V8h4" /><path d="M9 12.5h6M9 16h4" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 4.5h11l-2.5 4 2.5 4H6" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" /></>,
  medal: <><path d="M8 3.5l2.5 6M16 3.5l-2.5 6" /><circle cx="12" cy="15" r="5.5" /><path d="M12 12.6l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z" /></>,
  heart: <path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z" />,
  heartPulse: <><path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z" /><path d="M7.5 12.5h2.5l1.2-2.2 1.8 4 1.2-1.8H17" /></>,
  trendDown: <><path d="M4 7l6 6 3.5-3.5L20 16" /><path d="M15 16h5v-5" /></>,
  flame: <path d="M12 21c-3.6 0-6-2.4-6-5.8 0-3.1 2.3-4.9 3.4-7.7.5 1.6 1.4 2.6 2.4 3.1.2-3.3 1.6-5.7 3.6-7.1-.2 3.1 2.6 5.6 2.6 10.2 0 4-2.6 7.3-6 7.3z" />,
  dumbbell: <path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11" />,
  ruler: <><path d="M4 20V4l16 16z" /><path d="M4 9h2M4 13h3M4 17h2" /><path d="M8 16h3.5L8 12.5z" /></>,
  wand: <><path d="M4 20 15 9" /><path d="M13 7l4 4" /><path d="M17 3.5v3M15.5 5h3M20 10v2M19 11h2M9 4v2M8 5h2" /></>,
  sprout: <><path d="M12 20v-8" /><path d="M12 12c0-3.5-2.5-6-7-6 0 3.8 2.6 6 7 6z" /><path d="M12 14c0-3.2 2.2-5.5 6.5-5.5 0 3.4-2.4 5.5-6.5 5.5z" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="3" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /><path d="M8.5 14h2M13.5 14h2M8.5 17h2" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1" /><path d="M4.5 12a7.5 7.5 0 0 1 13-5.1" /><path d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4" /></>,
  arrowDown: <><path d="M12 4v15" /><path d="M6 13l6 6 6-6" /></>,
  gauge: <><path d="M4.5 16a7.5 7.5 0 1 1 15 0" /><path d="M12 16l3.5-4" /><path d="M4.5 19.5h15" /></>,
  leaf: <><path d="M5 19c0-8 5-13.5 14-14 .2 9-5.5 14-14 14z" /><path d="M5 19c3-4 6-6.5 9.5-8.5" /></>,

  // "lo que ya no cargas"
  sack: <><path d="M8 6.5c-2 2-3 5-3 8.5 0 3 2 5 7 5s7-2 7-5c0-3.5-1-6.5-3-8.5" /><path d="M8 6.5h8M9 3.5l3 3 3-3" /><path d="M10 14h4" /></>,
  pineapple: <><ellipse cx="12" cy="15" rx="5" ry="6" /><path d="M12 9V3.5M12 8 9 4.5M12 8l3-3.5" /><path d="M8.5 12.5l7 5M15.5 12.5l-7 5" /></>,
  cat: <><path d="M5 10 4.5 4l4.5 3a8.5 8.5 0 0 1 6 0l4.5-3L19 10" /><path d="M5 10c0 6 3 9.5 7 9.5s7-3.5 7-9.5" /><path d="M9.5 13h.01M14.5 13h.01" /><path d="M11 16l1 1 1-1" /></>,
  watermelon: <><path d="M3.5 9a8.5 8.5 0 0 0 17 0z" /><path d="M6.5 9a5.5 5.5 0 0 0 11 0" /><path d="M10 11.5h.01M14 11.5h.01M12 13.5h.01" /></>,
  bowling: <><circle cx="12" cy="12" r="8" /><path d="M10 8.5h.01M13.5 8h.01M12 11h.01" /></>,
  tire: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 4v4.5M12 15.5V20M4 12h4.5M15.5 12H20" /></>,
  dog: <><path d="M6 8.5 4 14l3 1" /><path d="M18 8.5 20 14l-3 1" /><path d="M7 7.5a6.5 6.5 0 0 1 10 0c1 1.6 1 4 1 6.5 0 3.6-2.6 6-6 6s-6-2.4-6-6c0-2.5 0-4.9 1-6.5z" /><path d="M10 12h.01M14 12h.01" /><path d="M11 15.5h2l-1 1z" /></>,
  backpack: <><path d="M6 10a6 6 0 0 1 12 0v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19z" /><path d="M9.5 4.5V4a2.5 2.5 0 0 1 5 0v.5" /><rect x="8.5" y="13" width="7" height="4.5" rx="1.2" /></>,
  drop: <><path d="M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5" /></>,
  suitcase: <><rect x="5" y="7" width="14" height="12.5" rx="2.5" /><path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" /><path d="M9 7v12.5M15 7v12.5" /></>,
  brick: <><rect x="3.5" y="6" width="17" height="12" rx="1.5" /><path d="M3.5 12h17M9 6v6M15 12v6" /></>,
}

export type IconName = keyof typeof P

export function Icon({ name, size = 20, stroke = 1.8, className }: { name: string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {P[name] ?? P.sparkle}
    </svg>
  )
}

/** Tonos de las burbujas: fondo con brillo + color del trazo */
export type Tone = 'teal' | 'mint' | 'ember' | 'sun' | 'sky' | 'mute' | 'dark'

/** Burbuja de vidrio con un ícono adentro (reemplaza los emojis en tarjetas) */
export function Badge({ icon, tone = 'teal', size = 52, iconSize, className = '' }: { icon: string; tone?: Tone; size?: number; iconSize?: number; className?: string }) {
  return (
    <span className={`badge tone-${tone} ${className}`} style={{ width: size, height: size }}>
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.46)} stroke={size > 70 ? 1.6 : 1.8} />
    </span>
  )
}

/** Todos los logros usan el mismo tono (verde petróleo) */
export const KIND_TONE: Record<string, Tone> = {
  salud: 'teal',
  cuerpo: 'teal',
  meta: 'teal',
  equivalencia: 'teal',
  constancia: 'teal',
}
