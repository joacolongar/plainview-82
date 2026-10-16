import type { Edicion } from '../data/pasatiempos/types'
import { formatearTiempo, SELLOS, type Progreso } from './progresoPasatiempos'

const NOMBRES = [
  ['cifrado', 'Cifrado'],
  ['cinedoku', 'Cinedoku'],
  ['crucigrama', 'Crucigrama'],
] as const

export const edicionCompleta = (p: Progreso) => NOMBRES.every(([j]) => p.juegos[j]?.resuelto)
export const sinRendirse = (p: Progreso) => NOMBRES.every(([j]) => p.juegos[j]?.sello && p.juegos[j]?.sello !== 'rendido')

/**
 * Texto para compartir (formato de docs/PASATIEMPOS.md). Los nombres van rellenados con espacios
 * para que las columnas queden alineadas en WhatsApp. Nunca incluye el cupón.
 * `sitio` es el host actual (window.location.host): así sigue andando cuando llegue el dominio propio.
 */
export function textoResultado(edicion: Edicion, p: Progreso, sitio: string): string {
  const filas = NOMBRES.map(([j, nombre]) => {
    const juego = p.juegos[j]
    const estrellas = juego?.sello ? SELLOS[juego.sello].estrellas : '☆☆☆'
    const tiempo = juego?.sello === 'rendido' ? '—' : formatearTiempo(juego?.segundos)
    return `${nombre.padEnd(12)} ${estrellas}  ${tiempo}`
  })
  return [`THE PLAINVIEW · Pasatiempos N° ${edicion.numero}`, ...filas, `Watch closer. ${sitio}/pasatiempos`].join('\n')
}
