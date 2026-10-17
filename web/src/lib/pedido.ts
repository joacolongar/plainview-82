// Validación del pedido contra el catálogo. La usa el servidor (functions/api/pedido.ts), que es la que vale;
// la boleta (S6b) la puede reusar para avisar antes de enviar. Por eso no importa nada del navegador
// ni de config.ts (que lee import.meta.env, que en el servidor no existe).
import { getProduct, numeroArticulo, type Product, type Size } from '../data/products'

export const MAX_ITEMS = 10
export const MAX_CANTIDAD = 10

/** Lo único que el cliente puede mandar por ítem. Nunca precios: el total se calcula acá. */
export type ItemPedido = { slug: string; talle: Size; color: string; cantidad: number }

/** Ítem ya validado, con el producto del catálogo para calcular precio y armar el resumen */
export type LineaPedido = ItemPedido & { producto: Product }

/** Se pueden pedir los que están en existencia o por encargo, y solo si ya tienen precio */
export const sePuedePedir = (p: Product) => (p.status === 'disponible' || p.status === 'preventa') && p.price > 0

const CLAVES_PEDIDO = ['items']
const CLAVES_ITEM = ['slug', 'talle', 'color', 'cantidad']

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Mismas claves, ni una más ni una menos */
const clavesExactas = (o: Record<string, unknown>, claves: string[]) =>
  Object.keys(o).length === claves.length && claves.every((k) => Object.hasOwn(o, k))

/**
 * Devuelve las líneas del pedido o null si algo no cierra. No dice qué falló a propósito:
 * al que prueba cosas raras no le contamos qué validamos.
 */
export function validarPedido(cuerpo: unknown): LineaPedido[] | null {
  if (!esObjeto(cuerpo) || !clavesExactas(cuerpo, CLAVES_PEDIDO)) return null
  const { items } = cuerpo
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) return null

  const lineas: LineaPedido[] = []
  const vistos = new Set<string>()
  for (const item of items) {
    if (!esObjeto(item) || !clavesExactas(item, CLAVES_ITEM)) return null
    const { slug, talle, color, cantidad } = item
    if (typeof slug !== 'string' || typeof talle !== 'string' || typeof color !== 'string') return null
    // Number.isInteger descarta 1.5, NaN, Infinity y "2" (texto)
    if (!Number.isInteger(cantidad) || (cantidad as number) < 1 || (cantidad as number) > MAX_CANTIDAD) return null

    const producto = getProduct(slug)
    if (!producto || !sePuedePedir(producto)) return null
    // El talle y el color tienen que ser de los de esa remera: comparar contra la lista ya descarta
    // textos largos, caracteres de control y cualquier otra cosa que no esté en el catálogo
    if (!producto.sizes.includes(talle as Size) || !producto.colors.includes(color)) return null

    // La boleta ya junta los repetidos; si llegan dos iguales, el pedido no salió de la boleta
    const clave = `${slug}|${talle}|${color}`
    if (vistos.has(clave)) return null
    vistos.add(clave)

    lineas.push({ slug, talle: talle as Size, color, cantidad: cantidad as number, producto })
  }
  return lineas
}

const PESOS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const totalPedido = (lineas: LineaPedido[]) => lineas.reduce((s, l) => s + l.producto.price * l.cantidad, 0)

/** El resumen que va a Telegram y a WhatsApp, armado solo con datos del catálogo */
export function resumenPedido(lineas: LineaPedido[]): string {
  const renglones = lineas.map(
    (l) =>
      `• ${l.cantidad} x Art. N° ${numeroArticulo(l.producto)} — ${l.producto.name} — talle ${l.talle}, ${l.color} (${PESOS.format(l.producto.price * l.cantidad)})`,
  )
  return [...renglones, '', `Total: ${PESOS.format(totalPedido(lineas))}`].join('\n')
}
