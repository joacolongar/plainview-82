export const BRAND = {
  name: 'Plainview 8:2',
  slogan: 'Watch closer.',
  instagram: 'https://instagram.com/plainview.82',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
}

export const CURRENCY = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
