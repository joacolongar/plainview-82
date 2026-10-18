// El cupón de los pasatiempos de la edición vigente, para que el servidor lo compare con el que llega en la boleta.
// El servidor (functions/) no pasa por Vite, así que no puede usar el import.meta.glob de data/pasatiempos/index.ts:
// la edición vigente se importa a mano. **Al publicar una edición nueva, cambiar este import** (si no, la consola
// del sitio lo avisa: ver el chequeo en data/pasatiempos/index.ts).
import edicion from '../data/pasatiempos/edicion-01.json'
import { decodificarClave } from './descifrar'
import { normalizarCupon } from './pedido'

export const EDICION_DEL_CUPON = edicion.numero

/** El cupón vigente, o null si el premio no se pudo leer */
function cuponVigente(): string | null {
  try {
    return normalizarCupon(decodificarClave(edicion.premio).cupon ?? '') || null
  } catch {
    return null
  }
}

/**
 * Cómo se informa el cupón en Telegram. No rechaza el pedido: el cupón es de bajo valor (viaja en el JS del sitio,
 * ver PASATIEMPOS.md) y el descuento lo aplica el dueño a mano. Esto solo le ahorra buscar la palabra.
 */
export function veredictoCupon(cupon: string | null): string | null {
  if (!cupon) return null
  const vigente = cuponVigente()
  if (!vigente) return `Cupón ${cupon}: no se pudo leer el de la edición ${EDICION_DEL_CUPON}, chequealo a mano.`
  return cupon === vigente ? `Cupón ${cupon} ✔ válido (edición ${EDICION_DEL_CUPON})` : `Cupón ${cupon} ✗ no coincide con el de la edición ${EDICION_DEL_CUPON}`
}
