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

## Estructura
- `web/` — frontend: Vite + React 19 + TypeScript + Tailwind v4 + React Router 7.
  - `src/data/products.ts` catálogo (por ahora estático, en el repo)
  - `src/data/game.ts` rondas del juego
  - `src/lib/whatsapp.ts` arma el mensaje del pedido y el link wa.me
  - `src/context/CartContext.tsx` carrito (estado + localStorage con try/catch)
  - `src/App.tsx` rutas con el router de datos (`createBrowserRouter`, necesario para la transición de hoja)
  - `src/components/NewspaperPage.tsx` layout común: todo el sitio impreso en la hoja del diario (cabecera chica + pie);
    `src/lib/pasarPagina.ts` pasa de página deslizando o con ← → (los juegos se protegen con `data-no-swipe`)
  - `src/data/paginas.ts` orden y números de página del diario; `src/data/editions.ts` edición del drop
  - `src/pages/*` una página por ruta. Ojo con los nombres: `AvisoComercial.tsx` es la página de cada remera
    (`/catalogo/:slug`) e `IndiceAvisos.tsx` el índice (`/catalogo`); `components/Aviso.tsx` son los avisos *chicos*
  - `src/data/noticias.ts` (portada), `anuncios.ts` (avisos chicos y cuáles van en la portada), `medidas.ts` (talles),
    `pasatiempos/` (ediciones JSON + tipos); `src/components/pasatiempos/` los juegos y `Ayudas.tsx` (común)
  - `public/logo/` logos en WebP (los que usa el sitio), `public/ilustraciones/` SVG de los avisos,
    `public/brand/` PNG originales de la marca (en git, no los carga el sitio), `public/_headers` seguridad
- `api/` — backend opcional (Etapa 5): FastAPI + websockets. No hace falta para lanzar.
- `docs/` — ROADMAP.md (plan por sesiones), IDEAS.md (backlog de ideas), PASATIEMPOS.md (diseño de los pasatiempos)
  y pasatiempos-maqueta.png (maqueta a 390px).
- `scripts/pasatiempos.py` — genera y valida las ediciones de pasatiempos (`web/src/data/pasatiempos/edicion-NN.json`).

## Comandos
```bash
cd web && npm install      # una vez
npm run dev                # http://localhost:5173
npm run build              # chequea tipos y compila
npm run lint               # oxlint
python3 scripts/pasatiempos.py validar 1   # (desde la raíz) valida la edición 1 de pasatiempos
```
Backend (cuando llegue la Etapa 5): `cd api && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload`

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
- **Rojo** (`--color-red` `#c84030`, el del logo) solo para acentos: bordes, filetes, el 8:2, rombos, estados activos.
  **Contraste:** sobre la hoja, texto rojo chico no llega al mínimo (3,9:1) → los activos se marcan con subrayado
  rojo y el texto va en tinta; en botones rojos el texto va en negrita de **19 px o más** (cuenta como texto grande).
- **Numeración:** "Vol. 8 · No. 2" es fijo (marca); la edición del drop sale de `src/data/editions.ts`; el número de
  página, de `src/data/paginas.ts` (no escribirlo a mano). Los pasatiempos tienen su propia numeración de ediciones.
- **Productos:** precio en 0 se muestra como "Próximo número"; la ruta del aviso sale de `rutaAviso()` y los estados
  de `ESTADOS` (`products.ts`). Las medidas son **de ejemplo** mientras `MEDIDAS_DE_EJEMPLO` sea `true` (lo avisa la tabla).
- **Imágenes:** WebP a 3x del tamaño en pantalla (con pérdida para bloques de color plano); ilustraciones en SVG.
- **Regla de contenido** (noticias, juegos, pasatiempos, avisos): textos e ilustraciones **propios**, nunca fotogramas
  ni afiches. Evita problemas de copyright y promociona las remeras.
  - **Alusiones sí:** se puede aludir a escenas y frases célebres (el ojo del tigre, el batido) con palabras propias.
  - **Diálogo textual nunca:** ninguna línea de una película copiada tal cual, ni entre comillas ni sin ellas.
  - **Spoilers solo como guiño velado:** se insinúan ("lluvias inusuales"), nunca se escriben como respuesta,
    palabra del crucigrama ni dato explícito.
- Las **noticias** de la portada (diario "THE PLAINVIEW") viven en `web/src/data/noticias.ts` y cuentan la premisa de
  la película como si pasara hoy, con la regla de arriba. Tono irónico de diario de época.
  - **Largo:** la principal lleva titular, bajada de **una línea** y epígrafe (sin cuerpo); las secundarias,
    sección, titular y **2 o 3 oraciones**. Las noticias mandan: tienen que pesar más que los avisos.
- Los **avisos** chicos (`web/src/data/anuncios.ts`, tipos "mini" y "linea") van sueltos entre las noticias y en otras
  páginas, nunca en una página propia. Misma regla de contenido; los teléfonos terminan en el año de la película.
- El número de WhatsApp va en `web/.env` como `VITE_WHATSAPP_NUMBER` (ver `.env.example`). Nunca commitear `.env`.
- Antes de dar algo por terminado: `npm run build` y `npm run lint` sin errores (y `validar` si se tocaron pasatiempos).

## Cómo verificamos
- No hay extensión de Chrome conectada: se usa **Edge headless** de Windows
  (`/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`) contra `npm run dev`.
- Edge no deja la ventana por debajo de ~500 px: para probar a **375 px** se carga la página dentro de un
  **iframe de 375 px** (una página temporal `web/public/__*.html`, que se borra al terminar) y se mide con JS:
  `scrollWidth ≤ 375`, elementos tocables ≥ 44 px, posición de la primera pantalla, etc. Capturas con `--screenshot`.
- Con `--virtual-time-budget` las View Transitions no llegan a dibujarse: esas partes se prueban sin la API.
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
  semanales para `web/`. Antes de mergear uno: que el build de Cloudflare pase y probar el sitio.
- **Cupones y soluciones** de los pasatiempos viajan en el JS (ofuscados, no secretos): por eso son de bajo valor
  y se validan a mano por WhatsApp (ver docs/PASATIEMPOS.md).
