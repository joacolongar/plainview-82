// POST /api/pedido — Cloudflare Pages Function (corre en el servidor de Cloudflare, no en el navegador).
// Recibe { items: [{ slug, talle, color, cantidad }], datos: { nombre, zona, entrega }, cupon?, token }:
// verifica con Turnstile que lo mande una persona, valida el pedido contra el catálogo, calcula el total,
// genera el N° de boleta, avisa por Telegram (con el veredicto del cupón) y responde { boleta, resumen, total }.
// Reglas en docs/ROADMAP.md (Etapa 2) y "Seguridad" en CLAUDE.md.
import { veredictoCupon } from '../../src/lib/cupon'
import { resumenPedido, totalPedido, validarPedido } from '../../src/lib/pedido'

// Variables de Cloudflare (Settings → Variables and Secrets); en local salen de web/.dev.vars (fuera de git).
// Sin VITE_: nunca llegan al navegador.
type Env = { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string; TURNSTILE_SECRET_KEY?: string }

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

const MAX_TOKEN = 2048 // los tokens de Turnstile miden unos cientos de caracteres

/**
 * Turnstile (el "no soy un robot" de Cloudflare): el widget de la boleta le da un token a quien lo pasa, y acá se le
 * pregunta a Cloudflare si es bueno. Cada token sirve una sola vez. Sin la clave secreta no se acepta nada:
 * un olvido de configuración no puede dejar el envío sin protección.
 */
async function esHumano(env: Env, token: string, ip: string | null): Promise<'si' | 'no' | 'sin-servicio'> {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('Falta TURNSTILE_SECRET_KEY: se rechazan todos los pedidos')
    return 'sin-servicio'
  }
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET_KEY)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    const datos = (await r.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!datos.success) console.warn('Turnstile rechazó el token', datos['error-codes'])
    return datos.success === true ? 'si' : 'no'
  } catch {
    console.error('No se pudo conectar con Turnstile')
    return 'sin-servicio'
  }
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

  // El token de Turnstile viaja con el pedido pero no es parte de él: se separa antes de validar
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) return pedidoInvalido()
  const { token, ...resto } = cuerpo as Record<string, unknown>
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN) return pedidoInvalido()

  const pedido = validarPedido(resto)
  if (!pedido) return pedidoInvalido()

  // Primero lo barato (validar), después lo que cuesta una consulta a Cloudflare
  const humano = await esHumano(env, token, request.headers.get('CF-Connecting-IP'))
  if (humano === 'sin-servicio') return json({ error: 'No pudimos registrar el pedido. Probá de nuevo en un rato.' }, 503)
  // codigo: para que la boleta sepa que tiene que reiniciar el widget (el 403 de origen no lo lleva)
  if (humano === 'no') return json({ error: 'No pudimos confirmar que sos humano', codigo: 'turnstile' }, 403)

  const boleta = numeroBoleta()
  const resumen = resumenPedido(pedido)
  const total = totalPedido(pedido.lineas)

  // Sin el aviso no hay contra qué verificar la boleta que llegue por WhatsApp: mejor que el cliente reintente
  const cupon = veredictoCupon(pedido.cupon)
  const avisado = await avisarPorTelegram(env, `🧾 Boleta ${boleta}\n\n${resumen}${cupon ? `\n\n${cupon}` : ''}`)
  if (!avisado) return json({ error: 'No pudimos registrar el pedido. Probá de nuevo en un rato.' }, 503)

  return json({ boleta, resumen, total })
}

// Cualquier otro método (GET, PUT…): 405. Sin esto, un GET caería en el sitio y devolvería el index.html.
export const onRequest = (): Response =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } })
