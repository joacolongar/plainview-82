import { Link, useLocation } from 'react-router-dom'
import { paginaDe, RUTA_INDICE } from '../data/paginas'
import { marcarDireccion } from '../lib/pasarPagina'

/**
 * Pasar de página con links: la tira finita de arriba (debajo de la barra de secciones) y la del pie.
 * Las dos usan el mismo orden (data/paginas.ts) y la misma transición de hoja que el deslizamiento y las flechas.
 * Son links comunes: se llega con Tab y se abren con Enter.
 */
type Vecina = { ruta: string; corto: string; seccion: string; numero: number }

/** Cuándo se ve el nombre de la página: siempre, solo desde md (en el celular no entraba) o nunca (el pie) */
type Nombre = 'siempre' | 'compu' | 'nunca'

function Enlace({ vecina, dir, nombre, className }: { vecina: Vecina; dir: 'atras' | 'adelante'; nombre: Nombre; className: string }) {
  const atras = dir === 'atras'
  return (
    <Link
      to={vecina.ruta}
      viewTransition
      onClick={() => marcarDireccion(dir)}
      className={className}
      aria-label={`Página ${atras ? 'anterior' : 'siguiente'}: pág. ${vecina.numero}, ${vecina.corto}`}
    >
      {/* Todo en un solo span: dentro de un link flex, cada pedazo suelto perdería el espacio del principio */}
      <span>
        {atras && <span aria-hidden>◂ </span>}
        Pág. {vecina.numero}
        {nombre !== 'nunca' && <span className={nombre === 'compu' ? 'hidden md:inline' : ''}> · {vecina.corto}</span>}
        {!atras && <span aria-hidden> ▸</span>}
      </span>
    </Link>
  )
}

// A 375 px entran unos 46 caracteres en un renglón (medido): si las dos etiquetas suman más, solo los números
const MAX_NOMBRES = 46
const etiqueta = (v: Vecina | null) => (v ? `◂ Pág. ${v.numero} · ${v.corto}` : '')

const enlace = 'flex min-h-11 items-center font-display underline-offset-4 hover:underline'

/** La tira de arriba: anterior a la izquierda, siguiente a la derecha. Fuera del diario (404, suplemento), nada */
export function TiraPaginas() {
  const { pathname } = useLocation()
  const pagina = paginaDe(pathname)
  if (!pagina) return null
  const { anterior, siguiente } = pagina
  const nombre: Nombre = etiqueta(anterior).length + etiqueta(siguiente).length <= MAX_NOMBRES ? 'siempre' : 'compu'
  return (
    <nav aria-label="Pasar de página" className="flex items-center justify-between gap-3 border-b border-print/30 text-xs whitespace-nowrap">
      {anterior ? <Enlace vecina={anterior} dir="atras" nombre={nombre} className={enlace} /> : <span />}
      {siguiente ? <Enlace vecina={siguiente} dir="adelante" nombre={nombre} className={`${enlace} justify-end`} /> : <span />}
    </nav>
  )
}

/** La del pie: anterior · Índice · siguiente. Solo el número, como en los diarios (el nombre está en la tira de arriba) */
export function PiePaginas() {
  const { pathname } = useLocation()
  const pagina = paginaDe(pathname)
  const pie = `${enlace} text-sm`
  return (
    <nav aria-label="Pasar de página (pie)" className="grid grid-cols-3 items-center">
      {pagina?.anterior ? <Enlace vecina={pagina.anterior} dir="atras" nombre="nunca" className={pie} /> : <span />}
      <Link to={RUTA_INDICE} className={`${pie} justify-center font-bold uppercase tracking-wider`}>
        Índice
      </Link>
      {pagina?.siguiente ? (
        <Enlace vecina={pagina.siguiente} dir="adelante" nombre="nunca" className={`${pie} justify-end`} />
      ) : (
        <span />
      )}
    </nav>
  )
}
