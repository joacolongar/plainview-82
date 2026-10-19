import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { paginaDe } from '../data/paginas'

type Pagina = ReturnType<typeof paginaDe>
export type Direccion = 'adelante' | 'atras'

// Umbrales del gesto: más de 60 px en horizontal, claramente más horizontal que vertical y en menos de 0,6 s.
// Así scrollear la página (vertical) o tocar algo nunca pasa de página sin querer.
const MIN_PX = 60
const MAX_MS = 600
const HORIZONTALIDAD = 1.5

// Donde el gesto o las flechas son de otro: campos de texto y tableros de juegos (data-no-swipe)
const EXCLUIDOS = 'input, textarea, select, [contenteditable], [data-no-swipe]'
const excluido = (t: EventTarget | null) => t instanceof Element && !!t.closest(EXCLUIDOS)

/** La animación (index.css) lee esta marca para saber hacia qué lado se va la hoja */
export const marcarDireccion = (dir: Direccion) => {
  document.documentElement.dataset.direccion = dir
}

/**
 * Pasar de página como en un diario: deslizando en el celular, con ← → en la compu, y con la
 * transición de hoja de la View Transitions API (React Router la usa con `viewTransition: true`).
 * Devuelve los handlers para la hoja; las flechas se escuchan en la ventana.
 */
export function usePasarPagina(pagina: Pagina) {
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()

  const ir = useCallback(
    (dir: Direccion) => {
      const destino = dir === 'adelante' ? pagina?.siguiente : pagina?.anterior
      if (!destino) return
      marcarDireccion(dir)
      navigate(destino.ruta, { viewTransition: true })
    },
    [pagina, navigate],
  )

  // En un diario, la página nueva se empieza a leer desde arriba (si no, queda el scroll de la anterior).
  // Si el link trae un ancla (/atencion-al-lector#arrepentimiento), se va a esa sección. Este efecto corre después
  // de que la página nueva se dibujó (los efectos del padre van después de los del hijo), así que el ancla ya existe.
  useEffect(() => {
    const ancla = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (ancla) ancla.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  // Flechas ← →. El Cifrado y el Cinedoku también las usan (y llaman a preventDefault).
  // Esperamos a que el evento termine de pasar por todos los listeners (queueMicrotask corre después)
  // y solo pasamos de página si nadie lo usó: no depende del orden en que se registraron.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || excluido(e.target)) return
      queueMicrotask(() => {
        if (!e.defaultPrevented) ir(e.key === 'ArrowRight' ? 'adelante' : 'atras')
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ir])

  // Deslizar: se anota dónde apoyó el dedo y se decide al levantarlo
  const inicio = useRef<{ x: number; y: number; t: number } | null>(null)
  const gestos = {
    onPointerDown: (e: ReactPointerEvent) => {
      inicio.current = e.pointerType === 'mouse' || excluido(e.target) ? null : { x: e.clientX, y: e.clientY, t: performance.now() }
    },
    onPointerUp: (e: ReactPointerEvent) => {
      const i = inicio.current
      inicio.current = null
      if (!i || performance.now() - i.t > MAX_MS) return
      const dx = e.clientX - i.x
      const dy = e.clientY - i.y
      if (Math.abs(dx) < MIN_PX || Math.abs(dx) < HORIZONTALIDAD * Math.abs(dy)) return
      ir(dx < 0 ? 'adelante' : 'atras') // dedo hacia la izquierda = página siguiente, como en un libro
    },
    onPointerCancel: () => {
      inicio.current = null
    },
  }

  return gestos
}
