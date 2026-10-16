/**
 * Forma de `edicion-NN.json`, que genera `scripts/pasatiempos.py`.
 * El contenido (solución única, cruces, cifrado biyectivo) lo valida el script de Python;
 * estos tipos solo describen la forma para que TypeScript nos avise si la usamos mal.
 */
export type Cifrado = {
  titulo: string
  entradilla: string
  pistasGratis: number
  cifrado: string // el mensaje ya cifrado: símbolos + espacios y puntuación (el texto en claro no viaja)
  clave: string // JSON símbolo → letra en base64. Ofuscado, no secreto (ver "Cupones" en docs/PASATIEMPOS.md)
  simbolosUsados: number
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
}

export type Edicion = {
  numero: number
  titulo: string
  cifrado: Cifrado
  cinedoku: Cinedoku
  crucigrama: Crucigrama
}

export type Juego = 'cifrado' | 'cinedoku' | 'crucigrama'
