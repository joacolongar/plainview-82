import { useEffect, useState, type CSSProperties } from 'react'
import type { Zona } from './Ambientacion'
import Capa, { BORDES_GRABADO } from './Capa'
import { movimientoReducido } from './movimiento'

/**
 * Casablanca, una sola vez al entrar: el pocillo volcado asoma por el borde derecho de la hoja, sobre el grabado;
 * el chorro se estira hacia abajo y caen las gotas. Cuando caen, aparece abajo la mancha (absorbida por el papel,
 * multiply), que se queda. Unos 2 s después de aparecer, el pocillo, el chorro y las gotas se desvanecen
 * (amb-taza en index.css, que dura DURACION_TAZA) y el componente los saca de la página.
 * Con movimiento reducido, solo la mancha.
 *
 * El dibujo es el de public/ilustraciones/ambientacion/taza-derramada.svg, copiado acá como JSX porque el chorro
 * y las gotas se animan por separado (un <img> se anima entero). Si se cambia el SVG, cambiarlo también acá.
 */

// Medidas en px a 375. El SVG mide 260 de ancho: se ven las primeras 150 unidades (la boca y el chorro),
// el resto queda del otro lado del borde de la hoja
const ANCHO_TAZA = 230
const ESCALA = ANCHO_TAZA / 260
const SE_VE = 150 * ESCALA
// Las gotas caen en x = 82 del SVG: a esa distancia del borde va el centro de la mancha (x = 112 de 260 en su SVG)
const GOTAS_DESDE_BORDE = (150 - 82) * ESCALA
const ANCHO_MANCHA = 130
const CENTRO_MANCHA = (112 / 260) * ANCHO_MANCHA

// La animación del pocillo entero (entra, espera y se desvanece). Se le pasa al CSS para no escribirla dos veces
const DURACION_TAZA = 3.3

export default function Cafe({ zona }: { zona: Zona }) {
  const [taza, setTaza] = useState(() => zona === 'grabado' && !movimientoReducido())

  useEffect(() => {
    if (!taza) return
    const t = setTimeout(() => setTaza(false), DURACION_TAZA * 1000 + 200)
    return () => clearTimeout(t)
  }, [taza])

  if (zona !== 'grabado') return null
  return (
    <Capa className={BORDES_GRABADO}>
      <img
        src="/ilustraciones/ambientacion/mancha-cafe.svg"
        alt=""
        width={ANCHO_MANCHA}
        className="amb-mancha absolute bottom-0.5 mix-blend-multiply"
        style={{ right: GOTAS_DESDE_BORDE - (ANCHO_MANCHA - CENTRO_MANCHA) }}
      />
      {taza && (
        <TazaDerramada
          className="amb-taza absolute top-[4%]"
          style={{ width: ANCHO_TAZA, right: SE_VE - ANCHO_TAZA, ['--dur' as string]: `${DURACION_TAZA}s` }}
        />
      )}
    </Capa>
  )
}

function TazaDerramada({ className, style }: { className: string; style: CSSProperties }) {
  return (
    <svg viewBox="0 0 260 320" className={`text-print ${className}`} style={style}>
      {/* pocillo volcado, todo blanco */}
      <g transform="rotate(-40 160 90)" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
        <path d="M212 70 C246 66 248 108 210 104" fill="none" strokeWidth="11" />
        <path d="M212 70 C246 66 248 108 210 104" fill="none" className="stroke-loza" strokeWidth="4.5" />
        <path d="M100 60 C102 104 128 124 160 124 C192 124 218 104 220 60 Z" className="fill-loza" strokeWidth="4.5" />
        <path d="M138 123 C140 130 180 130 182 123" className="fill-loza" strokeWidth="4" />
        <ellipse cx="160" cy="60" rx="60" ry="13" className="fill-loza" strokeWidth="4.5" />
        <ellipse cx="158" cy="62" rx="51" ry="8.5" className="fill-cafe" stroke="none" />
      </g>
      {/* chorro que cae desde el borde: se estira desde arriba */}
      <g className="amb-chorro">
        <path
          d="M92 112 C80 118 74 132 74 152 C74 176 78 196 79 214 C79 220 85 220 85 214 C86 194 84 172 86 152 C88 136 96 124 108 116 Z"
          className="fill-cafe"
        />
        <path d="M82 140 C80 156 80 172 81 186" className="stroke-cafe-claro" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".8" />
      </g>
      {/* gotas en el aire, cada vez más chicas, en cascada */}
      {[
        'M82 234 C80 242 77 248 77 252 C77 258 87 258 87 252 C87 248 84 242 82 234 Z',
        'M80 270 C79 275 77 279 77 282 C77 286 83 286 83 282 C83 279 81 275 80 270 Z',
        'M84 300 C83.4 303 82 305 82 307 C82 310 86 310 86 307 C86 305 84.6 303 84 300 Z',
      ].map((d, i) => (
        <path key={d} d={d} className="amb-gota fill-cafe" style={{ ['--retraso' as string]: `${1.1 + i * 0.18}s` }} />
      ))}
    </svg>
  )
}
