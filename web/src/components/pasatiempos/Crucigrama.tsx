import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Crucigrama as DatosCrucigrama } from '../../data/pasatiempos/types'
import { armarCrucigrama, normalizarLetra, type Direccion } from '../../lib/crucigrama'
import { calcularSello, type ProgresoCrucigrama } from '../../lib/progresoPasatiempos'
import Ayudas, { SelloResuelto, type Confirmacion } from './Ayudas'

type Props = {
  datos: DatosCrucigrama
  progreso: ProgresoCrucigrama
  onCambio: (p: ProgresoCrucigrama) => void
}

// El input oculto siempre tiene este carácter invisible: así "borrar" con el teclado del celular
// genera un evento aunque no haya nada escrito (si el campo está vacío, Android no avisa nada).
const CENTINELA = '​'

/** Cuánto tapa el teclado del celular: la diferencia entre la ventana y la parte visible (visualViewport) */
function useAltoTeclado() {
  const [alto, setAlto] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const medir = () => setAlto(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    medir()
    vv.addEventListener('resize', medir)
    vv.addEventListener('scroll', medir)
    return () => {
      vv.removeEventListener('resize', medir)
      vv.removeEventListener('scroll', medir)
    }
  }, [])
  return alto
}

/** Flecha de la barra de pista. En SVG porque la tipografía de época no trae los signos ‹ › y se veían como paréntesis */
function Chevron({ dir }: { dir: 'izq' | 'der' }) {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto size-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'izq' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'} />
    </svg>
  )
}

// Los botones de la barra y las celdas no le roban el foco al input: si no, el teclado del celular se cierra
const sinRobarFoco = (e: ReactPointerEvent) => e.preventDefault()

/**
 * Crucigrama del Valle.
 * Tocar una celda resalta su palabra; tocarla de nuevo cambia entre horizontal y vertical.
 * Se escribe con el teclado nativo a través de un <input> oculto, y la pista activa va en una barra
 * fija arriba del teclado, con ‹ anterior / siguiente › para recorrer las pistas.
 * Ayudas (como en los otros juegos): la pista revela la celda elegida y la deja fija (al escribir se saltea),
 * Verificar marca las equivocadas y Me rindo completa todo con sello en blanco.
 */
