import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CURRENCY } from '../../config'
import { numeroArticulo, rutaAviso } from '../../data/products'
import type { Tapa as DatosTapa } from '../../lib/tapa'
import TAPA from '../../data/tapa.json'

/**
 * La remera es la tapa (docs/portada/PORTADA.md, idea 1): volanta con el N° de artículo, el titular de tapa y la foto,
 * que es la remera dando una vuelta (video de Blender, no 3D en vivo). Debajo, el epígrafe con nombre, detalle y precio,
 * y el botón a la ficha.
 *
 * La foto: primero pinta la imagen fija (el primer cuadro del video, con prioridad alta: es lo más grande de la primera
 * pantalla). El video se suma recién cuando la página terminó de cargar y el navegador está libre, y aparece cuando
 * arranca: hasta entonces se sigue viendo la imagen, que es idéntica. Sin video si el lector pidió menos movimiento,
 * si ahorra datos, o en las copias quietas de la entrada (`quieta`). Fuera de la pantalla, se pausa.
 */
export default function Tapa({ tapa, quieta = false }: { tapa: DatosTapa; quieta?: boolean }) {
  const p = tapa.producto
  return (
    <article>
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-print-muted">
        <span aria-hidden className="mr-1.5 inline-block size-1.5 bg-red align-middle" />
        Espectáculos · Art. N° {numeroArticulo(p)}
      </p>
      <h2 className={`mt-1 text-center font-headline uppercase leading-[0.92] text-balance hyphens-auto ${tamanoTitular(tapa.titulo)}`}>
        {tapa.titulo}
      </h2>
      <figure className="mt-2 md:mt-3">
        <Foto tapa={tapa} quieta={quieta} />
        <figcaption className="mt-2 flex items-center justify-between gap-3">
          <p className="min-w-0 font-display text-[14px] italic leading-snug md:text-[15px]">
            <span className="font-bold">{p.titular}</span> — {detalle(p)} · {precio(p)}
          </p>
          <Link
            to={rutaAviso(p.slug)}
            className="flex min-h-11 shrink-0 items-center bg-print px-3 font-headline text-[17px] uppercase tracking-wider text-paper outline-offset-2 hover:bg-ink focus-visible:outline-2 focus-visible:outline-print md:px-4 md:text-lg"
          >
            Ver la remera ▸
          </Link>
        </figcaption>
      </figure>
    </article>
  )
}

function Foto({ tapa, quieta }: { tapa: DatosTapa; quieta: boolean }) {
  const [cargar, setCargar] = useState(false)
  const [andando, setAndando] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  // Después de todo lo demás: al terminar de cargar la página y con el navegador libre. Si está la entrada (el diario
  // doblado, <html data-entrada>), recién cuando el lector entra: debajo de la entrada no se ve
  useEffect(() => {
    if (quieta) return
    const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (menosMovimiento || ahorro) return
    const html = document.documentElement
    let cancelado = false
    let idle = 0
    const listo = () => !cancelado && setCargar(true)
    const enReposo = () => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(listo, { timeout: 2000 })
      else idle = globalThis.setTimeout(listo, 300)
    }
    const sinEntrada = new MutationObserver(() => {
      if (!('entrada' in html.dataset)) {
        sinEntrada.disconnect()
        enReposo()
      }
    })
    const empezar = () => {
      if ('entrada' in html.dataset) sinEntrada.observe(html, { attributes: true, attributeFilter: ['data-entrada'] })
      else enReposo()
    }
    if (document.readyState === 'complete') empezar()
    else window.addEventListener('load', empezar, { once: true })
    return () => {
      cancelado = true
      sinEntrada.disconnect()
      window.removeEventListener('load', empezar)
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle)
      window.clearTimeout(idle)
    }
  }, [quieta])

  // Con el video puesto: muted como propiedad antes de play (si no, el navegador no lo deja arrancar solo) y pausa
  // fuera de la pantalla. Si no arranca (ahorro de energía del iPhone), queda la imagen fija
  useEffect(() => {
    const v = video.current
    if (!cargar || !v) return
    v.muted = true
    const mirar = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    })
    mirar.observe(v)
    return () => mirar.disconnect()
  }, [cargar])

  return (
    <div className="foto-tapa relative aspect-[3/2] overflow-clip border border-print">
      <img
        src={tapa.poster}
        alt={`La remera ${tapa.producto.titular}, de frente`}
        width={TAPA.ancho}
        height={TAPA.alto}
        fetchPriority="high"
        className="absolute inset-0 size-full"
      />
      {cargar && (
        <video
          ref={video}
          src={tapa.video}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          width={TAPA.ancho}
          height={TAPA.alto}
          onPlaying={() => setAndando(true)}
          className={`absolute inset-0 size-full transition-opacity duration-500 ${andando ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}

/** "Remera negra oversize": el color (si hay uno solo, en femenino: Negro → negra) y el calce (lo que va antes de los
    dos puntos) */
function detalle(p: DatosTapa['producto']) {
  const color = p.colors.length === 1 ? ` ${p.colors[0].toLowerCase().replace(/o$/, 'a')}` : ''
  const calce = p.detalles?.calce?.split(':')[0]
  return `Remera${color}${calce ? ` ${calce}` : ''}`
}

function precio(p: DatosTapa['producto']) {
  if (p.status === 'proximamente' || p.price <= 0) return 'Próximo número'
  return `${CURRENCY.format(p.price)}${p.precioDePrueba ? ' (de prueba)' : ''}`
}

/** Como el titular principal (Home.tsx): la letra se achica con el largo para que entre la primera pantalla */
function tamanoTitular(titular: string) {
  if (titular.length <= 18) return 'text-[clamp(2.75rem,13vw,7rem)]'
  if (titular.length <= 30) return 'text-[clamp(2.25rem,10vw,5.5rem)]'
  return 'text-[clamp(2rem,8.5vw,4.5rem)]'
}
