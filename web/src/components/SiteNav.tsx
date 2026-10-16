import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// `short` es la etiqueta en mobile, por si alguna no entra a 375px al lado de las otras
const nav = [
  { to: '/catalogo', label: 'Catálogo', short: 'Catálogo' },
  { to: '/pasatiempos', label: 'Pasatiempos', short: 'Pasatiempos' },
  { to: '/como-comprar', label: 'Cómo comprar', short: 'Cómo comprar' },
]

/**
 * Secciones del sitio + link al pedido. Se usa en el header compacto (fondo oscuro) y en la cabecera del diario (papel).
 * - `onPaper`: sobre la hoja crema el activo se marca con subrayado rojo en vez de texto rojo
 *   (texto rojo chico sobre crema no llega al contraste mínimo).
 * - `cart`: 'desktop' = el pedido va en el nav solo desde md (en mobile lo pone el header arriba); 'always' = siempre en el nav.
 */
export default function SiteNav({ onPaper = false, cart }: { onPaper?: boolean; cart: 'desktop' | 'always' }) {
  const link = (isActive: boolean) =>
    onPaper
      ? isActive ? 'font-bold underline decoration-red decoration-2 underline-offset-4' : 'hover:underline underline-offset-4'
      : isActive ? 'text-red' : 'hover:text-red'
  const cols = cart === 'always' ? 'grid-cols-[1fr_1fr_1fr_auto]' : 'grid-cols-3'

  return (
    <nav className={`grid ${cols} text-xs uppercase tracking-wider md:flex md:items-center md:gap-6 md:text-sm md:tracking-widest`}>
      {nav.map((n) => (
        <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex min-h-11 items-center justify-center text-center ${link(isActive)}`}>
          <span className="md:hidden">{n.short}</span>
          <span className="hidden md:inline">{n.label}</span>
        </NavLink>
      ))}
      <CartLink className={cart === 'always' ? 'flex' : 'hidden md:flex'} linkClass={link} />
    </nav>
  )
}

/** Link al pedido. En el header compacto aparece dos veces (arriba en mobile, en el nav en desktop); `className` decide cuál se ve. */
export function CartLink({ className, linkClass }: { className: string; linkClass?: (isActive: boolean) => string }) {
  const { count } = useCart()
  return (
    <NavLink
      to="/carrito"
      aria-label={`Pedido, ${count} productos`}
      className={({ isActive }) =>
        `${className} min-h-11 min-w-11 items-center justify-center font-mono text-sm ${linkClass ? linkClass(isActive) : isActive ? 'text-red' : 'hover:text-red'}`
      }
    >
      [{count}]
    </NavLink>
  )
}
