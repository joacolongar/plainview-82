/**
 * Noticias de la portada: el diario "THE PLAINVIEW", que existe dentro del mundo de las películas.
 * Cada noticia cuenta la PREMISA de una película como si pasara hoy (ver la regla de contenido en CLAUDE.md):
 * - alusiones a escenas y frases célebres sí, diálogo textual nunca
 * - spoilers solo como guiño velado, nunca escritos como dato
 * - si hay remera, `productSlug` lleva a la ficha (solo se muestra el link si el producto existe)
 */
export type Seccion = 'portada' | 'internacional' | 'espectaculos' | 'deportes' | 'clima'

export type Noticia = {
  id: string
  seccion: Seccion
  titular: string
  bajada: string
  cuerpo: string[] // un string por párrafo
  epigrafe?: string // texto bajo la ilustración (solo la principal tiene ilustración por ahora)
  productSlug?: string
}

export const SECCIONES: Record<Seccion, string> = {
  portada: 'Primera plana',
  internacional: 'Internacionales',
  espectaculos: 'Espectáculos',
  deportes: 'Deportes',
  clima: 'El tiempo',
}

// TODO: borradores. Revisar el tono y ajustar los textos antes del lanzamiento.
export const noticias: Noticia[] = [
  {
    id: 'petroleo-sangriento',
    seccion: 'portada',
    titular: '¡Brota el crudo!',
    // La bajada y el epígrafe de la principal son cortos a propósito: titular + bajada + ilustración entran en la 1ª pantalla (375×667)
    bajada: 'Un petrolero de pocas palabras compra a precio de ganga los campos de Little Boston. El predicador del pueblo no está convencido.',
    cuerpo: [
      'Promete escuelas, caminos y prosperidad. Llegó con un hijo de la mano, un equipo de perforación y un dato que nadie más tenía: bajo los pastizales de la familia Sunday duerme un mar de petróleo. Los vecinos, que hasta ayer criaban cabras en tierra de piedras, firmaron sin leer demasiado.',
      'El señor D. Plainview (sin parentesco declarado con este diario, por ahora) habla poco y negocia mucho. Asegura que trabaja con su familia y que no le interesa otra cosa que el bien del pueblo. Los accionistas del ferrocarril piden ver los números.',
      'Desde el púlpito, el joven pastor de la Iglesia de la Tercera Revelación exige que la primera torre se bendiga como corresponde y que una parte de la fortuna vaya a su congregación. Las apuestas en el almacén de ramos generales están parejas.',
    ],
    epigrafe: 'La primera torre, vista desde la iglesia.',
  },
  {
    id: 'casablanca',
    seccion: 'espectaculos',
    titular: 'Reabre el café de Rick',
    bajada:
      'El local más concurrido de Casablanca vuelve a abrir sus puertas: ruleta, refugiados que esperan una visa para Lisboa y un dueño que jura no meterse en nada.',
    cuerpo: [
      'Con la guerra golpeando a Europa, medio continente pasa por Marruecos rumbo a América. Mientras tanto, se juega, se bebe y se espera en el café de un norteamericano que, según los habituales, no se sienta a la mesa con nadie.',
      'El prefecto de policía, cliente fiel, confirma que la casa sigue abierta y que el orden está garantizado, siempre y cuando nadie le pregunte demasiado. Corren rumores sobre unos salvoconductos que valen más que todo el local.',
      'Según fuentes del bar, anoche entró una pareja recién llegada y el pianista se quedó un rato largo sin saber qué tocar.',
    ],
    productSlug: 'casablanca',
  },
  {
    id: 'quien-quiere-ser-millonario',
    seccion: 'internacional',
    titular: 'Muchacho de Bombay, a una pregunta del premio mayor',
    bajada:
      'Sirve té en un centro de llamadas y nunca pisó una universidad. Aun así, responde todo en el programa de preguntas más visto del país. La policía quiere saber cómo lo hace.',
    cuerpo: [
      'Creció en los barrios más humildes de la ciudad, entre trenes, basurales y hermanos que se cuidaban como podían. Esta semana, millones de televisores lo vieron llegar a la última pregunta sin pestañear.',
      'El conductor del programa no oculta su desconfianza y las autoridades lo retuvieron para interrogarlo. Él insiste en que no hizo trampa: cada respuesta, dice, se la enseñó la vida.',
      'La final se emite esta noche. Los bares de la ciudad anuncian pantalla gigante y té gratis.',
    ],
  },
  {
    id: 'magnolia',
    seccion: 'clima',
    titular: 'Pronóstico: lluvias inusuales sobre el Valle de San Fernando',
    bajada: 'El servicio meteorológico no se anima a decir de qué.',
    cuerpo: [
      'Cielo cubierto sobre los suburbios de Los Ángeles, con vidas que se cruzan sin pedir permiso: un enfermero, un presentador de televisión, un policía de buen corazón y un gurú de la autoayuda, entre otros.',
      'Se recomienda paraguas firme, techo sólido y reconciliarse con quien corresponda antes del fin de semana. Las coincidencias, advierten, no existen.',
    ],
    productSlug: 'magnolia',
  },
  {
    id: 'rocky-iii',
    seccion: 'deportes',
    titular: 'El campeón defiende el título',
    bajada:
      'Balboa lleva años invicto y ya sale en las publicidades. Un retador con más hambre que modales lo desafía delante de todo Filadelfia.',
    cuerpo: [
      'El ídolo de Filadelfia tiene estatua, mansión y contratos en la televisión. Sus defensas del título se cuentan por victorias, aunque la prensa especializada se pregunta contra quién peleó de verdad.',
      'El retador, un peso pesado de Chicago que entrena solo y no sonríe en las fotos, lo provocó en público durante un acto oficial. El campeón aceptó.',
      'Su entrenador de toda la vida no quiere saber nada con la pelea. Las entradas se agotaron en una hora.',
    ],
  },
]

export const getNoticias = (seccion: Seccion) => noticias.filter((n) => n.seccion === seccion)

/** Avisos clasificados (columna de la portada). Ojo: nada de condiciones comerciales inventadas; eso va en Cómo comprar */
export const clasificados: string[] = [
  'SE OFRECEN remeras con referencias escondidas a plena vista. Solo para quienes se quedan hasta el final de los créditos.',
  'PEDIDOS por WhatsApp: elegí, armá tu pedido y escribinos. Sin formularios eternos.',
  'TALLES, pagos y envíos: todo explicado en la sección Cómo comprar.',
  'SE BUSCA cinéfilo de buen ojo para la sección Pasatiempos. No se requiere experiencia.',
]
