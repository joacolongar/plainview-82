import type { Size } from './products'

/**
 * Medidas de las remeras por talle, en centímetros (iguales para todos los diseños).
 * - ancho: de axila a axila, con la remera apoyada
 * - largo: desde el punto más alto del hombro hasta el ruedo
 *
 * TODO: son DE EJEMPLO. Reemplazar por las medidas reales y pasar MEDIDAS_DE_EJEMPLO a false.
 * Mientras sea true, la tabla avisa que no son las reales (nadie debería elegir talle con un dato inventado).
 */
export const MEDIDAS_DE_EJEMPLO = true

export const MEDIDAS: Record<Size, { ancho: number; largo: number }> = {
  S: { ancho: 48, largo: 70 },
  M: { ancho: 51, largo: 72 },
  L: { ancho: 54, largo: 74 },
  XL: { ancho: 57, largo: 76 },
  XXL: { ancho: 60, largo: 78 },
}
