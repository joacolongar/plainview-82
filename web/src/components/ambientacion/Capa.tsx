import type { ReactNode } from 'react'

/**
 * Capa decorativa: invisible para lectores de pantalla y para el dedo (los toques pasan de largo).
 * overflow: clip recorta lo que asoma por el borde de la hoja sin generar scroll horizontal. Es clip y no hidden
 * a propósito: hidden convierte la caja en un contenedor con scroll y el botón "sticky" de abajo dejaría de pegarse.
 * Por eso el recorte va en la capa y no en la página.
 */
export default function Capa({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute select-none overflow-clip ${className}`}>
      {children}
    </div>
  )
}

/** Bordes de la hoja: el aviso está dentro del margen de la hoja (12 px en mobile, 32 px desde md) */
export const BORDES_HOJA = '-inset-x-3 md:-inset-x-8'

/**
 * Alrededor del grabado, estirada hasta el borde de la hoja: el margen más los 4 px del filete del grabado
 * (la capa se mide desde adentro del filete). En md el grabado es la columna izquierda: a la derecha corta el filete.
 */
export const BORDES_GRABADO = 'inset-y-0 -inset-x-4 md:-left-9 md:right-0'
