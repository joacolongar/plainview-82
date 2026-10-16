import { BRAND, CURRENCY } from '../config'
import type { CartItem } from '../context/CartContext'

export function buildOrderMessage(items: CartItem[], note = ''): string {
  const lines = items.map(
    (i) => `• ${i.qty} x ${i.name} — talle ${i.size}, ${i.color} (${CURRENCY.format(i.price * i.qty)})`,
  )
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
