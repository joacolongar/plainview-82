# Ideas — backlog

Estimación: S = 1 sesión · M = 2-3 · L = 4+. Nada de esto bloquea el lanzamiento.
Lo que ya se hizo o tiene sesión en el roadmap está al final, en "Hechas o planificadas".

## Catálogo y producto
- **Revelado al tocar** (S): la foto de la remera cambia a un detalle ampliado de la estampa (con un toque, no hover).
  Viene del concepto "Expediente": una **lupa** para explorar la estampa en el aviso comercial.
- **Drops como estrenos** (M): colecciones con fecha de "estreno" y cuenta regresiva en la portada; antes del
  estreno, la remera aparece censurada. Encaja con `editions.ts`.
- **Créditos** (S): en cada aviso, quién ilustró el diseño (para colaboraciones con ilustradores).
- **Filtro por color de remera** (S): sumarlo al índice de avisos (película, director y década ya están).
- **Grabados propios** (M): reemplazar los placeholders "Grabado en preparación" de la portada y los avisos por
  ilustraciones de la marca en estilo grabado.
- **Más avisos en la portada** (S): cuando haya más noticias, sumar minis a `PORTADA` en `anuncios.ts`
  (con 5 noticias solo entra 1 + el rojo sin pasar de 2 a la vista).

## Pasatiempos
- **Ranking del juego** (M): tiempos de La Función del Día guardados en una base (era la S14 del plan viejo con
  FastAPI; si vuelve, va con D1 en Cloudflare).
- **Duelo en vivo** (L): dos personas, misma pista, gana el más rápido (era la S15 con websockets; en Cloudflare
  serían Durable Objects).
- **Zoom progresivo** (M): del concepto "Moviola": un detalle de estampa muy ampliado que se va alejando en cada
  error. Puede ser la mecánica de Mirá de Cerca o de La Función del Día (P6).
- **Premio por completar el carnet** (S): está sin definir (ver docs/PASATIEMPOS.md).
- **Cinedoku "fácil" de 4×4** (S): con una palabra de 4 letras distintas (por ejemplo RICK).
- **Hemeroteca** (M): poder jugar ediciones anteriores de los pasatiempos.
- **Cupón por racha** (S): completar varias ediciones seguidas = descuento.
- **Contenido de las ediciones fuera del repo público** (S): hoy el mensaje del Cifrado y el cupón están en claro en
  `scripts/pasatiempos.py`. Se podrían leer de un archivo no commiteado o generar en el deploy.
- **Duelo en vivo con websockets** (L): salas de 2, misma pista, puntaje por velocidad (S15). Ideal para el CV.

## Marca y comunidad
- **Easter egg "watch closer"** (S): escribir "watch closer" en cualquier página revela algo.
- **Votación del próximo diseño** (M): la comunidad elige entre 3 bocetos.
- **Feed de Instagram** enlazado en la portada (S). Si se embebe, hay que sumarlo a la CSP de `_headers`.

## Técnicas (para aprender)
- **Tests con Vitest** (S): `buildOrderMessage` (con N° de artículo), `armarColumnas` de la portada, `calcularSello`,
  `textoResultado`, `normalizarLetra`. Preguntar antes de sumar la dependencia.
- **GitHub Actions** (S): build + lint + `python3 scripts/pasatiempos.py validar` en cada PR (y en los de Dependabot).
- **Autoalojar las tipografías** (S): servir las fuentes desde el sitio en vez de Google Fonts (privacidad, sin
  depender de Google); después ajustar la CSP. Buen candidato para S11.
- **Trusted Types en la CSP** (S): un paso más contra inyección de HTML.
- **`srcset` y AVIF** (S): cuando lleguen las fotos (S5b).
- **Deuda chica** (S): `Product.description` ya no se muestra (lo reemplazó `aviso`): borrarlo o usarlo.

## Hechas o planificadas
- Ficha "expediente" → hecha como **aviso comercial** con "Fe de erratas: mire de nuevo" (S4–S4b).
- 404 con referencia de cine → **Fe de erratas** "esta escena se cortó en el montaje" (S5).
- Filtros por director y década → hechos en el índice de avisos (S5).
- Optimización de imágenes → logos en WebP a 3x (S4.0); fotos en S5b.
- Función del día tipo Wordle, pistas de paleta y modo "detalle" → **P6** (La Función del Día y Mirá de Cerca).
