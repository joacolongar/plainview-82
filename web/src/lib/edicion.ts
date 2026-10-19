// La edición del día: la portada cambia todos los días a la medianoche de Argentina, igual para todos.
// Todo sale de una función pura, elegirEdicion(fecha, banco): con la misma fecha y el mismo banco, siempre la misma
// edición. No hay servidor ni base de datos: el "azar" es un generador con semilla (el número de edición).
import type { Aviso } from '../data/anuncios'
import type { Banco } from '../data/banco'
import type { Noticia } from '../data/noticias'

/** Edición N° 1: el día que salió el diario (16 de octubre de 2026) */
export const INICIO = '2026-10-16'
export const ZONA = 'America/Argentina/Cordoba'
/** Una noticia (o aviso) no vuelve hasta que pasen al menos 7 ediciones, si el banco alcanza (ver elegir) */
export const SEPARACION = 7

export type Edicion = {
  numero: number
  dia: string // AAAA-MM-DD en Córdoba
  principal: Noticia
  secundarias: Noticia[] // 3 o 4
  minis: Aviso[] // 1, con ilustración
  lineas: Aviso[] // 2, de una línea
}

const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' })

/** El día en Córdoba para un instante: las 23:30 de Argentina del 19 ya son el 20 en UTC, pero acá siguen siendo el 19 */
export const diaEnArgentina = (fecha: Date) => formatoDia.format(fecha)

const diaUTC = (dia: string) => {
  const [a, m, d] = dia.split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}

/** Días desde INICIO + 1 (el 16/10/2026 es la N° 1). Antes de esa fecha, la N° 1 */
export function numeroEdicion(fecha: Date): number {
  return Math.max(1, Math.round((diaUTC(diaEnArgentina(fecha)) - diaUTC(INICIO)) / 86_400_000) + 1)
}

/**
 * Mulberry32: un generador de números "al azar" chiquito y determinista. Con la misma semilla da siempre la misma
 * serie, que es lo que hace falta para que todos vean la misma edición sin guardar nada en ningún lado.
 */
function generador(semilla: number) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Pieza = { id: string; pelicula?: string }
const peliculaDe = (p: Pieza) => p.pelicula ?? p.id

/**
 * Elige `cuantas` piezas del pool para la edición `n`, sin repetir película dentro de la edición (`usadas`).
 * Entre las que hace más de SEPARACION ediciones que no salen, elige al azar (con la semilla). Si no queda ninguna
 * (el banco todavía es chico para el ritmo de la portada), elige la que salió hace más tiempo: así se espacian
 * lo más posible. Las que nunca salieron cuentan como las más viejas.
 */
function elegir<T extends Pieza>(pool: T[], cuantas: number, n: number, azar: () => number, ultimo: Map<string, number>, usadas: Set<string>): T[] {
  const elegidas: T[] = []
  for (let i = 0; i < cuantas; i++) {
    const candidatas = pool.filter((p) => !usadas.has(peliculaDe(p)) && !elegidas.includes(p))
    if (candidatas.length === 0) break
    const libres = candidatas.filter((p) => n - (ultimo.get(p.id) ?? -Infinity) > SEPARACION)
    const elegida = libres.length > 0 ? libres[Math.floor(azar() * libres.length)] : masVieja(candidatas, ultimo)
    elegidas.push(elegida)
    usadas.add(peliculaDe(elegida))
  }
  return elegidas
}

const masVieja = <T extends Pieza>(pool: T[], ultimo: Map<string, number>) =>
  pool.reduce((a, b) => ((ultimo.get(b.id) ?? -Infinity) < (ultimo.get(a.id) ?? -Infinity) ? b : a))

function armar(n: number, banco: Banco, ultimo: Map<string, number>): Omit<Edicion, 'dia'> {
  // La semilla mezcla el número para que ediciones seguidas no arranquen con números parecidos
  const azar = generador(Math.imul(n, 2654435761))
  const usadas = new Set<string>()
  const principales = banco.noticias.filter((x) => x.tipo === 'principal')
  const secundariasPool = banco.noticias.filter((x) => x.tipo === 'secundaria')
  const minisPool = banco.avisos.filter((a) => a.tipo === 'mini')
  const lineasPool = banco.avisos.filter((a) => a.tipo === 'linea')

  const [principal] = elegir(principales, 1, n, azar, ultimo, usadas)
  const secundarias = elegir(secundariasPool, azar() < 0.5 ? 3 : 4, n, azar, ultimo, usadas)
  const minis = elegir(minisPool, 1, n, azar, ultimo, usadas)
  const lineas = elegir(lineasPool, 2, n, azar, ultimo, usadas)

  // Siempre al menos una película con remera: si no salió ninguna, se cambia el último aviso de línea por uno que
  // la tenga (o el mini, o la última secundaria), respetando que no se repita película
  const conRemera = (p: Pieza) => banco.conRemera.includes(peliculaDe(p))
  if (![principal, ...secundarias, ...minis, ...lineas].some(conRemera)) {
    for (const [lista, pool] of [
      [lineas, lineasPool],
      [minis, minisPool],
      [secundarias, secundariasPool],
    ] as [Pieza[], Pieza[]][]) {
      if (lista.length === 0) continue
      const sale = lista[lista.length - 1]
      usadas.delete(peliculaDe(sale))
      const [entra] = elegir(pool.filter(conRemera), 1, n, azar, ultimo, usadas)
      if (entra) {
        lista[lista.length - 1] = entra
        break
      }
      usadas.add(peliculaDe(sale))
    }
  }

  for (const p of [principal, ...secundarias, ...minis, ...lineas]) ultimo.set(p.id, n)
  return { numero: n, principal, secundarias, minis, lineas }
}

// Para respetar la separación hay que saber qué salió antes: se simulan las ediciones desde la N° 1, una sola vez
// por banco (WeakMap: si el banco cambia, se recalcula). Es invisible desde afuera: la función sigue siendo pura.
const simulaciones = new WeakMap<Banco, { ediciones: Omit<Edicion, 'dia'>[]; ultimo: Map<string, number> }>()

export function elegirEdicion(fecha: Date, banco: Banco): Edicion {
  const n = numeroEdicion(fecha)
  let sim = simulaciones.get(banco)
  if (!sim) {
    sim = { ediciones: [], ultimo: new Map() }
    simulaciones.set(banco, sim)
  }
  while (sim.ediciones.length < n) sim.ediciones.push(armar(sim.ediciones.length + 1, banco, sim.ultimo))
  return { ...sim.ediciones[n - 1], dia: diaEnArgentina(fecha) }
}
