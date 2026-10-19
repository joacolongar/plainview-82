import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CURRENCY } from '../config'
import { paginaDe, paginas } from '../data/paginas'
import { ESTADOS, numeroArticulo, products, rutaAviso, type Product } from '../data/products'

const decadaDe = (anio: number) => Math.floor(anio / 10) * 10
const unicos = <T,>(xs: T[]) => [...new Set(xs)].sort()

// Los filtros viven en la URL (?pelicula=…&director=…&decada=1990): se pueden compartir y "atrás" los deshace
const FILTROS = [
  { clave: 'pelicula', etiqueta: 'Película', valor: (p: Product) => p.movie, mostrar: (v: string) => v },
  { clave: 'director', etiqueta: 'Director', valor: (p: Product) => p.director, mostrar: (v: string) => v },
  { clave: 'decada', etiqueta: 'Década', valor: (p: Product) => String(decadaDe(p.year)), mostrar: (v: string) => `Años ${v.slice(2)}` },
] as const

/**
 * Índice del diario (pág. 2): los avisos de la edición, como el sumario de un catálogo por correo
 * ("Art. N° 001 … pág. 3"), con filtros en la URL, y abajo el resto de las secciones con su página.
 */
export default function IndiceAvisos() {
  const [params, setParams] = useSearchParams()
  const activos = FILTROS.filter((f) => params.get(f.clave))

  const avisos = [...products]
    .sort((a, b) => a.articulo - b.articulo)
    .filter((p) => activos.every((f) => f.valor(p) === params.get(f.clave)))

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(params)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    setParams(nuevos) // agrega una entrada al historial: "atrás" vuelve al filtro anterior
  }

  // El resto del diario (todo lo que no es un aviso ni este índice), con su número de página
  const secciones = paginas
    .map((p, i) => ({ ...p, numero: i + 1 }))
    .filter((p) => p.ruta !== '/catalogo' && !p.ruta.startsWith('/catalogo/'))

  return (
    <div>
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-print-muted">Índice de avisos</p>
      {/* mt: el acento de la Á sube por encima del renglón (leading-none) y pisaría el antetítulo */}
      <h1 className="mt-2 font-headline text-[clamp(2.5rem,12vw,5rem)] uppercase leading-none md:mt-3">Catálogo</h1>
      <p className="mt-1 font-display italic">Las remeras de esta edición. Tocá una para ver su página.</p>

      {/* Filtros: select nativos (cómodos en el celular), 16 px para que iPhone no haga zoom */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-y-4 border-double border-print py-2">
        {FILTROS.map((f) => (
          <label key={f.clave} className="min-w-0">
            <span className="block font-display text-[10px] font-bold uppercase tracking-[0.15em] text-print-muted">{f.etiqueta}</span>
            <select
              value={params.get(f.clave) ?? ''}
              onChange={(e) => cambiar(f.clave, e.target.value)}
              className="mt-0.5 min-h-11 w-full min-w-0 border border-print/40 bg-paper px-1 font-display text-base"
            >
              <option value="">Todas</option>
              {unicos(products.map(f.valor)).map((v) => (
                <option key={v} value={v}>
                  {f.mostrar(v)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {activos.length > 0 && (
        <button type="button" onClick={() => setParams(new URLSearchParams())} className="min-h-11 font-display text-sm underline underline-offset-4">
          Quitar filtros
        </button>
      )}

      {avisos.length === 0 ? (
        <p className="py-8 text-center font-display italic">Sin avisos en esta sección. La redacción sigue buscando.</p>
      ) : (
        <ol className="mt-2">
          {avisos.map((p) => (
            <li key={p.slug}>
              <FilaIndice
                to={rutaAviso(p.slug)}
                antes={`Art. N° ${numeroArticulo(p)}`}
                titulo={p.titular}
                pagina={paginaDe(rutaAviso(p.slug))?.numero}
                recorte={<Recorte p={p} />}
                detalle={`Remera · ${p.movie} · ${p.director} · ${p.year} · ${p.status === 'disponible' && p.price > 0 ? `${CURRENCY.format(p.price)}${p.precioDePrueba ? ' (precio de prueba)' : ''}` : ESTADOS[p.status]}`}
              />
            </li>
          ))}
        </ol>
      )}

      <h2 className="mt-8 border-b-4 border-double border-print pb-1 font-display text-[11px] font-bold uppercase tracking-[0.2em]">En esta edición</h2>
      <ol>
        {secciones.map((s) => (
          <li key={s.ruta}>
            <FilaIndice to={s.ruta} titulo={s.seccion} pagina={s.numero} />
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Una línea de sumario: [recorte] título … puntos guía … pág. N. La fila entera es el link (44 px o más) */
function FilaIndice(props: { to: string; antes?: string; titulo: string; pagina?: number; detalle?: string; recorte?: ReactNode }) {
  const { to, antes, titulo, pagina, detalle, recorte } = props
  return (
    <Link to={to} className="group flex min-h-11 items-start gap-3 border-b border-print/30 py-2">
      {recorte}
      {/* min-w-0: el título puede bajar de renglón sin empujar los puntos guía ni el número de página */}
      <span className="block min-w-0 flex-1">
        {/* El N° de artículo va arriba, chico: así, si el título baja de renglón, los puntos guía y el número de
            página siguen juntos en el último renglón (items-end), como en los sumarios impresos */}
        {antes && <span className="block font-mono text-[11px] leading-tight text-print-muted">{antes}</span>}
        <span className="flex items-end gap-2">
          <span className="min-w-0 font-display text-lg font-bold leading-tight underline-offset-4 group-hover:underline">{titulo}</span>
          <span aria-hidden className="mb-1.5 min-w-4 flex-1 border-b-2 border-dotted border-print/50" />
          {pagina && <span className="shrink-0 whitespace-nowrap font-display text-sm leading-tight">pág. {pagina}</span>}
        </span>
        {detalle && <span className="mt-0.5 block font-display text-sm text-print-muted">{detalle}</span>}
      </span>
    </Link>
  )
}

/**
 * La miniatura del índice: un recorte de la estampa pegado en la hoja (borde fino de tinta y apenas torcido, como
 * pegado a mano: solo la miniatura, nunca la hoja). Sin recorte todavía, un cuadrado con la trama de grabado.
 */
function Recorte({ p }: { p: Product }) {
  const marco = 'size-14 shrink-0 -rotate-2 border border-print bg-paper p-0.5 shadow-[1px_2px_0_color-mix(in_oklab,var(--color-print)_25%,transparent)] md:size-[72px]'
  return p.recorte ? (
    <img src={p.recorte} alt={p.name} width={72} height={72} loading="lazy" className={`${marco} object-cover`} />
  ) : (
    <span role="img" aria-label={`${p.name}: recorte en preparación`} className={`${marco} block`}>
      <span className="engraving block size-full" />
    </span>
  )
}
