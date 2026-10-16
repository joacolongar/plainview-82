import { useEffect, useState } from 'react'

/**
 * Progreso de los pasatiempos en localStorage, una clave por edición: `pv82-pasatiempos-01`.
 * Igual que el carrito: si el storage no está disponible (modo privado, bloqueado), se juega igual
 * y el progreso vive solo en memoria. Nunca se guardan soluciones, solo lo que hizo el lector.
 */

/** Sellos del Carnet de lector (ver docs/PASATIEMPOS.md). `rendido` = "Me rindo": sello en blanco */
export type Sello = 'oro' | 'plata' | 'bronce' | 'rendido'

export const SELLOS: Record<Sello, { nombre: string; detalle: string; estrellas: string }> = {
  oro: { nombre: 'Primera plana', detalle: 'Sin pistas y con 1 verificación como máximo', estrellas: '★★★' },
  plata: { nombre: 'Página central', detalle: 'Hasta 1 pista o 3 verificaciones', estrellas: '★★☆' },
  bronce: { nombre: 'Clasificados', detalle: 'Resuelto de cualquier forma', estrellas: '★☆☆' },
  rendido: { nombre: 'Me rindo', detalle: 'Se vio la solución: sello en blanco', estrellas: '☆☆☆' },
}

export type ProgresoJuego = {
  sello?: Sello
  segundos?: number // tiempo de resolución (P5)
  pistasUsadas?: number // pistas del editor
  verificaciones?: number // usos de "Verificar"
}

export type ProgresoCifrado = ProgresoJuego & {
  asignaciones?: Record<string, string> // símbolo → letra que puso el lector
  reveladas?: string[] // símbolos cuya letra dio el editor (quedan fijos)
  resuelto?: boolean
}

/** Celdas del Cinedoku numeradas de 0 a 35 (fila * 6 + columna). Las letras impresas no se guardan: vienen en el JSON */
export type ProgresoCinedoku = ProgresoJuego & {
  celdas?: Record<number, string> // letra que puso el lector
  notas?: Record<number, string> // candidatos anotados con el lápiz, por ejemplo "ZD"
  reveladas?: number[] // celdas que dio el editor (quedan fijas)
  resuelto?: boolean
}

/** Celdas del Crucigrama numeradas como fila * ancho + columna */
export type ProgresoCrucigrama = ProgresoJuego & {
  letras?: Record<number, string> // letra que escribió el lector
  reveladas?: number[] // celdas que dio el editor (P4b)
  resuelto?: boolean
}

// `v` es la versión del formato: si algún día cambia, los datos viejos se descartan en vez de romper la página
export type Progreso = {
  v: 1
  juegos: { cifrado?: ProgresoCifrado; cinedoku?: ProgresoCinedoku; crucigrama?: ProgresoCrucigrama }
}

/**
 * Sello según la tabla de docs/PASATIEMPOS.md. "Hasta 1 pista o 3 verificaciones" se lee como
 * "no más de 1 pista y no más de 3 verificaciones"; si se pasa de cualquiera de los dos, es bronce.
 */
export function calcularSello({ pistasUsadas = 0, verificaciones = 0 }: ProgresoJuego, rendido = false): Sello {
  if (rendido) return 'rendido'
  if (pistasUsadas === 0 && verificaciones <= 1) return 'oro'
  if (pistasUsadas <= 1 && verificaciones <= 3) return 'plata'
  return 'bronce'
}

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
