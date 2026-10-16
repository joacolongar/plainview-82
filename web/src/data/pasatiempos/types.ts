/**
 * Forma de `edicion-NN.json`, que genera `scripts/pasatiempos.py`.
 * El contenido (solución única, cruces, cifrado biyectivo) lo valida el script de Python;
 * estos tipos solo describen la forma para que TypeScript nos avise si la usamos mal.
 */
export type Cifrado = {
  titulo: string
  entradilla: string
  cupon: string
  pistasGratis: number
  texto: string // mensaje en claro, en mayúsculas y sin tildes
  clave: Record<string, string> // letra → símbolo (el símbolo es solo un identificador; se dibuja como SVG)
  letrasUsadas: number
}

export type Cinedoku = {
  titulo: string
  entradilla: string
  letras: string[] // las 6 letras, en el orden que deletrea la fila oculta
  filaOculta: number
  cajas: [number, number] // [filas, columnas] de cada caja
  inicio: string[] // 6 filas; "." = celda vacía
  solucion: string[]
  pistas: number // cuántas celdas vienen dadas
}

export type EntradaCrucigrama = {
  n: number
  fila: number
  col: number
  respuesta: string
  pista: string
  largo: number
}

export type Crucigrama = {
  titulo: string
  ancho: number
  alto: number
  grilla: string[] // "#" = casilla negra
  horizontales: EntradaCrucigrama[]
  verticales: EntradaCrucigrama[]
  descartadas: string[]
}

export type Edicion = {
  numero: number
  titulo: string
  cifrado: Cifrado
  cinedoku: Cinedoku
  crucigrama: Crucigrama
}

export type Juego = 'cifrado' | 'cinedoku' | 'crucigrama'
