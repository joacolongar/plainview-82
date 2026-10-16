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
| Catálogo | Páginas que se pasan deslizando, un artículo por página, con índice | "Art. N° 001 — Magnolia" |
| Remera | Artículo | N° de artículo, precio, descripción, detalles (talles, color, la referencia) |
| Referencia | Recuadro "Fe de erratas: mirá de nuevo" | Se despliega al tocarlo |
| Estado | En existencia / Por encargo / Próximo número | disponible / preventa / próximamente |
| Juego | Pasatiempos | "La función del día" |
| Cómo comprar | Avisos clasificados | Pagos, envíos, talles y cambios como avisos |
| Carrito | Boleta de pedido | Cupón recortable que se envía por WhatsApp |
| Footer | Pie de imprenta | Staff, Córdoba, @plainview.82 |

Estética: papel crema sobre fondo oscuro, tipografías de época, rojo (`--color-red`) solo para el 8:2 y acentos.

Reglas del concepto:
- Mobile-first (ver CLAUDE.md): las páginas del catálogo se pasan con el dedo, pero también con botones
  anterior/siguiente y con las flechas del teclado; nada depende solo del gesto.
- Cada página del catálogo tiene **URL propia** (se puede compartir un artículo por WhatsApp o Instagram).
  Las rutas viejas (`/producto/:slug`) redirigen a la nueva, para no romper links ya compartidos.
- Comprar nunca queda escondido detrás de la metáfora: precio, talle y botón siempre a la vista.
- Todo con CSS y los tokens de `index.css` (`scroll-snap` para deslizar, filetes, capitulares); sin librerías nuevas.

## Páginas

| Ruta | Qué tiene |
|---|---|
| `/` | Primera plana: cabecera con logo, fecha de hoy y "Edición N° 1", titular del drop, artículos destacados, recuadro de pasatiempos |
| `/catalogo` | Índice del catálogo: lista de artículos con número, nombre y precio |
| `/catalogo/:slug` | Una página por artículo: N°, precio, descripción, detalles, fotos con epígrafe, "Fe de erratas", talles, "Agregar a la boleta"; se desliza a la anterior/siguiente |
| `/producto/:slug` | Redirige a `/catalogo/:slug` |
| `/carrito` | Boleta de pedido: cupón recortable editable, nota, "Enviar boleta por WhatsApp" |
| `/juego` | Pasatiempos: ¿de qué película es? — pistas propias, opciones, puntaje, link al artículo |
| `/como-comprar` | Avisos clasificados: pasos, guía de talles, pagos, envíos y cambios |
| `*` | 404 "Esta escena se cortó en el montaje" |

---

## Etapa 0 — Base (1 sesión)
- [x] S1. Proyecto Vite + React + TS + Tailwind + Router, páginas vacías, carrito y WhatsApp funcionando con datos de ejemplo, CLAUDE.md
- [x] S1b. Crear repo en GitHub, primer push y deploy en Cloudflare Pages/Netlify (sitio "en construcción" online)

## Etapa 1 — La Edición: identidad y catálogo (6 sesiones)
- [x] S2a. Logo giratorio (`RotatingLogo`, 3D con `rotateY`, fijo con prefers-reduced-motion) y colores exactos de la marca en `@theme` (rojo `#c84030`, crema `#ece6d8`, fondo `#0e0d0b`)
- [ ] S2. Primera plana: tipografías de época (Google Fonts), "hoja" de papel crema sobre el fondo oscuro, cabecera con fecha de hoy y "Edición N° 1", nav como secciones, footer "pie de imprenta", favicon con el 8:2
- [ ] S2b. Datos editoriales: `src/data/editions.ts` (número, fecha, titular), campos `articleNo`, `kicker`, `headline`, `dek`, `caption` en `Product`; portada armada como primera plana de la edición actual
- [ ] S3. Fotos: carpeta `public/products/` en WebP, galería en la página del artículo con epígrafes (zoom con un toque en mobile)
- [ ] S4. Catálogo por páginas (1/2): ruta `/catalogo/:slug` con un artículo por página (N°, precio, descripción, detalles, "Fe de erratas", estados), `/producto/:slug` redirige, guía de talles en modal
- [ ] S5. Catálogo por páginas (2/2): pasar páginas deslizando (`scroll-snap`), botones anterior/siguiente y flechas del teclado, la URL cambia con cada página, índice en `/catalogo` con filtros (película, director, década) en la URL

## Etapa 2 — Pedidos por WhatsApp (2 sesiones)
- [ ] S6. Boleta de pedido: cupón recortable (borde punteado, tijera), quitar ítem, validaciones, "Enviar boleta por WhatsApp" pegado abajo, número real en `.env`, probar en celular
- [ ] S7. Datos del pedido (nombre, zona, envío/retiro) completados en la boleta y sumados al mensaje; página "Avisos clasificados" completa

## Etapa 3 — Pasatiempos (3 sesiones)
- [ ] S8. "La función del día": una pista diaria igual para todos (elegida por fecha), intentos limitados, maquetada como la página de pasatiempos
- [ ] S9. Pistas progresivas (texto → detalle de la estampa → paleta de colores), racha guardada en localStorage
- [ ] S10. Compartir resultado (texto con emojis para Instagram/WhatsApp) y cupón al acertar ("WATCHCLOSER")

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
