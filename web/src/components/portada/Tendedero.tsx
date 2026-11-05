import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { numeroArticulo, products, rendersDe, rutaAviso, type Product } from '../../data/products'
import TENDEDERO from '../../data/tendedero.json'
import Paquete from './Paquete'

/**
 * El tendedero del kiosco (docs/portada/PORTADA.md, idea 2): todas las remeras del catálogo, en su orden, colgadas de
 * una cuerda con dos broches. Cada una es el render de Blender de la remera colgada (public/portada/<diseño>-colgada.webp,
 * de aplicar_diseno.py --web); las que todavía no lo tienen cuelgan como un paquete en papel de diario. Cuando tengan
 * render, se reemplazan solas (`colgada` en products.ts).
 *
 * En el celular la fila se desliza con el dedo y frena en cada remera (scroll-snap); data-no-swipe: deslizarla no pasa
 * de página. En la compu, centradas. El vaivén es CSS (index.css): solo transform, sin él con menos movimiento.
 */
export default function Tendedero() {
  return (
    <section aria-labelledby="tendedero-titulo" className="-mx-3 mt-6 border-t-2 border-print pt-2 md:-mx-8">
      <div className="flex items-baseline justify-between px-3 md:px-8">
        <h2 id="tendedero-titulo" className="font-display text-[10px] font-bold uppercase tracking-[0.25em]">
          Colgadas en el kiosco
        </h2>
        <span aria-hidden className="font-display text-[13px] italic text-print-muted md:hidden">
          deslizá ⟷
        </span>
      </div>
      <div data-no-swipe className="tendedero-fila snap-x snap-mandatory overflow-x-auto scroll-px-3 pb-2">
        <ul className="relative flex w-max min-w-full justify-center gap-5 px-6 pt-4 md:gap-10">
          <Cuerda />
          {products.map((p, i) => (
            <li key={p.slug} className="snap-center">
              <Prenda p={p} i={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** La cuerda, de lado a lado de la fila, apenas vencida en el medio */
function Cuerda() {
  return (
    <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-3 h-4 w-full">
      <path d="M0 1.5 Q50 5 100 1.5" fill="none" className="stroke-madera-oscura" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Broches del paquete: arriba, a un cuarto de cada borde */
const BROCHES_PAQUETE = [
  [25, 2],
  [75, 2],
]

function Prenda({ p, i }: { p: Product; i: number }) {
  const colgada = rendersDe(p)?.colgada
  const broches = colgada ? TENDEDERO.broches : BROCHES_PAQUETE
  // cada una se balancea a destiempo de la anterior
  const estilo = { '--desfase': `${-1.7 * i}s` } as CSSProperties
  return (
    <Link
      to={rutaAviso(p.slug)}
      className="group block w-[136px] rounded-sm text-center outline-offset-4 focus-visible:outline-2 focus-visible:outline-print md:w-[160px]"
    >
      <div className="colgada relative origin-top" style={estilo}>
        {broches.map(([x, y], b) => (
          <span
            key={b}
            aria-hidden
            className="absolute z-10 h-[22px] w-[9px] -translate-x-1/2 -translate-y-[45%] rounded-[2px] border border-madera-oscura bg-madera"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
        {colgada ? (
          <img src={colgada} alt="" width={TENDEDERO.ancho} height={TENDEDERO.alto} loading="lazy" className="block w-full" />
        ) : (
          <div className="px-3 pt-1">
            <Paquete torcido={i} />
          </div>
        )}
        <Etiqueta p={p} />
      </div>
      <span className="mt-2 block font-display text-[14px] italic leading-tight underline-offset-4 group-hover:underline">{p.titular}</span>
    </Link>
  )
}

/** La etiqueta de cartón: N° de artículo y precio (o "Próximo número") */
function Etiqueta({ p }: { p: Product }) {
  const conPrecio = p.status !== 'proximamente' && p.price > 0
  return (
    <span className="absolute -right-2 top-[52%] block -rotate-6 border border-madera-oscura bg-carton px-1.5 pt-0.5 pb-1 text-left shadow-sm">
      <span className="block font-display text-[8px] font-bold uppercase tracking-[0.12em]">N° {numeroArticulo(p)}</span>
      {conPrecio ? (
        <span className="block font-headline text-[17px] leading-none">$ {miles.format(p.price)}</span>
      ) : (
        <span className="block font-headline text-[13px] uppercase leading-none">Próximo número</span>
      )}
      {conPrecio && p.precioDePrueba && <span className="block font-display text-[8px] italic">de prueba</span>}
    </span>
  )
}

const miles = new Intl.NumberFormat('es-AR') // 32000 → "32.000"