export default function Crucigrama({ datos, progreso, onCambio }: Props) {
  const { palabras, porCelda, numeros, solucion, blancas } = useMemo(() => armarCrucigrama(datos), [datos])
  const W = datos.ancho
  const letras = progreso.letras ?? {}
  const reveladas = new Set(progreso.reveladas ?? [])
  const resuelto = !!progreso.resuelto
  const pistasQuedan = datos.pistasGratis - (progreso.pistasUsadas ?? 0)

  const [activa, setActiva] = useState<number | null>(null) // índice en `palabras`
  const [cursor, setCursor] = useState<number | null>(null) // celda donde se escribe
  // Perder el foco (por ejemplo, al tocar "Pedir pista") solo esconde la barra: la celda elegida se mantiene
  const [conFoco, setConFoco] = useState(false)
  const [errores, setErrores] = useState<Set<number>>(new Set())
  const [confirmar, setConfirmar] = useState<Confirmacion>(null)
  const [aviso, setAviso] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const grilla = useRef<HTMLDivElement>(null)
  const altoTeclado = useAltoTeclado()
  const palabra = activa !== null ? palabras[activa] : null

  function enfocar() {
    const el = input.current
    if (!el) return
    el.value = CENTINELA
    el.focus({ preventScroll: true })
    el.setSelectionRange(1, 1)
  }

  function cerrar() {
    setActiva(null)
    setCursor(null)
    input.current?.blur()
  }

  function tocar(i: number) {
    if (resuelto) return
    const de = porCelda.get(i) ?? {}
    let dir: Direccion = palabra?.dir ?? 'h'
    if (cursor === i && de.h !== undefined && de.v !== undefined) dir = dir === 'h' ? 'v' : 'h' // segundo toque: cambia
    if (de[dir] === undefined) dir = dir === 'h' ? 'v' : 'h' // la celda tiene una sola dirección
    setActiva(de[dir] ?? null)
    setCursor(i)
    setConfirmar(null)
    enfocar()
  }

  function elegirPalabra(k: number) {
    if (resuelto) return
    const p = palabras[k]
    setActiva(k)
    setCursor(p.celdas.find((c) => !letras[c]) ?? p.celdas[0]) // arranca en el primer hueco
    enfocar()
  }

  const saltar = (paso: number) => elegirPalabra(activa === null ? 0 : (activa + paso + palabras.length) % palabras.length)

  function guardar(cambio: ProgresoCrucigrama) {
    const nuevo = { ...progreso, ...cambio }
    const l = nuevo.letras ?? {}
    if (blancas.every((i) => l[i] === solucion(i))) {
      onCambio({ ...nuevo, resuelto: true, sello: calcularSello(nuevo) })
      cerrar()
    } else {
      onCambio(nuevo)
    }
  }

  const sinError = (i: number) => setErrores((prev) => new Set([...prev].filter((x) => x !== i)))

  function escribir(letra: string) {
    if (cursor === null || !palabra) return
    setConfirmar(null)
    // las celdas que dio el editor no se pisan: se escribe en la próxima libre de la palabra
    const k = palabra.celdas.indexOf(cursor)
    const destino = palabra.celdas.slice(k).find((c) => !reveladas.has(c))
    if (destino === undefined) return
    sinError(destino)
    guardar({ letras: { ...letras, [destino]: letra } })
    const siguiente = palabra.celdas.slice(palabra.celdas.indexOf(destino) + 1).find((c) => !reveladas.has(c))
    setCursor(siguiente ?? destino)
  }

  function borrar() {
    if (cursor === null || !palabra) return
    setConfirmar(null)
    const nuevas = { ...letras }
    if (nuevas[cursor] && !reveladas.has(cursor)) {
      delete nuevas[cursor]
      sinError(cursor)
    } else {
      // celda vacía (o del editor): borra la anterior libre de la palabra y retrocede, como en cualquier crucigrama digital
      const k = palabra.celdas.indexOf(cursor)
      const anterior = palabra.celdas.slice(0, k).reverse().find((c) => !reveladas.has(c))
      if (anterior === undefined) return
      delete nuevas[anterior]
      sinError(anterior)
      setCursor(anterior)
    }
    guardar({ letras: nuevas })
  }

  function pedirPista() {
    if (resuelto || pistasQuedan <= 0) return
    if (cursor === null) return setAviso('Elegí primero la celda que querés que revele el editor.')
    if (reveladas.has(cursor)) return setAviso('Esa letra ya la dio el editor. Elegí otra celda.')
    if ((progreso.pistasUsadas ?? 0) === 0 && confirmar !== 'pista') return setConfirmar('pista')
    setConfirmar(null)
    sinError(cursor)
    setAviso(`El editor revela: fila ${Math.floor(cursor / W) + 1}, columna ${(cursor % W) + 1} es una ${solucion(cursor)}.`)
    guardar({
      letras: { ...letras, [cursor]: solucion(cursor) },
      reveladas: [...reveladas, cursor],
      pistasUsadas: (progreso.pistasUsadas ?? 0) + 1,
    })
  }

  function verificar() {
    if (resuelto || Object.keys(letras).length === 0) return
    setConfirmar(null)
    const mal = blancas.filter((i) => letras[i] && letras[i] !== solucion(i))
    setErrores(new Set(mal))
    setAviso(
      mal.length === 0
        ? 'Todo lo que pusiste está bien. Seguí.'
        : mal.length === 1
          ? 'Hay 1 letra equivocada: está marcada con ✗.'
          : `Hay ${mal.length} letras equivocadas: están marcadas con ✗.`,
    )
    guardar({ verificaciones: (progreso.verificaciones ?? 0) + 1 })
  }

  function rendirse() {
    if (resuelto) return
    if (confirmar !== 'rendirse') return setConfirmar('rendirse')
    setConfirmar(null)
    setErrores(new Set())
    setAviso('')
    onCambio({ ...progreso, letras: Object.fromEntries(blancas.map((i) => [i, solucion(i)])), resuelto: true, sello: calcularSello(progreso, true) })
    cerrar()
  }

  /** Flechas (en la compu): se mueve a la próxima celda blanca en esa dirección */
  function flecha(dr: number, dc: number) {
    if (cursor === null) return
    let r = Math.floor(cursor / W) + dr
    let c = (cursor % W) + dc
    while (r >= 0 && r < datos.alto && c >= 0 && c < W) {
      const i = r * W + c
      if (solucion(i) !== '#') {
        const dir: Direccion = dc !== 0 ? 'h' : 'v'
        const de = porCelda.get(i) ?? {}
        setActiva(de[dir] ?? de[dir === 'h' ? 'v' : 'h'] ?? null)
        setCursor(i)
        return
      }
      r += dr
      c += dc
    }
  }

  // Con el teclado del celular abierto, la celda donde se escribe tiene que quedar a la vista
  useEffect(() => {
    if (cursor === null) return
    grilla.current?.querySelector<HTMLElement>(`[data-celda="${cursor}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [cursor, altoTeclado])

  return (
    // data-no-swipe: deslizar o usar las flechas sobre el juego no pasa de página
    <div className="mt-3" data-no-swipe>
      <div
        ref={grilla}
        aria-label="Grilla del crucigrama"
        className="grid select-none border-2 border-print"
        style={{ gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: W * datos.alto }, (_, i) => {
          if (solucion(i) === '#') return <div key={i} className="aspect-square bg-print" aria-hidden />
          const enPalabra = palabra?.celdas.includes(i)
          return (
            <button
              key={i}
              type="button"
              data-celda={i}
              disabled={resuelto}
              onPointerDown={sinRobarFoco}
              onClick={() => tocar(i)}
              aria-label={
                `Fila ${Math.floor(i / W) + 1}, columna ${(i % W) + 1}, ${letras[i] ?? 'vacía'}` +
                (reveladas.has(i) ? ', dada por el editor' : '') +
                (errores.has(i) ? ', marcada como error' : '')
              }
              // margen al hacer scroll: deja lugar para la barra de pista y el teclado del celular
              style={cursor === i ? { scrollMarginBottom: altoTeclado + 96 } : undefined}
              className={`relative flex aspect-square items-center justify-center border-r border-b border-print/40 ${
                cursor === i ? 'bg-print/30 outline-2 -outline-offset-2 outline-red' : enPalabra ? 'bg-print/15' : ''
              }`}
            >
              {numeros.has(i) && <span className="absolute top-0 left-0.5 font-display text-[9px] font-bold leading-none" aria-hidden>{numeros.get(i)}</span>}
              <span
                className={`font-display text-xl leading-none ${reveladas.has(i) ? 'italic text-print-muted' : 'font-bold'} ${errores.has(i) ? 'line-through decoration-2' : ''}`}
              >
                {letras[i] ?? ''}
              </span>
              {errores.has(i) && <span className="absolute top-0 right-0.5 font-display text-[10px] font-bold" aria-hidden>✗</span>}
            </button>
          )
        })}
      </div>

      {!resuelto && (
        <Ayudas
          pistasQuedan={pistasQuedan}
          confirmar={confirmar}
          puedeVerificar={Object.keys(letras).length > 0}
          selloEnJuego={calcularSello(progreso)}
          segundos={progreso.segundos}
          aviso={aviso}
          onPista={pedirPista}
          onVerificar={verificar}
          onRendirse={rendirse}
        />
      )}

      {resuelto && (
        <div role="status" className="mt-4 border-4 border-double border-print p-3">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.15em] text-print-muted">Crucigrama resuelto</p>
          <SelloResuelto progreso={progreso} />
        </div>
      )}

      {/* Listas de pistas, como en la maqueta: tocar una elige su palabra */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(['h', 'v'] as const).map((dir) => (
          <div key={dir}>
            <p className="border-b border-print font-display text-[11px] font-bold uppercase tracking-[0.15em]">{dir === 'h' ? 'Horizontales' : 'Verticales'}</p>
            <ol>
              {palabras.map((p, k) =>
                p.dir !== dir ? null : (
                  <li key={k}>
                    <button
                      type="button"
                      disabled={resuelto}
                      onPointerDown={sinRobarFoco}
                      onClick={() => elegirPalabra(k)}
                      className={`min-h-11 w-full py-1 text-left font-display text-[15px] leading-snug ${activa === k ? 'bg-print/15' : ''}`}
                    >
                      <strong>{p.n}</strong> {p.pista} ({p.largo})
                    </button>
                  </li>
                ),
              )}
            </ol>
          </div>
        ))}
      </div>

      {/* El input oculto: recibe lo que se tipea. Está siempre (fuera de la barra) para poder enfocarlo
          en el mismo toque que elige la celda: si no, iOS no abre el teclado. 16 px evita el zoom de iOS. */}
      <input
        ref={input}
        aria-label="Escribir en el crucigrama"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="fixed bottom-0 left-0 size-px text-base opacity-0"
        onFocus={() => setConFoco(true)}
        onBlur={() => setConFoco(false)}
        onInput={(e) => {
          const el = e.currentTarget
          const tipo = (e.nativeEvent as InputEvent).inputType ?? ''
          // En Android `keydown` casi nunca dice qué tecla fue: se lee la letra del evento `input`
          if (tipo.startsWith('delete')) borrar()
          else {
            const letra = normalizarLetra([...el.value.replaceAll(CENTINELA, '')].pop() ?? '')
            if (letra) escribir(letra)
          }
          el.value = CENTINELA
          el.setSelectionRange(1, 1)
        }}
        onKeyDown={(e) => {
          const flechas: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }
          if (e.key in flechas) flecha(...flechas[e.key])
          else if (e.key === 'Enter') saltar(e.shiftKey ? -1 : 1)
          else if (e.key === 'Escape') cerrar()
          else return
          e.preventDefault()
        }}
      />

      {/* Barra de pista fija arriba del teclado (como el mini del NYT), con ‹ anterior / siguiente › */}
      {palabra && conFoco && (
        <div className="paper fixed inset-x-0 bottom-0 z-20 border-t-2 border-print shadow-[0_-4px_12px_rgb(0_0_0/0.15)]" style={{ transform: `translateY(-${altoTeclado}px)` }}>
          <div className="mx-auto flex max-w-6xl items-center gap-1 px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            <button type="button" onPointerDown={sinRobarFoco} onClick={() => saltar(-1)} aria-label="Pista anterior" className="size-11 shrink-0">
              <Chevron dir="izq" />
            </button>
            <p className="min-w-0 flex-1 font-display text-sm leading-snug" aria-live="polite">
              <strong>
                {palabra.n} {palabra.dir === 'h' ? '→' : '↓'}
              </strong>{' '}
              {palabra.pista} ({palabra.largo})
            </p>
            <button type="button" onPointerDown={sinRobarFoco} onClick={() => saltar(1)} aria-label="Pista siguiente" className="size-11 shrink-0">
              <Chevron dir="der" />
            </button>
            <button type="button" onPointerDown={sinRobarFoco} onClick={cerrar} aria-label="Cerrar" className="size-11 shrink-0 font-display text-lg">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
