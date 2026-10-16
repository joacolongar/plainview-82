# Roadmap — Plainview 8:2

Sesiones de 1 a 2 horas. Cada una termina con algo que funciona y un commit.
Usá `/sesion` en Claude Code para arrancar y `/cierre` para terminar.

## Stack elegido (y por qué)

| Parte | Elección | Por qué |
|---|---|---|
| Frontend | Vite + React 19 + TypeScript | Ya sabés React; TS te ahorra bugs en el catálogo y el carrito y suma al CV |
| Estilos | Tailwind v4 con tokens propios | Rápido para iterar la estética de diario sin pelear con CSS |
| Rutas | React Router 7 | Estándar, simple para un sitio de pocas páginas |
| Catálogo | Archivo `products.ts` en el repo | Con pocos productos no hace falta base de datos; editás y deployás |
| Pedidos | Link `wa.me` con mensaje armado | Cero backend, cero comisiones; el pago se coordina por chat |
| Hosting | Cloudflare Pages o Netlify (gratis) | Deploy automático en cada push; `public/_redirects` ya resuelve las rutas |
| Backend (después) | FastAPI + websockets | Tu terreno en Python; se suma solo cuando haga falta (stock, ranking, duelos) |

## Concepto: La Edición

El sitio es un **diario viejo mezclado con un catálogo de venta por correo del lejano oeste**: vas pasando
las páginas. Cada drop sale como una **edición** con número y fecha, y cada remera es un **artículo**
del catálogo, con número, precio, descripción y detalles. El "Watch closer" es la forma de leer: mirar
cada página de cerca.

| Pieza de tienda | En La Edición | Ejemplo |
|---|---|---|
| Portada | Primera plana | Cabecera, fecha de hoy, "Edición N° 1" |
| Drop / colección | Edición | "Edición N° 1 · Córdoba · 16 oct 2026" |
| Catálogo | Índice de avisos + un aviso por página que se pasa deslizando | "Art. N° 001 — Magnolia" |
| Remera | Aviso comercial estilo catálogo por correo | Titular grande, precio en recuadro, grabado, texto de aviso, tabla de medidas, cupón "Recorte y agregue a su pedido" |
| Referencia | Recuadro "Fe de erratas: mirá de nuevo" | Se despliega al tocarlo |
| Estado | En existencia / Por encargo / Próximo número | disponible / preventa / próximamente |
| Juego | Pasatiempos | El Cifrado, Cinedoku, Crucigrama Mini, Mirá de Cerca y La Función del Día (ver `docs/PASATIEMPOS.md`) |
| Cómo comprar | Avisos clasificados | Pagos, envíos, talles y cambios como avisos |
| Carrito | Boleta de pedido | Cupón recortable que se envía por WhatsApp |
| Footer | Pie de página + pie de imprenta | "← pág. anterior · Índice · pág. siguiente →", fecha, staff, @plainview.82 |
| 404 | Fe de erratas | "Esta escena se cortó en el montaje" |

Estética: papel crema sobre fondo oscuro, tipografías de época, rojo (`--color-red`) solo para el 8:2 y acentos.

Reglas del concepto:
- Mobile-first (ver CLAUDE.md): las páginas del catálogo se pasan con el dedo, pero también con botones
  anterior/siguiente y con las flechas del teclado; nada depende solo del gesto.
- Cada página del catálogo tiene **URL propia** (se puede compartir un artículo por WhatsApp o Instagram).
  Las rutas viejas (`/producto/:slug`) redirigen a la nueva, para no romper links ya compartidos.
- Comprar nunca queda escondido detrás de la metáfora: precio, talle y botón siempre a la vista.
- Todo con CSS y los tokens de `index.css` (filetes, capitulares, View Transitions); sin librerías nuevas.

