import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import Home from '../pages/Home'
import { CLASES_HOJA } from './hoja'

type Props = {
  /** La hoja real de la portada, que ya está dibujada debajo: de ahí salen el tamaño y la posición final */
  hoja: RefObject<HTMLDivElement | null>
  alTerminar: () => void
}

/** Medidas de la entrada, en px de pantalla. El diario se dibuja a tamaño real y se achica con `scale` */
type Geo = {
  /** Dónde está la hoja real (y donde termina el diario abierto) */
  left: number
  top: number
  /** Ancho de la hoja real y alto de la hoja que se dobla (la primera pantalla, con proporción de diario) */
  W: number
  H: number
  /** Alto de la hoja real entera: la copia lo copia para que el papel (su viñeta) sea idéntico */
  altoReal: number
  /** Escala, posición y giro del diario cerrado; ty2: la posición abierto, re-centrado */
  s: number
  tx: number
  ty: number
  ty2: number
  rot: number
}

function medir(hoja: HTMLElement): Geo {
  const r = hoja.getBoundingClientRect()
  const vw = innerWidth
  const vh = innerHeight
  const movil = vw < 768
  const W = r.width
  // Cerrado: casi todo el ancho en el celular, unos 700 px en la compu, y que la mitad visible entre en pantalla
  const escala = (H: number) => Math.min(movil ? (vw - 24) / W : Math.min(700, vw * 0.58) / W, (vh * 0.62) / (H / 2))
  // La hoja que se dobla: al menos la primera pantalla y más alta que ancha, como un diario (nunca más que la real)
  let H = Math.min(r.height, Math.max(vh - r.top, W * (movil ? 1.7 : 1.3)))
  // …y con el titular de hoy entero arriba de la faja (va al 86 % o al 74 % de la mitad visible y mide 76 u 84 px de
  // pantalla). En el celular la cabecera es alta y un titular de tres renglones lo pide. El primer h2 es el titular
  const titular = hoja.querySelector('h2')?.getBoundingClientRect()
  if (titular) {
    const [lugar, alto] = movil ? [0.86, 76] : [0.74, 84]
    const mitad = (titular.bottom - r.top + alto / 2 / escala(H) + 16) / lugar
    H = Math.min(r.height, Math.max(H, 2 * mitad))
  }
  const s = escala(H)
  // El centro de la mitad visible va al centro de la pantalla
  const tx = vw / 2 - (W * s) / 2 - r.left
  const ty = vh / 2 + (movil ? 0 : 10) - (H * s) / 4 - r.top
  const ty2 = Math.max(vh / 2 - (H * s) / 2 - r.top, 12 - r.top)
  return { left: r.left, top: r.top, W, H, altoReal: r.height, s, tx, ty, ty2, rot: movil ? -1 : -2.5 }
}

/**
 * Posición del diario: se mueve y se achica desde su esquina, y gira alrededor del centro de la mitad visible
 * (el mismo punto sobre el que gira la faja, así quedan alineados). Siempre la misma lista de funciones:
 * el navegador interpola cada una por separado y el giro no se deforma.
 */
const ubicar = (g: Geo, x: number, y: number, s: number, rot: number) =>
  `translate(${x}px, ${y}px) scale(${s}) translate(${g.W / 2}px, ${g.H / 4}px) rotate(${rot}deg) translate(${-g.W / 2}px, ${-g.H / 4}px)`

const CURVA_ABRIR = 'cubic-bezier(.45, .05, .25, 1)'

/**
 * La entrada al sitio (docs/entrada/ENTRADA.md): la primera plana de hoy doblada al medio, con una faja roja que
 * solo tiene el botón INGRESAR. Al tocarlo, la faja se corta, el diario se despliega y se agranda hasta coincidir
 * con la página real, que está dibujada debajo desde el principio. Es una capa encima: si algo falla, queda el sitio.
 * - El diario son dos copias quietas de la portada real (<Home />), sin el giro del logo (index.css) y sin poder
 *   tocarse (inert). Se desmontan al terminar, junto con toda la capa.
 * - Las animaciones son de la Web Animations API (element.animate, del navegador, sin librerías), solo con
 *   transform y opacity. `await animacion.finished` espera a que termine cada paso.
 * - Con movimiento reducido: solo un fundido.
 */
