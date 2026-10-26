// Arma la imagen pedida (?id=portada o ?id=<slug>) con los datos reales del catálogo. Corre en `npm run dev`:
// Vite resuelve los imports de src/ y las fotos de src/assets/. Todo el texto entra con textContent (nunca HTML).
import { products, numeroArticulo } from '/src/data/products.ts'
import { fotosDe } from '/src/data/fotos.ts'

const hoja = document.getElementById('hoja')
const id = new URLSearchParams(location.search).get('id') ?? 'portada'

/** Crea un elemento con clase y texto (o hijos) */
function el(tag, clase, contenido) {
  const e = document.createElement(tag)
  if (clase) e.className = clase
  for (const c of [].concat(contenido ?? [])) e.append(typeof c === 'string' ? document.createTextNode(c) : c)
  return e
}
function img(src, clase, alt = '') {
  const i = document.createElement('img')
  i.src = src
  i.alt = alt
  if (clase) i.className = clase
  return i
}

if (id === 'portada') {
  hoja.append(
    el('div', 'cabecera', [
      img('/logo/logo-watch-closer.webp', 'bloque'),
      el('h1', 'gotica', 'The Plainview'),
      img('/logo/logo-8-2-bloque.webp', 'bloque'),
    ]),
    el('div', 'fecha volanta', [el('span', '', 'Vol. 8 · Córdoba · No. 2'), el('span', '', 'Una edición nueva cada día')]),
    el('div', 'lema', [
      el('h2', 'anton', 'Remeras con cine adentro'),
      el('p', 'italica', 'Un aviso por remera, noticias de película y pasatiempos. Watch closer.'),
    ]),
  )
} else {
  const p = products.find((x) => x.slug === id)
  if (!p) throw new Error(`No existe la remera ${id}`)
  const [principal] = fotosDe(p)
  hoja.append(
    el('div', 'arriba', [el('span', 'gotica', 'The Plainview'), el('span', 'volanta', `${p.seccion ?? 'Avisos'} · Art. N° ${numeroArticulo(p)}`)]),
    el('div', 'aviso', [
      // Con foto, la foto; sin foto todavía, la trama de grabado con el bloque del 8:2
      el('div', 'foto', principal ? img(principal.src) : el('div', 'vacia trama', img('/logo/logo-8-2-bloque.webp', 'bloque'))),
      el('div', 'texto', [
        el('p', 'volanta', `${p.movie} · ${p.year}`),
        el('h2', 'anton', p.titular),
        el('p', 'italica', p.bajada),
        el('div', 'pie', [el('span', 'volanta', 'Plainview 8:2 · Watch closer.'), img('/logo/logo-8-2-bloque.webp', 'bloque')]),
      ]),
    ]),
  )
}

// Avisa al generador que ya está todo cargado (fuentes e imágenes)
await document.fonts.ready
await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))))
document.title = 'lista'
