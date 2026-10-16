import type { Crucigrama } from '../data/pasatiempos/types'

export type Direccion = 'h' | 'v'

export type Palabra = {
  n: number
  dir: Direccion
  pista: string
  largo: number
  celdas: number[] // índices fila * ancho + columna, en orden de lectura
}

/**
 * Arma, a partir del JSON, la lista de palabras (primero horizontales, después verticales, por número)
 * y para cada celda blanca, a qué palabra horizontal y vertical pertenece.
 * Es lo que permite que tocar una celda resalte "su" palabra y que ‹ › recorran todas las pistas.
 */
export function armarCrucigrama(datos: Crucigrama) {
  const W = datos.ancho
  const palabras: Palabra[] = [
    ...datos.horizontales.map((e) => ({ ...e, dir: 'h' as const, celdas: Array.from({ length: e.largo }, (_, k) => e.fila * W + e.col + k) })),
    ...datos.verticales.map((e) => ({ ...e, dir: 'v' as const, celdas: Array.from({ length: e.largo }, (_, k) => (e.fila + k) * W + e.col) })),
  ].map(({ n, dir, pista, largo, celdas }) => ({ n, dir, pista, largo, celdas }))

  const porCelda = new Map<number, Partial<Record<Direccion, number>>>() // celda → índice en `palabras`
  palabras.forEach((p, i) => p.celdas.forEach((c) => porCelda.set(c, { ...porCelda.get(c), [p.dir]: i })))

  const numeros = new Map<number, number>() // celda donde empieza una palabra → su número
  palabras.forEach((p) => numeros.set(p.celdas[0], p.n))

  const solucion = (i: number) => datos.grilla[Math.floor(i / W)][i % W]
  const blancas = Array.from({ length: W * datos.alto }, (_, i) => i).filter((i) => solucion(i) !== '#')

  return { palabras, porCelda, numeros, solucion, blancas }
}

/** Mayúscula sin tildes, pero respetando la Ñ (igual que `normalizar` en scripts/pasatiempos.py) */
export function normalizarLetra(s: string): string {
  const up = s.toUpperCase()
  if (up === 'Ñ') return 'Ñ'
  const base = up.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return /^[A-Z]$/.test(base) ? base : ''
}
