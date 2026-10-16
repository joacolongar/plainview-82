import { useEffect, useState } from 'react'
import type { Juego } from '../data/pasatiempos/types'

/**
 * Progreso de los pasatiempos en localStorage, una clave por edición: `pv82-pasatiempos-01`.
 * Igual que el carrito: si el storage no está disponible (modo privado, bloqueado), se juega igual
 * y el progreso vive solo en memoria. Nunca se guardan soluciones, solo lo que hizo el lector.
 */

/** Sellos del Carnet de lector (ver docs/PASATIEMPOS.md). `rendido` = "Me rindo": sello en blanco */
export type Sello = 'oro' | 'plata' | 'bronce' | 'rendido'

export const SELLOS: Record<Sello, { nombre: string; detalle: string }> = {
  oro: { nombre: 'Primera plana', detalle: 'Sin pistas y con 1 verificación como máximo' },
  plata: { nombre: 'Página central', detalle: 'Hasta 1 pista o 3 verificaciones' },
  bronce: { nombre: 'Clasificados', detalle: 'Resuelto de cualquier forma' },
  rendido: { nombre: 'Me rindo', detalle: 'Se vio la solución: sello en blanco' },
}

export type ProgresoJuego = {
  sello?: Sello
  segundos?: number // tiempo de resolución (P5)
}

// `v` es la versión del formato: si algún día cambia, los datos viejos se descartan en vez de romper la página
export type Progreso = { v: 1; juegos: Partial<Record<Juego, ProgresoJuego>> }

const vacio = (): Progreso => ({ v: 1, juegos: {} })
export const claveProgreso = (numero: number) => `pv82-pasatiempos-${String(numero).padStart(2, '0')}`

function cargar(numero: number): Progreso {
  try {
    const data = JSON.parse(localStorage.getItem(claveProgreso(numero)) ?? 'null')
    return data?.v === 1 && typeof data.juegos === 'object' ? data : vacio()
  } catch {
    return vacio()
  }
}

/** Estado del progreso de una edición, sincronizado con localStorage */
export function useProgreso(numero: number) {
  const [progreso, setProgreso] = useState<Progreso>(() => cargar(numero))

  useEffect(() => {
    try {
      localStorage.setItem(claveProgreso(numero), JSON.stringify(progreso))
    } catch {
      /* storage no disponible: el progreso vive solo en memoria */
    }
  }, [numero, progreso])

  return [progreso, setProgreso] as const
}
