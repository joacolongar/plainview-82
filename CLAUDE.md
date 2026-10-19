# Plainview 8:2 — sitio web

Marca de remeras con referencias sutiles a películas. Slogan: "Watch closer."
Sitio: el diario **THE PLAINVIEW** (concepto "La Edición", ver `docs/ROADMAP.md`): primera plana con noticias,
un aviso comercial por remera, pasatiempos y pedidos por WhatsApp (sin pasarela de pago).
Online en https://plainview-82.pages.dev (Cloudflare Pages, deploy automático en cada push a `main`).

## Cómo trabajamos
- El dueño del proyecto es estudiante de programación (React, Python, websockets) y trabaja en
  **sesiones de 1 a 2 horas**. Cada sesión cierra con algo que funciona y un commit.
- El plan vive en `docs/ROADMAP.md`. Al empezar, leelo y tomá la próxima sesión sin tildar.
  Al terminar, tildá lo hecho y anotá en "Bitácora" qué quedó pendiente.
- Explicá las decisiones cuando introduzcas algo nuevo: el proyecto también es para aprender.
  Preferí soluciones simples antes que librerías nuevas; preguntá antes de sumar dependencias.
- Textos de la interfaz en español rioplatense (vos), tono irónico y cinéfilo.
- **Commit y push solo con el OK del dueño.** Antes de commitear: `git add -A` (sin rutas a mano: un `git add`
  con una ruta que ya no existe falla y no agrega nada) y revisar `git status` / `git show --stat` que entre todo.
- **Archivos que llegan en un zip** (diseños, maquetas, ilustraciones, en la carpeta de diseño del Escritorio):
  descomprimir aparte, revisar (los SVG sin scripts ni recursos externos), copiar al proyecto **sin pisar nada** y,
  si algo ya existe, preguntar. Los zip y los HTML de demo no van a git (`.gitignore`).
  Los zips y archivos de diseño que me pasan están en la carpeta plainview, dentro de 1 DISEÑO en mi escritorio de
  Windows: `"/mnt/c/Users/Usuario/Desktop/1 DISEÑO/plainview"`. La ruta tiene espacios y Ñ, así que siempre entre
  comillas. `unzip` no está instalado: se descomprime con el módulo `zipfile` de Python (`python3 -I`), chequeando
  que ninguna ruta del zip se salga de la carpeta de destino.

## Estructura
- `web/` — frontend: Vite + React 19 + TypeScript + Tailwind v4 + React Router 7.
  - `src/data/products.ts` catálogo (por ahora estático, en el repo)
  - `src/data/game.ts` rondas del juego
  - `src/lib/whatsapp.ts` arma el mensaje del pedido y el link wa.me
  - `functions/api/pedido.ts` endpoint `POST /api/pedido` (Cloudflare Pages Functions, corre en el servidor; tipos en
    `tsconfig.functions.json`); `src/lib/pedido.ts` valida el pedido contra el catálogo y arma resumen y total
    (lo comparten servidor y boleta: no puede importar `config.ts` ni nada del navegador)
  - `src/pages/Boleta.tsx` la boleta de pedido (`/carrito`, con datos de entrega y Turnstile); `src/lib/boleta.ts` la
    envía a `/api/pedido` y guarda la última boleta enviada (sessionStorage); `src/lib/whatsapp.ts` arma el mensaje con
    la respuesta del servidor; `src/components/Turnstile.tsx` el widget; `src/lib/cupon.ts` el cupón de la edición
    vigente que compara el servidor (**al publicar una edición de pasatiempos nueva, actualizar su import**)
  - `src/context/CartContext.tsx` carrito (estado + localStorage con try/catch)
  - `src/App.tsx` rutas con el router de datos (`createBrowserRouter`, necesario para la transición de hoja)
  - `src/components/NewspaperPage.tsx` layout común: todo el sitio impreso en la hoja del diario (cabecera chica + pie);
    `src/lib/pasarPagina.ts` pasa de página deslizando o con ← → (los juegos se protegen con `data-no-swipe`)
  - `src/data/paginas.ts` orden y números de página del diario
  - `src/lib/edicion.ts` **la edición del día**: `elegirEdicion(fecha, banco)` (función pura, probada en
    `edicion.test.ts`) arma la portada; `numeroEdicion(fecha)` da el N° que muestran la cabecera, la franja y el pie.
    `src/lib/useFechaEdicion.ts` da la fecha (en desarrollo, `?fecha=AAAA-MM-DD` muestra otro día)
  - `src/data/banco.ts` el banco de la portada: noticias y avisos propios + las tandas `src/data/banco/banco-noticias-N.json`
    (se guardan tal cual llegan; las correcciones de largo van en `CORRECCIONES`)
  - `src/components/FeDeErratas.tsx` la Fe de erratas del aviso (se arma con `detalles` del producto) y el bloque
    "Watch closer"; `src/components/Galeria.tsx` las fotos del aviso; `src/data/fotos.ts` las encuentra solas
    (`import.meta.glob` sobre `src/assets/productos/<slug>/<slug>-N.webp`, la 1 es la principal)
  - `src/pages/AtencionAlLector.tsx` Atención al lector (`/atencion-al-lector`; `/como-comprar` redirige): cómo se compra,
    envíos y pagos, cambios y devoluciones y el Botón de arrepentimiento (`#arrepentimiento`, sale por WhatsApp)
  - `src/components/SiteNav.tsx` la barra de secciones (CATÁLOGO · PASATIEMPOS · ATENCIÓN AL LECTOR · BOLETA (n)),
    centrada entre los filetes de la cabecera y en Anton; a 375 px entra justo en un renglón: si se suma o se alarga
    una sección, medirla en 360 px
  - `src/pages/*` una página por ruta. Ojo con los nombres: `AvisoComercial.tsx` es la página de cada remera
    (`/catalogo/:slug`) e `IndiceAvisos.tsx` el índice (`/catalogo`); `components/Aviso.tsx` son los avisos *chicos*
  - `src/data/noticias.ts` (portada), `anuncios.ts` (avisos chicos y cuáles van en la portada), `medidas.ts` (talles),
    `pasatiempos/` (ediciones JSON + tipos); `src/components/pasatiempos/` los juegos y `Ayudas.tsx` (común)
  - `public/logo/` logos en WebP (los que usa el sitio), `public/ilustraciones/` SVG de los avisos,
    `public/brand/` PNG originales de la marca (en git, no los carga el sitio), `public/_headers` seguridad
