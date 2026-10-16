import { useEffect, useMemo, useState } from 'react'
import type { Cifrado as DatosCifrado } from '../../data/pasatiempos/types'
import { decodificarClave, simbolosEnOrden } from '../../lib/descifrar'
import { calcularSello, SELLOS, type ProgresoCifrado } from '../../lib/progresoPasatiempos'
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
 * Cuando todas las letras coinciden con la clave, se revela la carta (con el cupón) y se pone el sello.
 */
export default function Cifrado({ datos, progreso, onCambio }: Props) {
  const clave = useMemo(() => decodificarClave(datos.clave), [datos.clave])
  const simbolos = useMemo(() => simbolosEnOrden(datos.cifrado, clave), [datos.cifrado, clave])
  const asignaciones = useMemo(() => progreso.asignaciones ?? {}, [progreso.asignaciones])
  const resuelto = !!progreso.resuelto
  const [elegido, setElegido] = useState<string | null>(null) // estado de la interfaz: no se guarda

  const numero = (s: string) => simbolos.indexOf(s) + 1
  const letrasUsadas = new Set(Object.values(asignaciones))

  function asignar(letra: string | null) {
    if (!elegido || resuelto) return
    const nuevas = { ...asignaciones }
    if (letra) {
      for (const [s, l] of Object.entries(nuevas)) if (l === letra) delete nuevas[s] // la letra se mueve
      nuevas[elegido] = letra
    } else {
      delete nuevas[elegido]
    }

    if (simbolos.every((s) => nuevas[s] === clave[s])) {
      onCambio({ ...progreso, asignaciones: nuevas, resuelto: true, sello: calcularSello(progreso) })
      setElegido(null)
      return
    }
    onCambio({ ...progreso, asignaciones: nuevas })
    if (letra) {
      // pasa solo al próximo símbolo sin letra, para no tener que buscarlo
      const i = simbolos.indexOf(elegido)
      const siguiente = [...simbolos.slice(i + 1), ...simbolos.slice(0, i)].find((s) => !nuevas[s])
      setElegido(siguiente ?? null)
    }
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
    <div className="mt-3">
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
                    // el teclado aparece abajo: si el símbolo tocado quedó debajo, la página sube lo justo
                    // (scroll-mb-72 deja lugar para el teclado al calcular "nearest")
                    const celda = e.currentTarget
                    requestAnimationFrame(() => celda.scrollIntoView({ block: 'nearest' }))
                  }}
                  aria-pressed={elegido === ch}
                  aria-label={`Símbolo ${numero(ch)}, ${asignaciones[ch] ? `letra ${asignaciones[ch]}` : 'sin letra'}`}
                  className={`flex h-12 w-7 scroll-mb-72 flex-col items-center justify-end ${elegido === ch ? 'bg-print/10' : ''}`}
                >
                  <span className={`h-5 font-display text-base font-bold leading-5 ${elegido === ch ? 'underline decoration-red decoration-2' : ''}`}>
                    {asignaciones[ch] ?? ''}
                  </span>
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
          {progreso.sello && (
            <p className="mt-2 font-display text-sm italic">
              Sello en su carnet: <strong className="not-italic">{SELLOS[progreso.sello].nombre}</strong>. El cupón vale uno por pedido y solo en esta edición.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Lista de símbolos: botones de 44 px, la forma cómoda de elegir con el pulgar */}
          <p className="mt-4 font-display text-[11px] font-bold uppercase tracking-[0.15em] text-print-muted">Símbolos</p>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {simbolos.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setElegido(s)}
                aria-pressed={elegido === s}
                aria-label={`Símbolo ${numero(s)}, ${asignaciones[s] ? `letra ${asignaciones[s]}` : 'sin letra'}`}
                className={`flex h-11 flex-col items-center justify-center border ${elegido === s ? 'border-2 border-red bg-print/10' : 'border-print/40'}`}
              >
                <Glifo id={s} className="size-5" />
                <span className="h-3.5 font-display text-xs font-bold leading-3.5">{asignaciones[s] ?? ''}</span>
              </button>
            ))}
          </div>

          {/* Teclado pegado abajo mientras se ve el Cifrado (sticky dentro de la sección), al alcance del pulgar */}
          {elegido ? (
            <div className="paper sticky bottom-0 z-10 -mx-3 mt-3 border-t-2 border-print px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div className="flex min-h-11 items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display text-sm">
                  <Glifo id={elegido} className="size-6" /> Símbolo {numero(elegido)}: elegí la letra
                </p>
                <button type="button" onClick={() => setElegido(null)} className="min-h-11 px-2 font-display text-sm underline">
                  Cerrar
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {LETRAS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => asignar(l)}
                    aria-label={letrasUsadas.has(l) && asignaciones[elegido] !== l ? `${l}, ya usada en otro símbolo` : l}
                    className={`h-11 border border-print/40 font-display text-lg font-bold ${letrasUsadas.has(l) ? 'text-print-muted line-through decoration-1' : ''}`}
                  >
                    {l}
                  </button>
                ))}
                <button type="button" onClick={() => asignar(null)} aria-label="Borrar letra" className="h-11 border border-print/40 font-display text-lg">
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
