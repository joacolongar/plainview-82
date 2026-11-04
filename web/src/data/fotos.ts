import type { FotoProducto, Product } from './products'

/**
 * Las fotos de cada remera se encuentran solas: alcanza con dejar los archivos en
 * src/assets/productos/<slug>/<slug>-N.webp (N = 1, 2, 3…; la 1 es la principal).
 * import.meta.glob es de Vite: arma la lista al compilar y le pone a cada archivo una URL con hash,
 * así el navegador las guarda en caché sin miedo a quedarse con una vieja.
 * Vive acá y no en products.ts porque products.ts también lo usa el servidor (functions/), que no pasa por Vite.
 */
const ARCHIVOS = import.meta.glob<string>('../assets/productos/*/*.webp', { eager: true, query: '?url', import: 'default' })

export type Foto = { src: string } & FotoProducto

export function fotosDe(p: Product): Foto[] {
  const patron = new RegExp(`/productos/${p.slug}/${p.slug}-(\\d+)\\.webp$`)
  const encontradas = Object.entries(ARCHIVOS)
    .map(([ruta, src]) => ({ n: Number(ruta.match(patron)?.[1]), src }))
    .filter((f) => f.n > 0)
    .sort((a, b) => a.n - b.n)
  return encontradas.map((f, i) => ({
    src: f.src,
    alt: p.fotos?.[i]?.alt ?? `${p.name}, foto ${i + 1} de ${encontradas.length}`,
    color: p.fotos?.[i]?.color,
    lector: p.fotos?.[i]?.lector,
  }))
}
