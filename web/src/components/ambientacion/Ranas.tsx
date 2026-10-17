import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { Zona } from './Ambientacion'
import { movimientoReducido } from './movimiento'

/**
 * Magnolia: al entrar a la página llueven ranas una sola vez. Caen de arriba abajo cruzando la pantalla (pueden
 * pasar por encima de todo, incluido el texto, porque pasan y se van), cada una con su velocidad, su retraso y
 * un leve giro, para que no caigan en fila. Cuando sale la última, el componente las saca de la página
 * (un temporizador con la misma cuenta que la animación): no vuelven hasta que se entra de nuevo.
 * Con movimiento reducido no aparecen.
 *
 * Van en un portal a <body>, en una capa fija del tamaño de la pantalla: así caen por la pantalla aunque la
 * persona esté a mitad de página y quedan por encima de todo (el aviso es "isolate" y las encerraría adentro).
 * pointer-events: none → nunca bloquean un toque mientras caen.
 */
type Rana = { x: number; ancho: number; dur: number; retraso: number; giroDesde: number; giroHasta: number; deriva: number }

// x en % del ancho de la pantalla (el borde izquierdo de la rana)
const RANAS: Rana[] = [
  { x: 6, ancho: 62, dur: 3.2, retraso: 0.1, giroDesde: -20, giroHasta: 10, deriva: 14 },
  { x: 58, ancho: 78, dur: 2.6, retraso: 0.5, giroDesde: 15, giroHasta: -12, deriva: -18 },
  { x: 30, ancho: 54, dur: 3.9, retraso: 0.25, giroDesde: 8, giroHasta: 30, deriva: 10 },
  { x: 78, ancho: 66, dur: 3.5, retraso: 0.9, giroDesde: -10, giroHasta: -32, deriva: -12 },
  { x: 42, ancho: 50, dur: 2.9, retraso: 1.3, giroDesde: 25, giroHasta: 4, deriva: 16 },
]

// Cuándo sale la última (retraso + duración), con un margen
const FIN_MS = Math.max(...RANAS.map((r) => r.retraso + r.dur)) * 1000 + 300

export default function Ranas({ zona }: { zona: Zona }) {
  // Se decide al montar: si se entra de nuevo a la página, el componente se monta de nuevo y vuelven a caer
  const [cayendo, setCayendo] = useState(() => zona === 'pagina' && !movimientoReducido())

  useEffect(() => {
    if (!cayendo) return
    const t = setTimeout(() => setCayendo(false), FIN_MS)
    return () => clearTimeout(t) // si se sale antes, no queda un temporizador colgado
  }, [cayendo])

  if (!cayendo) return null

  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 select-none overflow-clip">
      {RANAS.map((r, i) => {
        const estilo: CSSProperties = {
          left: `${r.x}%`,
          ['--dur' as string]: `${r.dur}s`,
          ['--retraso' as string]: `${r.retraso}s`,
          ['--giro-desde' as string]: `${r.giroDesde}deg`,
          ['--giro-hasta' as string]: `${r.giroHasta}deg`,
          ['--deriva' as string]: `${r.deriva}px`,
        }
        return (
          <img
            key={i}
            src="/ilustraciones/ambientacion/rana.svg"
            alt=""
            width={r.ancho}
            height={r.ancho}
            className="amb-rana absolute top-0"
            style={estilo}
          />
        )
      })}
    </div>,
    document.body,
  )
}
