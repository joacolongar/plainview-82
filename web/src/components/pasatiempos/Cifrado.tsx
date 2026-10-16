import { useEffect, useMemo, useState } from 'react'
import type { Cifrado as DatosCifrado } from '../../data/pasatiempos/types'
import { decodificarClave, simbolosEnOrden } from '../../lib/descifrar'
import { calcularSello, type ProgresoCifrado } from '../../lib/progresoPasatiempos'
import Ayudas, { SelloResuelto, type Confirmacion } from './Ayudas'
import Glifo from './glyphs/Glifo'

const LETRAS = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ']

type Props = {
  datos: DatosCifrado
  progreso: ProgresoCifrado
  onCambio: (p: ProgresoCifrado) => void
}

/**
 * El Cifrado: tocás un símbolo (en el mensaje o en la lista) y elegís la letra en el teclado;
 * se completa en todas sus apariciones. Si esa letra ya estaba en otro símbolo, se mueve.
 * Ayudas (docs/PASATIEMPOS.md): pistas del editor (revelan una letra y quedan fijas), "Verificar"
 * (marca errores; cada uso cuenta) y "Me rindo" (muestra todo, sello en blanco). Las pistas y las
 * verificaciones bajan el sello; cuando todas las letras coinciden se revela la carta con el cupón.
 */
