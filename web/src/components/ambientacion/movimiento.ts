/**
 * ¿La persona pidió menos movimiento (ajuste del sistema)? Las ambientaciones que solo existen en movimiento
 * (las ranas, el pocillo) directamente no se dibujan. El CSS también las deja invisibles, por las dudas.
 */
export function movimientoReducido(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
