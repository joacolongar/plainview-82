import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BRAND, IS_PREVIEW } from '../config'
import { edicionActual } from '../data/editions'
import { paginaDe, RUTA_INDICE, seccionSuelta } from '../data/paginas'
import { fechaCorta, fechaLarga } from '../lib/fecha'
import { marcarDireccion, usePasarPagina } from '../lib/pasarPagina'
import RotatingLogo from './RotatingLogo'
import SiteNav from './SiteNav'

type Pagina = ReturnType<typeof paginaDe>

/**
 * Layout común: todo el sitio es el diario THE PLAINVIEW impreso en la hoja crema.
 * - La portada trae su cabecera grande (Masthead); el resto lleva la cabecera chica con N° de página y sección.
 * - El pie pasa de página ("← pág. anterior · Índice · pág. siguiente →") y cierra con el pie de imprenta.
 * El orden y los números de página salen de src/data/paginas.ts. Se pasa de página deslizando, con ← → o
 * con el pie, con transición de hoja (src/lib/pasarPagina.ts + index.css).
 */
export default function NewspaperPage() {
  const { pathname } = useLocation()
  const pagina = paginaDe(pathname)
  const edicion = edicionActual()
  const gestos = usePasarPagina(pagina)

  return (
    <div className="flex min-h-screen flex-col">
      {IS_PREVIEW && (
        <p className="border-b border-line px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-wider text-muted md:tracking-[0.2em]">
          Edición N° {edicion.numero} · <span className="text-red">Número de prueba</span> · Precios y fotos todavía no son reales
        </p>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-2 py-2 md:px-4 md:py-6">
        {/* `hoja` es lo que anima la transición (index.css). touch-pan-y + pinch-zoom: el navegador se queda con
            el scroll vertical y el zoom, y el gesto horizontal llega entero a los pointer events (deslizar) */}
        <div className="hoja paper touch-pan-y touch-pinch-zoom px-3 pt-2 pb-4 shadow-2xl md:px-8 md:pt-4" {...gestos}>
          {pathname !== '/' && <CabeceraChica pagina={pagina} suelta={seccionSuelta(pathname)} />}
          <Outlet />
          <PieDePagina pagina={pagina} />
        </div>
      </main>
    </div>
  )
}

function CabeceraChica({ pagina, suelta }: { pagina: Pagina; suelta: string | null }) {
  const edicion = edicionActual()
  return (
    <header className="mb-5">
      {/* Mobile: el logo a la izquierda y nombre + página apilados a la derecha (en una línea no entran a 375 px) */}
      <div className="flex items-center justify-between gap-3 py-1">
        <RotatingLogo lado="izquierda" tamano="h-12 w-[46px] md:h-14 md:w-[54px]" />
        <div className="min-w-0 text-right md:flex md:items-baseline md:gap-6">
          <p className="font-masthead text-xl leading-tight md:text-3xl">The Plainview</p>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">{pagina ? `Pág. ${pagina.numero}` : suelta ? 'Suplemento' : 'Fe de erratas'}</p>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 border-y-4 border-double border-print py-1 font-display text-[11px] font-bold uppercase tracking-[0.15em]">
        <span className="truncate">{pagina?.seccion ?? suelta ?? 'Esta página no existe'}</span>
        <span className="shrink-0">Edición N° {edicion.numero}</span>
      </div>
      <SiteNav />
    </header>
  )
}

const enlacePie = 'flex min-h-11 items-center font-display text-sm underline-offset-4 hover:underline'

function PieDePagina({ pagina }: { pagina: Pagina }) {
  // La fecha se calcula una sola vez al montar (inicializador de useState): el render queda puro
  const [hoy] = useState(() => new Date())
  const edicion = edicionActual()
  return (
    <footer className="mt-8 border-t-4 border-double border-print pt-1">
      <nav aria-label="Pasar de página" className="grid grid-cols-3 items-center">
        {pagina?.anterior ? (
          <Link
            to={pagina.anterior.ruta}
            viewTransition
            onClick={() => marcarDireccion('atras')}
            className={enlacePie}
            aria-label={`Página anterior: ${pagina.anterior.seccion}`}
          >
            ← pág. {pagina.anterior.numero}
          </Link>
        ) : (
          <span />
        )}
        <Link to={RUTA_INDICE} className={`${enlacePie} justify-center font-bold uppercase tracking-wider`}>
          Índice
        </Link>
        {pagina?.siguiente ? (
          <Link
            to={pagina.siguiente.ruta}
            viewTransition
            onClick={() => marcarDireccion('adelante')}
            className={`${enlacePie} justify-end`}
            aria-label={`Página siguiente: ${pagina.siguiente.seccion}`}
          >
            pág. {pagina.siguiente.numero} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
      {/* Pie de imprenta */}
      <div className="mt-1 border-t border-print/30 pt-2 text-center font-display text-xs leading-relaxed text-print-muted">
        <p>
          <time dateTime={hoy.toISOString().slice(0, 10)}>
            <span className="md:hidden">{fechaCorta.format(hoy)}</span>
            <span className="hidden md:inline">{fechaLarga.format(hoy)}</span>
          </time>
          {pagina && <> · Pág. {pagina.numero}</>}
        </p>
        <p>
          THE PLAINVIEW · Vol. 8 · No. 2 · Edición N° {edicion.numero} · Córdoba · Redacción:{' '}
          <a href={BRAND.instagram} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2">
            @plainview.82
          </a>
        </p>
        <p className="italic">{BRAND.slogan}</p>
        {/* Obligatorio a la vista en la portada (Res. 424/2020): va en el pie de todas las páginas */}
        <p>
          <Link to="/atencion-al-lector#arrepentimiento" className="inline-flex min-h-11 items-center font-bold text-print underline underline-offset-2">
            Botón de arrepentimiento
          </Link>
        </p>
      </div>
    </footer>
  )
}
