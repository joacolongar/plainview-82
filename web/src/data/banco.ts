import { avisosPropios, FUERA_DE_PORTADA, type Aviso } from './anuncios'
import { noticiasPropias, SECCIONES, type Noticia, type Seccion } from './noticias'
import { getPelicula } from './peliculas'
import { products } from './products'

/**
 * El banco de la portada: las noticias y avisos propios más las tandas que llegan como JSON en data/banco/
 * (banco-noticias-1.json, -2…). Para sumar una tanda alcanza con dejar el archivo: import.meta.glob lo encuentra.
 * El JSON se guarda tal cual llegó; las correcciones (largos de la regla de CLAUDE.md) van en CORRECCIONES.
 */

/** Formato en que llegan las tandas (ver banco-noticias-1.md) */
type NoticiaTanda = {
  pelicula: string
  anio: number
  director: string
  tipo: 'principal' | 'secundaria'
  seccion: string
  titular: string
  bajada: string
  cuerpo: string
}
type AvisoTanda = { pelicula: string; anio: number; tipo: 'linea'; titulo: string; texto: string; telefono: string }
export type Tanda = { noticias: NoticiaTanda[]; avisos: AvisoTanda[] }

/** "Proyecto Fin del Mundo (Project Hail Mary)" → "proyecto-fin-del-mundo-project-hail-mary" */
export const idPelicula = (titulo: string) =>
  titulo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** "Tecnología" → 'tecnologia'. Si la sección no existe en SECCIONES, el adaptador avisa */
const idSeccion = (nombre: string) => idPelicula(nombre) as Seccion

/**
 * Correcciones aprobadas por el dueño (2026-10-19) para respetar los largos: las bajadas de las principales,
 * acortadas a una línea (la original larga se reemplaza; el epígrafe sale del cuerpo de la tanda), y una
 * secundaria que tenía una sola oración. Clave: id de la noticia (película + tipo).
 */
const CORRECCIONES: Record<string, Partial<Pick<Noticia, 'bajada' | 'texto'>>> = {
  'peloton-principal': { bajada: 'Un novato descubre otra guerra, puertas adentro.' },
  'ella-principal': { bajada: 'La carta de amor se la contesta una voz.' },
  'oldboy-principal': { bajada: 'No sabe quién lo encerró. Tiene cinco días.' },
  'proyecto-fin-del-mundo-project-hail-mary-principal': { bajada: 'No recuerda su misión. Sí, que el Sol se apaga.' },
  'conclave-principal': { bajada: 'Cardenales encerrados y sin acuerdo.' },
  'el-codigo-da-vinci-principal': { bajada: 'Un mensaje cifrado y un profesor de simbología.' },
  'la-odisea-principal': { bajada: 'Diez años después de Troya, el rey no vuelve.' },
  'el-ultimo-rey-de-escocia-principal': { bajada: 'Llegó a Uganda por aventura y quedó al lado del poder.' },
  'el-odio-principal': { bajada: 'Tres amigos y un día muy largo por delante.' },
  'pandillas-de-nueva-york-principal': { bajada: 'Nadie discute con el hombre de la galera.' },
  'el-ultimo-rey-de-escocia-secundaria': { texto: 'Se fue a la capital con un auto nuevo. Nadie le explicó del todo el puesto.' },
  // Tanda 2: "una lluvia de verdad" traducía casi tal cual una línea de la película (regla: diálogo textual nunca)
  'taxi-driver-secundaria': { texto: 'A cualquier hora y a cualquier barrio. Dice que a la ciudad le hace falta que llueva fuerte y por varios días.' },
}

export function adaptarTanda(tanda: Tanda): { noticias: Noticia[]; avisos: Aviso[] } {
  const noticias = tanda.noticias.map((n): Noticia => {
    const pelicula = idPelicula(n.pelicula)
    const id = `${pelicula}-${n.tipo}`
    const seccion = idSeccion(n.seccion)
    if (import.meta.env?.DEV && !(seccion in SECCIONES)) console.warn(`Banco: sección desconocida "${n.seccion}" (${id})`)
    if (import.meta.env?.DEV && !getPelicula(pelicula)) console.warn(`Banco: película "${n.pelicula}" sin sumar a peliculas.ts`)
    const base = { id, tipo: n.tipo, seccion, pelicula, titular: n.titular }
    // La principal no lleva cuerpo: el cuerpo de la tanda es su epígrafe. En la secundaria, el cuerpo es el texto
    const adaptada: Noticia =
      n.tipo === 'principal' ? { ...base, bajada: n.bajada, epigrafe: n.cuerpo } : { ...base, texto: n.cuerpo }
    return { ...adaptada, ...CORRECCIONES[id] }
  })
  const avisos = tanda.avisos.map(
    (a): Aviso => ({
      id: `${idPelicula(a.pelicula)}-aviso`,
      tipo: 'linea',
      titulo: a.titulo,
      texto: a.texto,
      telefono: a.telefono,
      pelicula: idPelicula(a.pelicula),
    }),
  )
  return { noticias, avisos }
}

const TANDAS = import.meta.glob<Tanda>('./banco/banco-noticias-*.json', { eager: true, import: 'default' })

/** Lo que necesita lib/edicion.ts para armar la portada del día */
export type Banco = {
  noticias: Noticia[]
  /** Solo los que pueden salir en la portada (sin la marca ni FUERA_DE_PORTADA) */
  avisos: Aviso[]
  /** Películas que tienen remera en el catálogo: cada edición lleva al menos una */
  conRemera: string[]
}

const tandas = Object.keys(TANDAS)
  .sort((a, b) => Number(a.match(/(\d+)\.json$/)?.[1]) - Number(b.match(/(\d+)\.json$/)?.[1]))
  .map((ruta) => adaptarTanda(TANDAS[ruta]))

/** Todo lo que puede salir en una portada, en un orden fijo (propios primero, después las tandas por número) */
// La principal lleva el grabado de su película (peliculas.ts); sin grabado, la portada muestra "Grabado en preparación"
const conGrabado = (n: Noticia): Noticia => {
  const grabado = n.tipo === 'principal' ? getPelicula(n.pelicula)?.grabado : undefined
  return grabado ? { ...n, ilustracion: grabado } : n
}

export const BANCO: Banco = {
  noticias: [...noticiasPropias, ...tandas.flatMap((t) => t.noticias)].map(conGrabado),
  avisos: [...avisosPropios, ...tandas.flatMap((t) => t.avisos)].filter((a) => !FUERA_DE_PORTADA.includes(a.id)),
  conRemera: products.map((p) => idPelicula(p.movie)),
}