- `api/` — quedó del plan viejo (FastAPI) y **no se usa**: la Etapa 5 va toda en Cloudflare (Pages Functions + D1,
  ver ROADMAP). Se borra cuando el dueño lo confirme.
- `docs/` — ROADMAP.md (plan por sesiones), IDEAS.md (backlog de ideas), PASATIEMPOS.md (diseño de los pasatiempos)
  y pasatiempos-maqueta.png (maqueta a 390px).
- `scripts/pasatiempos.py` — genera y valida las ediciones de pasatiempos (`web/src/data/pasatiempos/edicion-NN.json`).

## Comandos
```bash
cd web && npm install      # una vez
npm run dev                # http://localhost:5173
npm run build              # chequea tipos y compila
npm run lint               # oxlint
npm test                   # Vitest: pruebas (por ahora, la edición del día y los largos del banco)
npm run pages              # sitio compilado + Functions en http://localhost:8788 (secretos en web/.dev.vars, fuera de git)
python3 scripts/pasatiempos.py validar 1   # (desde la raíz) valida la edición 1 de pasatiempos
```

## Mobile-first
La mayoría de las visitas llegan desde el celular (links de Instagram).
- Diseñar primero a **375px** y después agrandar: las clases sin prefijo son para mobile; `md:`/`lg:` solo suman.
- Botones y elementos tocables de **al menos 44px** de alto/ancho (`min-h-11`, `min-w-11`).
- Acciones importantes (agregar al pedido, enviar por WhatsApp) **al alcance del pulgar**: abajo, fijas si hace falta.
- **Nada que dependa solo de hover**: todo lo que se revela al pasar el mouse tiene que poder abrirse con un toque.
- **Imágenes livianas**: tamaño justo, WebP/AVIF, `loading="lazy"` fuera de la primera pantalla.
- **Primera pantalla:** en la portada, titular, bajada e ilustración con epígrafe entran en **375×667**.
- Acciones pegadas abajo con `sticky` (no `fixed`): se quedan al alcance del pulgar y no tapan el pie de página.
- Revisar cada cambio a 375px antes de darlo por terminado.

## Reglas del proyecto
- Estética: hoja de papel hueso (`--color-paper` `#ebe3d1`, utilidad `paper` con textura) sobre fondo oscuro
  (`--color-ink`), tinta `--color-print`. Tipografías: UnifrakturMaguntia (cabecera), Anton (titulares),
  Old Standard TT (texto). Tokens en `web/src/index.css` (`@theme`). No hardcodear colores.
