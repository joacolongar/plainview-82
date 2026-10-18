// Envío de la boleta a /api/pedido (functions/api/pedido.ts) y la última boleta enviada.
// La validación que vale es la del servidor; acá solo se arma el cuerpo y se traducen los errores.
import type { CartItem } from '../context/CartContext'
import type { DatosPedido } from './pedido'

/** Lo que respondió el servidor, más la nota (que va solo a WhatsApp, no al servidor) */
export type BoletaEnviada = { boleta: string; resumen: string; total: number; nota: string }

/** humano: false cuando Turnstile no lo dejó pasar (la boleta reinicia el widget) */
export type ResultadoEnvio = { ok: true; boleta: BoletaEnviada } | { ok: false; error: string; humano?: false }

const ESPERA_MS = 15000

export async function enviarBoleta(items: CartItem[], datos: DatosPedido, cupon: string, nota: string, token: string): Promise<ResultadoEnvio> {
  // Solo lo que acepta el servidor: de cada ítem, slug, talle, color y cantidad (el nombre y el precio guardados
  // en el carrito no viajan); los datos de entrega, el cupón si hay y el token de Turnstile
  const cuerpo = {
    items: items.map((i) => ({ slug: i.slug, talle: i.size, color: i.color, cantidad: i.qty })),
    datos: { nombre: datos.nombre.trim(), zona: datos.zona.trim(), entrega: datos.entrega },
    ...(cupon ? { cupon } : {}),
    token,
  }
  let r: Response
  try {
    r = await fetch('/api/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(ESPERA_MS), // sin respuesta en 15 s, se corta y se avisa
    })
  } catch {
    return { ok: false, error: 'No llegamos a la imprenta: revisá la conexión y probá de nuevo.' }
  }

  if (r.status === 403) {
    const codigo = await r.json().then((d: { codigo?: string }) => d.codigo, () => undefined)
    if (codigo === 'turnstile') return { ok: false, humano: false, error: 'No pudimos confirmar que sos humano. Esperá la verificación de nuevo y volvé a enviar.' }
  }
  if (r.status === 400 || r.status === 403)
    return { ok: false, error: 'La imprenta devolvió la boleta: algo no coincide con el catálogo. Revisala y probá de nuevo.' }
  if (!r.ok) return { ok: false, error: 'La imprenta está parada. Probá de nuevo en un rato.' }

  try {
    const respuesta: unknown = await r.json()
    if (esRespuesta(respuesta)) return { ok: true, boleta: { ...respuesta, nota } }
  } catch {
    /* respuesta que no es JSON: cae al error de abajo */
  }
  return { ok: false, error: 'La imprenta respondió algo ilegible. Probá de nuevo en un rato.' }
}

function esRespuesta(d: unknown): d is Omit<BoletaEnviada, 'nota'> {
  if (typeof d !== 'object' || d === null) return false
  const { boleta, resumen, total } = d as Record<string, unknown>
  return typeof boleta === 'string' && typeof resumen === 'string' && typeof total === 'number'
}

// La última boleta enviada, por si la persona vuelve de WhatsApp sin haber mandado el mensaje.
// sessionStorage: dura lo que la pestaña. Con try/catch porque puede no estar disponible.
const KEY = 'pv82-boleta-enviada'

export function guardarBoletaEnviada(b: BoletaEnviada) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(b))
  } catch {
    /* sin storage: se pierde al recargar, no pasa nada grave */
  }
}

export function leerBoletaEnviada(): BoletaEnviada | null {
  try {
    const d: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (esRespuesta(d) && typeof (d as BoletaEnviada).nota === 'string') return d as BoletaEnviada
  } catch {
    /* dato corrupto: se descarta */
  }
  return null
}

export function borrarBoletaEnviada() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nada que borrar */
  }
}
