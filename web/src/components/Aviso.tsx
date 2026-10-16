import { Link } from 'react-router-dom'
import type { Aviso as DatosAviso } from '../data/anuncios'
import { rutaAviso } from '../data/products'

type Props = {
  aviso: DatosAviso
  /** Sin link aunque tenga destino (por ejemplo, el aviso de una remera en su propia página) */
  sinLink?: boolean
}

/**
 * Aviso chico del diario (datos en src/data/anuncios.ts). Van sueltos entre las noticias, nunca en una página propia,
 * y tienen que pesar MENOS que las noticias: letra chica, ilustración de 44 px.
 * - "mini": recuadro con ilustración a la izquierda; estilos "invertido" (fondo tinta) y "rojo" (el de la marca).
 * - "linea": una línea de clasificado con separador punteado, para rellenar el final de una columna.
 * Si tiene `productSlug` o `href`, el aviso entero es un link (y mide 44 px o más).
 */
export default function Aviso({ aviso, sinLink = false }: Props) {
  const destino = sinLink ? undefined : aviso.productSlug ? rutaAviso(aviso.productSlug) : aviso.href
  const contenido = aviso.tipo === 'linea' ? <Linea aviso={aviso} /> : <Mini aviso={aviso} />
  return destino ? (
    <Link to={destino} className="block min-h-11 hover:opacity-90">
      {contenido}
    </Link>
  ) : (
    contenido
  )
}

function Mini({ aviso }: { aviso: DatosAviso }) {
  if (aviso.estilo === 'rojo') {
    // El de la marca, a todo el ancho. Tinta sobre rojo da ~3,9:1: solo alcanza como "texto grande" (19 px en negrita)
    return (
      <div data-aviso="rojo" className="bg-red px-3 py-2 text-print md:px-5 md:py-3">
        <p className="font-headline text-3xl uppercase leading-none md:text-4xl">{aviso.titulo}</p>
        <p className="mt-1 font-display text-[19px] font-bold leading-snug">{aviso.texto}</p>
        <p className="mt-1 font-headline text-xl">{aviso.telefono}</p>
      </div>
    )
  }
  const invertido = aviso.estilo === 'invertido'
  return (
    <div data-aviso="mini" className={`flex items-center gap-2 border-[3px] p-2 ${invertido ? 'border-print bg-print text-paper' : 'border-print'}`}>
      {aviso.ilustracion && (
        // Los SVG vienen en tinta: sobre fondo tinta se invierten para que se vean claros
        <img src={`/ilustraciones/${aviso.ilustracion}.svg`} alt="" width={44} height={44} loading="lazy" className={`size-11 shrink-0 ${invertido ? 'invert' : ''}`} />
      )}
      <div className="min-w-0">
        <p className="font-headline text-base uppercase leading-tight">{aviso.titulo}</p>
        <p className="font-display text-[13px] leading-snug">{aviso.texto}</p>
        <p className="mt-0.5 font-headline text-sm">{aviso.telefono}</p>
      </div>
    </div>
  )
}

function Linea({ aviso }: { aviso: DatosAviso }) {
  return (
    <p data-aviso="linea" className="border-t-2 border-dashed border-print pt-1.5 font-display text-[13px] leading-snug">
      <strong className="font-headline font-normal uppercase">{aviso.titulo}</strong> {aviso.texto}{' '}
      <strong className="whitespace-nowrap font-headline font-normal">{aviso.telefono}</strong>
    </p>
  )
}
