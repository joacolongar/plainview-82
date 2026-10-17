# Ambientaciones: cada página del catálogo tiene su propia vida

Cada aviso comercial (ficha de producto) puede tener una **ambientación**: un detalle visual de su
película que vive en la página. Es "Watch closer" aplicado al diseño: decora, no distrae.

Maqueta: `docs/fichas-ambientadas.png` (375 px). Ilustraciones: `web/public/ilustraciones/ambientacion/`.

## Reglas comunes

- Un campo opcional en cada producto: `ambientacion?: 'ranas' | 'cafe' | 'pecados'`.
  Un componente `<Ambientacion tipo=… />` por tipo, dentro del layout de la ficha.
- **Nunca tapar texto, precio ni botones.** Lo decorativo vive en los bordes (cortado por el costado
  de la pantalla, como en la maqueta) o en los huecos vacíos, y puede pasar por encima de la foto,
  nunca de una palabra. `pointer-events: none` y `aria-hidden="true"`.
- **Poco es más:** de 3 a 7 elementos por página, nunca llenarla.
- **Movimiento:** suave y lento. Con `prefers-reduced-motion`, todo queda quieto en su lugar.
- **Rendimiento:** solo `transform` y `opacity` en las animaciones. SVG livianos.
- Mobile-first a 375 px: en celular, menos elementos y más chicos. La página tiene `overflow: hidden`
  para que lo que asoma por el borde quede cortado sin generar scroll horizontal.

## Magnolia: `ranas`

- 4 o 5 ranas (`rana.svg`) de 28 a 52 px, rotadas, **solo en los márgenes y cortadas por el borde**.
- Caen despacio desde arriba (de 8 a 14 s cada una, con distinto retraso), girando apenas, por la
  franja del margen. Algunas con opacidad baja, como más lejos.
- Nunca encima ni debajo de una palabra.

## Casablanca: `cafe`

- Un **pocillo** blanco (bajo y ancho, sin sombreado gris) volcado (`taza-derramada.svg`),
  **bastante escondido**: asoma cortado por el borde derecho, casi solo el borde y la boca.
- Del borde sale un **chorro de café que está cayendo**, seguido de tres gotas en el aire, cada vez
  más chicas. No es un charco: el café todavía no llegó abajo.
- La mancha (`mancha-cafe.svg`) va **justo debajo de las gotas**, siguiendo su rastro: donde
  caerían, sobre el borde inferior de la foto y el espacio vacío a la derecha del precio. Con
  `mix-blend-mode: multiply` para que parezca absorbida por el papel. Nunca sobre el texto.
- Animación al entrar (una sola vez): el chorro se "estira" hacia abajo (~0,6 s, `scaleY` desde
  arriba) y las gotas caen en cascada; la mancha aparece de opacidad 0 a la final en ~1,2 s.
  Después queda todo fijo. Con movimiento reducido, todo aparece directamente en su lugar.

## Pecados capitales: `pecados`

- Los siete pecados **sueltos por la página**, como las ranas: en los huecos y los bordes, rotados,
  algunos verticales pegados al margen y cortados apenas por el borde.
- Tipografía de misterio: número romano en **IM Fell English SC** y el nombre en **IM Fell English
  itálica** (Google Fonts), en rojo sangre oscuro (`#a8261c` aprox.) con un leve filtro de tinta
  corrida. Son decorativos: no rigen las reglas de contraste del texto.
- **En el orden de la película**: I. Gula · II. Avaricia · III. Pereza · IV. Lujuria · V. Soberbia ·
  VI. Envidia · VII. Ira. Del I al V se ven nítidos; **VI y VII casi borrados** (opacidad baja), al pie.
  El que vio la película entiende; al que no, no se le spoilea nada.
- Al entrar, aparecen de a uno en ese orden (cada ~250 ms), como si alguien los fuera escribiendo.
- Fondo con líneas de lluvia muy tenues en diagonal (la ciudad donde nunca para de llover).
- Sección de la página: "POLICIALES" en vez de "AVISOS".

## Texto del producto (borrador)

- **Art. N° 003 · Ciudad sin nombre**
- Nombre: **Envío a domicilio**
- Película: *Pecados capitales* (Se7en), David Fincher, 1995
- Bajada: "Entrega garantizada en siete días. Llueva o llueva."
- Descripción: "Embalaje de cartón reforzado, cinta y sin remitente. Se entrega en mano. No pregunte qué hay adentro."
- Watch closer: "Una ciudad donde nunca para de llover, un detective a siete días de jubilarse y una lista que alguien completa en orden."
- Regla de spoilers: la remera es sobre el final, pero los textos solo lo insinúan. Nada de "caja",
  "cabeza" ni "desierto" escritos en la ficha.
