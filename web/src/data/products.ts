export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL'

export type Product = {
  slug: string
  name: string
  movie: string
  director: string
  year: number
  price: number // ARS
  /** true mientras el precio sea inventado para probar la compra. Antes de lanzar: precio real y false */
  precioDePrueba: boolean
  sizes: Size[]
  colors: string[]
  /** Las fotos, en el orden de los archivos (salen solas de src/assets/productos/<slug>/, ver fotos.ts): su texto
      alternativo, el color de la remera y, si la tiene puesta alguien, quién (arma el pie: "Fig. 1 — El lector…") */
  fotos?: FotoProducto[]
  /** La remera en 3D (la última figura de la lámina). Sin modelo, la ficha muestra solo las fotos */
  modelo3d?: Modelo3D
  /** true mientras las fotos sean bocetos: cada una lleva el sello "Prueba de imprenta" */
  fotoBoceto?: boolean
  /** Miniatura cuadrada del índice: un recorte de la estampa (no la remera entera), WebP de 216 px en
      public/recortes/. Sin recorte, el índice muestra la trama de grabado. Se reemplaza al llegar las fotos finales */
  recorte?: string
  /** La pista sutil: qué detalle de la peli esconde la estampa (sin spoilers grandes) */
  reference: string
  description: string
  status: 'disponible' | 'preventa' | 'proximamente'
  // Campos del aviso comercial (la página del artículo, S4). Regla de contenido de CLAUDE.md:
  // alusiones sí, diálogo textual nunca, spoilers solo como guiño velado.
  articulo: number // N° de artículo en el catálogo: 1 → "Art. N° 001"
  titular: string // titular grande del aviso
  bajada: string // una línea debajo del titular: a quién está dirigido
  aviso: string // el texto del aviso, en tono de catálogo por correo irónico
  epigrafe: string // texto bajo la ilustración o la foto
  /** Dónde pasa la película, como el lugar de un despacho de diario: "Art. N° 003 · Ciudad sin nombre" */
  lugar?: string
  /** Sección de la página en la cabecera chica (por defecto, "Avisos") */
  seccion?: string
  /** Detalle visual de la película que vive en la página (docs/AMBIENTACIONES.md) */
  ambientacion?: Ambientacion
  /** Detalles de la prenda: arman la Fe de erratas del aviso. Lo que falte no aparece.
      Mientras precioDePrueba sea true, también son de prueba (lo avisa la Fe de erratas) */
  detalles?: Detalles
}

export type Detalles = {
  tela?: string
  calce?: string
  estampa?: { tecnica: string; tamano: string; ubicacion: string }
  color?: string
  cuidado?: string
  /** La tirada de la remera (no confundir con la edición del diario) */
  edicion?: string
}

export type Ambientacion = 'ranas' | 'cafe' | 'pecados'

export type FotoProducto = {
  alt: string
  color?: string
  /** Quién la tiene puesta ("El lector Tomás"), cuánto mide en metros y qué talle usa: información de compra */
  lector?: { quien: string; altura: number; talle: Size }
}

/** Un punto en el espacio del modelo, en metros, con Y para arriba (como el glTF) */
export type Vec3 = [number, number, number]

export type Modelo3D = {
  /** Por color (de la lista `colors`): el .glb y la imagen fija del frente, en public/3d/. Los dos salen de
      aplicar_diseno.py --web; la imagen se ve mientras carga el 3D y queda si el navegador no puede mostrarlo */
  colores: Record<string, { glb: string; frente: string }>
  /** Los puntos de la Fe de erratas, numerados en este orden. posicion y normal, del "PUNTO" de aplicar_diseno.py:
      la normal es la de la cara (frente [0, 0, 1], espalda [0, 0, -1]): el punto se esconde cuando esa cara no se ve */
  puntos: PuntoErrata[]
}

/** Una errata de la estampa: "Donde dice «dice», debió decir «debio»." centro: el de su estampa, adonde va la cámara al
    tocar el número (DETALLE va al del primero, la estampa principal) */
export type PuntoErrata = { dice: string; debio: string; posicion: Vec3; normal: Vec3; centro: Vec3 }

