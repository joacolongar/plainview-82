import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Foto } from '../data/fotos'

/**
 * Galería de fotos del aviso. Una sola tira con scroll horizontal y "snap" (cada foto se acomoda sola al soltar):
 * en el celular se desliza con el dedo, sin JavaScript para el gesto; en la compu se elige con las miniaturas
 * o con ← → cuando la galería tiene el foco. Lleva data-no-swipe para que deslizar una foto no pase de página.
 * Con `boceto`, cada foto lleva el sello "Prueba de imprenta". `marco` son las clases del recuadro (el filete del
 * grabado) y `children` lo que va encima de las fotos, dentro del recuadro (la ambientación).
 */
type Props = { fotos: Foto[]; boceto?: boolean; marco: string; children?: ReactNode }

export default function Galeria({ fotos, boceto = false, marco, children }: Props) {
  const tira = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)
  const varias = fotos.length > 1

  function ir(i: number) {
    const t = tira.current
    if (!t) return
    const destino = Math.max(0, Math.min(fotos.length - 1, i))
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    t.scrollTo({ left: destino * t.clientWidth, behavior: suave ? 'smooth' : 'auto' })
  }

  function teclas(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault() // las flechas mueven las fotos, no la página
    ir(actual + (e.key === 'ArrowRight' ? 1 : -1))
  }

  return (
    <div data-no-swipe onKeyDown={varias ? teclas : undefined} aria-roledescription="galería" aria-label="Fotos de la remera">
      <div className={`relative ${marco}`}>
        <div
          ref={tira}
          // Cuál se ve: la que ocupa la mayor parte de la tira
          onScroll={(e) => setActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          tabIndex={varias ? 0 : undefined}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {fotos.map((f, i) => (
            <figure key={f.src} className="relative w-full shrink-0 snap-center" aria-label={varias ? `Foto ${i + 1} de ${fotos.length}` : undefined}>
              <img
                src={f.src}
                alt={f.alt}
                // La principal está en la primera pantalla: carga ya. Las demás, cuando se acercan
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                draggable={false}
                className="aspect-[5/4] w-full object-cover"
              />
              {boceto && <SelloBoceto />}
            </figure>
          ))}
        </div>
        {children}
      </div>

      {varias && (
        <>
          {/* Celular: puntos (cada uno es un botón de 44 px) */}
          <div className="flex justify-center md:hidden">
            {fotos.map((f, i) => (
              <button key={f.src} onClick={() => ir(i)} aria-label={`Ver foto ${i + 1}`} aria-current={i === actual} className="flex h-11 w-11 items-center justify-center">
                <span className={`block h-2.5 w-2.5 rounded-full border border-print ${i === actual ? 'bg-print' : ''}`} />
              </button>
            ))}
          </div>
          {/* Compu: miniaturas */}
          <div className="mt-2 hidden gap-2 md:flex">
            {fotos.map((f, i) => (
              <button
                key={f.src}
                onClick={() => ir(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual}
                className={`h-16 w-20 border-2 p-0.5 ${i === actual ? 'border-red' : 'border-print/30 hover:border-print'}`}
              >
                <img src={f.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Sello de goma en una esquina: la foto es un boceto, no la remera terminada */
function SelloBoceto() {
  return (
    <span className="pointer-events-none absolute top-2 right-2 -rotate-6 border-2 border-red bg-paper/85 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.15em] text-print">
      Prueba de imprenta
    </span>
  )
}
