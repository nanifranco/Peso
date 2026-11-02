import { useMemo } from 'react'

const cache = new Map<string, string>()

/** Convierte cualquier emoji en pixel art: lo dibuja chiquito y lo agranda sin suavizar */
function pixelate(emoji: string, res: number) {
  const key = emoji + res
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = res
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${res * 0.86}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.fillText(emoji, res / 2, res / 2 + res * 0.06)
  // endurece la transparencia para bordes nítidos
  const img = ctx.getImageData(0, 0, res, res)
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 90 ? 255 : 0
  ctx.putImageData(img, 0, 0)
  const url = c.toDataURL()
  cache.set(key, url)
  return url
}

export default function PixelEmoji({ e, size = 32, res = 14, dim = false }: { e: string; size?: number; res?: number; dim?: boolean }) {
  const src = useMemo(() => pixelate(e, res), [e, res])
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="pixel inline-block"
      style={{ imageRendering: 'pixelated', filter: dim ? 'grayscale(1) brightness(.45)' : undefined }}
    />
  )
}