// TODO: reemplazar precios, fotos, detalles y textos por los reales. Los textos de aviso son borradores.
export const products: Product[] = [
  {
    slug: 'magnolia',
    name: 'Magnolia — el frame',
    movie: 'Magnolia',
    director: 'Paul Thomas Anderson',
    year: 1999,
    price: 32000,
    precioDePrueba: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro'],
    fotos: [
      { alt: 'Frente de la remera negra: cuatro carteles de colores en el pecho y una línea de transmisión en vivo debajo', color: 'Negro' },
      { alt: 'Espalda de la remera negra, lisa, con una frase chica cerca del ruedo y la etiqueta Watch closer', color: 'Negro' },
      { alt: 'Detalle de la estampa: cuatro carteles redondeados en celeste, rojo, rosa y amarillo', color: 'Negro' },
    ],
    // Diseño: modelos/disenos/what-do-kids-know/ (aplicar.sh rehace el .blend y este .glb)
    modelo3d: {
      colores: { Negro: { glb: '/3d/what-do-kids-know.glb', frente: '/3d/what-do-kids-know-frente.webp' } },
      puntos: [
        { dice: 'una estampa grande', debio: 'cuatro carteles de 43 cm de ancho, a 14 cm del cuello', posicion: [0.1745, -0.0108, 0.0516], normal: [0, 0, 1], centro: [-0.0022, 0.1082, 0.0185] },
        { dice: 'un cartel', debio: 'el zócalo del noticiero en vivo, en crema, con su punto rojo', posicion: [-0.1773, -0.0475, 0.0385], normal: [0, 0, 1], centro: [-0.1309, 0.0154, 0.012] },
        { dice: 'sin firma', debio: 'el 8:2, chico, junto al ruedo', posicion: [0.2272, -0.2702, 0.0553], normal: [0, 0, 1], centro: [0.2354, -0.3389, 0.0595] },
        { dice: 'la espalda lisa', debio: 'una frase chica sobre el ruedo, para quien se queda hasta el final', posicion: [-0.2051, -0.2281, -0.0007], normal: [0, 0, -1], centro: [-0.1765, -0.287, -0.014] },
      ],
    },
    fotoBoceto: true,
    recorte: '/recortes/magnolia.webp',
    reference: 'Una referencia que aparece apenas un instante en un frame. Hay que mirar de cerca.',
    description: 'Estampa basada en un detalle de fondo de la película. Completar con la descripción real.',
    status: 'disponible',
    articulo: 1,
    titular: 'El frame de Magnolia',
    bajada: 'Para quien se quedó las tres horas y todavía mira el cielo antes de salir de casa.',
    aviso:
      'Remera con un detalle que la película muestra apenas un instante. Quien se la cruce por la calle no va a saber qué es; usted sí. Resiste lluvias comunes y de las otras. No incluye paraguas.',
    epigrafe: 'Estampa basada en un detalle de fondo. Mírela de cerca.',
    lugar: 'Valle de San Fernando',
    ambientacion: 'ranas',
    detalles: {
      tela: 'jersey de algodón peinado 24/1, 200 g/m²',
      calce: 'oversize: hombro caído y cuerpo amplio (si dudás, tu talle de siempre)',
      estampa: { tecnica: 'serigrafía a cuatro tintas', tamano: '43 × 14 cm', ubicacion: 'pecho; frase chica en la espalda, sobre el ruedo' },
      color: 'negro carbón, teñido en pieza',
      cuidado: 'lavar del revés con agua fría, sin secadora ni plancha sobre la estampa',
      edicion: 'tirada de 50 unidades, con etiqueta 8:2 en el ruedo',
    },
  },
  {
    slug: 'casablanca',
    name: 'Casablanca',
    movie: 'Casablanca',
    director: 'Michael Curtiz',
    year: 1942,
    price: 30000,
    precioDePrueba: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Hueso'],
    reference:
      'Un café en el norte de África, un pianista que sabe qué canción no tiene que tocar y un dueño que no brinda por nadie.',
    description: 'Completar cuando el diseño esté terminado.',
    status: 'disponible',
    articulo: 2,
    titular: 'Casablanca',
    bajada: 'Para quien entra a un café y elige la mesa con vista a la puerta.',
    aviso:
      'Remera para quien no se mete en nada, salvo cuando se mete. Ideal para esperar una visa, un salvoconducto o a alguien que no debería volver a entrar. Abriga lo justo para noches de humo y piano.',
    epigrafe: 'El grabado sale en la próxima edición. La mesa de siempre ya está reservada.',
    lugar: 'Casablanca',
    ambientacion: 'cafe',
    detalles: {
      tela: 'jersey de algodón peinado 24/1, 180 g/m²',
      calce: 'clásico: al cuerpo, sin ajustar',
      estampa: { tecnica: 'serigrafía a una tinta color café', tamano: '22 × 22 cm', ubicacion: 'centro del pecho' },
      color: 'hueso, como un mantel de café de los de antes',
      cuidado: 'lavar con agua fría y colores claros; secar a la sombra',
    },
  },
  {
    // Regla de spoilers de esta ficha (CLAUDE.md): la remera es sobre el final, los textos solo lo insinúan
    slug: 'pecados-capitales',
    name: 'Envío a domicilio',
    movie: 'Pecados capitales',
    director: 'David Fincher',
    year: 1995,
    price: 34000,
    precioDePrueba: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro'],
    reference:
      'Una ciudad donde nunca para de llover, un detective a siete días de jubilarse y una lista que alguien completa en orden.',
    description: 'Completar con la descripción real de la estampa.',
    status: 'disponible',
    articulo: 3,
    titular: 'Envío a domicilio',
    bajada: 'Entrega garantizada en siete días. Llueva o llueva.',
    aviso: 'Embalaje de cartón reforzado, cinta y sin remitente. Se entrega en mano. No pregunte qué hay adentro.',
    epigrafe: 'El repartidor llega puntual. Lo que trae, mejor no adelantarlo.',
    lugar: 'Ciudad sin nombre',
    seccion: 'Policiales',
    ambientacion: 'pecados',
    detalles: {
      tela: 'jersey de algodón peinado 20/1, 220 g/m²',
      calce: 'oversize: largo y ancho, para días de lluvia',
      estampa: { tecnica: 'serigrafía a dos tintas, rojo oscuro y blanco', tamano: '30 × 38 cm', ubicacion: 'espalda completa; número de artículo chico al frente' },
      color: 'negro, sin un rayo de sol',
      cuidado: 'lavar del revés con agua fría; no usar lavandina ni secadora',
      edicion: 'siete tandas de siete unidades, ni una más',
    },
  },
]

export const getProduct = (slug: string) => products.find((p) => p.slug === slug)

/** Ruta del aviso de una remera (antes /producto/:slug, que ahora redirige acá) */
export const rutaAviso = (slug: string) => `/catalogo/${slug}`

/** Estados con nombre de catálogo por correo, para el aviso y las cards */
export const ESTADOS: Record<Product['status'], string> = {
  disponible: 'En existencia',
  preventa: 'Por encargo',
  proximamente: 'Próximo número',
}

/** 1 → "001", como en los catálogos por correo */
export const numeroArticulo = (p: Product) => String(p.articulo).padStart(3, '0')
