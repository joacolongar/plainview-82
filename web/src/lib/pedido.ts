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

/** Pedido validado. El cupón de los pasatiempos viaja sin verificar: se chequea a mano (y en el servidor en S7a) */
export type Pedido = { lineas: LineaPedido[]; cupon: string | null }

/** Cupones de los pasatiempos: una palabra en mayúsculas (TORRE). Largo máximo para que nadie mande un libro */
export const MAX_CUPON = 20
const FORMATO_CUPON = /^[A-ZÁÉÍÓÚÜÑ]+$/

/** Lo que escribe la persona → lo que se manda: sin espacios y en mayúsculas ("  torre " → "TORRE") */
export const normalizarCupon = (texto: string) => texto.replace(/\s+/g, '').toLocaleUpperCase('es-AR')

export const cuponValido = (cupon: string) => cupon.length <= MAX_CUPON && FORMATO_CUPON.test(cupon)

/** Se pueden pedir los que están en existencia o por encargo, y solo si ya tienen precio */
export const sePuedePedir = (p: Product) => (p.status === 'disponible' || p.status === 'preventa') && p.price > 0

const CLAVES_PEDIDO = ['items', 'cupon'] // cupon es opcional
const CLAVES_ITEM = ['slug', 'talle', 'color', 'cantidad']

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Mismas claves, ni una más ni una menos */
const clavesExactas = (o: Record<string, unknown>, claves: string[]) =>
  Object.keys(o).length === claves.length && claves.every((k) => Object.hasOwn(o, k))

/** Solo claves conocidas, con las obligatorias presentes */
const clavesPermitidas = (o: Record<string, unknown>, permitidas: string[], obligatorias: string[]) =>
  Object.keys(o).every((k) => permitidas.includes(k)) && obligatorias.every((k) => Object.hasOwn(o, k))

/**
 * Devuelve el pedido validado o null si algo no cierra. No dice qué falló a propósito:
 * al que prueba cosas raras no le contamos qué validamos.
 */
export function validarPedido(cuerpo: unknown): Pedido | null {
  if (!esObjeto(cuerpo) || !clavesPermitidas(cuerpo, CLAVES_PEDIDO, ['items'])) return null
  const { items, cupon } = cuerpo
  // Si viene, ya normalizado: el servidor no lo arregla, lo rechaza
  if (cupon !== undefined && (typeof cupon !== 'string' || !cuponValido(cupon))) return null
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) return null

  const lineas: LineaPedido[] = []
  const vistos = new Set<string>()
  for (const item of items) {
    if (!esObjeto(item) || !clavesExactas(item, CLAVES_ITEM)) return null
    const linea = validarItem(item)
    if (!linea) return null

    // La boleta ya junta los repetidos; si llegan dos iguales, el pedido no salió de la boleta
    const clave = `${linea.slug}|${linea.talle}|${linea.color}`
    if (vistos.has(clave)) return null
    vistos.add(clave)

    lineas.push(linea)
  }
  return { lineas, cupon: cupon ?? null }
}

/** Un ítem contra el catálogo. La boleta lo usa renglón por renglón para marcar el que ya no se puede pedir */
export function validarItem({ slug, talle, color, cantidad }: Record<string, unknown>): LineaPedido | null {
  if (typeof slug !== 'string' || typeof talle !== 'string' || typeof color !== 'string') return null
  // Number.isInteger descarta 1.5, NaN, Infinity y "2" (texto)
  if (!Number.isInteger(cantidad) || (cantidad as number) < 1 || (cantidad as number) > MAX_CANTIDAD) return null

  const producto = getProduct(slug)
  if (!producto || !sePuedePedir(producto)) return null
  // El talle y el color tienen que ser de los de esa remera: comparar contra la lista ya descarta
  // textos largos, caracteres de control y cualquier otra cosa que no esté en el catálogo
  if (!producto.sizes.includes(talle as Size) || !producto.colors.includes(color)) return null

  return { slug, talle: talle as Size, color, cantidad: cantidad as number, producto }
}

const PESOS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const totalPedido = (lineas: LineaPedido[]) => lineas.reduce((s, l) => s + subtotal(l), 0)

export const subtotal = (l: Pick<LineaPedido, 'cantidad' | 'producto'>) => l.producto.price * l.cantidad
export const formatoPesos = (n: number) => PESOS.format(n)

/** El resumen que va a Telegram y a WhatsApp, armado solo con datos del catálogo */
export function resumenPedido({ lineas, cupon }: Pedido): string {
  const renglones = lineas.map(
    (l) =>
      `• ${l.cantidad} x Art. N° ${numeroArticulo(l.producto)} — ${l.producto.name} — talle ${l.talle}, ${l.color} (${PESOS.format(subtotal(l))})`,
  )
  return [
    ...renglones,
    '',
    `Total: ${PESOS.format(totalPedido(lineas))}`,
    // Mientras haya precios inventados, que se lea en Telegram y en WhatsApp: nadie paga un precio de prueba
    ...(lineas.some((l) => l.producto.precioDePrueba) ? ['⚠ PRECIO DE PRUEBA: no es el precio real'] : []),
    ...(cupon ? [`Cupón de los pasatiempos: ${cupon}`] : []),
  ].join('\n')
}
