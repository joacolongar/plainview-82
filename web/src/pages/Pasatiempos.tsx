import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ultimaEdicion } from '../data/pasatiempos'
import Cifrado from '../components/pasatiempos/Cifrado'
import Cinedoku from '../components/pasatiempos/Cinedoku'
import Crucigrama from '../components/pasatiempos/Crucigrama'
import type { Edicion, Juego } from '../data/pasatiempos/types'
import { SELLOS, useProgreso, type Progreso, type Sello } from '../lib/progresoPasatiempos'

const paperLink = 'inline-flex min-h-11 items-center font-display text-sm font-bold uppercase tracking-wider underline underline-offset-4 hover:decoration-red'

/**
 * Página de Pasatiempos. Sigue docs/pasatiempos-maqueta.png:
 * cabecera de página, título, las tres secciones de la edición y el Carnet de lector al pie.
 * Los tres juegos se juegan: Cifrado (P2), Cinedoku (P3) y Crucigrama (P4; sus ayudas llegan en P4b).
 */
export default function Pasatiempos() {
  const edicion = ultimaEdicion()

  return (
    <div className="paper px-3 pt-2 pb-6 shadow-2xl md:px-8 md:pt-4">
      {/* Cabecera de página. El N° de página queda fijo hasta que exista paginas.ts (S3) */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 whitespace-nowrap border-b border-print/30 py-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] md:tracking-[0.2em]">
        <span>The Plainview</span>
        <span className="text-center">Pág. 6</span>
        <span className="text-right">Pasatiempos</span>
      </div>

      <header className="border-b-4 border-double border-print pt-3 pb-3 text-center">
        <h1 className="font-headline text-[clamp(2.75rem,14vw,6rem)] uppercase leading-none">Pasatiempos</h1>
        <p className="mt-1 font-display italic">
          {edicion ? `Edición N° ${edicion.numero}` : 'Edición en imprenta'} · Para el lector que mira de cerca
        </p>
      </header>

      {!edicion ? (
        <p className="py-10 text-center font-display italic">La sección no llegó a imprenta. Vuelva pronto.</p>
      ) : (
        <EdicionPasatiempos edicion={edicion} />
      )}
    </div>
  )
}

/**
 * El progreso vive acá, en un solo lugar, y baja a cada juego y al Carnet: si cada uno tuviera su propio
 * useProgreso, el Carnet no se enteraría del sello que ganaste en el Cifrado hasta recargar la página.
 */
function EdicionPasatiempos({ edicion }: { edicion: Edicion }) {
  const [progreso, setProgreso] = useProgreso(edicion.numero)

  return (
    <>
      <Seccion
        id="cifrado"
        numero="I"
        titulo={edicion.cifrado.titulo}
        entradilla={edicion.cifrado.entradilla}
        dato={`${edicion.cifrado.simbolosUsados} símbolos`}
        extra={<PistasDelEditor total={edicion.cifrado.pistasGratis} usadas={progreso.juegos.cifrado?.pistasUsadas ?? 0} />}
      >
        <Cifrado
          datos={edicion.cifrado}
          progreso={progreso.juegos.cifrado ?? {}}
          onCambio={(cifrado) => setProgreso((p) => ({ ...p, juegos: { ...p.juegos, cifrado } }))}
        />
      </Seccion>
      <Seccion
        id="cinedoku"
        numero="II"
        titulo={edicion.cinedoku.titulo}
        entradilla={edicion.cinedoku.entradilla}
        dato={`${edicion.cinedoku.pistas} letras impresas · ${edicion.cinedoku.letras.join(' ')}`}
        extra={<PistasDelEditor total={edicion.cinedoku.pistasGratis} usadas={progreso.juegos.cinedoku?.pistasUsadas ?? 0} />}
      >
        <Cinedoku
          datos={edicion.cinedoku}
          progreso={progreso.juegos.cinedoku ?? {}}
          onCambio={(cinedoku) => setProgreso((p) => ({ ...p, juegos: { ...p.juegos, cinedoku } }))}
        />
      </Seccion>
      <Seccion
        id="crucigrama"
        numero="III"
        titulo={edicion.crucigrama.titulo}
        entradilla="Palabras cruzadas, todas sacadas de las páginas de este diario."
        dato={`${edicion.crucigrama.ancho}×${edicion.crucigrama.alto} · ${edicion.crucigrama.horizontales.length + edicion.crucigrama.verticales.length} palabras`}
      >
        <Crucigrama
          datos={edicion.crucigrama}
          progreso={progreso.juegos.crucigrama ?? {}}
          onCambio={(crucigrama) => setProgreso((p) => ({ ...p, juegos: { ...p.juegos, crucigrama } }))}
        />
      </Seccion>

      <p className="border-t-4 border-double border-print pt-3 font-display text-[15px] italic">
        Mientras se terminan de imprimir, puede probar suerte con La Función del Día.
      </p>
      <Link to="/juego" className={paperLink}>Jugar La Función del Día (versión de prueba) →</Link>

      <Carnet numero={edicion.numero} progreso={progreso} />
    </>
  )
}

