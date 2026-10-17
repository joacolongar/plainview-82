# Ambientaciones: cada página del catálogo tiene su propia vida

Cada aviso comercial (ficha de producto) puede tener una **ambientación**: un detalle visual de su
película que vive en la página. Es "Watch closer" aplicado al diseño: decora, no distrae.

Maqueta: `docs/fichas-ambientadas.png` (375 px). Ilustraciones: `web/public/ilustraciones/ambientacion/`.

## Reglas comunes

- Un campo opcional en cada producto: `ambientacion?: 'ranas' | 'cafe' | 'pecados'`.
  Un componente `<Ambientacion tipo=… />` por tipo, dentro del layout de la ficha.
- **Lo que se queda en la página nunca tapa texto, precio ni botones.** Vive en los bordes (cortado por
  el costado de la hoja, como en la maqueta) o en los huecos vacíos, y puede pasar por encima de la foto,
  nunca de una palabra. **Lo que pasa una sola vez y se va** (las ranas) puede cruzar por encima de todo.
  Siempre `pointer-events: none` y `aria-hidden="true"`: nunca bloquea un toque.
- **Poco es más:** de 3 a 7 elementos por página, nunca llenarla.
- **Movimiento:** solo `transform` y `opacity`. Con `prefers-reduced-motion` no hay ninguna animación:
  lo que solo existe en movimiento (ranas, pocillo) no aparece y lo que se queda (mancha, pecados) se ve
  quieto en su lugar.
- **Rendimiento:** SVG livianos; lo que ya pasó se saca de la página (no queda invisible).
- Mobile-first a 375 px: en celular, menos elementos y más chicos. Lo que asoma por el borde se recorta
  con `overflow: clip` en la capa decorativa, sin scroll horizontal. Nunca `overflow: hidden` en la página:
  rompe el botón pegado abajo (`sticky`).

## Magnolia: `ranas`

- 5 ranas (`rana.svg`) de 50 a 80 px, opacidad completa.
- **Una sola pasada al entrar a la página:** caen de arriba abajo cruzando la pantalla (no la página: se
  ven aunque la persona esté a mitad de scroll) y salen por abajo. Cada una con su velocidad (de 2,5 a 4 s),
  su retraso y un leve giro y desvío mientras cae, para que no caigan en fila.
- Pueden pasar por encima de todo, incluido el texto, porque pasan y se van.
- No se repiten: cuando sale la última, se sacan de la página. Vuelven solo si se entra de nuevo.
- Con movimiento reducido no aparecen.

## Casablanca: `cafe`

- Un **pocillo** blanco (bajo y ancho, sin sombreado gris) volcado (`taza-derramada.svg`),
  **bastante escondido**: asoma cortado por el borde derecho, casi solo el borde y la boca.
- Del borde sale un **chorro de café que está cayendo**, seguido de tres gotas en el aire, cada vez
  más chicas.
- La mancha (`mancha-cafe.svg`) va **justo debajo de las gotas**, siguiendo su rastro: donde
  caerían, sobre el borde inferior de la foto. Con `mix-blend-mode: multiply` para que parezca absorbida
  por el papel. Nunca sobre el texto.
- **Secuencia al entrar (una sola vez):**
  1. 0–0,5 s: el pocillo aparece asomando por el borde (entra apenas desde la derecha).
  2. 0,5–1,1 s: el chorro se estira hacia abajo (`scaleY` desde arriba).
  3. 1,1–1,9 s: las gotas caen en cascada.
  4. 1,5–2,5 s: la mancha aparece donde caen las gotas, y **se queda fija**.
  5. 2,5–3,3 s: el pocillo, el chorro y las gotas se desvanecen (~0,8 s, unos 2 s después de aparecer)
     y se sacan de la página. Queda solo la mancha.
- Con movimiento reducido se ve solo la mancha, quieta.

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
