export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL'

export type Product = {
  slug: string
  name: string
  movie: string
  director: string
  year: number
  price: number // ARS
  sizes: Size[]
  colors: string[]
  images: string[] // rutas en /public/products/...
  /** La pista sutil: qué detalle de la peli esconde la estampa (sin spoilers grandes) */
  reference: string
  description: string
  status: 'disponible' | 'preventa' | 'proximamente'
}

// TODO: reemplazar precios, imágenes y textos por los reales.
export const products: Product[] = [
  {
    slug: 'magnolia',
    name: 'Magnolia — el frame',
    movie: 'Magnolia',
    director: 'Paul Thomas Anderson',
    year: 1999,
    price: 0,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro'],
    images: [],
    reference: 'Una referencia que aparece apenas un instante en un frame. Hay que mirar de cerca.',
    description: 'Estampa basada en un detalle de fondo de la película. Completar con la descripción real.',
    status: 'proximamente',
  },
  {
    slug: 'casablanca',
    name: 'Casablanca',
    movie: 'Casablanca',
    director: 'Michael Curtiz',
    year: 1942,
    price: 0,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Hueso'],
    images: [],
    reference: 'Diseño en proceso.',
    description: 'Completar cuando el diseño esté terminado.',
    status: 'proximamente',
  },
]

export const getProduct = (slug: string) => products.find((p) => p.slug === slug)
