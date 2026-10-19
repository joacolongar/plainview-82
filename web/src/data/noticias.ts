/**
 * Noticias de la portada: el diario "THE PLAINVIEW", que existe dentro del mundo de las películas.
 * Cada noticia cuenta la PREMISA de una película como si pasara hoy (ver la regla de contenido en CLAUDE.md):
 * - alusiones a escenas y frases célebres sí, diálogo textual nunca
 * - spoilers solo como guiño velado, nunca escritos como dato
 * - CORTAS (regla de largo en CLAUDE.md): la principal lleva titular, bajada de una línea y epígrafe;
 *   las secundarias, sección, titular y `texto` de 2 o 3 oraciones
 * - `pelicula` dice de qué película es (id en minúsculas y con guiones): con eso la edición del día evita repetir
 *   película y se asegura de que salga al menos una con remera en el catálogo (ver lib/edicion.ts)
 * - si hay remera, `productSlug` hace del titular un link a su aviso (solo si el producto existe)
 * Estas son las noticias propias; las tandas del banco (data/banco/) se suman en data/banco.ts.
 */
export type Seccion =
  | 'television'
  | 'espectaculos'
  | 'deportes'
  | 'clima'
  | 'internacional'
  | 'sociedad'
  | 'tecnologia'
  | 'policiales'
  | 'comercio'
  | 'ciencia'
  | 'cultos'
  | 'cultura'
  | 'salud'
  | 'ciudad'

export type Noticia = {
  id: string
  /** La principal va arriba con titular grande; las secundarias, en las dos columnas */
  tipo: 'principal' | 'secundaria'
  seccion: Seccion
  pelicula: string
  titular: string
  bajada?: string // solo la principal: una línea
  texto?: string // solo las secundarias: 2 o 3 oraciones
  epigrafe?: string // solo la principal: texto bajo la ilustración
  /** Solo la principal: el grabado (SVG propio en public/ilustraciones/, sin extensión) y su texto alternativo */
  ilustracion?: { archivo: string; alt: string }
  productSlug?: string
}

export const SECCIONES: Record<Seccion, string> = {
  television: 'Televisión',
  espectaculos: 'Espectáculos',
  deportes: 'Deportes',
  clima: 'Pronóstico',
  internacional: 'Internacional',
  sociedad: 'Sociedad',
  tecnologia: 'Tecnología',
  policiales: 'Policiales',
  comercio: 'Comercio',
  ciencia: 'Ciencia',
  cultos: 'Cultos',
  cultura: 'Cultura',
  salud: 'Salud',
  ciudad: 'Ciudad',
}

// Largos de la regla de CLAUDE.md, que chequean las pruebas (edicion.test.ts) y el adaptador del banco
export const MAX_BAJADA = 55 // una línea en la compu (a 375 px ya ocupa dos)
export const ORACIONES_SECUNDARIA = [2, 3] as const

// TODO: borradores. Revisar el tono y ajustar los textos antes del lanzamiento.
export const noticiasPropias: Noticia[] = [
  {
    id: 'petroleo-sangriento',
    tipo: 'principal',
    seccion: 'comercio',
    pelicula: 'petroleo-sangriento',
    titular: '¡Brota el crudo!',
    bajada: 'Un petrolero compra Little Boston por monedas.',
    epigrafe: 'La primera torre, vista desde la iglesia.',
    ilustracion: { archivo: 'torre-petrolera', alt: 'Grabado de una torre petrolera con su balancín, junto a un tanque' },
  },
  {
    id: 'casablanca',
    tipo: 'secundaria',
    seccion: 'espectaculos',
    pelicula: 'casablanca',
    titular: 'Reabre el café de Rick',
    texto:
      'Ruleta, refugiados y un dueño que jura no meterse en nada. Anoche entró una pareja recién llegada y el pianista se quedó sin saber qué tocar.',
    productSlug: 'casablanca',
  },
  {
    id: 'quien-quiere-ser-millonario',
    tipo: 'secundaria',
    seccion: 'television',
    pelicula: 'quien-quiere-ser-millonario',
    titular: 'Muchacho de Bombay, a una pregunta del premio',
    texto: 'Sirve té en un centro de llamadas y responde todo. La policía quiere saber cómo lo hace.',
  },
  {
    id: 'clima',
    tipo: 'secundaria',
    seccion: 'clima',
    pelicula: 'magnolia',
    titular: 'Clima en el Valle',
    texto: 'Cielo variable sobre San Fernando y vidas que se cruzan sin pedir permiso. Probabilidad de lluvias inusuales.',
    productSlug: 'magnolia',
  },
  {
    id: 'rocky-iii',
    tipo: 'secundaria',
    seccion: 'deportes',
    pelicula: 'rocky-iii',
    titular: 'El campeón defiende el título',
    texto: 'Balboa ya tiene estatua y sale en las publicidades. Un retador de Chicago, con más hambre que modales, lo desafió en público.',
  },
]
