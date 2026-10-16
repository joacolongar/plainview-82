# Plainview 8:2 — sitio web

Marca de remeras con referencias sutiles a películas. Slogan: "Watch closer."
Sitio: catálogo con fichas, juego "Adiviná la peli" y pedidos por WhatsApp (sin pasarela de pago).

## Cómo trabajamos
- El dueño del proyecto es estudiante de programación (React, Python, websockets) y trabaja en
  **sesiones de 1 a 2 horas**. Cada sesión cierra con algo que funciona y un commit.
- El plan vive en `docs/ROADMAP.md`. Al empezar, leelo y tomá la próxima sesión sin tildar.
  Al terminar, tildá lo hecho y anotá en "Bitácora" qué quedó pendiente.
- Explicá las decisiones cuando introduzcas algo nuevo: el proyecto también es para aprender.
  Preferí soluciones simples antes que librerías nuevas; preguntá antes de sumar dependencias.
- Textos de la interfaz en español rioplatense (vos), tono irónico y cinéfilo.

## Estructura
- `web/` — frontend: Vite + React 19 + TypeScript + Tailwind v4 + React Router 7.
  - `src/data/products.ts` catálogo (por ahora estático, en el repo)
  - `src/data/game.ts` rondas del juego
  - `src/lib/whatsapp.ts` arma el mensaje del pedido y el link wa.me
  - `src/context/CartContext.tsx` carrito (estado + localStorage con try/catch)
  - `src/pages/*` una página por ruta
- `api/` — backend opcional (Etapa 5): FastAPI + websockets. No hace falta para lanzar.
- `docs/` — ROADMAP.md (plan por sesiones) e IDEAS.md (backlog de ideas).

## Comandos
```bash
cd web && npm install      # una vez
npm run dev                # http://localhost:5173
npm run build              # chequea tipos y compila
npm run lint               # oxlint
```
Backend (cuando llegue la Etapa 5): `cd api && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload`

## Mobile-first
La mayoría de las visitas llegan desde el celular (links de Instagram).
- Diseñar primero a **375px** y después agrandar: las clases sin prefijo son para mobile; `md:`/`lg:` solo suman.
- Botones y elementos tocables de **al menos 44px** de alto/ancho (`min-h-11`, `min-w-11`).
- Acciones importantes (agregar al pedido, enviar por WhatsApp) **al alcance del pulgar**: abajo, fijas si hace falta.
- **Nada que dependa solo de hover**: todo lo que se revela al pasar el mouse tiene que poder abrirse con un toque.
- **Imágenes livianas**: tamaño justo, WebP/AVIF, `loading="lazy"` fuera de la primera pantalla.
- Revisar cada cambio a 375px antes de darlo por terminado.

## Reglas del proyecto
- Estética: diario oscuro, serif display, rojo `--color-red` solo para acentos (el 8:2, CTAs, estados activos).
  Los tokens están en `web/src/index.css` (`@theme`). No hardcodear colores.
- El juego usa **pistas propias** (textos o ilustraciones de la marca), nunca fotogramas, afiches ni
  frases textuales de películas: evita problemas de copyright y promociona las remeras.
- El número de WhatsApp va en `web/.env` como `VITE_WHATSAPP_NUMBER` (ver `.env.example`). Nunca commitear `.env`.
- Antes de dar algo por terminado: `npm run build` y `npm run lint` sin errores.