### Todo el sitio es el diario: `NewspaperPage`
- **Layout común** para todas las rutas (reemplaza a `Layout.tsx`). La portada conserva la cabecera grande
  (`Masthead`) y es la pág. 1; el resto lleva una **cabecera chica**: logo giratorio en su recuadro oscuro,
  "THE PLAINVIEW", número de página y nombre de la sección.
- **Pie de página:** "← pág. anterior · Índice · pág. siguiente →", la fecha y el pie de imprenta.
- **Orden de páginas** en `src/data/paginas.ts`, armado a partir de productos y secciones: Primera plana →
  Índice de avisos → un aviso por producto (por `articleNo`) → Pasatiempos → Clasificados → Boleta.
  El número de página es la posición en esa lista; el 404 (Fe de erratas) queda afuera.
- **Pasar de página:** deslizando en el celular (pointer events nativos, umbral ~60px y solo si el gesto es más
  horizontal que vertical), con ← → en la compu (salvo con el foco en un campo o un tablero) y siempre con los
  botones del pie.
- **Transición de hoja:** View Transitions API (la prop `viewTransition` de React Router 7 + CSS
  `::view-transition-*`), un deslizamiento sutil con sombra según la dirección. Con reduced motion o sin soporte
  del navegador, cambia sin animación. Con una URL por página, navegar entre rutas es más simple que un
  carrusel con `scroll-snap`.

## Páginas

| Ruta | Qué tiene |
|---|---|
| `/` | Primera plana: cabecera con logo, fecha de hoy y "Edición N° 1", titular del drop, artículos destacados, recuadro de pasatiempos |
| `/catalogo` | Índice de avisos: sumario con N° de página, nombre y precio; filtros en la URL |
| `/catalogo/:slug` | Aviso comercial: titular grande, precio en recuadro, grabado, texto de aviso irónico, tabla de medidas, "Fe de erratas: mirá de nuevo", cupón "Recorte y agregue a su pedido" (talle, color, agregar); se pasa a la página anterior/siguiente |
| `/producto/:slug` | Redirige a `/catalogo/:slug` |
| `/carrito` | Boleta de pedido: cupón recortable editable, nota, "Enviar boleta por WhatsApp" |
| `/pasatiempos` | Pasatiempos: una página con El Cifrado, Cinedoku y Crucigrama del Valle de la edición numerada vigente, y el Carnet de lector al pie (maqueta en `docs/pasatiempos-maqueta.png`) |
| `/juego` | La Función del Día (versión de prueba, hasta P6) |
| `/como-comprar` | Avisos clasificados: pasos, guía de talles, pagos, envíos y cambios |
| `*` | Fe de erratas (404) |

---

## Etapa 0 — Base (1 sesión)
- [x] S1. Proyecto Vite + React + TS + Tailwind + Router, páginas vacías, carrito y WhatsApp funcionando con datos de ejemplo, CLAUDE.md
- [x] S1b. Crear repo en GitHub, primer push y deploy en Cloudflare Pages/Netlify (sitio "en construcción" online)

