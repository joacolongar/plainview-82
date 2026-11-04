import '@google/model-viewer' // registra la etiqueta <model-viewer>
import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { Modelo3D } from '../data/products'
import { NumeroErrata } from './FeDeErratas'
import { IconoGiro } from './Lamina'

// <model-viewer> (de Google) es un web component: una etiqueta HTML nueva, con three.js adentro. React 19 le pasa los
// atributos tal cual. Acá se le dice a TypeScript que la etiqueta existe (adentro de "declare module 'react'", los tipos
// DetailedHTMLProps y HTMLAttributes son los de React)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<ModelViewerElement>, ModelViewerElement> & Record<string, unknown>
    }
  }
}

// El decodificador de Draco (la malla viene comprimida) sale de nuestro sitio, no del CDN de Google: la CSP solo deja
// cargar lo propio. Son los archivos de three/examples/jsm/libs/draco/gltf/, copiados en public/3d/draco/.
// Ojo: model-viewer no lo lee de la clase sino de un objeto global, self.ModelViewerElement, cada vez que carga un modelo
const global = self as unknown as { ModelViewerElement?: Record<string, unknown> }
global.ModelViewerElement = { ...global.ModelViewerElement, dracoDecoderLocation: '/3d/draco/' }

type Vista = 'frente' | 'espalda' | 'detalle'
const NOMBRES: Record<Vista, string> = { frente: 'Vista frontal', espalda: 'Vista de espalda', detalle: 'Vista de cerca' }
const INCLINACION = 80 // grados desde arriba: de frente, apenas desde arriba (90 = a la altura del pecho)
const CERCA = 0.55 // DETALLE: la cámara a esta fracción de la distancia de la remera entera (entra la estampa)

type Props = { modelo: Modelo3D; glb: string; alCambiarVista: (texto: string) => void; alFallar: () => void }

/**
 * El visor de la remera en 3D (la última figura de la lámina, docs/ficha-3d/FICHA-3D.md).
 * - Luz: la misma de los renders de Blender (public/3d/estudio.hdr, de scripts/blender/estudio.py) con la curva
 *   "neutral", y una sombra suave de contacto debajo.
 * - Se gira arrastrando: con el mouse, 360° en horizontal y la inclinación limitada (se ven el cuello y el ruedo,
 *   sin darla vuelta). En el celular, touch-action pan-y: deslizar en vertical scrollea la página y en horizontal
 *   gira la remera. La ruedita no hace zoom (no traba el scroll): se acerca con DETALLE o pellizcando.
 * - Al abrir, una vuelta lenta y se detiene (con movimiento reducido, quieta).
 * - Los puntos de la Fe de erratas van anclados al modelo y se esconden cuando su cara no mira a la cámara.
 */
