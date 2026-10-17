import type { CSSProperties } from 'react'
import type { Zona } from './Ambientacion'
import Capa, { BORDES_HOJA } from './Capa'

/**
 * Magnolia: ranas que caen despacio por las franjas del margen, cortadas por el borde de la hoja.
 * Cada rana asoma como mucho --asoma (9 px en mobile, donde el margen mide 12; 22 px desde md, donde mide 32),
 * contando lo que crece su caja al girar: así nunca llega a una palabra.
 */
type Rana = { lado: 'izq' | 'der'; y: number; ancho: number; dur: number; retraso: number; giro: number; opacidad: number; soloMd?: boolean }

// En mobile van 4 (la última es solo para pantallas grandes). Retrasos negativos: al entrar ya están cayendo
const RANAS: Rana[] = [
  { lado: 'izq', y: 6, ancho: 34, dur: 11, retraso: -2, giro: -20, opacidad: 1 },
  { lado: 'der', y: 30, ancho: 46, dur: 13, retraso: -8, giro: 22, opacidad: 0.9 },
  { lado: 'izq', y: 55, ancho: 28, dur: 9, retraso: -5, giro: 14, opacidad: 0.45 },
  { lado: 'der', y: 78, ancho: 40, dur: 14, retraso: -11, giro: -28, opacidad: 0.6 },
  { lado: 'izq', y: 90, ancho: 52, dur: 12, retraso: -9, giro: 8, opacidad: 0.8, soloMd: true },
]

const BALANCEO = 12 // grados de más que gira al balancearse (amb-balancea en index.css)

/** Ancho de la caja de un cuadrado de lado `a` girado `grados` */
function cajaGirada(a: number, grados: number) {
  const r = (Math.abs(grados) * Math.PI) / 180
  return a * (Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)))
}

export default function Ranas({ zona }: { zona: Zona }) {
  if (zona !== 'pagina') return null
  return (
    <Capa className={`inset-y-0 ${BORDES_HOJA} [--asoma:9px] md:[--asoma:22px]`}>
      {RANAS.map((r, i) => {
        // El peor giro (con el balanceo) define cuánto se agranda la caja hacia adentro
        const caja = Math.max(cajaGirada(r.ancho, r.giro), cajaGirada(r.ancho, r.giro + BALANCEO))
        const desde = `calc(var(--asoma) - ${(r.ancho + caja) / 2}px)` // del borde de la hoja al costado de la rana
        const franja: CSSProperties = {
          [r.lado === 'izq' ? 'left' : 'right']: desde,
          width: r.ancho,
          ['--y' as string]: `${r.y}%`,
          ['--dur' as string]: `${r.dur}s`,
          ['--retraso' as string]: `${r.retraso}s`,
        }
        return (
          <div key={i} className={`amb-cae absolute inset-y-0 ${r.soloMd ? 'hidden md:block' : ''}`} style={franja}>
            <img
              src="/ilustraciones/ambientacion/rana.svg"
              alt=""
              width={r.ancho}
              height={r.ancho}
              className="amb-balancea absolute"
              style={{ top: `${r.y}%`, opacity: r.opacidad, transform: `rotate(${r.giro}deg)`, ['--giro' as string]: `${r.giro}deg` }}
            />
          </div>
        )
      })}
    </Capa>
  )
}
