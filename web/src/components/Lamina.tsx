import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Foto } from '../data/fotos'
import type { Product } from '../data/products'

// El visor 3D va en su propio archivo JS (con model-viewer y three adentro): se descarga recién al elegir la figura
const Visor3D = lazy(() => import('./Visor3D'))

/**
 * La lámina del aviso (docs/ficha-3d/FICHA-3D.md): las figuras numeradas de un diario. Primero las fotos, que son
 * lo que vende; al final, si la remera tiene modelo, la figura en 3D para el que quiere mirar de cerca.
 * - Las fotos van en una tira con scroll horizontal y "snap": en el celular se desliza con el dedo, sin JavaScript para
 *   el gesto; en la compu se eligen en la tira de figuras o con ← → cuando la lámina tiene el foco.
 * - La tira de figuras va debajo del marco en el celular (4 columnas) y a la izquierda en la compu.
 * - El pie cambia con la figura: en las fotos con alguien, quién es, cuánto mide y qué talle usa (para comprar).
 * - Sin WebGL (o si falla la carga del modelo) no aparecen la figura 3D ni el sello GIRALA: quedan las fotos.
 * Lleva data-no-swipe: deslizar una foto o girar la remera no pasa de página.
 * `children` es lo que va encima de las fotos (la ambientación); sobre el 3D no cae nada.
 */
type Props = { p: Product; fotos: Foto[]; color: string; epigrafe: string; children?: ReactNode }

