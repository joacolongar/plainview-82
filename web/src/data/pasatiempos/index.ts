import { EDICION_DEL_CUPON } from '../../lib/cupon'
import type { Edicion } from './types'

/**
 * Carga todas las ediciones de pasatiempos.
 * `import.meta.glob` es de Vite: busca los archivos que coinciden con el patrón en tiempo de build y,
 * con `eager: true`, los importa directamente (no hace falta tocar este archivo cuando sale `edicion-02.json`).
 */
const archivos = import.meta.glob<Edicion>('./edicion-*.json', { eager: true, import: 'default' })

// Chequeo mínimo de forma: el contenido ya lo validó Python; esto solo avisa si un JSON está roto o incompleto
function esEdicion(x: unknown): x is Edicion {
  const e = x as Partial<Edicion> | null
  return typeof e?.numero === 'number' && !!e.cifrado && !!e.cinedoku && !!e.crucigrama
}

export const ediciones: Edicion[] = Object.entries(archivos)
  .filter(([ruta, data]) => {
    if (esEdicion(data)) return true
    console.warn(`Pasatiempos: ${ruta} no tiene la forma esperada; se ignora`)
    return false
  })
  .map(([, data]) => data)
  .sort((a, b) => a.numero - b.numero)

/** La edición vigente es la de número más alto */
export const ultimaEdicion = (): Edicion | undefined => ediciones.at(-1)

// El servidor compara el cupón con la edición que importa src/lib/cupon.ts (a mano: no puede usar glob).
// Si sale una edición nueva y nadie actualizó ese import, que se note en la consola
if (import.meta.env.DEV && ultimaEdicion() && ultimaEdicion()!.numero !== EDICION_DEL_CUPON)
  console.error(`Pasatiempos: la edición vigente es la ${ultimaEdicion()!.numero} pero el servidor compara el cupón de la ${EDICION_DEL_CUPON} (src/lib/cupon.ts)`)