- **La mesa** (`docs/MESA.md`): **desde 768 px** el diario está apoyado sobre una mesa de madera
  (`public/texturas/mesa-madera.webp`): capas fijas `body::before` (madera) y `body::after` (luz cálida y viñeta)
  detrás de todo, y la hoja con sombra en capas. **Nunca rotar la hoja** (el texto se ve borroso). En celular, el fondo
  negro de siempre. La madera no se mueve al scrollear ni al pasar de página.
- **Rojo** (`--color-red` `#c84030`, el del logo) solo para acentos: bordes, filetes, el 8:2, rombos, estados activos.
  **Contraste:** sobre la hoja, texto rojo chico no llega al mínimo (3,9:1) → los activos se marcan con subrayado
  rojo y el texto va en tinta; en botones rojos el texto va en negrita de **19 px o más** (cuenta como texto grande).
- **Numeración:** "Vol. 8 · No. 2" es fijo (marca); la edición es la del día (`numeroEdicion`, `lib/edicion.ts`); el número de
  página, de `src/data/paginas.ts` (no escribirlo a mano). Los pasatiempos tienen su propia numeración de ediciones.
- **Productos:** precio en 0 se muestra como "Próximo número"; `precioDePrueba: true` marca un precio inventado
  (se lee "Precio de prueba" en el aviso y el índice, y "⚠ PRECIO DE PRUEBA" en Telegram y WhatsApp): antes de lanzar,
  precios reales y todos en `false` (la misma bandera marca como de prueba los `detalles` de la Fe de erratas); la ruta del aviso sale de `rutaAviso()` y los estados
  de `ESTADOS` (`products.ts`). Las medidas son **de ejemplo** mientras `MEDIDAS_DE_EJEMPLO` sea `true` (lo avisa la tabla).
- **Imágenes:** WebP a 3x del tamaño en pantalla (con pérdida para bloques de color plano); ilustraciones en SVG.
  Fotos de producto: para sumar una, alcanza con dejar el archivo en `src/assets/productos/<slug>/` (y su texto en
  `altFotos`); al menos 1500 px de ancho (se ven a ~500 px en la compu) y una foto por archivo. Sin `cwebp` ni Pillow:
  se convierten con el canvas de Edge headless. Mientras sean bocetos, `fotoBoceto: true` (sello "Prueba de imprenta").
- **Regla de contenido** (noticias, juegos, pasatiempos, avisos): textos e ilustraciones **propios**, nunca fotogramas
  ni afiches. Evita problemas de copyright y promociona las remeras.
  - **Alusiones sí:** se puede aludir a escenas y frases célebres (el ojo del tigre, el batido) con palabras propias.
  - **Diálogo textual nunca:** ninguna línea de una película copiada tal cual, ni entre comillas ni sin ellas.
  - **Spoilers solo como guiño velado:** se insinúan ("lluvias inusuales"), nunca se escriben como respuesta,
    palabra del crucigrama ni dato explícito.
- Las **noticias** de la portada (diario "THE PLAINVIEW") viven en `web/src/data/noticias.ts` (propias) y en las tandas
  del banco (`web/src/data/banco/`), y cuentan la premisa de la película como si pasara hoy, con la regla de arriba.
  Tono irónico de diario de época. Cada noticia y cada aviso llevan `pelicula` (id en minúsculas con guiones).
  - **Edición del día:** la portada cambia a la medianoche de Córdoba (N° 1 = 16/10/2026). Cada edición: 1 principal,
    3 o 4 secundarias, 1 aviso ilustrado y 2 de línea, sin repetir película y con al menos una película con remera.
    Una noticia no vuelve antes de 7 ediciones si el banco alcanza (las principales sí; las secundarias, con 14,
    vuelven cada 3 a 6: hacen falta unas 24 para los 7 días). Si se toca la elección, correr `npm test`.
  - **Largo:** la principal lleva titular, bajada de **una línea** (hasta 55 caracteres) y epígrafe (sin cuerpo); las
    secundarias, sección, titular y **2 o 3 oraciones**. Las pruebas lo chequean en todo el banco. Las noticias mandan: tienen que pesar más que los avisos.
