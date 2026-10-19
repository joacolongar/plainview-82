import { numeroEdicion } from '../lib/edicion'
import { fechaLarga, fechaMini } from '../lib/fecha'
import { useFechaEdicion } from '../lib/useFechaEdicion'
import RotatingLogo from './RotatingLogo'
import { TiraPaginas } from './NavegacionPaginas'
import SiteNav from './SiteNav'


/**
 * Cabecera del diario THE PLAINVIEW (solo en la portada; reemplaza al header compacto).
 * Estructura tomada de un diario de los años 30 (docs: cabecera-maqueta): bloque WATCH CLOSER a la izquierda,
 * nombre al centro, logo giratorio a la derecha, barra de volumen/fecha entre filetes y las secciones abajo.
 */
// Los dos bloques rojos miden lo mismo (el del 8:2 es el contenedor del giro): la cabecera queda simétrica
const BLOQUE = 'h-[52px] w-[50px] md:h-[100px] md:w-24'

export default function Masthead() {
  // La fecha de la edición del día: cambia a la medianoche de Argentina (lib/edicion.ts)
  const hoy = useFechaEdicion()
  const edicion = numeroEdicion(hoy)
  return (
    <header>
      {/* Simétrica, como en la maqueta: bloque WATCH CLOSER | título | logo giratorio del mismo tamaño.
          En mobile el título va en dos líneas para que entren los tres. */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 md:gap-x-6">
        <img src="/logo/logo-watch-closer.webp" alt="Watch closer" width={287} height={300} className={BLOQUE} />
        <h1 className="text-center font-masthead text-[clamp(2.25rem,10vw,6.5rem)] leading-[0.95]">
          <span className="block md:inline">The</span> Plainview
        </h1>
        <RotatingLogo lado="derecha" tamano={BLOQUE} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 border-y-4 border-double border-print py-1 font-display text-[11px] uppercase tracking-wider md:text-xs">
        {/* "Vol. 8 · No. 2" es fijo, como marca; la edición avanza todos los días (lib/edicion.ts) */}
        <span>
          <span className="md:hidden">Vol. 8 · No. 2 · Ed. N° {edicion}</span>
          <span className="hidden md:inline">Vol. 8 · Córdoba · No. 2 · Edición N° {edicion}</span>
        </span>
        <time dateTime={hoy.toISOString().slice(0, 10)}>
          <span className="md:hidden">{fechaMini(hoy)}</span>
          <span className="hidden md:inline">{fechaLarga.format(hoy)}</span>
        </time>
      </div>
      <SiteNav />
      <TiraPaginas />
    </header>
  )
}
