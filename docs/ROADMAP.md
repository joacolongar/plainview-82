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

El sitio es un diario de cine. Cada drop sale como una **edición** con número y fecha, y cada remera
es una **nota**: titular, volanta, foto con epígrafe y un recuadro que invita a mirar de nuevo.
El "Watch closer" deja de ser un bloque suelto y pasa a ser la forma de leer el diario.

| Pieza de tienda | En el diario | Ejemplo |
|---|---|---|
| Drop / colección | Edición | "Edición N° 1 · Córdoba · 16 oct 2026" |
| Remera | Nota | Volanta "Magnolia · P. T. Anderson · 1999", titular, bajada, epígrafe |
| Referencia | Recuadro "Fe de erratas: mirá de nuevo" | Se despliega al tocarlo |
| Estado | En kioscos / En imprenta / Próxima edición | disponible / preventa / próximamente |
| Catálogo | Cartelera (secciones = filtros) | Sección "Directores", "Décadas" |
| Juego | Pasatiempos | "La función del día" |
| Carrito | Aviso clasificado | "Publicar aviso" manda el WhatsApp |
| Footer | Pie de imprenta | Staff, Córdoba, @plainview.82 |

Reglas del concepto:
- Las rutas no cambian (`/catalogo`, `/juego`…): son simples y no rompen links ya compartidos. Lo que cambia son los textos y el diseño.
- Comprar nunca queda escondido detrás de la metáfora: precio, talle y botón siempre a la vista.
- Todo con CSS y los tokens de `index.css` (columnas, filetes, capitulares); sin librerías nuevas.

## Páginas

| Ruta | Qué tiene |
|---|---|
| `/` | Tapa de la edición actual: cabezal con N° y fecha, titular del drop, notas en columnas, recuadro de pasatiempos |
| `/catalogo` | Cartelera: notas en columnas por secciones (director, película, década) |
| `/producto/:slug` | La nota: volanta, titular, bajada, fotos con epígrafe, recuadro "Fe de erratas: mirá de nuevo", talles, precio, "Agregar al aviso" |
| `/carrito` | Aviso clasificado editable, nota, botón "Publicar aviso por WhatsApp" |
| `/juego` | Pasatiempos: ¿de qué película es? — pistas propias, opciones, puntaje, link a la nota |
| `/como-comprar` | "Cómo suscribirse": pasos, guía de talles, pagos, envíos y cambios |
| `*` | 404 "Esta escena se cortó en el montaje" |

---

## Etapa 0 — Base (1 sesión)
- [x] S1. Proyecto Vite + React + TS + Tailwind + Router, páginas vacías, carrito y WhatsApp funcionando con datos de ejemplo, CLAUDE.md
- [ ] S1b. Crear repo en GitHub, primer push y deploy en Cloudflare Pages/Netlify (sitio "en construcción" online)

## Etapa 1 — La Edición: identidad y catálogo (5 sesiones)
- [ ] S2. Cabezal del diario: tipografías (Google Fonts), logo SVG con el 8:2 rojo, cabezal con N° de edición y fecha, nav como secciones, footer "pie de imprenta", favicon
- [ ] S2b. Datos editoriales y tapa: `src/data/editions.ts` (número, fecha, titular), campos `edition`, `kicker`, `headline`, `dek`, `caption` en `Product`; portada armada como tapa de la edición actual en columnas
- [ ] S3. Fotos: carpeta `public/products/`, galería en la ficha con epígrafes (varias fotos, zoom en mobile)
- [ ] S4. Ficha como nota: volanta + titular + bajada, recuadro "Fe de erratas: mirá de nuevo", estados En kioscos / En imprenta / Próxima edición, guía de talles en modal, "Notas relacionadas"
- [ ] S5. Cartelera: notas en columnas por secciones (película, director, década) con filtros en la URL (`?director=...`), orden, estado vacío ("Sin notas en esta sección")

## Etapa 2 — Pedidos por WhatsApp (2 sesiones)
- [ ] S6. Carrito como aviso clasificado: contador animado, quitar ítem, validaciones, "Publicar aviso por WhatsApp", número real en `.env`, probar en celular
- [ ] S7. Datos del pedido (nombre, zona, envío/retiro) en un mini formulario que se suma al aviso; página "Cómo suscribirse" completa

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
