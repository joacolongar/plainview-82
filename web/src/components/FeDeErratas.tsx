import type { Detalles, Product } from '../data/products'

/**
 * "Fe de erratas" del aviso: los detalles de la prenda, como correcciones de diario.
 * "Donde dice «una remera cualquiera», debió decir «jersey de algodón peinado…»."
 * Se arma sola con los detalles del producto: lo que falta no aparece. Se abre con un toque (no depende de hover).
 */
type Errata = { campo: string; dice: string; debio: (d: Detalles) => string | undefined }

// Lo que "dijo mal" el diario es fijo por campo; lo que "debió decir" sale del producto
const ERRATAS: Errata[] = [
  { campo: 'Tela', dice: 'una remera cualquiera', debio: (d) => d.tela },
  { campo: 'Calce', dice: 'le queda como le queda', debio: (d) => d.calce },
  {
    campo: 'Estampa',
    dice: 'un dibujito',
    debio: (d) => d.estampa && `${d.estampa.tecnica}, ${d.estampa.tamano}, en ${d.estampa.ubicacion}`,
  },
  { campo: 'Color', dice: 'negro, blanco o qué importa', debio: (d) => d.color },
  { campo: 'Cuidado', dice: 'lávese como sea', debio: (d) => d.cuidado },
  { campo: 'Edición', dice: 'hay para todos', debio: (d) => d.edicion },
]

export default function FeDeErratas({ p }: { p: Product }) {
  const d = p.detalles
  const lineas = d ? ERRATAS.map((e) => ({ ...e, texto: e.debio(d)?.trim() })).filter((e) => e.texto) : []
  if (lineas.length === 0) return null

  return (
    <details className="group border-y-4 border-double border-print py-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-headline text-xl uppercase leading-none">Fe de erratas</span>
          <span className="block font-display text-sm italic leading-snug">En la edición anterior dijimos que era solo una remera.</span>
        </span>
        <span className="shrink-0 font-display text-xs font-bold uppercase tracking-wider">
          Mire de nuevo <span aria-hidden className="inline-block motion-safe:transition-transform group-open:rotate-90">▸</span>
        </span>
      </summary>
      <ul className="mt-2 space-y-1.5 pb-1">
        {lineas.map((e) => (
          <li key={e.campo} className="font-display text-[15px] leading-snug">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.12em]">{e.campo}.</span>
            Donde dice «{e.dice}», debió decir «{e.texto}».
          </li>
        ))}
      </ul>
      {p.precioDePrueba && <p className="pb-1 font-display text-xs font-bold">Datos de prueba: los definitivos llegan con la próxima edición.</p>}
    </details>
  )
}

/** "Watch closer": la referencia escondida en la estampa, contada sin spoilers */
export function WatchCloser({ referencia }: { referencia: string }) {
  return (
    <aside className="border-l-4 border-red pl-3">
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em]">Watch closer</p>
      <p className="font-display text-[15px] leading-snug">{referencia}</p>
    </aside>
  )
}
