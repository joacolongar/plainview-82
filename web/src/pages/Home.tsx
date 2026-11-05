import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../components/Aviso'
import Masthead from '../components/Masthead'
import { CIERRE_PORTADA, getAviso, type Aviso as DatosAviso } from '../data/anuncios'
import { BANCO } from '../data/banco'
import { SECCIONES, type Noticia } from '../data/noticias'
import { getProduct, products, rutaAviso } from '../data/products'
import Tapa from '../components/portada/Tapa'
import Tendedero from '../components/portada/Tendedero'
import { elegirEdicion } from '../lib/edicion'
import { repartirConTapa } from '../lib/portada'
import { remeraDeTapa } from '../lib/tapa'
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
 * Primera plana del diario THE PLAINVIEW (docs/portada/PORTADA.md). Cambia todos los días: la edición la elige
 * elegirEdicion (lib/edicion.ts) y la remera de tapa, remeraDeTapa (lib/tapa.ts), los dos con la fecha de Córdoba.
 * 1. La tapa: la remera dando una vuelta, con su titular de tapa, y al lado (abajo en el celular) dos notas.
 * 2. El tendedero del kiosco, a todo el ancho.
 * 3. La noticia principal con su grabado y las dos columnas de breves y avisos; cierra el aviso rojo de la marca.
 * Si la principal es de la película de la remera de tapa, pierde el grabado y pasa a ser la primera de las dos notas.
 * Sin ninguna remera con vuelta, la portada de antes: la principal arriba (maqueta: docs/portada-con-avisos.png).
 * `quieta`: las copias del diario doblado de la entrada (sin video).
 */
export default function Home({ quieta = false }: { quieta?: boolean }) {
  const fecha = useFechaEdicion()
  const edicion = elegirEdicion(fecha, BANCO)
  const tapa = remeraDeTapa(edicion.numero, products)
  const p = edicion.principal
  const cierre = getAviso(CIERRE_PORTADA)

  if (!tapa) {
    return (
      <div>
        <Masthead />
        <Principal p={p} primeraPantalla />
        <Columnas noticias={edicion.secundarias} minis={edicion.minis} lineas={edicion.lineas} />
        {cierre && <Cierre aviso={cierre} />}
      </div>
    )
  }

  const { arriba, principalAbajo, resto } = repartirConTapa(edicion, tapa)

  return (
    <div>
      <Masthead />
      <div className="pt-2 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] md:gap-8 md:pt-5">
        <Tapa tapa={tapa} quieta={quieta} />
        <div className="mt-5 flex flex-col gap-4 border-t-2 border-print pt-4 md:mt-0 md:border-t-0 md:pt-0">
          {arriba.map((n) => (
            <Breve key={n.id} n={n} />
          ))}
        </div>
      </div>

      <Tendedero />

      {principalAbajo && (
        <div className="mt-2 border-t-2 border-print pt-4">
          <Principal p={p} />
        </div>
      )}
      <Columnas noticias={resto} minis={edicion.minis} lineas={edicion.lineas} />
      {cierre && <Cierre aviso={cierre} />}
    </div>
  )
}

/**
 * La noticia principal: titular, bajada y grabado con epígrafe. Arriba de todo (`primeraPantalla`) en 375×667 entran
 * titular, bajada y grabado con epígrafe, y el grabado carga ya; debajo del tendedero, cuando le toca.
 */
function Principal({ p, primeraPantalla = false }: { p: Noticia; primeraPantalla?: boolean }) {
  return (
    <article className={primeraPantalla ? 'pt-2 md:pt-5' : ''}>
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
                // En la primera pantalla carga ya; debajo del tendedero, cuando se acerca
                fetchPriority={primeraPantalla ? 'high' : undefined}
                loading={primeraPantalla ? undefined : 'lazy'}
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
  )
}

/** Dos columnas con noticias breves y avisos intercalados */
function Columnas({ noticias, minis, lineas }: { noticias: Noticia[]; minis: DatosAviso[]; lineas: DatosAviso[] }) {
  const columnas = armarColumnas(noticias, minis, lineas)
  return (
    <div className="mt-5 grid grid-cols-2 gap-x-4 border-t-2 border-print pt-4 md:gap-x-10">
      {columnas.map((col, c) => (
        <div key={c} className="flex min-w-0 flex-col gap-4">
          {col.map((item) =>
            item.tipo === 'noticia' ? <Breve key={item.noticia.id} n={item.noticia} /> : <Aviso key={item.aviso.id} aviso={item.aviso} />,
          )}
        </div>
      ))}
    </div>
  )
}

function Cierre({ aviso }: { aviso: DatosAviso }) {
  return (
    <div className="mt-6">
      <Aviso aviso={aviso} />
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
      {/* la principal, cuando baja a nota, lleva su bajada */}
      <p className="mt-1 font-display text-[15px] leading-snug text-pretty md:text-base">{n.texto ?? n.bajada}</p>
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
