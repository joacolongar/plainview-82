import { numeroArticulo, products, rutaAviso } from './products'

/**
 * El orden de las páginas del diario. El número de página es la posición en esta lista,
 * así que se recalcula solo cuando entra una remera nueva. Lo usan la cabecera chica ("Pág. 5")
 * y el pie ("← pág. anterior · Índice · pág. siguiente →"); en S3b, también el deslizamiento.
 */
export type Pagina = {
  ruta: string
  seccion: string // lo que se lee en la cabecera chica
}

// Los avisos van por N° de artículo, como en un catálogo por correo
const avisos: Pagina[] = [...products]
  .sort((a, b) => a.articulo - b.articulo)
  .map((p) => ({ ruta: rutaAviso(p.slug), seccion: `${p.seccion ?? 'Avisos'} · Art. N° ${numeroArticulo(p)}` }))

export const paginas: Pagina[] = [
  { ruta: '/', seccion: 'Primera plana' },
  { ruta: '/catalogo', seccion: 'Índice de avisos' },
  ...avisos,
  { ruta: '/pasatiempos', seccion: 'Pasatiempos' },
  { ruta: '/atencion-al-lector', seccion: 'Atención al lector' },
  { ruta: '/carrito', seccion: 'Boleta de pedido' },
]

export const RUTA_INDICE = '/catalogo'

/** Rutas que existen pero no son una página numerada del diario (el 404 es "Fe de erratas") */
const sueltas: Record<string, string> = { '/juego': 'Suplemento · La Función del Día' }
export const seccionSuelta = (ruta: string) => sueltas[ruta] ?? null

/** Página del diario para una ruta: número (desde 1), sección y vecinas. Fuera del diario (404, /juego): null */
export function paginaDe(ruta: string) {
  const i = paginas.findIndex((p) => p.ruta === ruta)
  if (i === -1) return null
  return {
    numero: i + 1,
    seccion: paginas[i].seccion,
    anterior: i > 0 ? { ...paginas[i - 1], numero: i } : null,
    siguiente: i < paginas.length - 1 ? { ...paginas[i + 1], numero: i + 2 } : null,
  }
}