## Etapa 1 — La Edición: identidad, diario y catálogo (9 sesiones)
- [x] S2a. Logo giratorio (`RotatingLogo`, 3D con `rotateY`, fijo con prefers-reduced-motion) y colores exactos de la marca en `@theme` (rojo `#c84030`, crema `#ece6d8`, fondo `#0e0d0b`)
- [x] S2. Primera plana del diario "THE PLAINVIEW": tipografías de época (UnifrakturMaguntia, Anton, Old Standard TT), hoja crema con textura sobre el fondo oscuro, cabecera (Watch closer, logo, "Vol. 8 · Córdoba · No. 2" y fecha de hoy), noticias en `src/data/noticias.ts` (principal + secundarias + clima, clasificados y pasatiempos)
- [x] S2b. Datos editoriales: `src/data/editions.ts` (número, fecha, titular) del que leen la franja y la cabecera ("Vol. 8 · No. 2" queda fijo como marca y se suma "Edición N°"); campos del aviso en `Product` (`articulo`, `titular`, `bajada`, `aviso`, `epigrafe`, con borradores) y "Art. N° 001" en las cards; favicon y apple-touch-icon con el 8:2 + `theme-color`
- [ ] S3. `NewspaperPage`: layout común para todas las rutas (cabecera chica con logo, N° de página y sección; pie "← pág. anterior · Índice · pág. siguiente →" con fecha y pie de imprenta), orden de páginas en `src/data/paginas.ts`
- [ ] S3b. Pasar de página: deslizar en el celular (pointer events), flechas ← → en la compu, transición de hoja con View Transitions (`viewTransition` de React Router), sin animación con reduced motion
- [ ] S4. Aviso comercial (1/2): ruta `/catalogo/:slug` (`/producto/:slug` redirige), titular grande, precio en recuadro, grabado (placeholder `engraving`), texto de aviso irónico (campo `aviso` en `Product`), estados; productos encadenados como páginas del catálogo
- [ ] S4b. Aviso comercial (2/2): tabla de medidas (datos reales por talle), cupón "Recorte y agregue a su pedido" (talle, color, agregar; pegado abajo en mobile), recuadro "Fe de erratas: mirá de nuevo"
- [ ] S5. Índice de avisos en `/catalogo` (sumario con N° de página, filtros por película, director y década en la URL) y 404 como "Fe de erratas"
- [ ] S5b. Fotos: carpeta `public/products/` en WebP, galería en el aviso con epígrafes (zoom con un toque en mobile)

## Etapa 2 — Pedidos por WhatsApp (2 sesiones)
- [ ] S6. Boleta de pedido (página del diario): cupón recortable (borde punteado, tijera), quitar ítem, validaciones, "Enviar boleta por WhatsApp" pegado abajo, campo de cupón (de los pasatiempos) en el mensaje, número real en `.env`, probar en celular
- [ ] S7. Datos del pedido (nombre, zona, envío/retiro) completados en la boleta y sumados al mensaje; página "Clasificados" (cómo comprar) completa dentro de `NewspaperPage`

## Etapa 3 — Pasatiempos (6-8 sesiones, diseño en `docs/PASATIEMPOS.md`)
Numeradas P1–P6 para no renumerar S11 y S12. Contenido por **edición numerada** (`web/src/data/pasatiempos/edicion-NN.json`),
generado y validado con `python3 scripts/pasatiempos.py generar|validar N`.
- [x] P1. Marco de la página Pasatiempos (`/pasatiempos`, hoja del diario según la maqueta) + Carnet de lector (sellos en localStorage) + carga del JSON con tipos
- [x] P2a. El Cifrado jugable: clave decodificada (base64 → `atob` + `TextDecoder`), 27 glifos SVG propios, mensaje por palabras, lista de símbolos de 44 px, teclado A–Z + Ñ pegado abajo (también teclado físico), la letra se mueve si ya estaba usada, resolución con carta + cupón y sello en el carnet
- [x] P2b. El Cifrado, ayudas: pistas del editor (revela una letra a elección), "Verificar" (marca errores, cada uso cuenta), "Me rindo" (solución sin sello)
- [x] P3. Cinedoku (1-2 sesiones): grilla 6×6, teclado de 6 letras, modo lápiz, verificación, fila oculta ZODIAC
- [x] P4a. Crucigrama del Valle escribible: grilla 8×15 (celdas de 41 px), tocar resalta la palabra y otro toque cambia la dirección, teclado nativo con input oculto (centinela invisible para que "borrar" funcione en Android), tildes normalizadas, flechas en la compu, barra de pista fija arriba del teclado (`visualViewport`) con ‹ › y ✕, listas de pistas tocables, resolución con sello
- [x] P4b. Crucigrama, ayudas: pistas del editor (`pistasGratis` en el JSON), Verificar y Me rindo con `Ayudas.tsx`
- [x] P5. Sellos (oro/plata/bronce), tiempos y resultado para compartir; completar los tres desbloquea el mensaje del Cifrado
- [ ] P6. Mirá de Cerca y La Función del Día, cuando haya ilustraciones

