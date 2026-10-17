import { BRAND } from '../config'
import type { BoletaEnviada } from './boleta'

/**
 * El mensaje de WhatsApp sale de la respuesta del servidor (N° de boleta y resumen armado con el catálogo),
 * no del carrito: así lo que llega por WhatsApp es lo mismo que llegó a Telegram y se puede cotejar.
 */
export function mensajeBoleta({ boleta, resumen, nota }: BoletaEnviada): string {
  return [`Hola ${BRAND.name}! Envío la boleta N° ${boleta}:`, '', resumen, ...(nota ? ['', `Nota: ${nota}`] : [])].join('\n')
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(message)}`
}
