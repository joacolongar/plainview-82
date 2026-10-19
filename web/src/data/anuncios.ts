/**
 * Avisos de THE PLAINVIEW: chiquitos, sueltos entre las noticias y en otras páginas.
 * - "mini": recuadro con ilustración, título, una línea y teléfono (máx. ~10 palabras de texto).
 * - "linea": clasificado de una sola línea, para rellenar el final de una columna.
 * Reglas: texto propio, alusiones sí, frases textuales y spoilers no. Sin fotogramas ni caras.
 * Easter egg: los teléfonos terminan en el año de la película (82-1942 = Casablanca).
 */
export type Aviso = {
  id: string
  tipo: 'mini' | 'linea'
  estilo?: 'invertido' | 'rojo'
  titulo: string
  texto: string
  telefono: string
  /** nombre del SVG en /public/ilustraciones, sin extensión */
  ilustracion?: string
  productSlug?: string
  href?: string
  /** De qué película es (como en noticias.ts). Sin película: los de la marca */
  pelicula?: string
}

// Estos son los avisos propios; las tandas del banco (data/banco/) se suman en data/banco.ts
export const avisosPropios: Aviso[] = [
  {
    "id": "plainview-perforaciones",
    "pelicula": "petroleo-sangriento",
    "tipo": "mini",
    "ilustracion": "torre-petrolera",
    "titulo": "PLAINVIEW & HIJO",
    "texto": "¿Petróleo bajo su tierra? Nosotros lo sacamos.",
    "telefono": "Tel. 82-2007"
  },
  {
    "id": "cafe-americano",
    "pelicula": "casablanca",
    "tipo": "mini",
    "estilo": "invertido",
    "ilustracion": "piano-cafe",
    "titulo": "CAFÉ AMERICANO",
    "texto": "Abierto todas las noches. Aquí no pasa nada.",
    "telefono": "Tel. 82-1942",
    "productSlug": "casablanca"
  },
  {
    "id": "seminario-confianza",
    "pelicula": "magnolia",
    "tipo": "mini",
    "ilustracion": "televisor",
    "titulo": "¿LO DEJARON EN VISTO?",
    "texto": "Seminario intensivo de confianza.",
    "telefono": "¡LLAME YA! 0-800-VALLE",
    "productSlug": "magnolia"
  },
  {
    "id": "concurso-bombay",
    "pelicula": "quien-quiere-ser-millonario",
    "tipo": "mini",
    "ilustracion": "atril-concurso",
    "titulo": "¿SABE LA RESPUESTA?",
    "texto": "Programa de Bombay busca concursantes.",
    "telefono": "Tel. 82-2008"
  },
  {
    "id": "iglesia",
    "pelicula": "petroleo-sangriento",
    "tipo": "mini",
    "ilustracion": "capilla",
    "titulo": "IGLESIA DE LA REVELACIÓN",
    "texto": "Sanaciones todos los domingos.",
    "telefono": "Tel. 82-2007"
  },
  {
    "id": "sparrings",
    "pelicula": "rocky-iii",
    "tipo": "mini",
    "ilustracion": "guantes",
    "titulo": "SE BUSCAN SPARRINGS",
    "texto": "Se paga por round.",
    "telefono": "Tel. 82-1982"
  },
  {
    "id": "recompensa",
    "pelicula": "zodiac",
    "tipo": "mini",
    "ilustracion": "sobre-cifrado",
    "titulo": "RECOMPENSA",
    "texto": "A quien descifre la carta de esta página.",
    "telefono": "Tel. 82-2007"
  },
  {
    "id": "paraguas",
    "pelicula": "magnolia",
    "tipo": "mini",
    "ilustracion": "paraguas",
    "titulo": "PARAGUAS REFORZADOS",
    "texto": "Para toda clase de lluvia.",
    "telefono": "Tel. 82-1999"
  },
  {
    "id": "plainview-82",
    "tipo": "mini",
    "estilo": "rojo",
    "titulo": "SE HACEN REMERAS",
    "texto": "Plainview 8:2. Para el que mira de cerca.",
    "telefono": "Ver catálogo →",
    "href": "/catalogo"
  },
  {
    "id": "pianista",
    "pelicula": "casablanca",
    "tipo": "linea",
    "titulo": "SE BUSCA",
    "texto": "pianista discreto. Repertorio completo salvo una canción.",
    "telefono": "82-1942"
  },
  {
    "id": "batidora",
    "pelicula": "petroleo-sangriento",
    "tipo": "linea",
    "titulo": "VENDO",
    "texto": "batidora industrial. Ideal para compartir.",
    "telefono": "82-2007"
  },
  {
    "id": "tigre",
    "pelicula": "rocky-iii",
    "tipo": "linea",
    "titulo": "PERDIDO",
    "texto": "ojo de tigre. Se gratifica.",
    "telefono": "82-1982"
  },
  {
    "id": "vias",
    "pelicula": "pecados-capitales",
    "tipo": "linea",
    "titulo": "ALQUILO",
    "texto": "depto. junto a las vías. Se mueve un poco.",
    "telefono": "82-1995"
  },
  {
    "id": "pronosticos",
    "pelicula": "magnolia",
    "tipo": "linea",
    "titulo": "SE HACEN",
    "texto": "pronósticos. Especialidad: lluvias inusuales.",
    "telefono": "82-1999"
  },
  {
    "id": "salvoconductos",
    "pelicula": "casablanca",
    "tipo": "linea",
    "titulo": "VENDO",
    "texto": "salvoconductos. Sin preguntas.",
    "telefono": "82-1942"
  },
  {
    "id": "detective",
    "pelicula": "zodiac",
    "tipo": "linea",
    "titulo": "BUSCO",
    "texto": "detective paciente. Caso de cartas.",
    "telefono": "82-2007"
  }
]

export const getAviso = (id: string) => avisosPropios.find((a) => a.id === id)

/** El aviso "mini" de una remera (para el pie de su aviso comercial) */
export const avisoDeProducto = (slug: string) => avisosPropios.find((a) => a.tipo === 'mini' && a.productSlug === slug)

/**
 * Avisos de la portada: los elige la edición del día (lib/edicion.ts), salvo estos:
 * - CIERRE: el aviso de la marca, a todo el ancho al final de todas las ediciones
 * - FUERA_DE_PORTADA: Café Americano sale al pie del aviso de Casablanca y Recompensa habla de "la carta de esta
 *   página" (vive en Pasatiempos)
 */
export const CIERRE_PORTADA = 'plainview-82'
export const FUERA_DE_PORTADA = ['plainview-82', 'cafe-americano', 'recompensa']