export default function Lamina({ p, fotos: todas, color, epigrafe, children }: Props) {
  // Si hay fotos de cada color, las del color elegido
  const delColor = todas.filter((f) => f.color === color)
  const fotos = delColor.length > 0 ? delColor : todas
  const [webgl] = useState(hayWebGL)
  const [fallo, setFallo] = useState(false)
  const con3d = !!p.modelo3d && webgl && !fallo
  const total = fotos.length + (con3d ? 1 : 0)
  const fig3d = con3d ? fotos.length : -1 // índice de la figura 3D
  const [actual, setActual] = useState(0)
  const [vista, setVista] = useState('Vista frontal')
  const tira = useRef<HTMLDivElement>(null)
  const es3d = actual === fig3d

  // Al volver del 3D a una foto, la tira se acomoda en esa foto (sin animación: ya estaba oculta)
  useEffect(() => {
    if (!es3d) tira.current?.scrollTo({ left: actual * tira.current.clientWidth })
  }, [es3d, actual])

  function ir(i: number) {
    const destino = Math.max(0, Math.min(total - 1, i))
    const t = tira.current
    if (destino === fig3d || !t || es3d) return setActual(destino)
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    t.scrollTo({ left: destino * t.clientWidth, behavior: suave ? 'smooth' : 'auto' })
  }

  function teclas(e: KeyboardEvent) {
    if (es3d || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault() // las flechas mueven las fotos, no la página
    ir(actual + (e.key === 'ArrowRight' ? 1 : -1))
  }

  const foto = fotos[actual]
  const pie = es3d ? `${vista}. Arrastrá para girarla; tocá los números.` : foto?.lector ? lector(foto.lector) : actual === 0 ? epigrafe : foto?.alt

  return (
    <figure data-no-swipe aria-roledescription="lámina" aria-label="Figuras de la remera" className="md:grid md:grid-cols-[4.5rem_1fr] md:gap-3">
      <div className="md:col-start-2">
        <div className="relative aspect-[4/5] border-2 border-print">
          {es3d && p.modelo3d ? (
            <Suspense fallback={<Revelando />}>
              <Visor3D
                key={color}
                modelo={p.modelo3d}
                glb={p.modelo3d.glb[color] ?? Object.values(p.modelo3d.glb)[0]}
                alCambiarVista={setVista}
                alFallar={() => {
                  setFallo(true)
                  setActual(0)
                }}
              />
            </Suspense>
          ) : (
            <>
              <div
                ref={tira}
                // Cuál se ve: la que ocupa la mayor parte de la tira
                onScroll={(e) => setActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
                onKeyDown={fotos.length > 1 ? teclas : undefined}
                tabIndex={fotos.length > 1 ? 0 : undefined}
                className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {fotos.map((f, i) => (
                  <div key={f.src} className="relative size-full shrink-0 snap-center" aria-label={`Fig. ${i + 1} de ${total}`}>
                    <img
                      src={f.src}
                      alt={f.alt}
                      // La principal está en la primera pantalla: carga ya. Las demás, cuando se acercan
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      draggable={false}
                      className="size-full object-cover"
                    />
                    {p.fotoBoceto && <SelloBoceto />}
                  </div>
                ))}
              </div>
              {children}
              {con3d && (
                <button
                  onClick={() => setActual(fig3d)}
                  className="absolute right-2 bottom-2 flex min-h-11 items-center gap-2 border-2 border-paper bg-print px-3 font-headline text-[19px] tracking-[0.12em] text-paper outline-2 outline-print"
                >
                  <IconoGiro /> GIRALA
                </button>
              )}
            </>
          )}
        </div>
        <figcaption className="mt-1 font-display text-sm italic leading-snug text-print-muted" aria-live="polite">
          <span className="font-bold not-italic text-print">Fig. {actual + 1}</span> — {pie}
        </figcaption>
      </div>

      {/* La tira de figuras: cada una es un botón de al menos 44 px */}
      {total > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2 md:col-start-1 md:row-start-1 md:mt-0 md:flex md:flex-col">
          {fotos.map((f, i) => (
            <Figura key={f.src} n={i + 1} elegida={i === actual} onClick={() => ir(i)}>
              <img src={f.src} alt="" loading="lazy" className="size-full object-cover" />
            </Figura>
          ))}
          {con3d && (
            <Figura n={fig3d + 1} elegida={es3d} onClick={() => setActual(fig3d)} oscura etiqueta="en 3D">
              <span className="flex size-full flex-col items-center justify-center gap-0.5 text-paper">
                <span className="self-end pr-1 font-headline text-xs tracking-wider">360°</span>
                <IconoRemera />
              </span>
            </Figura>
          )}
        </div>
      )}
    </figure>
  )
}

function Figura({ n, elegida, onClick, oscura = false, etiqueta, children }: { n: number; elegida: boolean; onClick: () => void; oscura?: boolean; etiqueta?: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Ver la figura ${n}${etiqueta ? ` ${etiqueta}` : ''}`}
      aria-current={elegida}
      className={`relative aspect-square min-h-11 w-full p-0.5 ${elegida ? 'border-2 border-print outline-2 outline-offset-2 outline-print' : 'border border-print/30 hover:border-print'} ${oscura ? 'bg-print' : ''}`}
    >
      {children}
      <span className={`absolute bottom-0.5 left-1 font-display text-[9px] font-bold uppercase tracking-[0.15em] ${oscura ? 'text-paper' : 'bg-paper/85 px-0.5 text-print'}`}>Fig. {n}</span>
    </button>
  )
}

/** "Fig. 1 — El lector Tomás mide 1,80 m y usa talle M." (quién lo escribe el dueño en products.ts) */
function lector(l: NonNullable<Foto['lector']>) {
  return `${l.quien} mide ${l.altura.toLocaleString('es-AR', { minimumFractionDigits: 2 })} m y usa talle ${l.talle}.`
}

/** Mientras baja el visor (la primera vez, unos 300 KB) */
function Revelando() {
  return (
    <div className="visor-fondo flex size-full items-center justify-center">
      <span className="font-display text-sm italic text-print-muted">Revelando la figura…</span>
    </div>
  )
}

/** Hay WebGL si el navegador da un contexto: se pide una vez y se suelta enseguida */
function hayWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch {
    return false
  }
}

/** Sello de goma en una esquina: la foto es un boceto, no la remera terminada */
function SelloBoceto() {
  return (
    <span className="pointer-events-none absolute top-2 right-2 -rotate-6 border-2 border-red bg-paper/85 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.15em] text-print">
      Prueba de imprenta
    </span>
  )
}

export function IconoGiro() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" />
      <path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2" />
    </svg>
  )
}

function IconoRemera() {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M11 4 4 8l2.5 5.5L9 12.5V28h14V12.5l2.5 1L28 8l-7-4c-.6 2-2.6 3.3-5 3.3S11.6 6 11 4Z" />
    </svg>
  )
}
