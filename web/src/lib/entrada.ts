// La entrada al sitio (docs/entrada/ENTRADA.md): el diario doblado con la faja de INGRESAR.
// Se decide una sola vez, al cargar el JS (main.tsx llama a prepararEntrada antes de dibujar). Así no aparece al
// navegar dentro del sitio ni al tocar el logo: para eso habría que volver a cargar la página.

const CLAVE = 'pv82-entrada'

type Llegada = {
  /** La ruta por la que se entró (location.pathname) */
  ruta: string
  /** Cómo se llegó: 'navigate' (link, URL nueva), 'reload', 'back_forward'… (PerformanceNavigationTiming.type) */
  tipoNavegacion: string
  /** Si en esta pestaña ya se mostró (sessionStorage). Si el almacenamiento falla, cuenta como vista */
  yaVista: boolean
}

/** Solo al entrar por la portada en una pestaña nueva: ni al recargar ni por el link de una remera */
export function debeMostrarEntrada({ ruta, tipoNavegacion, yaVista }: Llegada): boolean {
  return ruta === '/' && tipoNavegacion === 'navigate' && !yaVista
}

let pendiente = false

/**
 * Decide si se muestra y marca la pestaña. La marca se pone apenas se decide, también al entrar por otra ruta:
 * si se recarga en medio de la entrada o se vuelve a la portada, no aparece de nuevo.
 * Si el sessionStorage no anda (modo privado, almacenamiento bloqueado), no se muestra: se ve la página normal.
 * Solo en desarrollo, ?entrada la muestra siempre (para probar y sacar capturas).
 */
export function prepararEntrada() {
  let yaVista = true
  try {
    yaVista = sessionStorage.getItem(CLAVE) !== null
    sessionStorage.setItem(CLAVE, '1')
  } catch {
    // sin almacenamiento: queda como vista
  }
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  const forzada = import.meta.env.DEV && new URLSearchParams(location.search).has('entrada')
  pendiente = forzada || debeMostrarEntrada({ ruta: location.pathname, tipoNavegacion: nav?.type ?? 'navigate', yaVista })
  // Mientras está la entrada, <html data-entrada>: traba el scroll y frena el giro del logo (index.css). Se pone acá,
  // antes del primer cuadro, para que el logo de la página real arranque quieto en la misma cara que las copias
  if (pendiente) document.documentElement.dataset.entrada = ''
}

/** Si hay que mostrar la entrada (lo lee NewspaperPage al montar) */
export const entradaPendiente = () => pendiente

/** Al terminar: se saca la marca de <html> y vuelven el scroll y el giro del logo */
export function terminarEntrada() {
  pendiente = false
  delete document.documentElement.dataset.entrada
}
