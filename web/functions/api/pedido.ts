// POST /api/pedido — Cloudflare Pages Function (corre en el servidor de Cloudflare, no en el navegador).
// Recibe { items: [{ slug, talle, color, cantidad }], cupon? }, lo valida contra el catálogo, calcula el total,
// genera el N° de boleta, avisa por Telegram y responde { boleta, resumen, total }.
// Reglas en docs/ROADMAP.md (Etapa 2) y "Seguridad" en CLAUDE.md.
import { resumenPedido, totalPedido, validarPedido } from '../../src/lib/pedido'

// Variables de Cloudflare (Settings → Variables and Secrets); en local salen de web/.dev.vars (fuera de git).
// Sin VITE_: nunca llegan al navegador.
type Env = { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string }

// Lo poco que usamos del contexto que arma Cloudflare (así no sumamos @cloudflare/workers-types)
type Contexto = { request: Request; env: Env }

const MAX_BYTES = 4096 // un pedido de 10 ítems ocupa menos de 1 KB

function json(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

// Siempre el mismo error: no contamos qué falló
const pedidoInvalido = () => json({ error: 'Pedido inválido' }, 400)

/** Lee el cuerpo cortando apenas pasa el límite, sin cargar en memoria uno gigante */
async function leerCuerpo(request: Request): Promise<string | null> {
  const declarado = Number(request.headers.get('Content-Length') ?? 0)
  if (declarado > MAX_BYTES || !request.body) return null
  const lector = request.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await lector.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await lector.cancel()
      return null
    }
    partes.push(value)
  }
  const bytes = new Uint8Array(total)
  let pos = 0
  for (const p of partes) {
    bytes.set(p, pos)
    pos += p.byteLength
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null // no era UTF-8 válido
  }
}

// 32 caracteres sin los que se confunden (0/O, 1/I). 256 es múltiplo de 32, así que `byte % 32`
// reparte parejo: ninguna letra sale más que otra.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** "PV-261017-K7QM": fecha de Córdoba + 4 caracteres al azar (crypto, no Math.random) */
function numeroBoleta(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '00'
  const azar = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALFABETO[b % 32]).join('')
  return `PV-${parte('year')}${parte('month')}${parte('day')}-${azar}`
}

async function avisarPorTelegram(env: Env, texto: string): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false
  try {
    // Sin parse_mode: el texto va tal cual, Telegram no interpreta Markdown ni HTML
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: texto }),
    })
    // Ojo: nunca loguear la URL, lleva el token adentro
    if (!r.ok) console.error('Telegram respondió', r.status)
    return r.ok
  } catch {
    console.error('No se pudo conectar con Telegram')
    return false
  }
}

export async function onRequestPost({ request, env }: Contexto): Promise<Response> {
  // Un navegador siempre manda Origin en un POST con fetch: si viene de otro sitio, afuera
  const origen = request.headers.get('Origin')
  if (origen && origen !== new URL(request.url).origin) return json({ error: 'Origen no permitido' }, 403)

  const tipo = request.headers.get('Content-Type') ?? ''
  if (tipo.split(';')[0].trim().toLowerCase() !== 'application/json') return pedidoInvalido()

  const texto = await leerCuerpo(request)
  if (texto === null) return pedidoInvalido()
  let cuerpo: unknown
  try {
    cuerpo = JSON.parse(texto)
  } catch {
    return pedidoInvalido()
  }

  const pedido = validarPedido(cuerpo)
  if (!pedido) return pedidoInvalido()

  const boleta = numeroBoleta()
  const resumen = resumenPedido(pedido)
  const total = totalPedido(pedido.lineas)

  // Sin el aviso no hay contra qué verificar la boleta que llegue por WhatsApp: mejor que el cliente reintente
  const nota = pedido.cupon ? '\n\n(El cupón todavía no se verifica solo: chequealo con el de la edición.)' : ''
  const avisado = await avisarPorTelegram(env, `🧾 Boleta ${boleta}\n\n${resumen}${nota}`)
  if (!avisado) return json({ error: 'No pudimos registrar el pedido. Probá de nuevo en un rato.' }, 503)

  return json({ boleta, resumen, total })
}

// Cualquier otro método (GET, PUT…): 405. Sin esto, un GET caería en el sitio y devolvería el index.html.
export const onRequest = (): Response =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } })
