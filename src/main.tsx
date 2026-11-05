import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => { /* sin service worker: la app sigue funcionando */ })
}

/**
 * Busca versión nueva al abrir la app y cada vez que vuelves a ella.
 * Compara el archivo de la app publicado con el que está corriendo; si cambió, recarga.
 * (Tus datos están en localStorage y se quedan igual.)
 */
if (import.meta.env.PROD) {
  const current = () => document.querySelector<HTMLScriptElement>('script[type="module"][src*="assets/"]')?.getAttribute('src')
  let checking = false
  const check = async () => {
    if (checking || !navigator.onLine) return
    checking = true
    try {
      const html = await (await fetch(`./?v=${Date.now()}`, { cache: 'no-store' })).text()
      const latest = html.match(/<script[^>]+type="module"[^>]+src="([^"]*assets\/[^"]+)"/)?.[1]
      const mine = current()
      if (latest && mine && latest !== mine) location.reload()
    } catch { /* sin internet: se queda la versión actual */ }
    checking = false
  }
  check()
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
}
