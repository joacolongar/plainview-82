/**
 * Noticias de la portada: el diario "THE PLAINVIEW", que existe dentro del mundo de las películas.
 * Cada noticia cuenta la PREMISA de una película como si pasara hoy (ver la regla de contenido en CLAUDE.md):
 * - alusiones a escenas y frases célebres sí, diálogo textual nunca
 * - spoilers solo como guiño velado, nunca escritos como dato
 * - CORTAS (regla de largo en CLAUDE.md): la principal lleva titular, bajada de una línea y epígrafe;
 *   las secundarias, sección, titular y `texto` de 2 o 3 oraciones
 * - si hay remera, `productSlug` hace del titular un link a su aviso (solo si el producto existe)
 */
export type Seccion = 'portada' | 'television' | 'espectaculos' | 'deportes' | 'clima'

export type Noticia = {
  id: string
  seccion: Seccion
  titular: string
  bajada?: string // solo la principal: una línea
  texto?: string // solo las secundarias: 2 o 3 oraciones
  epigrafe?: string // solo la principal: texto bajo la ilustración
  productSlug?: string
}

export const SECCIONES: Record<Seccion, string> = {
  portada: 'Primera plana',
  television: 'Televisión',
  espectaculos: 'Espectáculos',
  deportes: 'Deportes',
  clima: 'Pronóstico',
}

// TODO: borradores. Revisar el tono y ajustar los textos antes del lanzamiento.
export const noticias: Noticia[] = [
  {
    id: 'petroleo-sangriento',
    seccion: 'portada',
    titular: '¡Brota el crudo!',
    bajada: 'Un petrolero compra Little Boston por monedas.',
    epigrafe: 'La primera torre, vista desde la iglesia.',
  },
  {
    id: 'casablanca',
    seccion: 'espectaculos',
    titular: 'Reabre el café de Rick',
    texto:
      'Ruleta, refugiados y un dueño que jura no meterse en nada. Anoche entró una pareja recién llegada y el pianista se quedó sin saber qué tocar.',
    productSlug: 'casablanca',
  },
  {
    id: 'quien-quiere-ser-millonario',
    seccion: 'television',
    titular: 'Muchacho de Bombay, a una pregunta del premio',
    texto: 'Sirve té en un centro de llamadas y responde todo. La policía quiere saber cómo lo hace.',
  },
  {
    id: 'clima',
    seccion: 'clima',
    titular: 'Clima en el Valle',
    texto: 'Cielo variable sobre San Fernando y vidas que se cruzan sin pedir permiso. Probabilidad de lluvias inusuales.',
    productSlug: 'magnolia',
  },
  {
    id: 'rocky-iii',
    seccion: 'deportes',
    titular: 'El campeón defiende el título',
    texto: 'Balboa ya tiene estatua y sale en las publicidades. Un retador de Chicago, con más hambre que modales, lo desafió en público.',
  },
]

export const getNoticias = (seccion: Seccion) => noticias.filter((n) => n.seccion === seccion)
export const principal = () => noticias.find((n) => n.seccion === 'portada')!
export const secundarias = () => noticias.filter((n) => n.seccion !== 'portada')
