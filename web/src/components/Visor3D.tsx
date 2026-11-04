import '@google/model-viewer' // registra la etiqueta <model-viewer>
import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import CAMARA from '../data/camara3d.json'
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

export type Vista = 'frente' | 'espalda' | 'detalle'
const NOMBRES: Record<Vista, string> = { frente: 'Vista frontal', espalda: 'Vista de espalda', detalle: 'Vista de cerca' }
/** Lo que la lámina (los botones de abajo y la lista de la Fe de erratas) le puede pedir al visor */
export type ControlVisor = { ir: (v: Vista) => void; acercar: (punto: number) => void }

// La cámara del frente es fija (src/data/camara3d.json) y la misma con la que Blender hace la imagen fija del frente:
// así, cuando el 3D reemplaza a la imagen, no salta nada
const [OX, OY, OZ] = CAMARA.objetivo
const OBJETIVO = `${OX}m ${OY}m ${OZ}m`
const RADIO_DETALLE = CAMARA.radio * 0.55 // DETALLE y el punto 1: entra la estampa principal entera (43 cm)
const RADIO_PUNTO = CAMARA.radio * 0.32 // los demás puntos: estampas chicas (el zócalo, el 8:2, la frase)
const DE_FRENTE = 88 // inclinación al acercarse: casi a la altura de la estampa
const BAJO_LA_NOTA = 0.04 // en un punto, la cámara mira 4 cm más arriba: la estampa queda debajo de la nota abierta

type Props = {
  ref?: Ref<ControlVisor>
  modelo: Modelo3D
  glb: string
  alListo: () => void
  alFallar: () => void
  /** La vista actual (null: de cerca en un punto) y su texto para el pie de la figura */
  alCambiarVista: (vista: Vista | null, texto: string) => void
}

const grados = (rad: number) => (rad * 180) / Math.PI

/** Espera a que la cámara llegue a `destino` (en grados) o 1,5 s, por las dudas */
function llegar(mv: ModelViewerElement, destino: number) {
  const inicio = performance.now()
  return new Promise<void>((ok) => {
    const mirar = () => {
      if (Math.abs(grados(mv.getCameraOrbit().theta) - destino) < 1 || performance.now() - inicio > 1500) ok()
      else requestAnimationFrame(mirar)
    }
    mirar()
  })
}
const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * El visor de la remera en 3D: la Fig. 1 de la lámina (docs/ficha-3d/FICHA-3D.md). Mientras carga, la lámina muestra
 * encima la imagen fija del frente (Lamina.tsx); cuando el modelo está dibujado, avisa con alListo.
 * - Luz: la misma de los renders de Blender (public/3d/estudio.hdr, de scripts/blender/estudio.py) con la curva
 *   "neutral", y una sombra suave de contacto debajo.
 * - Se gira arrastrando: con el mouse, 360° en horizontal y la inclinación limitada (se ven el cuello y el ruedo,
 *   sin darla vuelta). En el celular, touch-action pan-y: deslizar en vertical scrollea la página y en horizontal
 *   gira la remera. La ruedita no hace zoom (no traba el scroll): se acerca con DETALLE, con los números o pellizcando.
 * - Al tocar un número, la cámara va hasta su estampa y se abre la nota; si está del otro lado, primero gira.
 *   VER ENTERA (o cerrar la nota) vuelve a la remera entera. Con movimiento reducido, la cámara salta.
 * - Al aparecer, una vuelta lenta y se detiene (con movimiento reducido, quieta).
 * - Si el modelo no carga, o carga sin su textura (la remera saldría lisa), avisa con alFallar: queda la imagen fija.
 */
