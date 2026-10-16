import { Outlet, useLocation } from 'react-router-dom'
import { BRAND, IS_PREVIEW } from '../config'
import RotatingLogo from './RotatingLogo'
import SiteNav, { CartLink } from './SiteNav'

export default function Layout() {
  // En la portada la cabecera del diario (Masthead, dentro de Home) reemplaza a este header
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  // Páginas impresas en la hoja crema: menos margen en el main para que la hoja aproveche el ancho
  const enHoja = isHome || pathname === '/pasatiempos'

  return (
    <div className="min-h-screen flex flex-col">
      {IS_PREVIEW && (
        <p className="border-b border-line px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-wider md:tracking-[0.2em] text-muted">
          Edición N° 0 · <span className="text-red">Número de prueba</span> · Precios y fotos todavía no son reales
        </p>
      )}
      {!isHome && (
        <header className="border-b-4 border-double border-line">
          {/* Mobile: logo + pedido arriba y las secciones en una fila abajo. Desde md: todo en una línea */}
          <div className="mx-auto max-w-6xl px-4 md:py-4 md:flex md:items-center md:justify-between md:gap-4">
            <div className="flex items-center justify-between gap-4 py-1 md:py-0">
              <RotatingLogo />
              <CartLink className="flex md:hidden" />
            </div>
            <div className="border-t border-line md:border-0">
              <SiteNav cart="desktop" />
            </div>
          </div>
        </header>
      )}
      <main className={`flex-1 mx-auto w-full max-w-6xl ${enHoja ? 'px-2 py-2 md:px-4 md:py-6' : 'px-4 py-8 md:py-10'}`}>
        <Outlet />
      </main>
      <footer className="border-t border-line text-muted text-sm">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
          <span className="italic">{BRAND.slogan}</span>
          <a href={BRAND.instagram} target="_blank" rel="noreferrer" className="flex min-h-11 items-center hover:text-paper">@plainview.82</a>
        </div>
      </footer>
    </div>
  )
}