export default function Cifrado({ datos, progreso, onCambio }: Props) {
  const clave = useMemo(() => decodificarClave(datos.clave), [datos.clave])
  const simbolos = useMemo(() => simbolosEnOrden(datos.cifrado, clave), [datos.cifrado, clave])
  const asignaciones = useMemo(() => progreso.asignaciones ?? {}, [progreso.asignaciones])
  const reveladas = useMemo(() => new Set(progreso.reveladas ?? []), [progreso.reveladas])
  const pistasUsadas = progreso.pistasUsadas ?? 0
  const pistasQuedan = datos.pistasGratis - pistasUsadas
  const resuelto = !!progreso.resuelto

  // Estado de la interfaz (no se guarda): símbolo elegido, errores marcados, confirmaciones y avisos
  const [elegido, setElegido] = useState<string | null>(null)
  const [errores, setErrores] = useState<Set<string>>(new Set())
  const [confirmar, setConfirmar] = useState<Confirmacion>(null)
  const [aviso, setAviso] = useState('')

  const numero = (s: string) => simbolos.indexOf(s) + 1
  const letrasUsadas = new Set(Object.values(asignaciones))
  const letrasDelEditor = new Set([...reveladas].map((s) => clave[s]))
  const etiqueta = (s: string) =>
    `Símbolo ${numero(s)}, ${asignaciones[s] ? `letra ${asignaciones[s]}` : 'sin letra'}` +
    (reveladas.has(s) ? ', dada por el editor' : '') +
    (errores.has(s) ? ', marcada como error' : '')

  /** Guarda el cambio y, si con eso quedó todo bien, lo da por resuelto con el sello que corresponda */
  function guardar(cambio: ProgresoCifrado) {
    const nuevo = { ...progreso, ...cambio }
    const nuevas = nuevo.asignaciones ?? {}
    if (simbolos.every((s) => nuevas[s] === clave[s])) {
      onCambio({ ...nuevo, resuelto: true, sello: calcularSello(nuevo) })
      setElegido(null)
    } else {
      onCambio(nuevo)
    }
  }

  /** El próximo símbolo sin letra después de `desde`, para no tener que buscarlo */
  function siguienteVacio(desde: string, nuevas: Record<string, string>) {
    const i = simbolos.indexOf(desde)
    return [...simbolos.slice(i + 1), ...simbolos.slice(0, i)].find((s) => !nuevas[s]) ?? null
  }

  function asignar(letra: string | null) {
    if (!elegido || resuelto) return
    setConfirmar(null)
    if (reveladas.has(elegido)) return setAviso('Esa letra la dio el editor: no se cambia.')
    if (letra && letrasDelEditor.has(letra)) return setAviso(`La ${letra} ya la dio el editor en otro símbolo.`)

    const nuevas = { ...asignaciones }
    if (letra) {
      for (const [s, l] of Object.entries(nuevas)) if (l === letra) delete nuevas[s] // la letra se mueve
      nuevas[elegido] = letra
    } else {
      delete nuevas[elegido]
    }
    setErrores((prev) => new Set([...prev].filter((s) => s !== elegido && nuevas[s]))) // la marca se va al cambiar
    setAviso('')
    guardar({ asignaciones: nuevas })
    if (letra) setElegido(siguienteVacio(elegido, nuevas))
  }

  function pedirPista() {
    if (resuelto || pistasQuedan <= 0) return
    if (!elegido) return setAviso('Elegí primero el símbolo que querés que revele el editor.')
    if (reveladas.has(elegido)) return setAviso('Ese símbolo ya lo reveló el editor. Elegí otro.')
    // Antes de la primera pista, un segundo toque para confirmar: nadie pierde el oro sin querer
    if (pistasUsadas === 0 && confirmar !== 'pista') return setConfirmar('pista')

    const letra = clave[elegido]
    const nuevas = { ...asignaciones }
    for (const [s, l] of Object.entries(nuevas)) if (l === letra) delete nuevas[s]
    nuevas[elegido] = letra
    setConfirmar(null)
    setErrores((prev) => new Set([...prev].filter((s) => nuevas[s] && s !== elegido)))
    setAviso(`El editor revela: el símbolo ${numero(elegido)} es la ${letra}.`)
    guardar({ asignaciones: nuevas, reveladas: [...reveladas, elegido], pistasUsadas: pistasUsadas + 1 })
    setElegido(siguienteVacio(elegido, nuevas))
  }

  function verificar() {
    if (resuelto || letrasUsadas.size === 0) return
    setConfirmar(null)
    const mal = simbolos.filter((s) => asignaciones[s] && asignaciones[s] !== clave[s])
    setErrores(new Set(mal))
    setAviso(
      mal.length === 0
        ? 'Todo lo que pusiste está bien. Seguí.'
        : mal.length === 1
          ? 'Hay 1 símbolo equivocado: está marcado con ✗.'
          : `Hay ${mal.length} símbolos equivocados: están marcados con ✗.`,
    )
    guardar({ verificaciones: (progreso.verificaciones ?? 0) + 1 })
  }

  function rendirse() {
    if (resuelto) return
    if (confirmar !== 'rendirse') return setConfirmar('rendirse')
    setConfirmar(null)
    setErrores(new Set())
    setElegido(null)
    setAviso('')
    onCambio({ ...progreso, asignaciones: { ...clave }, resuelto: true, sello: calcularSello(progreso, true) })
  }

  function mover(paso: number) {
    if (!simbolos.length) return
    const i = elegido ? simbolos.indexOf(elegido) : -1
    setElegido(simbolos[(i + paso + simbolos.length) % simbolos.length])
  }

  // En la compu también se juega con el teclado físico: letras, Backspace y flechas
  useEffect(() => {
    if (!elegido || resuelto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const tecla = e.key.toUpperCase()
      if (LETRAS.includes(tecla)) asignar(tecla)
      else if (e.key === 'Backspace' || e.key === 'Delete') asignar(null)
      else if (e.key === 'ArrowRight') mover(1)
      else if (e.key === 'ArrowLeft') mover(-1)
      else if (e.key === 'Escape') setElegido(null)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const textoEnClaro = [...datos.cifrado].map((ch) => clave[ch] ?? ch).join('')

  return (
    // data-no-swipe: deslizar o usar las flechas sobre el juego no pasa de página
    <div className="mt-3" data-no-swipe>
      {/* El mensaje: palabra por palabra, sin cortar palabras al final del renglón */}
      <div className="flex flex-wrap gap-x-3 gap-y-3" aria-label="Mensaje cifrado">
        {datos.cifrado.split(' ').map((palabra, i) => (
          <span key={i} className="inline-flex items-end">
            {[...palabra].map((ch, j) =>
              ch in clave ? (
                <button
                  key={j}
                  type="button"
                  disabled={resuelto}
                  onClick={(e) => {
                    setElegido(ch)
                    setConfirmar(null)
                    // el teclado aparece abajo: si el símbolo tocado quedó debajo, la página sube lo justo
                    // (scroll-mb-72 deja lugar para el teclado al calcular "nearest")
                    const celda = e.currentTarget
                    requestAnimationFrame(() => celda.scrollIntoView({ block: 'nearest' }))
                  }}
                  aria-pressed={elegido === ch}
                  aria-label={etiqueta(ch)}
                  className={`relative flex h-12 w-7 scroll-mb-72 flex-col items-center justify-end ${elegido === ch ? 'bg-print/10' : ''}`}
                >
                  <span
                    className={`h-5 font-display text-base font-bold leading-5 ${elegido === ch ? 'underline decoration-red decoration-2' : ''} ${reveladas.has(ch) ? 'italic text-print-muted' : ''} ${errores.has(ch) ? 'line-through decoration-2' : ''}`}
                  >
                    {asignaciones[ch] ?? ''}
                  </span>
                  {errores.has(ch) && <span className="absolute -top-1 right-0 font-display text-xs font-bold" aria-hidden>✗</span>}
                  <span className="mt-0.5 h-px w-5 bg-print/60" aria-hidden />
                  <Glifo id={ch} className="mt-0.5 size-5" />
                </button>
              ) : (
                <span key={j} className="pb-0.5 font-display text-lg leading-none" aria-hidden>{ch}</span>
              ),
            )}
          </span>
        ))}
      </div>

      {resuelto ? (
        <div role="status" className="mt-4 border-4 border-double border-print p-3">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.15em] text-print-muted">Carta descifrada</p>
          <p className="mt-1 font-display text-[15px] leading-snug">{textoEnClaro}</p>
          <SelloResuelto progreso={progreso} />
          {/* El cupón no está en la carta: aparece en el Carnet al completar los tres pasatiempos sin rendirse */}
        </div>
      ) : (
        <>
          <Ayudas
            pistasQuedan={pistasQuedan}
            confirmar={confirmar}
            puedeVerificar={letrasUsadas.size > 0}
            selloEnJuego={calcularSello(progreso)}
            segundos={progreso.segundos}
            aviso={aviso}
            onPista={pedirPista}
            onVerificar={verificar}
            onRendirse={rendirse}
          />

          {/* Lista de símbolos: botones de 44 px, la forma cómoda de elegir con el pulgar */}
          <p className="mt-3 font-display text-[11px] font-bold uppercase tracking-[0.15em] text-print-muted">Símbolos</p>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {simbolos.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setElegido(s)
                  setConfirmar(null)
                }}
                aria-pressed={elegido === s}
                aria-label={etiqueta(s)}
                className={`relative flex h-11 flex-col items-center justify-center border ${elegido === s ? 'border-2 border-red bg-print/10' : 'border-print/40'} ${reveladas.has(s) ? 'bg-print/10' : ''}`}
              >
                <Glifo id={s} className="size-5" />
                <span className={`h-3.5 font-display text-xs font-bold leading-3.5 ${reveladas.has(s) ? 'italic' : ''} ${errores.has(s) ? 'line-through' : ''}`}>
                  {asignaciones[s] ?? ''}
                </span>
                {errores.has(s) && <span className="absolute top-0 right-0.5 font-display text-[10px] font-bold" aria-hidden>✗</span>}
              </button>
            ))}
          </div>

          {/* Teclado pegado abajo mientras se ve el Cifrado (sticky dentro de la sección), al alcance del pulgar */}
          {elegido ? (
            <div className="paper sticky bottom-0 z-10 -mx-3 mt-3 border-t-2 border-print px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div className="flex min-h-11 items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display text-sm">
                  <Glifo id={elegido} className="size-6" />
                  {reveladas.has(elegido) ? `Símbolo ${numero(elegido)}: lo dio el editor` : `Símbolo ${numero(elegido)}: elegí la letra`}
                </p>
                <button type="button" onClick={() => setElegido(null)} className="min-h-11 px-2 font-display text-sm underline">
                  Cerrar
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {LETRAS.map((l) => {
                  const delEditor = letrasDelEditor.has(l)
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => asignar(l)}
                      disabled={reveladas.has(elegido) || delEditor}
                      aria-label={delEditor ? `${l}, la dio el editor` : letrasUsadas.has(l) && asignaciones[elegido] !== l ? `${l}, ya usada en otro símbolo` : l}
                      className={`h-11 border border-print/40 font-display text-lg font-bold disabled:opacity-30 ${letrasUsadas.has(l) ? 'text-print-muted line-through decoration-1' : ''}`}
                    >
                      {l}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => asignar(null)}
                  disabled={reveladas.has(elegido)}
                  aria-label="Borrar letra"
                  className="h-11 border border-print/40 font-display text-lg disabled:opacity-30"
                >
                  ⌫
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 font-display text-sm italic">Tocá un símbolo del mensaje o de la lista para empezar.</p>
          )}
        </>
      )}
    </div>
  )
}
