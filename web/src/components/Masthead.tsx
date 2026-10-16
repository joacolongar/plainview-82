import { useState } from 'react'
import RotatingLogo from './RotatingLogo'
import SiteNav from './SiteNav'

// "viernes, 16 de octubre de 2026" — el formato lo arma el navegador, en español de Argentina.
// En mobile va sin el día de la semana para que la barra entre en una línea.
const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const fechaCorta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Cabecera del diario THE PLAINVIEW (solo en la portada; reemplaza al header compacto).
 * Estructura tomada de un diario de los años 30: recuadro a la izquierda, nombre al centro, logo a la derecha,
 * barra de volumen/fecha entre filetes y las secciones abajo.
 * Mobile: recuadro y logo en una fila chica arriba del nombre. Desde md: flanquean el nombre.
 */
export default function Masthead() {
  // La fecha se calcula una sola vez al montar (inicializador de useState): el render queda puro
  const [hoy] = useState(() => new Date())
  return (
    <header>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 md:grid-cols-[1fr_auto_1fr] md:gap-x-6">
        <p className="col-start-1 row-start-1 justify-self-start border-2 border-red px-2 py-1 text-center font-headline text-sm uppercase leading-none tracking-wide md:px-3 md:py-2 md:text-lg">
          Watch
          <br />
          closer
        </p>
        {/* Recuadro oscuro: la cara PLAINVIEW del logo es crema y sobre la hoja no se vería */}
        <div className="col-start-3 row-start-1 justify-self-end bg-ink px-2 md:px-3 md:py-1">
          <RotatingLogo center />
        </div>
        {/* En mobile el nombre baja a su propia fila (row 2, todo el ancho); desde md queda en el centro de la fila 1 */}
        <h1 className="col-span-3 row-start-2 text-center font-masthead text-[clamp(2.75rem,13vw,6.5rem)] leading-none md:col-span-1 md:col-start-2 md:row-start-1">
          The Plainview
        </h1>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 border-y-4 border-double border-print py-1 font-display text-[11px] uppercase tracking-wider md:text-xs">
        <span>Vol. 8 · Córdoba · No. 2</span>
        <time dateTime={hoy.toISOString().slice(0, 10)}>
          <span className="md:hidden">{fechaCorta.format(hoy)}</span>
          <span className="hidden md:inline">{fechaLarga.format(hoy)}</span>
        </time>
      </div>
      <div className="border-b border-print/30">
        <SiteNav onPaper cart="always" />
      </div>
    </header>
  )
}
