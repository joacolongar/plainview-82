// La remera de tapa de la portada (docs/portada/PORTADA.md): rota con la edición del día entre las remeras que tienen
// la vuelta renderizada y su titular de tapa. Función pura, como elegirEdicion: mismo número, misma remera.
// No usa el generador de la edición: sumar una remera con vuelta no reacomoda las noticias.
// La usa también el servidor (functions/_middleware.ts, para anunciar la imagen de tapa): no puede importar el banco ni
// nada del navegador.
import { rendersDe, type Product } from '../data/products'

export type Tapa = { producto: Product; titulo: string; video: string; poster: string }

/** Las remeras que pueden salir en tapa, en el orden del catálogo */
export function remerasDeTapa(productos: Product[]): Tapa[] {
  return productos.flatMap((producto) => {
    const vuelta = rendersDe(producto)?.vuelta
    return vuelta && producto.tituloTapa ? [{ producto, titulo: producto.tituloTapa, ...vuelta }] : []
  })
}

/** La remera de tapa de la edición N° `numero`: una por día, en el orden del catálogo. Sin ninguna, nada */
export function remeraDeTapa(numero: number, productos: Product[]): Tapa | undefined {
  const tapas = remerasDeTapa(productos)
  return tapas.length > 0 ? tapas[(numero - 1) % tapas.length] : undefined
}
