import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../components/Aviso'
import { getAviso } from '../data/anuncios'
import { ultimaEdicion } from '../data/pasatiempos'
import Cifrado from '../components/pasatiempos/Cifrado'
import Cinedoku from '../components/pasatiempos/Cinedoku'
import Crucigrama from '../components/pasatiempos/Crucigrama'
import type { Edicion, Juego } from '../data/pasatiempos/types'
import { decodificarClave } from '../lib/descifrar'
import { formatearTiempo, SELLOS, useCronometros, useProgreso, type Progreso, type ProgresoJuego, type Sello } from '../lib/progresoPasatiempos'
import { edicionCompleta, sinRendirse, textoResultado } from '../lib/resultado'

const paperLink = 'inline-flex min-h-11 items-center font-display text-sm font-bold uppercase tracking-wider underline underline-offset-4 hover:decoration-red'

/**
 * Página de Pasatiempos. Sigue docs/pasatiempos-maqueta.png:
 * cabecera de página, título, las tres secciones de la edición y el Carnet de lector al pie.
 * Los tres juegos se juegan con sus ayudas: Cifrado (P2), Cinedoku (P3) y Crucigrama (P4).
 */
export default function Pasatiempos() {
  const edicion = ultimaEdicion()
  const recompensa = getAviso('recompensa')

  return (
    <div>
      <header className="border-b-4 border-double border-print pt-3 pb-3 text-center">
        <h1 className="font-headline text-[clamp(2.75rem,14vw,6rem)] uppercase leading-none">Pasatiempos</h1>
        <p className="mt-1 font-display italic">
          {edicion ? `Edición N° ${edicion.numero}` : 'Edición en imprenta'} · Para el lector que mira de cerca
        </p>
      </header>

      {/* El aviso "Recompensa" anuncia el Cifrado, que es lo primero de la página */}
      {edicion && recompensa && (
        <aside className="mx-auto mt-4 max-w-xs">
          <Aviso aviso={recompensa} />
        </aside>
      )}

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
  useCronometros(progreso, setProgreso)

  // Cada juego guarda su copia del progreso, que puede ir un segundo atrás del cronómetro: nunca se resta tiempo
  const conTiempo = <T extends ProgresoJuego>(nuevo: T, anterior?: ProgresoJuego): T => ({
    ...nuevo,
    segundos: Math.max(nuevo.segundos ?? 0, anterior?.segundos ?? 0),
  })

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
          onCambio={(cifrado) => setProgreso((p) => ({ ...p, juegos: { ...p.juegos, cifrado: conTiempo(cifrado, p.juegos.cifrado) } }))}
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
          onCambio={(cinedoku) => setProgreso((p) => ({ ...p, juegos: { ...p.juegos, cinedoku: conTiempo(cinedoku, p.juegos.cinedoku) } }))}
        />
      </Seccion>
      <Seccion
        id="crucigrama"
        numero="III"
        titulo={edicion.crucigrama.titulo}
        entradilla="Palabras cruzadas, todas sacadas de las páginas de este diario."
        dato={`${edicion.crucigrama.ancho}×${edicion.crucigrama.alto} · ${edicion.crucigrama.horizontales.length + edicion.crucigrama.verticales.length} palabras`}
        extra={<PistasDelEditor total={edicion.crucigrama.pistasGratis} usadas={progreso.juegos.crucigrama?.pistasUsadas ?? 0} />}
      >
        <Crucigrama
          datos={edicion.crucigrama}
          progreso={progreso.juegos.crucigrama ?? {}}
          onCambio={(crucigrama) => setProgreso((p) => ({ ...p, juegos: { ...p.juegos, crucigrama: conTiempo(crucigrama, p.juegos.crucigrama) } }))}
        />
      </Seccion>

      <p className="border-t-4 border-double border-print pt-3 font-display text-[15px] italic">
        Mientras se terminan de imprimir, puede probar suerte con La Función del Día.
      </p>
      <Link to="/juego" className={paperLink}>Jugar La Función del Día (versión de prueba) →</Link>

      <Carnet edicion={edicion} progreso={progreso} />
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
function Carnet({ edicion, progreso }: { edicion: Edicion; progreso: Progreso }) {
  const numero = edicion.numero
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
              {sello && sello !== 'rendido' && progreso.juegos[id]?.segundos ? (
                <span className="font-display text-xs" aria-label={`tiempo ${formatearTiempo(progreso.juegos[id]?.segundos)}`}>
                  <span aria-hidden>⏱</span> {formatearTiempo(progreso.juegos[id]?.segundos)}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
      {edicionCompleta(progreso) && <ResultadoEdicion edicion={edicion} progreso={progreso} />}
    </section>
  )
}

/**
 * Al completar los tres: el cupón (solo si ninguno fue "Me rindo") y el resultado para compartir.
 * En el celular, Compartir abre el menú nativo (WhatsApp, Instagram…); si no hay, copia el texto.
 */
function ResultadoEdicion({ edicion, progreso }: { edicion: Edicion; progreso: Progreso }) {
  const [estado, setEstado] = useState('')
  const texto = textoResultado(edicion, progreso, window.location.host)
  const premio = sinRendirse(progreso) ? decodificarClave(edicion.premio) : null

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ text: texto })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // el lector cerró el menú: no hay que hacer nada
      }
    }
    try {
      await navigator.clipboard.writeText(texto)
      setEstado('Copiado. Pegalo donde quieras.')
    } catch {
      setEstado('No se pudo copiar: mantené apretado el texto para copiarlo a mano.')
    }
  }

  return (
    <div className="mt-4 border-t-2 border-dashed border-print pt-3">
      <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">Edición completa</p>
      {premio ? (
        <div className="mt-2 border-4 border-double border-red p-3 text-center">
          <p className="font-display text-xs uppercase tracking-[0.15em]">Palabra para su boleta</p>
          <p className="font-headline text-4xl uppercase tracking-wider">{premio.cupon}</p>
          <p className="mt-1 font-display text-sm italic">
            {premio.detalle} Escríbala en su boleta de pedido: vale uno por pedido y solo en esta edición.
          </p>
        </div>
      ) : (
        <p className="mt-2 font-display text-sm italic">
          El premio era para quien completara los tres sin rendirse. Habrá revancha en la próxima edición.
        </p>
      )}
      <pre className="mt-3 overflow-x-auto bg-print/5 p-2 font-mono text-xs leading-relaxed whitespace-pre">{texto}</pre>
      <button type="button" onClick={compartir} className="mt-2 min-h-12 w-full border-2 border-print font-display text-sm font-bold uppercase tracking-wider">
        Compartir resultado
      </button>
      <p role="status" aria-live="polite" className="min-h-5 font-display text-sm italic">{estado}</p>
    </div>
  )
}

function SelloImpreso({ sello }: { sello: Sello }) {
  const { nombre, detalle, estrellas } = SELLOS[sello]
  const estilo =
    sello === 'oro' ? 'border-red border-double border-4' : sello === 'rendido' ? 'border-dashed border-2 border-print/50 text-print-muted' : 'border-2 border-print'
  return (
    <span title={detalle} className={`flex size-20 -rotate-6 flex-col items-center justify-center rounded-full ${estilo}`}>
      <span className="text-xs leading-none" aria-hidden>{estrellas}</span>
      <span className="mt-1 max-w-full px-1.5 font-display text-[9px] font-bold uppercase leading-tight tracking-tight">{nombre}</span>
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
