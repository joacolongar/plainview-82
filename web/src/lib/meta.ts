// Título, descripción e imagen de cada ruta, para Open Graph (la vista previa al compartir un link en WhatsApp,
// Instagram o Facebook) y para el título de la pestaña. Lo usa el servidor (functions/_middleware.ts), así que no
// puede importar nada del navegador ni de config.ts (que lee import.meta.env).
import { paginaDe, seccionSuelta } from '../data/paginas'
import { getProduct, numeroArticulo } from '../data/products'

export type Meta = {
  titulo: string
  descripcion: string
  /** Ruta de la imagen de 1200×630 (public/og/). El middleware la hace absoluta con el dominio del pedido */
  imagen: string
  imagenAlt: string
  tipo: 'website' | 'product'
}

export const NOMBRE_SITIO = 'THE PLAINVIEW · Plainview 8:2'

const PORTADA: Meta = {
  titulo: 'THE PLAINVIEW — remeras con cine adentro',
  descripcion: 'El diario de Plainview 8:2: una edición nueva cada día, un aviso por remera y pasatiempos de cine. Watch closer.',
  imagen: '/og/portada.jpg',
  imagenAlt: 'Cabecera del diario THE PLAINVIEW con los bloques rojos de Watch closer y 8:2',
  tipo: 'website',
}

const DESCRIPCIONES: Record<string, string> = {
  '/catalogo': 'Las remeras de esta edición, como en un catálogo por correo. Tocá una para ver su página.',
  '/pasatiempos': 'Cifrado, Cinedoku y Crucigrama de cine. Completá los tres y ganá el cupón de la edición.',
  '/atencion-al-lector': 'Cómo se compra, envíos y pagos, cambios y devoluciones, y el Botón de arrepentimiento.',
  '/carrito': 'Tu boleta de pedido: la imprenta te da el número y se abre WhatsApp con el pedido armado.',
}

/** "/catalogo/magnolia/" → "/catalogo/magnolia" (la barra final no cambia la página) */
const normalizar = (ruta: string) => (ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta)

export function metaDe(rutaPedida: string): Meta {
  const ruta = normalizar(rutaPedida)

  // El aviso de cada remera: su titular, su bajada y su imagen propia
  const aviso = ruta.match(/^\/catalogo\/([^/]+)$/)
  if (aviso) {
    const p = getProduct(decodeURIComponent(aviso[1]))
    if (p)
      return {
        titulo: `${p.titular} — Art. N° ${numeroArticulo(p)} · Plainview 8:2`,
        descripcion: p.bajada,
        imagen: `/og/${p.slug}.jpg`,
        imagenAlt: `Aviso de la remera ${p.name} (${p.movie}), Art. N° ${numeroArticulo(p)}`,
        tipo: 'product',
      }
  }

  if (ruta === '/') return PORTADA
  const pagina = paginaDe(ruta)
  if (pagina) return { ...PORTADA, titulo: `${pagina.corto} — THE PLAINVIEW`, descripcion: DESCRIPCIONES[ruta] ?? PORTADA.descripcion }
  const suelta = seccionSuelta(ruta)
  if (suelta) return { ...PORTADA, titulo: `${suelta} — THE PLAINVIEW` }
  // Cualquier otra dirección: la Fe de erratas (el 404 del diario)
  return { ...PORTADA, titulo: 'Fe de erratas — THE PLAINVIEW', descripcion: 'Esta página no existe: la escena se cortó en el montaje.' }
}
