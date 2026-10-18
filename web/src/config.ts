export const BRAND = {
  name: 'Plainview 8:2',
  slogan: 'Watch closer.',
  instagram: 'https://instagram.com/plainview.82',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
}

/** Clave pública del widget de Turnstile (la secreta vive solo en Cloudflare, sin VITE_). Pública por diseño:
    el widget la necesita en el navegador, como el número de WhatsApp */
export const TURNSTILE_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

/** Mientras sea true se muestra la franja "Número de prueba". Pasar a false en el lanzamiento (S12). */
export const IS_PREVIEW = true

export const CURRENCY = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
