import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Aviso from '../components/Aviso'
import Ambientacion from '../components/ambientacion/Ambientacion'
import FeDeErratas, { WatchCloser } from '../components/FeDeErratas'
import Galeria from '../components/Galeria'
import { useCart } from '../context/CartContext'
import { avisoDeProducto } from '../data/anuncios'
import { fotosDe } from '../data/fotos'
import { MEDIDAS, MEDIDAS_DE_EJEMPLO } from '../data/medidas'
import { ESTADOS, getProduct, numeroArticulo, rutaAviso, type Product, type Size } from '../data/products'
import NotFound from './NotFound'

const miles = new Intl.NumberFormat('es-AR') // 25000 → "25.000"

/**
 * El aviso comercial de una remera, como en los catálogos de venta por correo del lejano oeste:
 * N° de artículo, titular enorme, precio en recuadro, grabado con epígrafe y texto de aviso.
 * Mobile-first: titular a todo el ancho; bajada y precio en una fila; después grabado, texto, Fe de erratas,
 * tabla de medidas y el cupón "Recorte y agregue a su pedido", con su botón pegado abajo.
 */
export default function AvisoComercial() {
  const { slug = '' } = useParams()
  const p = getProduct(slug)
  const { add } = useCart()
  const [size, setSize] = useState<Size | null>(null)
  const [color, setColor] = useState(p?.colors[0] ?? '')
  const [added, setAdded] = useState(false)

  if (!p) return <NotFound />
  const canBuy = p.status !== 'proximamente' && size !== null
  const avisoChico = avisoDeProducto(p.slug)
  const fotos = fotosDe(p)

  return (
    // relative + isolate: la ambientación se ubica contra la página y lo que va detrás del texto (la lluvia) queda
    // sobre el papel pero debajo de las palabras
    <article className="relative isolate">
      {/* key: al pasar a otra remera se monta de nuevo y su animación de entrada vuelve a empezar */}
      <Ambientacion key={p.slug} tipo={p.ambientacion} zona="pagina" />
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.15em] text-print-muted">
        Art. N° {numeroArticulo(p)}
        {/* el lugar, si no es el nombre de la película (Casablanca · Casablanca) */}
        {p.lugar && p.lugar !== p.movie && ` · ${p.lugar}`} · {p.movie} · {p.director} · {p.year}
      </p>
      <h1 className="mt-1 font-headline text-[clamp(2.5rem,12vw,5.5rem)] uppercase leading-[0.92] text-balance hyphens-auto">{p.titular}</h1>
      <div className="mt-3 flex items-start gap-3">
        <p className="flex-1 font-display text-[17px] italic leading-snug md:text-xl">{p.bajada}</p>
        <Precio p={p} />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-8">
        <figure>
          {/* Las fotos si hay (galería), si no el grabado con trama; siempre con doble filete y epígrafe */}
          {fotos.length > 0 ? (
            <Galeria fotos={fotos} boceto={p.fotoBoceto} marco="border-4 border-double border-print p-1">
              <Ambientacion key={p.slug} tipo={p.ambientacion} zona="grabado" />
            </Galeria>
          ) : (
            <div className="relative border-4 border-double border-print p-1">
              <div className="engraving flex aspect-[4/5] items-center justify-center">
                <span className="bg-paper px-2 font-display text-xs uppercase tracking-widest text-print-muted">Grabado en preparación</span>
              </div>
              {/* Lo que puede pasar por encima de la foto (nunca de una palabra) */}
              <Ambientacion key={p.slug} tipo={p.ambientacion} zona="grabado" />
            </div>
          )}
          <figcaption className="mt-1 font-display text-sm italic leading-snug text-print-muted">{p.epigrafe}</figcaption>
        </figure>

        <div className="space-y-5">
          {/* Texto del aviso con capitular, como en los catálogos de época */}
          <p className="font-display text-[15px] leading-snug text-pretty first-letter:float-left first-letter:mr-1.5 first-letter:font-headline first-letter:text-5xl first-letter:leading-[0.8]">
            {p.aviso}
          </p>
          <FeDeErratas p={p} />
          <WatchCloser referencia={p.reference} />
          <TablaMedidas talles={p.sizes} elegido={size} />

          {/* El cupón de los catálogos por correo: se "llena" y se agrega al pedido */}
          <section aria-labelledby="cupon-titulo" className="relative border-2 border-dashed border-print px-3 pt-4 pb-3">
            <span aria-hidden className="absolute -top-3.5 left-3 bg-paper px-1 text-xl leading-none">✂</span>
            <h2 id="cupon-titulo" className="font-headline text-lg uppercase leading-none">Recorte y agregue a su pedido</h2>
            <p className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-print-muted">
              Art. N° {numeroArticulo(p)} — {p.titular} · Llene y envíe
            </p>
            <fieldset className="mt-3">
              <legend className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.15em]">Talle</legend>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`h-11 w-12 border font-display ${size === s ? 'border-2 border-red font-bold' : 'border-print/40'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <a href="#medidas" className="mt-1 inline-flex min-h-11 items-center font-display text-sm underline underline-offset-4">
                ¿Qué talle soy? Ver medidas ↑
              </a>
            </fieldset>
            {p.colors.length > 1 && (
              <fieldset className="mt-2">
                <legend className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.15em]">Color</legend>
                <div className="flex flex-wrap gap-2">
                  {p.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      aria-pressed={color === c}
                      className={`min-h-11 border px-3 font-display ${color === c ? 'border-2 border-red font-bold' : 'border-print/40'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </section>

          {/* El botón del cupón. sticky (no fixed): en mobile queda pegado abajo, al alcance del pulgar, mientras se
              lee el aviso (aunque el cupón no esté a la vista), y al llegar al final vuelve a su lugar debajo del cupón */}
          <div className="sticky bottom-0 -mx-3 mt-0! space-y-2 border-t border-print/30 bg-paper px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:border-0 md:p-0">
            <button
              disabled={!canBuy}
              onClick={() => {
                add({ slug: p.slug, name: p.name, price: p.price, size: size!, color })
                setAdded(true)
              }}
              className="min-h-12 w-full bg-red font-display text-[19px] font-bold uppercase tracking-wider text-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              {p.status === 'proximamente' ? 'Próximo número' : size ? 'Agregar al pedido' : 'Elegí un talle'}
            </button>
            {added && (
              <p className="flex items-center justify-between font-display text-sm">
                Agregado.
                <Link to="/carrito" className="flex min-h-11 items-center font-bold underline decoration-red decoration-2 underline-offset-4">
                  Ver la boleta
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Al pie, el aviso chico de esta remera (sin link: ya estamos en su página) */}
      {avisoChico && (
        <aside className="mt-8 max-w-sm">
          <Aviso aviso={avisoChico} sinLink />
        </aside>
      )}
    </article>
  )
}

/** Tabla de medidas de época: solo los talles de esta remera; resalta el elegido en el cupón */
function TablaMedidas({ talles, elegido }: { talles: Size[]; elegido: Size | null }) {
  return (
    <section id="medidas" aria-labelledby="medidas-titulo" className="scroll-mt-4">
      <h2 id="medidas-titulo" className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">
        Tabla de medidas (en cm)
      </h2>
      <table className="mt-1 w-full border-y-4 border-double border-print font-display text-[15px] tabular-nums">
        <thead>
          <tr className="border-b border-print/40 text-[11px] uppercase tracking-widest">
            <th scope="col" className="py-1 text-left">Talle</th>
            <th scope="col" className="py-1 text-right">Ancho</th>
            <th scope="col" className="py-1 text-right">Largo</th>
          </tr>
        </thead>
        <tbody>
          {talles.map((t) => (
            <tr key={t} className={`border-b border-dotted border-print/40 last:border-0 ${elegido === t ? 'bg-print/10 font-bold' : ''}`}>
              <th scope="row" className="py-1 text-left">{t}</th>
              <td className="py-1 text-right">{MEDIDAS[t].ancho}</td>
              <td className="py-1 text-right">{MEDIDAS[t].largo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 font-display text-xs italic text-print-muted">Ancho: de axila a axila. Largo: del hombro al ruedo.</p>
      {MEDIDAS_DE_EJEMPLO && (
        <p className="mt-1 font-display text-xs font-bold">Medidas de ejemplo: las reales llegan con la próxima edición.</p>
      )}
    </section>
  )
}

/** Precio en recuadro, con el "$" chico y alto como en la referencia. Sin precio todavía: "Próximo número" */
function Precio({ p }: { p: Product }) {
  const conPrecio = p.status !== 'proximamente' && p.price > 0
  return (
    <div className="shrink-0 border-[3px] border-print px-2 pt-1 pb-1.5 text-center">
      {conPrecio ? (
        <p className="flex items-start justify-center font-headline leading-none" aria-label={`Precio: ${miles.format(p.price)} pesos`}>
          <span className="mt-1 text-xl" aria-hidden>$</span>
          <span className="text-5xl md:text-6xl" aria-hidden>{miles.format(p.price)}</span>
        </p>
      ) : (
        <p className="font-headline text-xl uppercase leading-none">
          Próximo
          <br />
          número
        </p>
      )}
      {/* Sin precio, el recuadro ya dice "Próximo número": el estado sería repetirlo */}
      {conPrecio && <p className="mt-1 font-display text-[10px] font-bold uppercase tracking-widest">{ESTADOS[p.status]}</p>}
      {/* Mientras el precio sea inventado, que se lea: el sitio ya está publicado */}
      {conPrecio && p.precioDePrueba && (
        <p className="mt-0.5 border-t border-print/40 pt-0.5 font-display text-[10px] italic">Precio de prueba</p>
      )}
    </div>
  )
}

/** /producto/:slug era la ruta vieja: redirige al aviso para no romper links ya compartidos */
export function RedirigirAviso() {
  const { slug = '' } = useParams()
  return <Navigate to={rutaAviso(slug)} replace />
}
