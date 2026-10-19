import { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// `corta` es la etiqueta en el celular: a 375 px las cuatro tienen que entrar en un renglón
const secciones = [
  { to: '/catalogo', label: 'Catálogo', corta: 'Catálogo' },
  { to: '/pasatiempos', label: 'Pasatiempos', corta: 'Pasatiempos' },
  { to: '/atencion-al-lector', label: 'Atención al lector', corta: 'Atención al lector' },
]

/**
 * Barra de secciones del diario, entre los filetes de la cabecera (portada y cabecera chica):
 * CATÁLOGO · PASATIEMPOS · ATENCIÓN AL LECTOR · BOLETA (n), centrada, en Anton (la condensada de los titulares).
 * La sección activa se marca con subrayado rojo y el texto en tinta: texto rojo chico sobre la hoja no llega al
 * contraste mínimo. Cada link mide al menos 44 px de alto; los "·" son adorno (aria-hidden).
 */
export default function SiteNav() {
  const { count } = useCart()
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center px-0.5 ${isActive ? 'underline decoration-red decoration-2 underline-offset-4' : 'hover:underline underline-offset-4'}`

  return (
    <nav
      aria-label="Secciones"
      className="flex items-center justify-center gap-x-[3px] max-[359px]:gap-x-0 max-[359px]:text-[11px] border-b-2 border-print font-headline text-[12px] uppercase tracking-[0.03em] whitespace-nowrap min-[400px]:gap-x-2 min-[400px]:text-sm md:gap-x-3 md:text-base md:tracking-[0.12em]"
    >
      {secciones.map((s) => (
        <Fragment key={s.to}>
          <NavLink to={s.to} className={link}>
            <span className="md:hidden">{s.corta}</span>
            <span className="hidden md:inline">{s.label}</span>
          </NavLink>
          <Separador />
        </Fragment>
      ))}
      <NavLink to="/carrito" aria-label={`Boleta, ${count} ${count === 1 ? 'artículo' : 'artículos'}`} className={link}>
        Boleta ({count})
      </NavLink>
    </nav>
  )
}

function Separador() {
  return (
    <span aria-hidden className="text-print/60">
      ·
    </span>
  )
}