- **Ambientaciones** (`docs/AMBIENTACIONES.md`, `src/components/ambientacion/`): cada aviso comercial puede llevar
  `ambientacion` (`'ranas' | 'cafe' | 'pecados'`), un detalle de su película que vive en la página. Reglas:
  - **Lo que se queda nunca tapa texto, precio ni botones:** va en los bordes (cortado por el borde de la hoja) o encima
    del grabado, nunca de una palabra. **Lo que pasa una sola vez y se va** (las ranas de Magnolia) puede cruzar por
    encima de todo. Siempre `aria-hidden` y `pointer-events: none` (componente `Capa`); lo que ya pasó se saca del DOM.
  - **Recorte con `overflow: clip` en la capa**, nunca `overflow: hidden` en la página: rompe el `sticky` del botón.
  - **Poco es más:** de 3 a 7 elementos, menos y más chicos en mobile. A 375 px el margen de la hoja mide 12 px.
  - **Movimiento:** suave y lento, **solo `transform` y `opacity`**, y solo dentro de `prefers-reduced-motion:
    no-preference` (`index.css`). Con movimiento reducido no hay animación: lo que solo existe en movimiento
    (ranas, pocillo) no aparece (`movimiento.ts` + opacidad 0 en el CSS) y lo que se queda (mancha, pecados) se ve quieto.
  - Se prueba con el script de superposición (cajas de cada trazo contra las de cada palabra y botón, y la columna
    entera para lo que cae por el margen), con y sin `--force-prefers-reduced-motion`.
- **Spoilers de la ficha de Pecados capitales (Se7en, Art. N° 003):** la remera es sobre el final, pero los textos solo
  lo insinúan. Nada de "caja", "cabeza" ni "desierto" escritos en la ficha (titular, bajada, aviso, epígrafe, Fe de
  erratas, avisos chicos ni alt). Los siete pecados van en el orden de la película, con VI y VII casi borrados.
- Los **avisos** chicos (`web/src/data/anuncios.ts`, tipos "mini" y "linea") van sueltos entre las noticias y en otras
  páginas, nunca en una página propia. Misma regla de contenido; los teléfonos terminan en el año de la película.
- El número de WhatsApp va en `web/.env` como `VITE_WHATSAPP_NUMBER` (ver `.env.example`). Nunca commitear `.env`.
- **Textos legales** (Atención al lector: envíos, cambios, arrepentimiento) son **borrador** mientras `BORRADOR_LEGAL`
  sea `true` (lo avisa cada sección). Antes de lanzar, que los revise alguien que sepa y pasar la bandera a `false`.
  El link "Botón de arrepentimiento" tiene que estar a la vista en la portada (Res. 424/2020): va en el pie de todas
  las páginas; no sacarlo.
- Antes de dar algo por terminado: `npm run build` y `npm run lint` sin errores (y `validar` si se tocaron pasatiempos).

## Cómo verificamos
- No hay extensión de Chrome conectada: se usa **Edge headless** de Windows
  (`/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`) contra `npm run dev`.
- Edge no deja la ventana por debajo de ~500 px: para probar a **375 px** se carga la página dentro de un
  **iframe de 375 px** (una página temporal `web/public/__*.html`, que se borra al terminar) y se mide con JS:
  `scrollWidth ≤ 375`, elementos tocables ≥ 44 px, posición de la primera pantalla, etc. Capturas con `--screenshot`.
- Con `--virtual-time-budget` las View Transitions no llegan a dibujarse: esas partes se prueban sin la API.
- **Contra `npm run pages`** (wrangler, para probar `/api`), el sitio sale con la CSP de `_headers`: la página de prueba
  va en `web/dist/` (no en `public/`) con el JS en un archivo aparte y el iframe con `width`/`height` como atributos
  (la CSP bloquea scripts en línea y el atributo `style`), y a la copia `dist/_headers` se le saca `frame-ancestors`
  y `X-Frame-Options` (el próximo build la regenera). Para que WhatsApp no cargue: `--host-resolver-rules="MAP wa.me 127.0.0.1:9"`.
  Cada pedido válido le llega al dueño por Telegram: simular la respuesta cuando no haga falta el servidor real.
- **Turnstile en headless:** el desafío real no se resuelve (iframe de otro sitio dentro de un shadow DOM): la lógica
  se prueba con un `window.turnstile` falso puesto antes de abrir la boleta (se entra por un aviso y se navega con el
  router, con `document.startViewTransition = undefined`). El widget real lo prueba el dueño en el navegador. La página
  de prueba también recibe la CSP: para usar un iframe propio, sumar `'self'` al `frame-src` de la copia `dist/_headers`.
