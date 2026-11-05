// El número de la edición del día y la fecha de Córdoba. Aparte de edicion.ts porque lo usa también el servidor
// (functions/_middleware.ts) y no tiene que arrastrar el banco de noticias.

/** Edición N° 1: el día que salió el diario (16 de octubre de 2026) */
export const INICIO = '2026-10-16'
export const ZONA = 'America/Argentina/Cordoba'

const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' })

/** El día en Córdoba para un instante: las 23:30 de Argentina del 19 ya son el 20 en UTC, pero acá siguen siendo el 19 */
export const diaEnArgentina = (fecha: Date) => formatoDia.format(fecha)

const diaUTC = (dia: string) => {
  const [a, m, d] = dia.split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}

/** Días desde INICIO + 1 (el 16/10/2026 es la N° 1). Antes de esa fecha, la N° 1 */
export function numeroEdicion(fecha: Date): number {
  return Math.max(1, Math.round((diaUTC(diaEnArgentina(fecha)) - diaUTC(INICIO)) / 86_400_000) + 1)
}
