/**
 * Ediciones del diario: cada drop de remeras sale como una edición nueva (ver "Concepto" en docs/ROADMAP.md).
 * "Vol. 8 · No. 2" de la cabecera es fijo (guiño al 8:2); lo que avanza con cada drop es el número de edición.
 * No confundir con las ediciones de Pasatiempos (src/data/pasatiempos/), que tienen su propia numeración.
 */
export type EdicionDiario = {
  numero: number
  fecha: string // salida del drop, AAAA-MM-DD
  titular: string // titular de tapa de esa edición (para compartir y SEO en S11)
}

export const ediciones: EdicionDiario[] = [{ numero: 1, fecha: '2026-10-16', titular: '¡Brota el crudo!' }]

/** La edición vigente es la última de la lista */
export const edicionActual = (): EdicionDiario => ediciones[ediciones.length - 1]
