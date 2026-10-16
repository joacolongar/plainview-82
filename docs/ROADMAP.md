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

## Páginas

| Ruta | Qué tiene |
|---|---|
| `/` | Portada tipo titular, CTA a catálogo y juego, últimos "estrenos" |
| `/catalogo` | Grilla de remeras, filtro por director (luego película, década, color) |
| `/producto/:slug` | Fotos, precio, talles, color, bloque "Watch closer: la referencia", agregar al pedido |
| `/carrito` | Lista editable, nota, botón "Enviar pedido por WhatsApp" |
| `/juego` | ¿De qué película es? — pistas propias, opciones, puntaje, link a la remera |
| `/como-comprar` | Pasos, guía de talles, pagos, envíos y cambios |
| `*` | 404 "Esta escena se cortó en el montaje" |

---

## Etapa 0 — Base (1 sesión)
- [x] S1. Proyecto Vite + React + TS + Tailwind + Router, páginas vacías, carrito y WhatsApp funcionando con datos de ejemplo, CLAUDE.md
- [ ] S1b. Crear repo en GitHub, primer push y deploy en Cloudflare Pages/Netlify (sitio "en construcción" online)

## Etapa 1 — Identidad y catálogo (4 sesiones)
- [ ] S2. Tipografías (Google Fonts), logo en SVG con el 8:2 rojo, header/footer definitivos, favicon
- [ ] S3. Fotos: carpeta `public/products/`, galería en la ficha (varias fotos, zoom en mobile)
- [ ] S4. Ficha completa: guía de talles en modal, estados (disponible/preventa/próximamente), productos relacionados
- [ ] S5. Catálogo: filtros por película, director y década en la URL (`?director=...`), orden, estado vacío

## Etapa 2 — Pedidos por WhatsApp (2 sesiones)
- [ ] S6. Carrito pulido: contador animado, quitar ítem, validaciones, número real en `.env`, probar en celular
- [ ] S7. Datos del pedido (nombre, zona, envío/retiro) en un mini formulario que se suma al mensaje; página "Cómo comprar" completa

## Etapa 3 — El juego (3 sesiones)
- [ ] S8. Modo "función del día": una pista diaria igual para todos (elegida por fecha), intentos limitados
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