## Etapa 4 — Lanzamiento (2 sesiones)
- [ ] S11. SEO: títulos por página, Open Graph con imagen de cada remera, sitemap, accesibilidad (teclado, contraste)
- [ ] S12. Analytics simple (Cloudflare/Plausible), dominio propio, revisión final en mobile, link en la bio de @plainview.82

## Etapa 5 — Backend opcional (3+ sesiones, cuando haga falta)
- [ ] S13. FastAPI en `api/`: endpoint `/products` y panel mínimo para cargar stock (el front pasa a leer de la API)
- [ ] S14. Ranking del juego guardado en la base (SQLite → Postgres si crece)
- [ ] S15. Modo duelo en vivo con websockets: dos personas, misma pista, gana el más rápido

---

## Bitácora
- 2026-10-16 — S1: proyecto inicializado con catálogo de ejemplo (Magnolia, Casablanca), carrito con WhatsApp, juego de 3 rondas y CLAUDE.md. Pendiente: repo en GitHub y deploy (S1b).
- 2026-10-16 — Concepto: se eligió "La Edición" (el sitio como diario de cine) entre tres propuestas (Edición, Expediente, Moviola). Se reescribieron las Etapas 1 a 3 y se sumó S2b (datos editoriales + tapa). Ideas guardadas para más adelante: la lupa/revelado del Expediente y el zoom progresivo de la Moviola como mecánica de juego. Pendiente: fotos reales, precios y textos editoriales de cada remera.
- 2026-10-16 — S1b: repo público en https://github.com/joacolongar/plainview-82 y deploy automático en Cloudflare Pages (root `web`, build `npm run build`, salida `dist`, Node 22 por `.nvmrc`, `VITE_WHATSAPP_NUMBER` como variable de entorno). Online en https://plainview-82.pages.dev con la franja "Número de prueba" (`IS_PREVIEW` en `config.ts`, pasar a false en S12). `gh` instalado en `~/.local/bin` (sin apt). Verificado: rutas directas responden 200 y el número llega al build. Pendiente: probar en el celular el carrito → WhatsApp de punta a punta.
- 2026-10-16 — Mobile-first (fuera de plan): reglas nuevas en CLAUDE.md y repaso de todas las páginas a 375px. El header desbordaba y ensanchaba todo el sitio: ahora en mobile va logo + pedido arriba y secciones en una fila. Botones de 44px o más, barra de compra y de WhatsApp pegadas abajo con `sticky` (ficha y carrito), selects/textarea a 16px para que iPhone no haga zoom, `viewport-fit=cover` para el área segura. Verificado midiendo cada ruta en un iframe de 375px (sin desbordes ni elementos tocables chicos). Pendiente: probar en un celular real, incluido el carrito → WhatsApp de punta a punta (viene de S1b). Próxima sesión: S2, cabezal del diario (ya respetando las reglas mobile-first).
- 2026-10-16 — S2a: logo giratorio en el header (`RotatingLogo`: 5 s el 8:2, giro de 0,6 s, 5 s PLAINVIEW; con reduced motion queda PLAINVIEW fijo). Los PNG de `public/brand/` se recortaron y exportaron a WebP a 3x (`public/logo/`, ~13 KB c/u) para que las dos caras tengan peso parecido. Tokens con los colores exactos del logo. Verificado a 375px: nítido, sin desbordes y el layout no se mueve durante el giro. Se reescribió el concepto: diario viejo + catálogo de venta por correo del lejano oeste, catálogo de a una página por artículo con URL propia, "Avisos clasificados" y "Boleta de pedido". Pendiente: el crema sobre rojo da 3,99:1 de contraste (AA pide 4,5:1 en texto chico), revisar en S11 o usar texto más grande/negrita en botones rojos; decidir qué hacer con `public/brand/` (se publica con el sitio). Próxima sesión: S2, primera plana.
- 2026-10-16 — S2: la portada es la primera plana de "THE PLAINVIEW". En `/` la cabecera del diario reemplaza al header compacto (nav extraído a `SiteNav`, con variante sobre papel). Noticia principal: Petróleo sangriento (sin remera todavía, lleva al catálogo); secundarias Casablanca, Millonario y Rocky III; Magnolia como columna del clima. Reglas de las noticias en CLAUDE.md. El logo va en un recuadro oscuro porque su cara PLAINVIEW es crema. El adelanto de Pasatiempos no muestra pistas (las tres películas del juego salen en las noticias). Verificado a 375×667: titular, bajada e ilustración con epígrafe entran en la primera pantalla (epígrafe en 641px), sin desbordes ni titulares cortados en ninguna ruta; desktop y reduced motion revisados. Pendiente: favicon y pie de imprenta (pasan a S2b); ilustración real del grabado; revisar los borradores de `noticias.ts`; probar en celular real. Próxima sesión: S2b.
- 2026-10-16 — Diseño (sin código): todo el sitio pasa a ser el diario THE PLAINVIEW con un layout común `NewspaperPage` (cabecera chica con N° de página y sección, pie con paginación), páginas que se pasan deslizando o con flechas y transición de hoja con View Transitions (reemplaza al `scroll-snap` planeado). La ficha pasa a ser un aviso comercial estilo catálogo por correo; catálogo = índice de avisos, carrito = boleta, cómo comprar = clasificados, 404 = fe de erratas. Etapa 1 reorganizada (S3–S5b) y Etapa 3 reemplazada por P1–P6 según `docs/PASATIEMPOS.md` (Cifrado → Cinedoku → Crucigrama → Mirá de Cerca, con base común antes y La Función del Día al final). Pendiente: definir el premio del carnet de lector, conseguir medidas reales por talle (S4b) y el arte para Mirá de Cerca (P5). Próxima sesión: S2b.
- 2026-10-16 — P1: llegó `pasatiempos.zip` con un diseño nuevo de los pasatiempos (ediciones numeradas, `scripts/pasatiempos.py` que genera y valida, sellos oro/plata/bronce, maqueta a 390px); su `PASATIEMPOS.md` reemplazó al anterior y la Etapa 3 sigue su orden. `validar 1` da OK. Página `/pasatiempos` sobre la hoja crema según la maqueta: cabecera de página (Pág. 6 fija hasta S3), título, las tres secciones con datos leídos del JSON (`import.meta.glob` + tipos en `src/data/pasatiempos/`) y recuadro "En imprenta", link a La Función del Día (`/juego`, versión de prueba) y Carnet de lector con sellos desde localStorage (`pv82-pasatiempos-01`, con versión y try/catch; datos corruptos se descartan). El nav y la portada llevan a `/pasatiempos`. Verificado a 375px: sin desbordes ni elementos tocables chicos. Pendiente (decidir antes de P2–P4): RANAS spoilea el final de Magnolia; las pistas de TIGRE y BATIDO aluden a frases célebres (regla de citas); el crucigrama 11×13 deja celdas de ~30px (< 44px); el cupón BATIDO se lee en el JSON público. Próxima sesión: P2, El Cifrado.
- 2026-10-16 — Decisiones antes de P2: RANAS fuera del crucigrama (spoiler) y entra CONCURSO; TIGRE y BATIDO se quedan; regla de contenido en CLAUDE.md (alusiones sí, diálogo textual nunca, spoilers solo como guiño velado). Crucigrama a 8 columnas (≈42px por celda a 375px), palabras de más de 8 letras solo en vertical, alto máximo 15: entran 11 palabras (afuera CASABLANCA, PREDICADOR, FINCHER). El JSON del Cifrado ya no trae mensaje ni cupón en claro (texto cifrado + clave en base64); el cupón pasa a TORRE porque BATIDO es palabra del crucigrama, y `validar` falla si el cupón aparece en claro. Cupón: bajo valor, uno por pedido, cambia en cada edición, validado a mano (anotado en PASATIEMPOS.md). Edición 1 regenerada; `validar 1` OK. Próxima sesión: P2, El Cifrado.
- 2026-10-16 — Pistas del crucigrama corregidas (ROCKY, TIGRE y CONCURSO nombraban otras respuestas; RICK aludía a una pista de CASABLANCA, que no entró) y regla nueva en `validar`: ninguna pista puede contener una respuesta de la grilla. Edición 1 regenerada, misma grilla; `validar 1` OK.
- 2026-10-16 — P2a: El Cifrado se juega de punta a punta en `/pasatiempos` (componente `pasatiempos/Cifrado.tsx`, glifos en `pasatiempos/glyphs/Glifo.tsx`). El progreso se subió a la página para que el Carnet se actualice al ganar el sello; el sello sale de `calcularSello` ("hasta 1 pista o 3 verificaciones" leído como ambas condiciones). Las celdas del mensaje miden 28×48 px (a 44 px el mensaje ocupaba más de 30 renglones); la alternativa de 44 px es la lista de símbolos. Al tocar una celda baja, la página sube para que no la tape el teclado. Verificado a 375×667 en Edge headless: sin desbordes, letra que se mueve, borrar, resolución con TORRE, sello Primera plana en el carnet y progreso que sobrevive a la recarga. Pendiente: P2b (pistas, Verificar, Me rindo); probar en celular real. Próxima sesión: P2b.
- 2026-10-16 — P2b: El Cifrado con ayudas. Pedir pista revela la letra del símbolo elegido y la deja fija (en gris e itálica; esa letra se deshabilita en el teclado); la primera pide un segundo toque porque baja el sello. Verificar marca los equivocados con ✗ y tachado (no solo color), cuenta cada uso y se desactiva sin letras. Me rindo (dos toques) muestra la carta con sello en blanco. Línea "Si lo resolvés ahora" con el sello en juego; los rombos de la cabecera muestran ◇ por pista usada. "Verificar" en rojo con texto de 19px en negrita (texto grande: el crema sobre rojo da 3,99:1 y alcanza el 3:1). Verificado en headless a 375×667: 1 pista + 2 verificaciones = Página central, 3 pistas = Clasificados, Me rindo = sello en blanco y persiste al recargar. Pendiente: probar en celular real; P5 suma tiempos y compartir. Próxima sesión: P3, Cinedoku.
- 2026-10-16 — P3: Cinedoku jugable (`pasatiempos/Cinedoku.tsx`). La botonera de ayudas se extrajo a `pasatiempos/Ayudas.tsx` y la usan Cifrado y Cinedoku; el script suma `pistasGratis: 3` al Cinedoku (edición 1 regenerada, resto idéntico). Grilla de celdas de 55 px con cajas 2×3, fila oculta sombreada, resaltado de fila/columna/caja y misma letra (sin marcar conflictos solos). Lápiz con interruptor, mantener apretado o Shift + letra; teclado pegado abajo. Pista revela la celda elegida, Verificar marca con ✗, Me rindo con sello en blanco; al resolver, la fila 4 se ilumina en rojo con ZODIAC. Verificado en headless a 375×667: impresas no editables, las tres formas del lápiz, sin ayudas = Primera plana, 1 pista + 2 verificaciones = Página central, Me rindo persiste al recargar. Pendiente: probar en celular real (sobre todo el mantener apretado). Próxima sesión: P4, Crucigrama del Valle.
- 2026-10-16 — P4a: Crucigrama escribible (`pasatiempos/Crucigrama.tsx` + `lib/crucigrama.ts`, que arma el mapa celda → palabras). El input oculto vive siempre en la página (fijo, 16 px para que iOS no haga zoom) para enfocarlo en el mismo toque que elige la celda; las celdas y los botones de la barra no le roban el foco (`preventDefault` en pointerdown) para que el teclado no se cierre. La letra se lee del evento `input` (en Android `keydown` dice "Unidentified") y el campo guarda un carácter invisible para que borrar genere evento. La barra sube con `visualViewport` para quedar arriba del teclado; las flechas ‹ › van en SVG porque la tipografía de época las dibujaba como paréntesis. Verificado en headless a 375×667: sin desbordes, tildes, cambio de dirección en cruces, borrar y retroceder, ‹ ›, flechas, resolver las 11 palabras = Primera plana y persiste al recargar. Pendiente: **probar en celular real** (teclado nativo y barra, que en headless no se pueden simular); P4b. Próxima sesión: P4b.
- 2026-10-16 — P4b: ayudas del Crucigrama con `Ayudas.tsx` (los tres juegos quedan completos). El script suma `pistasGratis: 3` al crucigrama (edición 1 regenerada, resto idéntico). Al perder el foco el input solo se esconde la barra: la celda elegida se mantiene, así "Pedir pista" sabe qué revelar. La pista deja la letra fija (itálica gris) y al escribir se saltea; borrar también la saltea. Verificar marca con ✗ y tachado; Me rindo con sello en blanco. Verificado en headless a 375×667: 1 pista + 2 verificaciones = Página central, 3 pistas = Clasificados, Me rindo persiste al recargar, salteo de la revelada (RCK → RICK). Pendiente: probar los tres juegos en celular real. Próxima sesión: P5 (sellos, tiempos y compartir; completar los tres desbloquea el mensaje del Cifrado).
- 2026-10-16 — P5: el cupón sale del mensaje cifrado (opción B): la carta ahora dice que quien complete los tres sabrá la palabra; el cupón va en `premio` (base64) y el validador falla si vuelve a aparecer en el mensaje. Edición 1 regenerada (clave, Cinedoku y Crucigrama idénticos: el progreso guardado sigue sirviendo). Cronómetro por juego (`useCronometros` en la página, con setState funcional y sin restar tiempo cuando un juego guarda una copia vieja): arranca con la primera jugada, se frena al resolver, no cuenta con la pestaña oculta. Tiempos en la línea del sello, en el recuadro de resuelto (`SelloResuelto`, compartido) y bajo cada sello del Carnet. Al completar los tres: tarjeta "Edición completa" con el cupón (solo sin "Me rindo") y el texto para compartir (`lib/resultado.ts`, host desde `window.location`); Compartir usa el menú nativo y si no hay, copia. Verificado en headless: tiempos, pestaña oculta, recarga, texto exacto, copia, sin cupón con un rendido, sin tarjeta con un solo juego. Pendiente: probar Compartir en celular real (menú nativo); P6 cuando haya ilustraciones. Próxima sesión: S2b (o P6 si llegan las ilustraciones).
- 2026-10-16 — S2b: `editions.ts` con la edición del drop (N° 1); la franja y la cabecera leen de ahí. Numeración: "Vol. 8 · Córdoba · No. 2" fijo (marca) + "Edición N° 1" (en mobile va en el hueco entre "Watch closer" y el logo, para que la cabecera no crezca: el epígrafe sigue en 641 px de 667). Los campos de aviso de `Product` quedaron en castellano (`articulo`, `titular`, `bajada`, `aviso`, `epigrafe`) en vez de kicker/headline/dek; borradores para Magnolia y Casablanca con la regla de contenido; `numeroArticulo()` y "Art. N° 001" en las cards. Favicon 32 px y apple-touch-icon 180 px recortados de `logo-8-2.webp` con el canvas de Edge; se borró el favicon de Vite; `theme-color` con el negro de la marca (único color escrito a mano, en el HTML). Verificado a 375 px: sin desbordes, primera pantalla intacta, íconos servidos. Pendiente: revisar los borradores de los avisos; probar en celular real. Próxima sesión: S3, `NewspaperPage`.
