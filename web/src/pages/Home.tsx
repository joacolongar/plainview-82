import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../components/Aviso'
import Masthead from '../components/Masthead'
import { CIERRE_PORTADA, getAviso, type Aviso as DatosAviso } from '../data/anuncios'
import { BANCO } from '../data/banco'
import { SECCIONES, type Noticia } from '../data/noticias'
import { getProduct, rutaAviso } from '../data/products'
import { elegirEdicion } from '../lib/edicion'
import { useFechaEdicion } from '../lib/useFechaEdicion'

type Item = { tipo: 'noticia'; noticia: Noticia } | { tipo: 'aviso'; aviso: DatosAviso }

/**
 * Reparte las noticias secundarias en dos columnas e intercala los avisos de la edición del día:
 * - las noticias van alternadas: izquierda, derecha, izquierda…
 * - los minis van desfasados: la derecha arranca con uno y la izquierda lo pone después de su primera noticia
 *   (así nunca quedan dos a la misma altura y hay como mucho 2 a la vista en el celular)
 * - los avisos de línea rellenan el final: el primero a la columna más corta, el siguiente a la otra
 */
function armarColumnas(noticias: Noticia[], minisDelDia: DatosAviso[], lineas: DatosAviso[]): [Item[], Item[]] {
  const minis = [...minisDelDia] // se van sacando de a uno
  const izq: Item[] = []
  const der: Item[] = []
  const mini = (col: Item[]) => {
    const a = minis.shift()
    if (a) col.push({ tipo: 'aviso', aviso: a })
  }

  mini(der)
  noticias.forEach((noticia, i) => {
    const col = i % 2 === 0 ? izq : der
    col.push({ tipo: 'noticia', noticia })
    const enSuColumna = Math.floor(i / 2) + 1
    if (col === izq ? enSuColumna % 2 === 1 : enSuColumna % 2 === 0) mini(col)
  })

  const [corta, larga] = izq.length <= der.length ? [izq, der] : [der, izq]
  lineas.forEach((aviso, i) => (i % 2 === 0 ? corta : larga).push({ tipo: 'aviso', aviso }))
  return [izq, der]
}

/**
 * Primera plana del diario THE PLAINVIEW (maqueta: docs/portada-con-avisos.png).
 * Principal corta (titular, bajada, grabado, epígrafe) y abajo dos columnas, también en el celular,
 * con noticias breves y avisos sueltos. Cierra el aviso rojo de la marca.
 * Cambia todos los días: la edición la elige elegirEdicion (lib/edicion.ts) con la fecha de Córdoba.
 */
export default function Home() {
  const edicion = elegirEdicion(useFechaEdicion(), BANCO)
  const p = edicion.principal
  const columnas = armarColumnas(edicion.secundarias, edicion.minis, edicion.lineas)
  const cierre = getAviso(CIERRE_PORTADA)

  return (
    <div>
      <Masthead />

      {/* Noticia principal: en 375×667 entran titular, bajada y grabado con epígrafe */}
      <article className="pt-2 md:pt-5">
        <h2 className={`text-center font-headline uppercase leading-[0.92] text-balance hyphens-auto ${tamanoTitular(p.titular)}`}>{p.titular}</h2>
        <p className="mx-auto mt-2 max-w-3xl text-center font-display text-[17px] italic leading-snug md:text-2xl">{p.bajada}</p>
        <figure className="mt-3 md:mt-5">
          {/* Grabado: doble filete y trama rayada que se apaga hacia el centro (grabado-vineta en index.css),
              con la ilustración propia encima. Sin ilustración, la trama entera y "Grabado en preparación" */}
          <div className="border-4 border-double border-print p-1">
            {p.ilustracion ? (
              <div className="relative aspect-[2/1] md:aspect-[5/2]">
                <div aria-hidden className="engraving grabado-vineta absolute inset-0" />
                <img
                  src={`/ilustraciones/${p.ilustracion.archivo}.svg`}
                  alt={p.ilustracion.alt}
                  width={200}
                  height={200}
                  // En la primera pantalla: carga ya
                  fetchPriority="high"
                  className="relative mx-auto h-full w-auto py-1"
                />
              </div>
            ) : (
              <div className="engraving flex aspect-[2/1] items-center justify-center md:aspect-[5/2]">
                <span className="bg-paper px-2 font-display text-xs uppercase tracking-widest text-print-muted">Grabado en preparación</span>
              </div>
            )}
          </div>
          {p.epigrafe && <figcaption className="mt-1 font-display text-sm italic leading-snug text-print-muted">{p.epigrafe}</figcaption>}
        </figure>
      </article>

      {/* Dos columnas con noticias breves y avisos intercalados */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 border-t-2 border-print pt-4 md:gap-x-10">
        {columnas.map((col, c) => (
          <div key={c} className="flex min-w-0 flex-col gap-4">
            {col.map((item) =>
              item.tipo === 'noticia' ? (
                <Breve key={item.noticia.id} n={item.noticia} />
              ) : (
                <Aviso key={item.aviso.id} aviso={item.aviso} />
              ),
            )}
          </div>
        ))}
      </div>

      {cierre && (
        <div className="mt-6">
          <Aviso aviso={cierre} />
        </div>
      )}
    </div>
  )
}

/**
 * El titular principal achica la letra según el largo, para que en 375×667 entren titular, bajada y grabado con
 * epígrafe (regla de la primera pantalla). Medido con todas las principales del banco.
 */
function tamanoTitular(titular: string) {
  if (titular.length <= 18) return 'text-[clamp(3rem,15vw,9rem)]'
  if (titular.length <= 30) return 'text-[clamp(2.5rem,11vw,7rem)]'
  return 'text-[clamp(2rem,9vw,5.5rem)]'
}

function Volanta({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-print-muted">
      <span aria-hidden className="size-1.5 shrink-0 bg-red" />
      {children}
    </p>
  )
}

/** Noticia breve: sección, titular y 2 o 3 oraciones. Si hay remera, la noticia entera es el link a su aviso
 * (área grande para el dedo, sin dejar huecos cuando el titular entra en una línea) */
function Breve({ n }: { n: Noticia }) {
  const product = n.productSlug ? getProduct(n.productSlug) : undefined
  const contenido = (
    <>
      <Volanta>{SECCIONES[n.seccion]}</Volanta>
      <h3 className="mt-1 font-display text-xl font-bold leading-tight text-balance hyphens-auto underline-offset-4 group-hover:underline md:text-3xl">
        {n.titular}
      </h3>
      <p className="mt-1 font-display text-[15px] leading-snug text-pretty md:text-base">{n.texto}</p>
    </>
  )
  return (
    <article className="border-b border-print/30 pb-4">
      {product ? (
        <Link to={rutaAviso(product.slug)} className="group block">
          {contenido}
        </Link>
      ) : (
        contenido
      )}
    </article>
  )
}