- Lo que el headless no puede probar (teclado del celular, gestos reales, menú de compartir, animaciones)
  lo prueba el dueño en su teléfono; queda anotado como pendiente en la Bitácora.

## Seguridad
- **Secretos:** nunca en el repo ni en variables `VITE_`. Vite copia todo lo que empieza con `VITE_` dentro del JS
  que baja el navegador: cualquiera lo puede leer. `VITE_WHATSAPP_NUMBER` está bien porque es un número de contacto
  público; una clave de API, un token o una contraseña, jamás. Si algún día hace falta un secreto, va en el backend
  (Etapa 5) o en las variables de Cloudflare que no empiezan con `VITE_`.
- **`.env` nunca se commitea** (está en `.gitignore`). Revisado el 2026-10-17: no aparece en ningún commit.
- **Sin HTML ni código armado con texto:** prohibido `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`
  y `document.write`. Todo texto (incluida la URL en la Fe de erratas) se muestra con JSX, que lo escapa.
- **Cabeceras de seguridad** en `web/public/_headers` (Cloudflare Pages): CSP, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy` y `frame-ancestors 'none'`. La CSP permite solo lo que usamos (nuestro JS y CSS, Google Fonts,
  imágenes propias y `data:`). **Si se suma algo externo** (analytics, otra fuente, un script), hay que agregarlo
  a la CSP o el navegador lo bloquea. Nada de scripts ni estilos en línea en `index.html`.
- **Dependencias:** `npm audit` sin vulnerabilidades antes de lanzar; Dependabot (`.github/dependabot.yml`) abre PRs
  semanales para `web/`, y en GitHub están activadas las alertas y las actualizaciones de seguridad.
  **`@types/node` sigue a `web/.nvmrc`** (hoy Node 22 → `@types/node` `^22`): Dependabot no ofrece sus saltos mayores
  (`ignore` en `dependabot.yml`); se suben a mano y junto con `.nvmrc`. Los PR viejos de Dependabot se ponen al día
  con un comentario `@dependabot rebase` antes de mergear. Antes de mergear uno: que el build de Cloudflare pase y probar el sitio.
- **Pedidos verificados en el servidor** (Etapa 2, `POST /api/pedido` en Cloudflare Pages Functions):
  - El servidor **nunca confía en precios ni totales del cliente**: recibe solo slug, talle, color y cantidad, valida
    estrictamente contra `products.ts` (claves conocidas, valores permitidos, largos y cantidades máximas) y calcula el total.
  - Credenciales (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TURNSTILE_SECRET_KEY`) solo como variables/secretos de
    Cloudflare, **sin `VITE_`**. Nunca en el repo, en `.env` del front ni en respuestas del endpoint.
  - **Datos de entrega** (nombre, zona, envío/retiro): se validan en `validarDatos` (`src/lib/pedido.ts`, la comparten
    boleta y servidor): de 2 a 60 caracteres y sin caracteres de control ni de formato invisibles (`\p{Cc}\p{Cf}`:
    saltos de línea, marcas de dirección del texto), para que nadie disfrace el mensaje de Telegram o de WhatsApp.
  - **Turnstile** protege el envío: el widget (script cargado solo en la boleta, nunca en `index.html`) da un token que
    la función verifica con `siteverify` antes de avisar por Telegram. Cada token sirve una vez: la boleta reinicia el
    widget después de cada envío. Sin `TURNSTILE_SECRET_KEY` la función rechaza todo (503). Token rechazado: 403 con
    `codigo: 'turnstile'`. La CSP de `_headers` permite `https://challenges.cloudflare.com` en `script-src` y `frame-src`.
    La clave pública va en `VITE_TURNSTILE_SITE_KEY` (pública por diseño). En local, claves de prueba de Cloudflare:
    pública `1x00000000000000000000AA` y secreta `1x0000000000000000000000000000000AA` (siempre pasan; las `2x…`
    siempre fallan). WhatsApp se abre recién con la respuesta del servidor (N° de boleta).
  - **Cupón:** el servidor lo compara con el de la edición vigente y lo informa en Telegram (✔ / ✗); no rechaza el pedido.
- **Cupones y soluciones** de los pasatiempos viajan en el JS (ofuscados, no secretos): por eso son de bajo valor
  y se validan a mano por WhatsApp (ver docs/PASATIEMPOS.md).
