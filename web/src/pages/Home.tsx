import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Masthead from '../components/Masthead'
import { rounds } from '../data/game'
import { clasificados, getNoticias, SECCIONES, type Noticia } from '../data/noticias'
import { getProduct } from '../data/products'

// Links sobre el papel: tinta subrayada, 44px de alto para el pulgar
const paperLink = 'inline-flex min-h-11 items-center font-display text-sm font-bold uppercase tracking-wider underline underline-offset-4 hover:decoration-red'

/** Primera plana del diario THE PLAINVIEW. Mobile: una columna. Desde md: grillas con filetes entre columnas. */
export default function Home() {
  const [principal] = getNoticias('portada')
  const [clima] = getNoticias('clima')
  const secundarias = [...getNoticias('espectaculos'), ...getNoticias('internacional'), ...getNoticias('deportes')]

  return (
    <div className="paper px-3 pt-3 pb-6 shadow-2xl md:px-8 md:pt-6">
      <Masthead />

      {/* Noticia principal: en 375×667 entran titular, bajada e ilustración con epígrafe */}
      <article className="pt-2 md:pt-5">
        <h2 className="text-center font-headline text-[clamp(3rem,15vw,9rem)] uppercase leading-[0.92] text-balance hyphens-auto">
          {principal.titular}
        </h2>
        <p className="mx-auto mt-2 max-w-3xl text-center font-display text-[17px] italic leading-snug md:text-2xl">{principal.bajada}</p>
        <div className="mt-2 grid gap-4 md:mt-5 md:grid-cols-3 md:gap-6">
          <figure className="md:col-span-2">
            {/* Placeholder con borde de grabado hasta que esté la ilustración propia */}
            <div className="border-4 border-double border-print p-1">
              <div className="engraving flex aspect-[2/1] items-center justify-center md:aspect-[4/3]">
                <span className="bg-paper px-2 font-display text-xs uppercase tracking-widest text-print-muted">Grabado en preparación</span>
              </div>
            </div>
            {principal.epigrafe && <figcaption className="mt-1 font-display text-sm italic leading-snug text-print-muted">{principal.epigrafe}</figcaption>}
          </figure>
          <div className="border-t border-print/30 pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <Cuerpo parrafos={principal.cuerpo} />
            <Link to="/catalogo" className={paperLink}>Ver el catálogo →</Link>
          </div>
        </div>
      </article>

      {/* Noticias secundarias */}
      <div className="mt-6 grid border-t-4 border-double border-print md:grid-cols-3 md:divide-x md:divide-print/30">
        {secundarias.map((n) => (
          <div key={n.id} className="border-b border-print/30 py-5 last:border-b-0 md:border-b-0 md:px-5 md:first:pl-0 md:last:pr-0">
            <Articulo n={n} />
          </div>
        ))}
      </div>

      {/* Columnas chicas: el tiempo, clasificados y pasatiempos */}
      <div className="grid border-t-4 border-double border-print md:grid-cols-3 md:divide-x md:divide-print/30">
        <section className="border-b border-print/30 py-5 md:border-b-0 md:pr-5">
          {clima && <Articulo n={clima} chico />}
        </section>
        <section className="border-b border-print/30 py-5 md:border-b-0 md:px-5">
          <Volanta>Avisos clasificados</Volanta>
          <ul className="mt-2 space-y-2 font-display text-[15px] leading-snug">
            {clasificados.map((c) => (
              <li key={c} className="border-b border-dotted border-print/40 pb-2">{c}</li>
            ))}
          </ul>
          <Link to="/como-comprar" className={paperLink}>Ver Cómo comprar →</Link>
        </section>
        <section className="py-5 md:pl-5">
          <Volanta>Pasatiempos</Volanta>
          <h3 className="mt-1 font-headline text-2xl uppercase leading-none">¿De qué película es?</h3>
          {/* Sin mostrar pistas: las películas del juego también salen en las noticias y la respuesta quedaría a la vista */}
          <p className="mt-2 font-display text-[15px] italic leading-snug">
            {rounds.length} acertijos de cine esperan al lector atento. Pistas propias, ninguna trampa y un premio para quien mire de cerca.
          </p>
          <Link to="/pasatiempos" className={paperLink}>Ir a Pasatiempos →</Link>
        </section>
      </div>
    </div>
  )
}

function Volanta({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-print-muted">
      <span aria-hidden className="size-2 bg-red" />
      {children}
    </p>
  )
}

/** Cuerpo de nota con capitular (primera letra grande) en el primer párrafo */
function Cuerpo({ parrafos }: { parrafos: string[] }) {
  return (
    <div className="space-y-2 font-display text-[15px] leading-snug text-pretty">
      {parrafos.map((p, i) => (
        <p key={i} className={i === 0 ? 'first-letter:float-left first-letter:mr-1.5 first-letter:font-headline first-letter:text-5xl first-letter:leading-[0.8]' : ''}>
          {p}
        </p>
      ))}
    </div>
  )
}

function Articulo({ n, chico = false }: { n: Noticia; chico?: boolean }) {
  const product = n.productSlug ? getProduct(n.productSlug) : undefined
  return (
    <article>
      <Volanta>{SECCIONES[n.seccion]}</Volanta>
      <h3 className={`mt-1 font-headline uppercase leading-none text-balance hyphens-auto ${chico ? 'text-2xl' : 'text-3xl'}`}>{n.titular}</h3>
      <p className="mt-2 font-display italic leading-snug">{n.bajada}</p>
      <div className="mt-2">
        <Cuerpo parrafos={n.cuerpo} />
      </div>
      {product && <Link to={`/producto/${product.slug}`} className={paperLink}>Ver la remera →</Link>}
    </article>
  )
}
