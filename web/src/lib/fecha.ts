// Fechas del diario, en español de Argentina (el formato lo arma el navegador con Intl).
// "viernes, 16 de octubre de 2026" (larga) y "16 de octubre de 2026" (corta, para que entre en mobile).
export const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const fechaCorta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

/** "16 oct 2026", como en la maqueta de la cabecera mobile (sin el punto de la abreviatura) */
export function fechaMini(d: Date): string {
  const partes = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(d)
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value.replace('.', '') ?? ''
  return `${parte('day')} ${parte('month')} ${parte('year')}`
}