function Seccion({ id, numero, titulo, entradilla, dato, extra, children }: {
  id: Juego
  numero: string
  titulo: string
  entradilla: string
  dato: string
  extra?: ReactNode
  children?: ReactNode // el juego; sin juego, se muestra "En imprenta"
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="border-b-4 border-double border-print py-5">
      <h2 id={`${id}-titulo`} className="font-display text-3xl font-bold leading-tight">
        {numero}. {titulo}
      </h2>
      <p className="mt-1 font-display text-[15px] italic leading-snug">{entradilla}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-display text-[11px] font-bold uppercase tracking-[0.15em] text-print-muted">
        <span>{dato}</span>
        {extra}
      </div>
      {children ?? (
        <div className="mt-3 border-4 border-double border-print p-1">
          <div className="engraving flex min-h-28 items-center justify-center">
            <span className="bg-paper px-2 font-display text-xs uppercase tracking-widest text-print-muted">En imprenta</span>
          </div>
        </div>
      )}
    </section>
  )
}

// El texto va en tinta y los rombos en rojo: texto rojo chico sobre crema no llega al contraste mínimo.
// ◆ = pista disponible, ◇ = pista usada
function PistasDelEditor({ total, usadas }: { total: number; usadas: number }) {
  const quedan = Math.max(total - usadas, 0)
  return (
    <span aria-label={`Pistas del editor: quedan ${quedan} de ${total}`}>
      Pistas del editor: <span aria-hidden className="text-red">{'◆'.repeat(quedan)}{'◇'.repeat(total - quedan)}</span>
    </span>
  )
}

const JUEGOS: { id: Juego; nombre: string }[] = [
  { id: 'cifrado', nombre: 'Cifrado' },
  { id: 'cinedoku', nombre: 'Cinedoku' },
  { id: 'crucigrama', nombre: 'Crucigrama' },
]

/** Carnet de lector: un casillero por juego con el sello ganado en esta edición */
function Carnet({ numero, progreso }: { numero: number; progreso: Progreso }) {
  return (
    <section aria-labelledby="carnet-titulo" className="mt-6 border-2 border-dashed border-print p-3">
      <h2 id="carnet-titulo" className="font-display text-sm font-bold uppercase tracking-[0.2em]">Carnet de lector</h2>
      <p className="font-display text-xs italic text-print-muted">Edición N° {numero} · Los sellos se guardan en este dispositivo.</p>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {JUEGOS.map(({ id, nombre }) => {
          const sello = progreso.juegos[id]?.sello
          return (
            <li key={id} className="flex flex-col items-center gap-1 text-center">
              <span className="font-display text-[11px] font-bold uppercase tracking-wider">{nombre}</span>
              {sello ? <SelloImpreso sello={sello} /> : <SinSello />}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function SelloImpreso({ sello }: { sello: Sello }) {
  const { nombre, detalle, estrellas } = SELLOS[sello]
  const estilo =
    sello === 'oro' ? 'border-red border-double border-4' : sello === 'rendido' ? 'border-dashed border-2 border-print/50 text-print-muted' : 'border-2 border-print'
  return (
    <span title={detalle} className={`flex size-20 -rotate-6 flex-col items-center justify-center rounded-full ${estilo}`}>
      <span className="text-xs leading-none" aria-hidden>{estrellas}</span>
      <span className="mt-1 px-1 font-display text-[10px] font-bold uppercase leading-tight">{nombre}</span>
    </span>
  )
}

function SinSello() {
  return (
    <span className="flex size-20 items-center justify-center rounded-full border-2 border-dotted border-print/30 font-display text-[10px] uppercase text-print-muted">
      Sin sello
    </span>
  )
}