export default function Visor3D({ modelo, glb, alCambiarVista, alFallar }: Props) {
  const visor = useRef<ModelViewerElement>(null)
  const marco = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState<Vista>('frente')
  const [listo, setListo] = useState(false)
  const [tocado, setTocado] = useState(false)
  const [nota, setNota] = useState<number | null>(null)
  const pedidos = useRef(0)
  const distancia = useRef(1) // la distancia a la que entra la remera entera (la "auto" de model-viewer)

  useEffect(() => {
    const mv = visor.current
    const m = marco.current
    if (!mv || !m) return
    const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches
    let cuadro = 0

    // La vuelta de entrada gira la remera sobre sí misma (auto-rotate). Al terminar, o si la persona la toca, ese giro
    // se pasa a la cámara: la imagen queda igual y FRENTE / ESPALDA vuelven a apuntar bien
    const fijarGiro = () => {
      cancelAnimationFrame(cuadro)
      const giro = mv.turntableRotation
      mv.autoRotate = false
      if (!giro) return
      const o = mv.getCameraOrbit()
      mv.resetTurntableRotation(0)
      mv.cameraOrbit = `${o.theta - giro}rad ${o.phi}rad ${o.radius}m`
      mv.jumpCameraToGoal()
    }
    const vigilarVuelta = () => {
      if (mv.turntableRotation >= 2 * Math.PI) fijarGiro()
      else cuadro = requestAnimationFrame(vigilarVuelta)
    }
    const alCargar = () => {
      distancia.current = mv.getCameraOrbit().radius
      setListo(true)
      if (!reducido) {
        mv.autoRotate = true
        vigilarVuelta()
      }
    }
    const alMoverCamara = (e: Event) => {
      if ((e as CustomEvent<{ source: string }>).detail.source !== 'user-interaction') return
      setTocado(true)
      if (mv.autoRotate) fijarGiro()
    }
    // La ruedita: se corta antes de que llegue al visor (fase de captura). Sin preventDefault, la página scrollea
    const sinRuedita = (e: WheelEvent) => e.stopPropagation()

    mv.addEventListener('load', alCargar)
    mv.addEventListener('error', alFallar)
    mv.addEventListener('camera-change', alMoverCamara)
    m.addEventListener('wheel', sinRuedita, { capture: true, passive: true })
    return () => {
      cancelAnimationFrame(cuadro)
      mv.removeEventListener('load', alCargar)
      mv.removeEventListener('error', alFallar)
      mv.removeEventListener('camera-change', alMoverCamara)
      m.removeEventListener('wheel', sinRuedita, { capture: true })
    }
  }, [alFallar])

  function ir(v: Vista) {
    const mv = visor.current
    if (!mv) return
    if (mv.autoRotate || mv.turntableRotation) {
      mv.autoRotate = false
      mv.resetTurntableRotation(0)
    }
    // La cámara puede venir de varias vueltas: se elige el ángulo equivalente más cercano, así no da vueltas de más
    const actual = (mv.getCameraOrbit().theta * 180) / Math.PI
    const destino = v === 'espalda' ? 180 : 0
    // Un pelito distinto cada vez: si el valor no cambia, model-viewer no mueve la cámara (y quizás la giraron a mano)
    const theta = destino + 360 * Math.round((actual - destino) / 360) + (pedidos.current++ % 2) * 0.001
    const [x, y, z] = modelo.detalle
    mv.cameraOrbit = v === 'detalle' ? `${theta}deg 88deg ${distancia.current * CERCA}m` : `${theta}deg ${INCLINACION}deg auto`
    mv.cameraTarget = v === 'detalle' ? `${x}m ${y}m ${z}m` : 'auto auto auto'
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) mv.jumpCameraToGoal()
    setVista(v)
    setNota(null)
    alCambiarVista(NOMBRES[v])
  }

  const abierta = nota === null ? null : modelo.puntos[nota]

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={marco} className="visor-fondo relative min-h-0 flex-1">
        <model-viewer
          ref={visor}
          src={glb}
          alt="La remera en 3D. Se gira arrastrando; los números marcan las erratas de la estampa"
          environment-image="/3d/estudio.hdr"
          tone-mapping="neutral"
          // 1,1 y no 1: medido contra el render de Blender con la misma cámara y luz, el visor sale un poco más oscuro
          // (filtra el entorno de otra manera). Con 1,1 coinciden: cian 34·212·228 en la web y 35·212·228 en Blender
          // Número y no texto: si el elemento tiene una propiedad con ese nombre, React 19 le pasa la propiedad (no el
          // atributo), y model-viewer la quiere numérica. Los nombres con guiones van como atributos (texto)
          exposure={1.1}
          shadow-intensity="1"
          shadow-softness="0.9"
          camera-controls
          touch-action="pan-y"
          disable-pan
          disable-tap
          interaction-prompt="none"
          camera-orbit={`0deg ${INCLINACION}deg auto`}
          min-camera-orbit="-Infinity 60deg 0.45m"
          max-camera-orbit="Infinity 110deg auto"
          rotation-per-second="45deg"
          auto-rotate-delay="0"
          interpolation-decay="120"
          class="block size-full"
        >
          {/* Sin la barra de carga de model-viewer: el aviso de carga es nuestro */}
          <div slot="progress-bar" />
          {/* Sin la mira del paneo: es un punto invisible de 6 px justo en el centro que se queda con el toque, y un
              arrastre que empieza ahí no gira la remera (y acá no hay paneo) */}
          <div slot="pan-target" className="pointer-events-none" />
          {modelo.puntos.map((punto, i) => (
            <button
              key={i}
              slot={`hotspot-${i + 1}`}
              data-position={punto.posicion.map((n) => `${n}m`).join(' ')}
              data-normal={punto.normal.map((n) => `${n}m`).join(' ')}
              // model-viewer le pone data-visible cuando su cara mira a la cámara (index.css esconde los demás)
              data-visibility-attribute="visible"
              onClick={() => setNota(nota === i ? null : i)}
              aria-label={`Errata ${i + 1}: donde dice «${punto.dice}»`}
              aria-expanded={nota === i}
              className="punto-3d flex size-11 items-center justify-center rounded-full"
            >
              <span className="rounded-full ring-4 ring-red/30">
                <NumeroErrata n={i + 1} />
              </span>
            </button>
          ))}
        </model-viewer>

        {!listo && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-sm italic text-print-muted">
            Revelando la figura…
          </span>
        )}
        {listo && !tocado && (
          <span className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 bg-print/85 px-3 py-1.5 font-display text-sm italic whitespace-nowrap text-paper">
            <IconoGiro /> Arrastrá para girarla
          </span>
        )}
        {abierta && nota !== null && (
          <div role="status" className="absolute inset-x-2 top-2 flex items-start gap-2 border-2 border-print bg-paper p-2 pl-3 shadow-lg">
            <p className="flex-1 font-display text-[15px] leading-snug">
              <span className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em]">
                Fe de erratas <NumeroErrata n={nota + 1} />
              </span>
              Donde dice «{abierta.dice}», debió decir «{abierta.debio}».
            </p>
            <button onClick={() => setNota(null)} aria-label="Cerrar la nota" className="flex size-11 shrink-0 items-center justify-center text-xl">
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 border-t-2 border-print">
        {(['frente', 'espalda', 'detalle'] as const).map((v) => (
          <button
            key={v}
            onClick={() => ir(v)}
            aria-pressed={vista === v}
            className={`min-h-11 border-print font-headline text-[15px] uppercase tracking-[0.12em] [&+&]:border-l-2 ${vista === v ? 'bg-print text-paper' : 'bg-paper'}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
