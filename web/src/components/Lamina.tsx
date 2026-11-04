import { lazy, Suspense, useCallback, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import type { Foto } from '../data/fotos'
import type { Product } from '../data/products'
import type { ControlVisor, Vista } from './Visor3D'

// El visor 3D va en su propio archivo JS (con model-viewer y three adentro): se descarga después de la página
const Visor3D = lazy(() => import('./Visor3D'))

/** Lo que la página le puede pedir a la lámina: la lista de la Fe de erratas pide ver de cerca el punto N (0 = el 1) */
export type ControlLamina = { verPunto: (punto: number) => void }

/**
 * La lámina del aviso (docs/ficha-3d/FICHA-3D.md): las figuras numeradas de un diario. Si la remera tiene modelo, la
 * Fig. 1 es la remera en 3D; después, las fotos.
 * - La Fig. 1 arranca con la imagen fija del frente (render de Blender con la misma cámara y luz): es lo primero que se
 *   ve y lo que mide el navegador para la primera pantalla. El visor se baja con el primer gesto de la persona, y cuando
 *   el modelo está dibujado la imagen se va con un fundido (sin fundido, con movimiento reducido). Sin WebGL, o si el modelo o su textura no cargan, la imagen fija queda como Fig. 1, sin visor.
 * - Las fotos van en una tira con scroll horizontal y "snap": en el celular se desliza con el dedo, sin JavaScript para
 *   el gesto; en la compu se eligen en la tira de figuras o con ← → cuando la lámina tiene el foco.
 * - La tira de figuras va debajo del marco en el celular (4 columnas) y a la izquierda en la compu.
 * - El pie cambia con la figura: en las fotos con alguien, quién es, cuánto mide y qué talle usa (para comprar).
 * - verPunto (por `ref`): la lista de la Fe de erratas pide ver un punto de cerca: se elige la Fig. 1, la página sube
 *   hasta la lámina y el visor se acerca (si todavía no cargó, apenas esté listo).
 * Lleva data-no-swipe: deslizar una foto o girar la remera no pasa de página.
 * `children` es lo que va encima de las fotos (la ambientación); sobre el 3D no cae nada.
 */
type Props = {
  ref?: Ref<ControlLamina>
  p: Product
  fotos: Foto[]
  color: string
  epigrafe: string
  /** Avisa si hay 3D de verdad (la lista de la Fe de erratas se puede tocar solo si lo hay) */
  alSaberSi3d?: (hay: boolean) => void
  children?: ReactNode
}

export default function Lamina({ ref, p, fotos: todas, color, epigrafe, alSaberSi3d, children }: Props) {
  // Si hay fotos de cada color, las del color elegido
  const delColor = todas.filter((f) => f.color === color)
  const fotos = delColor.length > 0 ? delColor : todas
  const modelo = p.modelo3d
  const delModelo = modelo ? (modelo.colores[color] ?? Object.values(modelo.colores)[0]) : undefined
  // Sin WebGL (o si el modelo falla) queda la imagen fija. WebGL se prueba recién al cargar el visor: crear un contexto
  // al dibujar la página por primera vez la demora (en un celular lento, cientos de ms antes de mostrar la imagen)
  const [fallo, setFallo] = useState(false)
  const puede3d = !!delModelo && !fallo
  const base = delModelo ? 1 : 0 // la Fig. 1 es la del 3D (o su imagen fija); las fotos, desde la 2
  const total = fotos.length + base
  const [actual, setActual] = useState(0)
  const es3d = base === 1 && actual === 0
  const [cargar, setCargar] = useState(false)
  const [listo, setListo] = useState(false)
  const [vista, setVista] = useState<{ v: Vista | null; texto: string }>({ v: 'frente', texto: 'Vista frontal' })
  const control = useRef<ControlVisor>(null)
  const tira = useRef<HTMLDivElement>(null)
  const raiz = useRef<HTMLElement>(null)
  const pendiente = useRef<number | null>(null) // un punto pedido antes de que el visor estuviera listo

  useEffect(() => alSaberSi3d?.(puede3d), [alSaberSi3d, puede3d])

  // El visor se baja con el primer gesto de la persona (tocar, scrollear, mover el mouse o una tecla), no solo: armar el
  // 3D es mucho trabajo (en un celular sin buena GPU, segundos) y si arranca con la página la frena (Lighthouse en
  // celular bajaba de 94 a 44). Mientras tanto se ve la imagen fija, que es igual a la primera vista del 3D
  useEffect(() => {
    if (!puede3d) return
    const GESTOS = ['pointerdown', 'pointermove', 'touchstart', 'scroll', 'wheel', 'keydown'] as const
    const empezar = () => {
      for (const g of GESTOS) removeEventListener(g, empezar)
      if (!hayWebGL()) return setFallo(true)
      // Si el navegador está ocupado, cuando se libere (Safari no tiene requestIdleCallback: un ratito después)
      if ('requestIdleCallback' in window) requestIdleCallback(() => setCargar(true), { timeout: 500 })
      else setTimeout(() => setCargar(true), 50)
    }
    for (const g of GESTOS) addEventListener(g, empezar, { once: true, passive: true })
    return () => {
      for (const g of GESTOS) removeEventListener(g, empezar)
    }
  }, [puede3d])

  // Un punto pedido desde la lista: a la Fig. 1, la página sube hasta la lámina y el visor se acerca (apenas pueda)
  function verPunto(punto: number) {
    if (!puede3d) return
    setActual(0)
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches
    raiz.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })
    if (listo && control.current) return control.current.acercar(punto)
    if (!cargar && !hayWebGL()) return setFallo(true)
    pendiente.current = punto
    setCargar(true)
  }
  useImperativeHandle(ref, () => ({ verPunto }))

  // Al volver del 3D a una foto, la tira se acomoda en esa foto (sin animación: estaba oculta)
  useEffect(() => {
    if (!es3d) tira.current?.scrollTo({ left: (actual - base) * tira.current.clientWidth })
  }, [es3d, actual, base])

  const alListo = useCallback(() => {
    setListo(true)
    if (pendiente.current !== null) control.current?.acercar(pendiente.current)
    pendiente.current = null
  }, [])
  const alFallar = useCallback(() => {
    setFallo(true)
    setListo(false)
  }, [])
  const alCambiarVista = useCallback((v: Vista | null, texto: string) => setVista({ v, texto }), [])

  function ir(i: number) {
    const destino = Math.max(0, Math.min(total - 1, i))
    const t = tira.current
    if (destino < base || !t || es3d) return setActual(destino)
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches
    t.scrollTo({ left: (destino - base) * t.clientWidth, behavior: suave ? 'smooth' : 'auto' })
  }

  function teclas(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault() // las flechas mueven las fotos, no la página
    ir(actual + (e.key === 'ArrowRight' ? 1 : -1))
  }

  const foto = fotos[actual - base]
  const pie = es3d
    ? puede3d
      ? `${vista.texto}. Arrastrá para girarla; tocá los números.`
      : 'La remera de frente.'
    : foto?.lector
      ? lector(foto.lector)
      : actual === base
        ? epigrafe
        : foto?.alt

  return (
    <figure ref={raiz} data-no-swipe aria-roledescription="lámina" aria-label="Figuras de la remera" className="scroll-mt-2 md:grid md:grid-cols-[4.5rem_1fr] md:gap-3">
      <div className="md:col-start-2">
        <div className="relative aspect-[4/5] border-2 border-print">
          {delModelo && (
            <div className={`absolute inset-0 flex flex-col ${es3d ? '' : 'hidden'}`}>
              <div className="visor-fondo relative min-h-0 flex-1 overflow-clip">
                {puede3d && cargar && (
                  <Suspense fallback={null}>
                    <Visor3D ref={control} key={color} modelo={modelo!} glb={delModelo.glb} alListo={alListo} alFallar={alFallar} alCambiarVista={alCambiarVista} />
                  </Suspense>
                )}
                {/* La imagen fija del frente: misma cámara que el 3D y recortada igual (cover: llena el alto y recorta
                    los costados), así el cambio no salta. Encima del visor hasta que está listo */}
                <img
                  src={delModelo.frente}
                  alt={puede3d && listo ? '' : 'La remera de frente'}
                  width={900}
                  height={900}
                  fetchPriority="high"
                  draggable={false}
                  className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${puede3d && listo ? 'opacity-0' : ''}`}
                />
              </div>
              {/* La barra está desde el principio (apagada hasta que el visor está listo): el marco no cambia de forma */}
              {puede3d && (
                <div className="grid grid-cols-3 border-t-2 border-print">
                  {(['frente', 'espalda', 'detalle'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => control.current?.ir(v)}
                      disabled={!listo}
                      aria-pressed={vista.v === v}
                      className={`min-h-11 border-print font-headline text-[15px] uppercase tracking-[0.12em] disabled:opacity-60 [&+&]:border-l-2 ${vista.v === v ? 'bg-print text-paper' : 'bg-paper'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {fotos.length > 0 && (
            <div className={`size-full ${es3d ? 'hidden' : ''}`}>
              <div
                ref={tira}
                // Cuál se ve: la que ocupa la mayor parte de la tira
                onScroll={(e) => setActual(base + Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
                onKeyDown={total > 1 ? teclas : undefined}
                tabIndex={total > 1 ? 0 : undefined}
                className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {fotos.map((f, i) => (
                  <div key={f.src} className="relative size-full shrink-0 snap-center" aria-label={`Fig. ${i + base + 1} de ${total}`}>
                    <img
                      src={f.src}
                      alt={f.alt}
                      // Sin 3D, la primera foto está en la primera pantalla: carga ya. Las demás, cuando se acercan
                      loading={i === 0 && !base ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 && !base ? 'high' : 'auto'}
                      draggable={false}
                      className="size-full object-cover"
                    />
                    {p.fotoBoceto && <SelloBoceto />}
                  </div>
                ))}
              </div>
              {children}
            </div>
          )}
        </div>
        <figcaption className="mt-1 font-display text-sm italic leading-snug text-print-muted" aria-live="polite">
          <span className="font-bold not-italic text-print">Fig. {actual + 1}</span> — {pie}
        </figcaption>
      </div>

      {/* La tira de figuras: cada una es un botón de al menos 44 px */}
      {total > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2 md:col-start-1 md:row-start-1 md:mt-0 md:flex md:flex-col">
          {delModelo && (
            <Figura n={1} elegida={es3d} onClick={() => ir(0)} oscura={puede3d} etiqueta={puede3d ? 'en 3D' : 'de frente'}>
              {puede3d ? (
                <span className="flex size-full flex-col items-center justify-center gap-0.5 text-paper">
                  <span className="self-end pr-1 font-headline text-xs tracking-wider">360°</span>
                  <IconoRemera />
                </span>
              ) : (
                <img src={delModelo.frente} alt="" loading="lazy" className="size-full object-cover" />
              )}
            </Figura>
          )}
          {fotos.map((f, i) => (
            <Figura key={f.src} n={i + base + 1} elegida={i + base === actual} onClick={() => ir(i + base)}>
              <img src={f.src} alt="" loading="lazy" className="size-full object-cover" />
            </Figura>
          ))}
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

/** "Fig. 2 — El lector Tomás mide 1,80 m y usa talle M." (quién lo escribe el dueño en products.ts) */
function lector(l: NonNullable<Foto['lector']>) {
  return `${l.quien} mide ${l.altura.toLocaleString('es-AR', { minimumFractionDigits: 2 })} m y usa talle ${l.talle}.`
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
