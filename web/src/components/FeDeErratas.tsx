import type { Detalles, Product } from '../data/products'

/**
 * "Fe de erratas" del aviso: los detalles de la prenda, como correcciones de diario.
 * "Donde dice «una remera cualquiera», debió decir «jersey de algodón peinado…»."
 * Se arma sola con los detalles del producto: lo que falta no aparece. Se abre con un toque (no depende de hover).
 * Primero van las erratas de la estampa, numeradas: los mismos números están sobre la remera en 3D (Visor3D.tsx).
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

export default function FeDeErratas({ p, figura3d }: { p: Product; figura3d?: number }) {
  const d = p.detalles
  const lineas = d ? ERRATAS.map((e) => ({ ...e, texto: e.debio(d)?.trim() })).filter((e) => e.texto) : []
  const puntos = p.modelo3d?.puntos ?? []
  if (lineas.length === 0 && puntos.length === 0) return null

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
      {puntos.length > 0 && (
        <ol className="mt-2 space-y-1.5">
          {puntos.map((punto, i) => (
            <li key={i} className="flex items-start gap-2 font-display text-[15px] leading-snug">
              <NumeroErrata n={i + 1} />
              <span>
                Donde dice «{punto.dice}», debió decir «{punto.debio}».
              </span>
            </li>
          ))}
        </ol>
      )}
      {puntos.length > 0 && figura3d && (
        <p className="mt-1 font-display text-xs italic text-print-muted">En la Fig. {figura3d}, los números están sobre la prenda.</p>
      )}
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

/** El número de una errata de la estampa: círculo rojo con la cifra en tinta (en tinta y no en papel por el
 * contraste: el papel sobre el rojo no llega a 4,5:1 en letra chica). Lo usan la lista y los puntos del 3D */
export function NumeroErrata({ n }: { n: number }) {
  return (
    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red font-display text-[13px] font-bold text-print">
      {n}
    </span>
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
