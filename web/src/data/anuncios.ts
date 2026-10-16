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
}

export const avisos: Aviso[] = [
  {
    "id": "plainview-perforaciones",
    "tipo": "mini",
    "ilustracion": "torre-petrolera",
    "titulo": "PLAINVIEW & HIJO",
    "texto": "¿Petróleo bajo su tierra? Nosotros lo sacamos.",
    "telefono": "Tel. 82-2007"
  },
  {
    "id": "cafe-americano",
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
    "tipo": "mini",
    "ilustracion": "televisor",
    "titulo": "¿LO DEJARON EN VISTO?",
    "texto": "Seminario intensivo de confianza.",
    "telefono": "¡LLAME YA! 0-800-VALLE",
    "productSlug": "magnolia"
  },
  {
    "id": "concurso-bombay",
    "tipo": "mini",
    "ilustracion": "atril-concurso",
    "titulo": "¿SABE LA RESPUESTA?",
    "texto": "Programa de Bombay busca concursantes.",
    "telefono": "Tel. 82-2008"
  },
  {
    "id": "iglesia",
    "tipo": "mini",
    "ilustracion": "capilla",
    "titulo": "IGLESIA DE LA REVELACIÓN",
    "texto": "Sanaciones todos los domingos.",
    "telefono": "Tel. 82-2007"
  },
  {
    "id": "sparrings",
    "tipo": "mini",
    "ilustracion": "guantes",
    "titulo": "SE BUSCAN SPARRINGS",
    "texto": "Se paga por round.",
    "telefono": "Tel. 82-1982"
  },
  {
    "id": "recompensa",
    "tipo": "mini",
    "ilustracion": "sobre-cifrado",
    "titulo": "RECOMPENSA",
    "texto": "A quien descifre la carta de esta página.",
    "telefono": "Tel. 82-2007"
  },
  {
    "id": "paraguas",
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
    "tipo": "linea",
    "titulo": "SE BUSCA",
    "texto": "pianista discreto. Repertorio completo salvo una canción.",
    "telefono": "82-1942"
  },
  {
    "id": "batidora",
    "tipo": "linea",
    "titulo": "VENDO",
    "texto": "batidora industrial. Ideal para compartir.",
    "telefono": "82-2007"
  },
  {
    "id": "tigre",
    "tipo": "linea",
    "titulo": "PERDIDO",
    "texto": "ojo de tigre. Se gratifica.",
    "telefono": "82-1982"
  },
  {
    "id": "vias",
    "tipo": "linea",
    "titulo": "ALQUILO",
    "texto": "depto. junto a las vías. Se mueve un poco.",
    "telefono": "82-1995"
  },
  {
    "id": "pronosticos",
    "tipo": "linea",
    "titulo": "SE HACEN",
    "texto": "pronósticos. Especialidad: lluvias inusuales.",
    "telefono": "82-1999"
  },
  {
    "id": "salvoconductos",
    "tipo": "linea",
    "titulo": "VENDO",
    "texto": "salvoconductos. Sin preguntas.",
    "telefono": "82-1942"
  },
  {
    "id": "detective",
    "tipo": "linea",
    "titulo": "BUSCO",
    "texto": "detective paciente. Caso de cartas.",
    "telefono": "82-2007"
  }
]

export const getAviso = (id: string) => avisos.find((a) => a.id === id)

/** El aviso "mini" de una remera (para el pie de su aviso comercial) */
export const avisoDeProducto = (slug: string) => avisos.find((a) => a.tipo === 'mini' && a.productSlug === slug)

/**
 * Qué avisos salen en la portada y en qué orden. Para cambiarlos alcanza con editar esta lista.
 * - minis: se intercalan entre las noticias (uno cada 2 noticias por columna, desfasados)
 * - lineas: rellenan el final de las columnas
 * - cierre: el aviso de la marca, a todo el ancho al final
 */
export const PORTADA = {
  // Con 5 noticias, las dos columnas miden menos de una pantalla: un mini + el rojo de cierre ya son 2 avisos
  // a la vista, el máximo en el celular. Si la portada crece, se pueden sumar minis (por ejemplo 'paraguas').
  // Café Americano no va acá: sale al pie del aviso de Casablanca.
  minis: ['plainview-perforaciones'],
  lineas: ['tigre', 'batidora'],
  cierre: 'plainview-82',
}
