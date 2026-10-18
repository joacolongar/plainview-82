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

export type Entrega = 'envio' | 'retiro'

/** A quién y cómo se entrega. Texto libre de la persona: se valida con cuidado (largo y caracteres) */
export type DatosPedido = { nombre: string; zona: string; entrega: Entrega }

/** Pedido validado. El cupón de los pasatiempos lo compara el servidor con el de la edición vigente (cupon.ts) */
export type Pedido = { lineas: LineaPedido[]; cupon: string | null; datos: DatosPedido }

const CLAVES_PEDIDO = ['items', 'datos', 'cupon'] // cupon es opcional
const CLAVES_ITEM = ['slug', 'talle', 'color', 'cantidad']

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Mismas claves, ni una más ni una menos */
const clavesExactas = (o: Record<string, unknown>, claves: string[]) =>
  Object.keys(o).length === claves.length && claves.every((k) => Object.hasOwn(o, k))

/** Solo claves conocidas, con las obligatorias presentes */
const clavesPermitidas = (o: Record<string, unknown>, permitidas: string[], obligatorias: string[]) =>
  Object.keys(o).every((k) => permitidas.includes(k)) && obligatorias.every((k) => Object.hasOwn(o, k))

export const ENTREGAS: Record<Entrega, string> = { envio: 'Envío a domicilio', retiro: 'Retiro en mano' }
export const MIN_TEXTO = 2
export const MAX_TEXTO = 60
// Caracteres de control y de formato invisibles (saltos de línea, tabulaciones, marcas de dirección del texto):
// en un nombre no tienen nada que hacer y en Telegram o WhatsApp podrían disfrazar el mensaje
const INVISIBLES = /[\p{Cc}\p{Cf}]/u

/** Nombre o zona: entre 2 y 60 caracteres (sin contar espacios de los bordes) y sin caracteres invisibles */
export function textoValido(t: unknown): t is string {
  if (typeof t !== 'string' || INVISIBLES.test(t)) return false
  const largo = [...t.trim()].length // por caracteres, no por unidades de UTF-16 (una tilde o un emoji cuentan uno)
  return largo >= MIN_TEXTO && largo <= MAX_TEXTO
}

const CLAVES_DATOS = ['nombre', 'zona', 'entrega']

export function validarDatos(d: unknown): DatosPedido | null {
  if (!esObjeto(d) || !clavesExactas(d, CLAVES_DATOS)) return null
  const { nombre, zona, entrega } = d
  if (!textoValido(nombre) || !textoValido(zona)) return null
  if (entrega !== 'envio' && entrega !== 'retiro') return null
  return { nombre: nombre.trim(), zona: zona.trim(), entrega }
}

/** Cupones de los pasatiempos: una palabra en mayúsculas (TORRE). Largo máximo para que nadie mande un libro */
export const MAX_CUPON = 20
const FORMATO_CUPON = /^[A-ZÁÉÍÓÚÜÑ]+$/

/** Lo que escribe la persona → lo que se manda: sin espacios y en mayúsculas ("  torre " → "TORRE") */
export const normalizarCupon = (texto: string) => texto.replace(/\s+/g, '').toLocaleUpperCase('es-AR')

export const cuponValido = (cupon: string) => cupon.length <= MAX_CUPON && FORMATO_CUPON.test(cupon)

/** Se pueden pedir los que están en existencia o por encargo, y solo si ya tienen precio */
export const sePuedePedir = (p: Product) => (p.status === 'disponible' || p.status === 'preventa') && p.price > 0

/**
 * Devuelve el pedido validado o null si algo no cierra. No dice qué falló a propósito:
 * al que prueba cosas raras no le contamos qué validamos.
 */
export function validarPedido(cuerpo: unknown): Pedido | null {
  if (!esObjeto(cuerpo) || !clavesPermitidas(cuerpo, CLAVES_PEDIDO, ['items', 'datos'])) return null
  const { items, cupon } = cuerpo
  const datos = validarDatos(cuerpo.datos)
  if (!datos) return null
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
  return { lineas, cupon: cupon ?? null, datos }
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
export function resumenPedido({ lineas, cupon, datos }: Pedido): string {
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
    '',
    `A nombre de: ${datos.nombre}`,
    `Zona: ${datos.zona}`,
    `Entrega: ${ENTREGAS[datos.entrega]}`,
  ].join('\n')
}
