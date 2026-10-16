import { Link, NavLink, Outlet } from 'react-router-dom'
import { BRAND } from '../config'
import { useCart } from '../context/CartContext'

const nav = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/juego', label: 'Adiviná la peli' },
  { to: '/como-comprar', label: 'Cómo comprar' },
]

export default function Layout() {
  const { count } = useCart()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-4 border-double border-line">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-2xl font-black tracking-tight">
            PLAINVIEW <span className="text-red">8:2</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm uppercase tracking-widest">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'text-red' : 'hover:text-red')}>
                {n.label}
              </NavLink>
            ))}
            <NavLink to="/carrito" className="font-mono" aria-label={`Carrito, ${count} productos`}>
              [{count}]
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line text-muted text-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 flex justify-between">
          <span className="italic">{BRAND.slogan}</span>
          <a href={BRAND.instagram} target="_blank" rel="noreferrer" className="hover:text-paper">@plainview.82</a>
        </div>
      </footer>
    </div>
  )
}
