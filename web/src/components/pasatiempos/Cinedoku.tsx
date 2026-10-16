import { useEffect, useRef, useState } from 'react'
import type { Cinedoku as DatosCinedoku } from '../../data/pasatiempos/types'
import { calcularSello, type ProgresoCinedoku } from '../../lib/progresoPasatiempos'
import Ayudas, { SelloResuelto, type Confirmacion } from './Ayudas'

type Props = {
  datos: DatosCinedoku
  progreso: ProgresoCinedoku
  onCambio: (p: ProgresoCinedoku) => void
}

const N = 6 // 6×6; las cajas miden datos.cajas = [2 filas, 3 columnas]
const TODAS = Array.from({ length: N * N }, (_, i) => i)
const fila = (i: number) => Math.floor(i / N)
const col = (i: number) => i % N
const PRESION_LARGA_MS = 450

/**
 * Cinedoku: sudoku 6×6 con las letras Z O D I A C. Tocás una celda y la letra en el teclado.
 * Lápiz (interruptor o mantener apretada la letra; en la compu, Shift + letra) anota candidatos chiquitos.
 * No marca conflictos solo: eso sería verificar gratis. La fila oculta, resuelta, dice ZODIAC.
 */
export default function Cinedoku({ datos, progreso, onCambio }: Props) {
  const [altoCaja, anchoCaja] = datos.cajas
  const impresa = (i: number) => datos.inicio[fila(i)][col(i)] !== '.'
  const solucion = (i: number) => datos.solucion[fila(i)][col(i)]
  const celdas = progreso.celdas ?? {}
  const notas = progreso.notas ?? {}
  const reveladas = new Set(progreso.reveladas ?? [])
  const valor = (i: number) => (impresa(i) ? datos.inicio[fila(i)][col(i)] : (celdas[i] ?? ''))
  const resuelto = !!progreso.resuelto
  const pistasQuedan = datos.pistasGratis - (progreso.pistasUsadas ?? 0)

  // Estado de la interfaz (no se guarda)
  const [elegida, setElegida] = useState<number | null>(null)
  const [lapiz, setLapiz] = useState(false)
  const [errores, setErrores] = useState<Set<number>>(new Set())
  const [confirmar, setConfirmar] = useState<Confirmacion>(null)
  const [aviso, setAviso] = useState('')
  const presion = useRef<{ timer?: number; larga: boolean }>({ larga: false })

  const misma = (a: number, b: number) =>
    fila(a) === fila(b) || col(a) === col(b) ||
    (Math.floor(fila(a) / altoCaja) === Math.floor(fila(b) / altoCaja) && Math.floor(col(a) / anchoCaja) === Math.floor(col(b) / anchoCaja))

  function guardar(cambio: ProgresoCinedoku) {
    const nuevo = { ...progreso, ...cambio }
    const c = nuevo.celdas ?? {}
    if (TODAS.every((i) => (impresa(i) ? true : c[i] === solucion(i)))) {
      onCambio({ ...nuevo, resuelto: true, sello: calcularSello(nuevo) })
      setElegida(null)
    } else {
      onCambio(nuevo)
    }
  }

  /** Si la celda elegida no se puede tocar, avisa y devuelve false */
  function editable(i: number | null): i is number {
    if (i === null || resuelto) return false
    if (impresa(i)) {
      setAviso('Esa letra viene impresa: no se cambia.')
      return false
    }
    if (reveladas.has(i)) {
      setAviso('Esa letra la dio el editor: no se cambia.')
      return false
    }
    return true
  }

  function poner(letra: string, comoNota = lapiz) {
    setConfirmar(null)
    if (!editable(elegida)) return
    setAviso('')
    if (comoNota) {
      const actual = notas[elegida] ?? ''
      const nueva = actual.includes(letra) ? actual.replace(letra, '') : datos.letras.filter((l) => l === letra || actual.includes(l)).join('')
      return guardar({ notas: { ...notas, [elegida]: nueva } })
    }
    const sinNota = { ...notas }
    delete sinNota[elegida]
    setErrores((prev) => new Set([...prev].filter((i) => i !== elegida)))
    guardar({ celdas: { ...celdas, [elegida]: letra }, notas: sinNota })
  }

  function borrar() {
    setConfirmar(null)
    if (!editable(elegida)) return
    const c = { ...celdas }
    const n = { ...notas }
    delete c[elegida]
    delete n[elegida]
    setErrores((prev) => new Set([...prev].filter((i) => i !== elegida)))
    guardar({ celdas: c, notas: n })
  }

  function pedirPista() {
    if (resuelto || pistasQuedan <= 0) return
    if (elegida === null) return setAviso('Elegí primero la celda que querés que revele el editor.')
    if (!editable(elegida)) return
    if ((progreso.pistasUsadas ?? 0) === 0 && confirmar !== 'pista') return setConfirmar('pista')
    const n = { ...notas }
    delete n[elegida]
    setConfirmar(null)
    setErrores((prev) => new Set([...prev].filter((i) => i !== elegida)))
    setAviso(`El editor revela: fila ${fila(elegida) + 1}, columna ${col(elegida) + 1} es una ${solucion(elegida)}.`)
    guardar({
      celdas: { ...celdas, [elegida]: solucion(elegida) },
      notas: n,
      reveladas: [...reveladas, elegida],
      pistasUsadas: (progreso.pistasUsadas ?? 0) + 1,
    })
  }

  function verificar() {
    if (resuelto || Object.keys(celdas).length === 0) return
    setConfirmar(null)
    const mal = TODAS.filter((i) => !impresa(i) && celdas[i] && celdas[i] !== solucion(i))
    setErrores(new Set(mal))
    setAviso(
      mal.length === 0
        ? 'Todo lo que pusiste está bien. Seguí.'
        : mal.length === 1
          ? 'Hay 1 celda equivocada: está marcada con ✗.'
          : `Hay ${mal.length} celdas equivocadas: están marcadas con ✗.`,
    )
    guardar({ verificaciones: (progreso.verificaciones ?? 0) + 1 })
  }

  function rendirse() {
    if (resuelto) return
    if (confirmar !== 'rendirse') return setConfirmar('rendirse')
    const todas = Object.fromEntries(TODAS.filter((i) => !impresa(i)).map((i) => [i, solucion(i)]))
    setConfirmar(null)
    setErrores(new Set())
    setElegida(null)
    setAviso('')
    onCambio({ ...progreso, celdas: todas, notas: {}, resuelto: true, sello: calcularSello(progreso, true) })
  }

  // En la compu: flechas para moverse, letras para poner, Shift + letra para anotar, Backspace para borrar
  useEffect(() => {
    if (elegida === null || resuelto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const tecla = e.key.toUpperCase()
      const mover: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: N, ArrowUp: -N }
      if (datos.letras.includes(tecla)) poner(tecla, e.shiftKey || lapiz)
      else if (e.key === 'Backspace' || e.key === 'Delete') borrar()
      else if (e.key in mover) setElegida((elegida + mover[e.key] + N * N) % (N * N))
      else if (e.key === 'Escape') setElegida(null)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Mantener apretada una letra = anotarla con el lápiz (sin depender solo del gesto: también está el interruptor)
  const presionar = (letra: string) => {
    presion.current.larga = false
    presion.current.timer = window.setTimeout(() => {
      presion.current.larga = true
      poner(letra, true)
    }, PRESION_LARGA_MS)
  }
  const soltar = () => window.clearTimeout(presion.current.timer)

  const letraElegida = elegida !== null ? valor(elegida) : ''

  return (
    // data-no-swipe: deslizar o usar las flechas sobre el juego no pasa de página
    <div className="mt-3" data-no-swipe>
      <div
        aria-label="Grilla del Cinedoku"
        className="mx-auto grid max-w-sm select-none grid-cols-6 border-[3px] border-print"
      >
        {TODAS.map((i) => {
          const v = valor(i)
          const oculta = fila(i) === datos.filaOculta
          const zodiac = resuelto && oculta
          const fondo =
            elegida === i ? 'bg-print/25'
            : zodiac ? 'bg-red/15'
            : letraElegida && v === letraElegida ? 'bg-print/15'
            : elegida !== null && misma(i, elegida) ? 'bg-print/[0.07]'
            : oculta ? 'bg-print/10'
            : ''
          const bordes =
            `${col(i) < N - 1 ? ((col(i) + 1) % anchoCaja === 0 ? 'border-r-[3px]' : 'border-r') : ''} ` +
            `${fila(i) < N - 1 ? ((fila(i) + 1) % altoCaja === 0 ? 'border-b-[3px]' : 'border-b') : ''}`
          const nota = !v ? notas[i] : ''
          return (
            <button
              key={i}
              type="button"
              disabled={resuelto}
              onClick={(e) => {
                setElegida(i)
                setConfirmar(null)
                // si la celda quedó donde va a aparecer el teclado, la página sube lo justo (scroll-mb-52)
                const boton = e.currentTarget
                requestAnimationFrame(() => boton.scrollIntoView({ block: 'nearest' }))
              }}
              aria-pressed={elegida === i}
              aria-label={
                `Fila ${fila(i) + 1}, columna ${col(i) + 1}, ${v || 'vacía'}` +
                (impresa(i) ? ', impresa' : '') +
                (reveladas.has(i) ? ', dada por el editor' : '') +
                (errores.has(i) ? ', marcada como error' : '') +
                (nota ? `, notas ${[...nota].join(' ')}` : '')
              }
              className={`relative flex aspect-square scroll-mb-52 items-center justify-center border-print/50 ${bordes} ${fondo} ${elegida === i ? 'outline-2 -outline-offset-2 outline-red' : ''}`}
            >
              {v ? (
                <span
                  className={`font-display text-2xl leading-none ${impresa(i) || zodiac ? 'font-bold' : ''} ${zodiac ? 'text-red' : ''} ${reveladas.has(i) ? 'italic text-print-muted' : ''} ${errores.has(i) ? 'line-through decoration-2' : ''}`}
                >
                  {v}
                </span>
              ) : nota ? (
                // candidatos en su lugar fijo (orden Z O D / I A C) para encontrarlos de un vistazo
                <span className="grid w-full grid-cols-3 px-0.5 font-display text-[10px] leading-tight text-print-muted" aria-hidden>
                  {datos.letras.map((l) => <span key={l}>{nota.includes(l) ? l : ''}</span>)}
                </span>
              ) : null}
              {errores.has(i) && <span className="absolute top-0 right-0.5 font-display text-xs font-bold" aria-hidden>✗</span>}
            </button>
          )
        })}
      </div>

      {resuelto ? (
        <div role="status" className="mt-4 border-4 border-double border-print p-3">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.15em] text-print-muted">Grilla resuelta</p>
          <p className="mt-1 font-display text-[15px] leading-snug">
            La fila {datos.filaOculta + 1} dice <strong>{datos.solucion[datos.filaOculta]}</strong>: el nombre que la redacción prefería no imprimir.
          </p>
          <SelloResuelto progreso={progreso} />
        </div>
      ) : (
        <>
          <Ayudas
            pistasQuedan={pistasQuedan}
            confirmar={confirmar}
            puedeVerificar={Object.keys(celdas).length > 0}
            selloEnJuego={calcularSello(progreso)}
            segundos={progreso.segundos}
            aviso={aviso}
            onPista={pedirPista}
            onVerificar={verificar}
            onRendirse={rendirse}
          />

          {/* Teclado pegado abajo mientras se ve el Cinedoku, al alcance del pulgar */}
          {elegida !== null ? (
            <div className="paper sticky bottom-0 z-10 -mx-3 mt-2 border-t-2 border-print px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <p className="flex min-h-8 items-center justify-between font-display text-sm">
                <span>
                  Fila {fila(elegida) + 1}, columna {col(elegida) + 1}
                  {lapiz ? ' · anotando candidatos' : ''}
                </span>
                <button type="button" onClick={() => setElegida(null)} className="min-h-11 px-2 underline">
                  Cerrar
                </button>
              </p>
              <div className="grid grid-cols-6 gap-1">
                {datos.letras.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onPointerDown={() => presionar(l)}
                    onPointerUp={soltar}
                    onPointerLeave={soltar}
                    onContextMenu={(e) => e.preventDefault()} // sin menú del sistema al mantener apretado
                    onClick={() => {
                      if (presion.current.larga) return void (presion.current.larga = false) // ya se anotó
                      poner(l)
                    }}
                    aria-label={lapiz ? `Anotar ${l}` : `Poner ${l}`}
                    className="h-12 select-none border border-print/40 font-display text-xl font-bold [-webkit-touch-callout:none]"
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setLapiz((x) => !x)}
                  aria-pressed={lapiz}
                  className={`h-11 border font-display text-sm font-bold uppercase tracking-wider ${lapiz ? 'border-2 border-red bg-print/10' : 'border-print/40'}`}
                >
                  ✎ Lápiz {lapiz ? 'activado' : ''}
                </button>
                <button type="button" onClick={borrar} className="h-11 border border-print/40 font-display text-sm font-bold uppercase tracking-wider">
                  ⌫ Borrar
                </button>
              </div>
              <p className="mt-1 font-display text-xs italic text-print-muted">Mantené apretada una letra para anotarla como candidato.</p>
            </div>
          ) : (
            <p className="mt-2 font-display text-sm italic">Tocá una celda vacía para empezar.</p>
          )}
        </>
      )}
    </div>
  )
}
