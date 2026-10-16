import { NavLink, Outlet } from 'react-router-dom'
import { BRAND, IS_PREVIEW } from '../config'
import { useCart } from '../context/CartContext'
import RotatingLogo from './RotatingLogo'

// `short` es la etiqueta en mobile: a 375px "Adiviná la peli" no entra al lado de las otras
const nav = [
  { to: '/catalogo', label: 'Catálogo', short: 'Catálogo' },
  { to: '/juego', label: 'Adiviná la peli', short: 'Juego' },
  { to: '/como-comprar', label: 'Cómo comprar', short: 'Cómo comprar' },
]

export default function Layout() {
  const { count } = useCart()
  return (
    <div className="min-h-screen flex flex-col">
      {IS_PREVIEW && (
        <p className="border-b border-line px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-wider md:tracking-[0.2em] text-muted">
          Edición N° 0 · <span className="text-red">Número de prueba</span> · Precios y fotos todavía no son reales
        </p>
      )}
      <header className="border-b-4 border-double border-line">
        {/* Mobile: logo + pedido arriba y las secciones en una fila abajo. Desde md: todo en una línea */}
        <div className="mx-auto max-w-6xl px-4 md:py-4 md:flex md:items-center md:justify-between md:gap-4">
          <div className="flex items-center justify-between gap-4 py-1 md:py-0">
            <RotatingLogo />
            <CartLink count={count} className="flex md:hidden" />
          </div>
          <nav className="grid grid-cols-3 border-t border-line text-xs uppercase tracking-widest md:flex md:items-center md:gap-6 md:border-0 md:text-sm">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `flex min-h-11 items-center justify-center text-center ${isActive ? 'text-red' : 'hover:text-red'}`}
              >
                <span className="md:hidden">{n.short}</span>
                <span className="hidden md:inline">{n.label}</span>
              </NavLink>
            ))}
            <CartLink count={count} className="hidden md:flex" />
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
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

/** El link al pedido aparece dos veces (arriba a la derecha en mobile, al final del nav en desktop); `className` decide cuál se ve. */
function CartLink({ count, className }: { count: number; className: string }) {
  return (
    <NavLink
      to="/carrito"
      aria-label={`Pedido, ${count} productos`}
      className={({ isActive }) => `${className} min-h-11 min-w-11 items-center justify-center font-mono text-sm ${isActive ? 'text-red' : 'hover:text-red'}`}
    >
      [{count}]
    </NavLink>
  )
}
