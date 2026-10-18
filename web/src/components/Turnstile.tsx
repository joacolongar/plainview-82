import { useEffect, useRef, useState } from 'react'

/**
 * Turnstile, el "no soy un robot" de Cloudflare (casi siempre se resuelve solo, sin tocar nada).
 * El script se carga recién acá, cuando se abre la boleta, y nunca en index.html. Por eso la CSP de _headers
 * permite https://challenges.cloudflare.com en script-src y frame-src, y nada más de afuera.
 * Al pasar, el widget le da un token a la boleta, que lo manda con el pedido y el servidor lo verifica.
 * Cada token sirve una vez: después de cada envío, `reinicio` cambia y el widget pide uno nuevo.
 */
type ApiTurnstile = {
  render: (el: HTMLElement, opciones: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: ApiTurnstile
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let cargando: Promise<ApiTurnstile> | null = null

// Un solo <script> aunque la boleta se abra varias veces
function cargarScript(): Promise<ApiTurnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  cargando ??= new Promise((ok, mal) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => (window.turnstile ? ok(window.turnstile) : mal(new Error('Turnstile no cargó')))
    s.onerror = () => {
      cargando = null // que se pueda reintentar
      s.remove()
      mal(new Error('Turnstile no cargó'))
    }
    document.head.appendChild(s)
  })
  return cargando
}

type Props = { siteKey: string; alCambiar: (token: string | null) => void; reinicio: number }

export default function Turnstile({ siteKey, alCambiar, reinicio }: Props) {
  const caja = useRef<HTMLDivElement>(null)
  const id = useRef<string | null>(null)
  // La función cambia en cada render de la boleta: se guarda la última para no volver a dibujar el widget
  const avisar = useRef(alCambiar)
  useEffect(() => {
    avisar.current = alCambiar
  })
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vivo = true
    cargarScript()
      .then((api) => {
        if (!vivo || !caja.current) return
        id.current = api.render(caja.current, {
          sitekey: siteKey,
          action: 'pedido',
          language: 'es',
          theme: 'light',
          size: 'flexible',
          callback: (token: string) => avisar.current(token),
          'expired-callback': () => avisar.current(null),
          'error-callback': () => avisar.current(null),
        })
      })
      .catch(() => vivo && setFallo(true))
    return () => {
      vivo = false
      if (id.current) window.turnstile?.remove(id.current)
      id.current = null
    }
  }, [siteKey])

  useEffect(() => {
    if (reinicio === 0 || !id.current) return
    avisar.current(null)
    window.turnstile?.reset(id.current)
  }, [reinicio])

  if (fallo)
    return <p className="font-display text-sm font-bold">No pudimos cargar la verificación. Revisá la conexión y recargá la página.</p>
  return <div ref={caja} className="min-h-[65px]" />
}
