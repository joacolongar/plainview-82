import { BRAND, CURRENCY } from '../config'
import type { CartItem } from '../context/CartContext'
import { getProduct, numeroArticulo } from '../data/products'

export function buildOrderMessage(items: CartItem[], note = ''): string {
  // El N° de artículo identifica la remera sin dudas aunque cambie el nombre. Se busca por slug en el catálogo,
  // así también sale en boletas guardadas antes de este cambio (si el producto ya no existe, se omite)
  const lines = items.map((i) => {
    const p = getProduct(i.slug)
    const articulo = p ? `Art. N° ${numeroArticulo(p)} — ` : ''
    return `• ${i.qty} x ${articulo}${i.name} — talle ${i.size}, ${i.color} (${CURRENCY.format(i.price * i.qty)})`
  })
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  return [
    `Hola ${BRAND.name}! Quiero hacer este pedido:`,
    '',
    ...lines,
    '',
    `Total: ${CURRENCY.format(total)}`,
    note ? `Nota: ${note}` : '',
  ]
    .filter((l, idx, arr) => !(l === '' && idx === arr.length - 1))
    .join('\n')
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(message)}`
}