export default function Entrada({ hoja, alTerminar }: Props) {
  const [geo, setGeo] = useState<Geo | null>(null)
  const [cortada, setCortada] = useState(false)
  const [teclado, setTeclado] = useState(false)
  const abriendo = useRef(false)
  const raiz = useRef<HTMLDivElement>(null)
  const diario = useRef<HTMLDivElement>(null)
  const abajo = useRef<HTMLDivElement>(null)
  const sombra = useRef<HTMLDivElement>(null)
  const pliegues = useRef<HTMLDivElement[]>([])
  const vineta = useRef<HTMLDivElement>(null)
  const izq = useRef<HTMLDivElement>(null)
  const der = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)

  // Medir antes del primer cuadro (useLayoutEffect) y de nuevo cuando cargan las tipografías o cambia la ventana
  useLayoutEffect(() => {
    const el = hoja.current
    if (!el) return
    let viva = true
    const armar = () => {
      if (viva && !abriendo.current) setGeo(medir(el))
    }
    armar()
    void document.fonts.ready.then(armar)
    addEventListener('resize', armar)
    return () => {
      viva = false
      removeEventListener('resize', armar)
    }
  }, [hoja])

  // Foco en INGRESAR (Enter abre), sin el anillo: aparece recién si la persona usa el teclado
  const lista = geo !== null
  useEffect(() => {
    if (lista) boton.current?.focus({ preventScroll: true, focusVisible: false })
  }, [lista])
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') setTeclado(true)
    }
    addEventListener('keydown', alTeclear)
    return () => removeEventListener('keydown', alTeclear)
  }, [])

  async function abrir() {
    const g = geo
    if (!g || abriendo.current) return
    abriendo.current = true
    // fill 'forwards': al terminar, cada elemento se queda como lo dejó su animación
    const animar = (el: Element | null, cuadros: Keyframe[], opciones: KeyframeAnimationOptions) =>
      el?.animate(cuadros, { fill: 'forwards', ...opciones }).finished
    try {
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // 1 · La faja se corta: en el mismo cuadro, la faja entera se cambia por las dos mitades (flushSync dibuja ya)
        flushSync(() => setCortada(true))
        const tension = { duration: 120, easing: 'ease-out' }
        await Promise.all([
          animar(izq.current, [{ transform: 'none' }, { transform: 'translateX(-6px) rotate(-1deg)' }], tension),
          animar(der.current, [{ transform: 'none' }, { transform: 'translateX(6px) rotate(1deg)' }], tension),
        ])
        // Cada mitad sale despedida hacia su lado, girando y cayendo
        const salida = { duration: 600, easing: 'cubic-bezier(.4, 0, .8, .5)' }
        void animar(izq.current, [{ transform: 'translateX(-6px) rotate(-1deg)' }, { transform: 'translate(-55vw, 90px) rotate(-22deg)', opacity: 0 }], salida)
        void animar(der.current, [{ transform: 'translateX(6px) rotate(1deg)' }, { transform: 'translate(55vw, 110px) rotate(18deg)', opacity: 0 }], salida)

        // 2 · A los 0,4 s, la mitad de abajo se despliega y el diario se endereza y se re-centra
        const abrirse = { duration: 700, delay: 400, easing: CURVA_ABRIR }
        void animar(abajo.current, [{ transform: 'rotateX(-179.9deg)' }, { transform: 'rotateX(0deg)' }], abrirse)
        void animar(sombra.current, [{ transform: 'translateZ(-2px) scaleY(.5)' }, { transform: 'translateZ(-2px) scaleY(1)' }], abrirse)
        for (const p of pliegues.current) void animar(p, [{ opacity: 1 }, { opacity: 0.2 }], abrirse)
        void animar(vineta.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 400 })
        await animar(diario.current, [{ transform: ubicar(g, g.tx, g.ty, g.s, g.rot) }, { transform: ubicar(g, g.tx, g.ty2, g.s, 0) }], abrirse)

        // 3 · Se agranda hasta coincidir con la página real (FLIP: de donde está a la caja medida de la hoja)
        await animar(diario.current, [{ transform: ubicar(g, g.tx, g.ty2, g.s, 0) }, { transform: ubicar(g, 0, 0, 1, 0) }], {
          duration: 550,
          easing: 'cubic-bezier(.3, .7, .2, 1)',
        })
      }
      // La capa se desvanece: lo que queda es el sitio
      await animar(raiz.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease' })
    } finally {
      alTerminar()
    }
  }

  return (
    <div ref={raiz} role="dialog" aria-modal="true" aria-label="The Plainview, edición del día" className={`entrada ${teclado ? 'teclado' : ''}`}>
      {geo && (
        <>
          <div
            ref={diario}
            className="entrada-diario"
            style={{ left: geo.left, top: geo.top, width: geo.W, height: geo.H, transform: ubicar(geo, geo.tx, geo.ty, geo.s, geo.rot) }}
          >
            <div ref={sombra} className="entrada-sombra" style={{ height: geo.H }} />
            <div className="entrada-arriba" style={{ height: geo.H / 2 }}>
              <Copia geo={geo} desde={0} />
              <div ref={(el) => void (el && (pliegues.current[0] = el))} className="entrada-pliegue-arriba" />
            </div>
            {/* Doblada por detrás de la de arriba: el frente es la otra mitad de la portada, el dorso la contratapa */}
            <div ref={abajo} className="entrada-abajo" style={{ top: geo.H / 2, height: geo.H / 2 }}>
              <div className="entrada-cara">
                <Copia geo={geo} desde={geo.H / 2} />
                <div ref={(el) => void (el && (pliegues.current[1] = el))} className="entrada-pliegue-abajo" />
              </div>
              <div className="entrada-cara entrada-dorso" />
            </div>
          </div>

          {/* La faja va a escala de pantalla, encima de la mitad visible y con su mismo giro (botón siempre legible) */}
          <div
            className="entrada-lugar-faja"
            style={{ left: geo.left + geo.tx, top: geo.top + geo.ty, width: geo.W * geo.s, height: (geo.H / 2) * geo.s, transform: `rotate(${geo.rot}deg)` }}
          >
            <div className={`entrada-faja ${cortada ? 'cortada' : ''}`}>
              {/* Cerrada se ve una sola faja entera; las mitades (con el corte en zigzag) aparecen recién al tocar.
                  El botón está dibujado en la faja, así se corta con ella */}
              <Media clase="entera" />
              <Media clase="izq" ref={izq} />
              <Media clase="der" ref={der} />
              {/* El botón de verdad: invisible, encima del dibujado y del mismo tamaño; recibe el toque y el foco */}
              <button ref={boton} type="button" onClick={abrir} className="entrada-boton entrada-ingresar">
                INGRESAR
              </button>
            </div>
          </div>
        </>
      )}
      <div ref={vineta} className="entrada-vineta" />
    </div>
  )
}

/** Una copia quieta de la portada real, del ancho y el alto de la hoja, corrida para mostrar su mitad */
function Copia({ geo, desde }: { geo: Geo; desde: number }) {
  return (
    <div inert className={`entrada-copia ${CLASES_HOJA}`} style={{ width: geo.W, height: geo.altoReal, top: -desde }}>
      <Home />
    </div>
  )
}

function Media({ clase, ref }: { clase: string; ref?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={ref} aria-hidden className={`entrada-media ${clase}`}>
      <div className="entrada-tela">
        <span className="entrada-boton">INGRESAR</span>
      </div>
    </div>
  )
}
