// Fechas del diario, en español de Argentina (el formato lo arma el navegador con Intl).
// "viernes, 16 de octubre de 2026" (larga) y "16 de octubre de 2026" (corta, para que entre en mobile).
export const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const fechaCorta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