export default function Visor3D({ ref, modelo, glb, alListo, alFallar, alCambiarVista }: Props) {
  const visor = useRef<ModelViewerElement>(null)
  const marco = useRef<HTMLDivElement>(null)
  const [listo, setListo] = useState(false)
  const [tocado, setTocado] = useState(false)
  const [nota, setNota] = useState<number | null>(null)
  const pedidos = useRef(0) // cuenta cada movimiento pedido (ver mover)
  const pararGiro = useRef(() => {})

  useEffect(() => {
    const mv = visor.current
    const m = marco.current
    if (!mv || !m) return
    let cuadro = 0
    let espera = 0

    // La vuelta de entrada gira la remera sobre sí misma (auto-rotate). Al terminar, o si la persona la toca, ese giro
    // se pasa a la cámara: la imagen queda igual y FRENTE / ESPALDA vuelven a apuntar bien
    const fijarGiro = () => {
      cancelAnimationFrame(cuadro)
      clearTimeout(espera)
      const giro = mv.turntableRotation
      mv.autoRotate = false
      if (!giro) return
      const o = mv.getCameraOrbit()
      mv.resetTurntableRotation(0)
      mv.cameraOrbit = `${o.theta - giro}rad ${o.phi}rad ${o.radius}m`
      mv.jumpCameraToGoal()
    }
    pararGiro.current = fijarGiro
    const vigilarVuelta = () => {
      if (mv.turntableRotation >= 2 * Math.PI) fijarGiro()
      else cuadro = requestAnimationFrame(vigilarVuelta)
    }
    const alCargar = () => {
      // Sin textura (por ejemplo, si el navegador no la pudo leer) la remera saldría lisa: mejor la imagen fija
      const textura = mv.model?.materials[0]?.pbrMetallicRoughness.baseColorTexture?.texture?.source
      if (!textura) return alFallar()
      // Dos cuadros: el primero con el modelo ya dibujado. Recién ahí la lámina saca la imagen fija
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setListo(true)
          alListo()
          // La vuelta, cuando ya se fue la imagen fija (el fundido dura 0,3 s)
          if (!reducido()) espera = window.setTimeout(() => {
            mv.autoRotate = true
            vigilarVuelta()
          }, 400)
        }),
      )
    }
    const alMoverCamara = (e: Event) => {
      if ((e as CustomEvent<{ source: string }>).detail.source !== 'user-interaction') return
      setTocado(true)
      if (mv.autoRotate || mv.turntableRotation) fijarGiro()
    }
    // La ruedita: se corta antes de que llegue al visor (fase de captura). Sin preventDefault, la página scrollea
    const sinRuedita = (e: WheelEvent) => e.stopPropagation()

    mv.addEventListener('load', alCargar)
    mv.addEventListener('error', alFallar)
    mv.addEventListener('camera-change', alMoverCamara)
    m.addEventListener('wheel', sinRuedita, { capture: true, passive: true })
    return () => {
      cancelAnimationFrame(cuadro)
      clearTimeout(espera)
      mv.removeEventListener('load', alCargar)
      mv.removeEventListener('error', alFallar)
      mv.removeEventListener('camera-change', alMoverCamara)
      m.removeEventListener('wheel', sinRuedita, { capture: true })
    }
  }, [alListo, alFallar])

  /**
   * Mueve la cámara (model-viewer la lleva suave hasta ahí). La cámara puede venir de varias vueltas: se elige el
   * ángulo equivalente más cercano a `theta`, así no da vueltas de más. Devuelve el número de pedido: si llega otro
   * mientras se mueve, el anterior se abandona (ver acercar).
   */
  function mover(theta: number, phi: number, radio: number, objetivo: string) {
    const mv = visor.current!
    pararGiro.current()
    const actual = grados(mv.getCameraOrbit().theta)
    const destino = theta + 360 * Math.round((actual - theta) / 360)
    // Un pelito distinto cada vez: si el valor no cambia, model-viewer no mueve la cámara (y quizás la giraron a mano)
    mv.cameraOrbit = `${destino + (pedidos.current % 2) * 0.001}deg ${phi}deg ${radio}m`
    mv.cameraTarget = objetivo
    if (reducido()) mv.jumpCameraToGoal()
    return { pedido: ++pedidos.current, destino }
  }

  const cara = (theta: number) => (Math.abs(((((theta - 180) % 360) + 360) % 360) - 180) > 90 ? 180 : 0)

  function ir(v: Vista) {
    if (!visor.current) return
    const [x, y, z] = modelo.puntos[0]?.centro ?? CAMARA.objetivo
    if (v === 'detalle') mover(0, DE_FRENTE, RADIO_DETALLE, `${x}m ${y}m ${z}m`)
    else mover(v === 'espalda' ? 180 : 0, CAMARA.phi, CAMARA.radio, OBJETIVO)
    setNota(null)
    alCambiarVista(v, NOMBRES[v])
  }

  function verEntera() {
    const mv = visor.current
    if (!mv) return
    // De la cara que se está mirando (el punto 4 vuelve a la espalda entera)
    mover(cara(grados(mv.getCameraOrbit().theta)), CAMARA.phi, CAMARA.radio, OBJETIVO)
    setNota(null)
    alCambiarVista(null, 'La remera entera')
  }

  async function acercar(i: number) {
    const mv = visor.current
    const punto = modelo.puntos[i]
    if (!mv || !punto) return
    setTocado(true)
    setNota(i)
    alCambiarVista(null, `De cerca, la errata ${i + 1}`)
    const theta = punto.normal[2] < 0 ? 180 : 0 // la cara del punto: frente o espalda
    // Del otro lado: primero gira la remera entera y después se acerca
    if (cara(grados(mv.getCameraOrbit().theta)) !== theta) {
      const giro = mover(theta, CAMARA.phi, CAMARA.radio, OBJETIVO)
      await llegar(mv, giro.destino)
      if (giro.pedido !== pedidos.current) return // mientras giraba, se pidió otra cosa
    }
    const [x, y, z] = punto.centro
    mover(theta, DE_FRENTE, i === 0 ? RADIO_DETALLE : RADIO_PUNTO, `${x}m ${y + BAJO_LA_NOTA}m ${z}m`)
  }

  useImperativeHandle(ref, () => ({ ir, acercar }))

  const abierta = nota === null ? null : modelo.puntos[nota]

  return (
    <div ref={marco} className="absolute inset-0">
      <model-viewer
        ref={visor}
        src={glb}
        alt="La remera en 3D. Se gira arrastrando; los números marcan las erratas de la estampa"
        environment-image="/3d/estudio.hdr"
        tone-mapping="neutral"
        // 1,1 y no 1: medido contra el render de Blender con la misma cámara y luz, el visor sale un poco más oscuro
        // (filtra el entorno de otra manera). Con 1,1 coinciden: cian 34·212·228 en la web y 35·212·228 en Blender.
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
        camera-orbit={`${CAMARA.theta}deg ${CAMARA.phi}deg ${CAMARA.radio}m`}
        camera-target={OBJETIVO}
        field-of-view={`${CAMARA.fov}deg`}
        min-field-of-view={`${CAMARA.fov}deg`}
        max-field-of-view={`${CAMARA.fov}deg`}
        min-camera-orbit="-Infinity 60deg 0.45m"
        max-camera-orbit={`Infinity 110deg ${CAMARA.radio}m`}
        rotation-per-second="45deg"
        auto-rotate-delay="0"
        interpolation-decay="120"
        class="block size-full"
      >
        {/* Sin la barra de carga de model-viewer: mientras carga se ve la imagen fija */}
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
            onClick={() => (nota === i ? verEntera() : acercar(i))}
            aria-label={`Errata ${i + 1}: donde dice «${punto.dice}». Verla de cerca`}
            aria-expanded={nota === i}
            className="punto-3d flex size-11 items-center justify-center rounded-full"
          >
            <span className="rounded-full ring-4 ring-red/30">
              <NumeroErrata n={i + 1} />
            </span>
          </button>
        ))}
      </model-viewer>

      {listo && !tocado && (
        <span className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 bg-print/85 px-3 py-1.5 font-display text-sm italic whitespace-nowrap text-paper">
          <IconoGiro /> Arrastrá para girarla
        </span>
      )}
      {abierta && nota !== null && (
        <>
          <div role="status" className="absolute inset-x-2 top-2 flex items-start gap-2 border-2 border-print bg-paper p-2 pl-3 shadow-lg">
            <p className="flex-1 font-display text-[15px] leading-snug">
              <span className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em]">
                Fe de erratas <NumeroErrata n={nota + 1} />
              </span>
              Donde dice «{abierta.dice}», debió decir «{abierta.debio}».
            </p>
            <button onClick={verEntera} aria-label="Cerrar la nota y ver la remera entera" className="flex size-11 shrink-0 items-center justify-center text-xl">
              ✕
            </button>
          </div>
          <button
            onClick={verEntera}
            className="absolute right-2 bottom-2 min-h-11 border-2 border-paper bg-print px-3 font-headline text-[15px] tracking-[0.12em] text-paper outline-2 outline-print"
          >
            VER ENTERA
          </button>
        </>
      )}
    </div>
  )
}
