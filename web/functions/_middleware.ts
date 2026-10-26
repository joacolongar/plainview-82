// Middleware de Cloudflare Pages Functions: corre antes de cada pedido que no esté excluido en public/_routes.json.
// Le pone a cada página su título, descripción y Open Graph (la vista previa al compartir el link). WhatsApp,
// Instagram y Facebook no ejecutan JavaScript: leen el HTML tal cual sale del servidor, así que las etiquetas tienen
// que llegar ahí, no las puede poner React.
//
// Cómo: index.html trae las etiquetas con los valores de la portada; acá, HTMLRewriter (de Cloudflare) les cambia el
// `content` con setAttribute mientras el HTML pasa. No se arma HTML con texto: setAttribute escapa solo.
import { metaDe } from '../src/lib/meta'

// Lo poco que usamos de HTMLRewriter (así no sumamos @cloudflare/workers-types)
type Elemento = { setAttribute(nombre: string, valor: string): void; setInnerContent(texto: string): void }
declare class HTMLRewriter {
  on(selector: string, manejador: { element(e: Elemento): void }): HTMLRewriter
  transform(respuesta: Response): Response
}

type Contexto = { request: Request; next: () => Promise<Response> }

export async function onRequest({ request, next }: Contexto): Promise<Response> {
  const respuesta = await next()
  const url = new URL(request.url)
  // Solo las páginas: ni la API ni otros métodos ni lo que no sea HTML
  const esHtml = respuesta.headers.get('Content-Type')?.includes('text/html')
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || !esHtml) return respuesta

  const m = metaDe(url.pathname)
  const absoluta = (ruta: string) => new URL(ruta, url.origin).href
  const contenido = (valor: string) => ({ element: (e: Elemento) => e.setAttribute('content', valor) })

  // La respuesta transformada conserva las cabeceras de la original (CSP, noindex y demás de _headers)
  return new HTMLRewriter()
    .on('title', { element: (e) => e.setInnerContent(m.titulo) })
    .on('meta[name="description"]', contenido(m.descripcion))
    .on('meta[property="og:type"]', contenido(m.tipo === 'product' ? 'product' : 'website'))
    .on('meta[property="og:url"]', contenido(absoluta(url.pathname)))
    .on('meta[property="og:title"]', contenido(m.titulo))
    .on('meta[property="og:description"]', contenido(m.descripcion))
    .on('meta[property="og:image"]', contenido(absoluta(m.imagen)))
    .on('meta[property="og:image:alt"]', contenido(m.imagenAlt))
    .transform(respuesta)
}
