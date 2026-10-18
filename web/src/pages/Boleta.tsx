import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Turnstile from '../components/Turnstile'
import { BRAND, TURNSTILE_SITE_KEY } from '../config'
import { useCart, type CartItem } from '../context/CartContext'
import { numeroArticulo, getProduct } from '../data/products'
import { borrarBoletaEnviada, enviarBoleta, guardarBoletaEnviada, leerBoletaEnviada, type BoletaEnviada } from '../lib/boleta'
import {
  cuponValido,
  ENTREGAS,
  formatoPesos,
  MAX_CANTIDAD,
  MAX_CUPON,
  MAX_ITEMS,
  MAX_TEXTO,
  MIN_TEXTO,
  normalizarCupon,
  subtotal,
  textoValido,
  validarItem,
  type Entrega,
} from '../lib/pedido'
import { mensajeBoleta, whatsappLink } from '../lib/whatsapp'

const MAX_NOTA = 500

/**
 * La boleta de pedido: un cupón recortable con los renglones del carrito. "Enviar boleta" la manda a
 * /api/pedido, que valida contra el catálogo y devuelve el N° de boleta; con eso se abre WhatsApp.
 * Precios y total salen del catálogo (no del precio guardado en el carrito) y cada renglón se valida
 * con la misma función que el servidor, solo para avisar antes: la que vale es la del servidor.
 * Antes de enviar: nombre, zona y entrega (validados igual que en el servidor) y Turnstile, que confirma que
 * la boleta la manda una persona.
 */
export default function Boleta() {
  const { items, setQty, clear, count } = useCart()
  const [cupon, setCupon] = useState('')
  const [nota, setNota] = useState('')
  const [nombre, setNombre] = useState('')
  const [zona, setZona] = useState('')
  const [entrega, setEntrega] = useState<Entrega | null>(null)
  // Los errores de los datos se muestran recién después del primer intento de envío (no mientras se escribe)
  const [intentado, setIntentado] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [reinicio, setReinicio] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviada, setEnviada] = useState<BoletaEnviada | null>(leerBoletaEnviada)
  // El estado tarda un render en llegar: el ref frena el doble toque en el mismo instante
  const enVuelo = useRef(false)

  if (count === 0 && enviada)
    return (
      <Enviada
        boleta={enviada}
        otra={() => {
          borrarBoletaEnviada()
          setEnviada(null)
        }}
      />
    )

  if (count === 0)
    return (
      <div className="space-y-4 py-6 text-center">
        <h1 className="font-headline text-4xl uppercase">La boleta está en blanco</h1>
        <p className="font-display italic">Elija una remera en el índice y vuelva con el talle en la mano.</p>
        <Link to="/catalogo" className="inline-flex min-h-11 items-center font-bold underline decoration-red decoration-2 underline-offset-4">
          Ir al índice de avisos
        </Link>
      </div>
    )

  const renglones = items.map((i) => ({ item: i, linea: validarItem({ slug: i.slug, talle: i.size, color: i.color, cantidad: i.qty }) }))
  const hayInvalidos = renglones.some((r) => !r.linea)
  const demasiados = items.length > MAX_ITEMS
  const total = renglones.reduce((s, r) => s + (r.linea ? subtotal(r.linea) : 0), 0)
  const deprueba = renglones.some((r) => r.linea?.producto.precioDePrueba)
  const cuponFinal = normalizarCupon(cupon)
  const cuponMal = cuponFinal !== '' && !cuponValido(cuponFinal)
  const nombreMal = !textoValido(nombre)
  const zonaMal = !textoValido(zona)
  const datosOk = !nombreMal && !zonaMal && entrega !== null
  // El botón se puede tocar aunque falten datos: al tocarlo se muestra qué falta (un botón apagado no explica nada)
  const puedeEnviar = !hayInvalidos && !demasiados && !cuponMal && !enviando && BRAND.whatsappNumber !== '' && TURNSTILE_SITE_KEY !== ''

  async function enviar() {
    if (enVuelo.current) return
    setIntentado(true)
    if (!datosOk || entrega === null) {
      document.getElementById(nombreMal ? 'nombre' : zonaMal ? 'zona' : 'entrega-envio')?.focus()
      return
    }
    if (!token) {
      setError('Esperá a que termine la verificación de abajo ("Soy humano") y volvé a tocar Enviar.')
      return
    }
    enVuelo.current = true
    setEnviando(true)
    setError(null)
    const r = await enviarBoleta(items, { nombre, zona, entrega }, cuponFinal, nota.trim(), token)
    enVuelo.current = false
    setEnviando(false)
    // Cada token de Turnstile sirve una sola vez: pase lo que pase, se pide otro
    setReinicio((n) => n + 1)
    if (!r.ok) {
      setError(r.error)
      return
    }
    guardarBoletaEnviada(r.boleta)
    setEnviada(r.boleta)
    clear()
    // Misma pestaña: un window.open después de esperar al servidor lo bloquea el navegador como pop-up
    window.location.assign(whatsappLink(mensajeBoleta(r.boleta)))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-headline text-4xl uppercase leading-none">Boleta de pedido</h1>
        <p className="mt-1 font-display italic">Llene, recorte y envíe. La imprenta le devuelve el número de boleta.</p>
      </header>

      <section aria-labelledby="boleta-titulo" className="relative border-2 border-dashed border-print px-3 pt-4 pb-3">
        <span aria-hidden className="absolute -top-3.5 left-3 bg-paper px-1 text-xl leading-none">✂</span>
        <h2 id="boleta-titulo" className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">
          Artículos pedidos
        </h2>
        <ul className="mt-2 divide-y divide-print/30 border-y border-print/30">
          {renglones.map(({ item, linea }, idx) => (
            <Renglon key={`${item.slug}-${item.size}-${item.color}`} item={item} importe={linea ? subtotal(linea) : null} cambiar={(q) => setQty(idx, q)} />
          ))}
        </ul>
        <p className="mt-2 flex items-baseline justify-between border-b-4 border-double border-print pb-1">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">Total</span>
          <span className="font-headline text-3xl">{formatoPesos(total)}</span>
        </p>
        {deprueba && <p className="mt-1 font-display text-xs font-bold">Precios de prueba: no son los precios reales.</p>}
        {demasiados && <p className="mt-1 font-display text-sm font-bold">✗ Hasta {MAX_ITEMS} artículos distintos por boleta.</p>}
      </section>

      <fieldset className="space-y-3">
        <legend className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">Datos para la entrega</legend>
        <Campo id="nombre" etiqueta="A nombre de" valor={nombre} cambiar={setNombre} autoComplete="name" error={intentado && nombreMal} />
        <Campo id="zona" etiqueta="Zona o barrio" valor={zona} cambiar={setZona} autoComplete="address-level2" error={intentado && zonaMal} />
        <div role="radiogroup" aria-label="Entrega" aria-describedby={intentado && !entrega ? 'entrega-error' : undefined} className="grid grid-cols-2 gap-2">
          {(Object.keys(ENTREGAS) as Entrega[]).map((e) => (
            <label
              key={e}
              className={`flex min-h-11 cursor-pointer items-center justify-center border-2 px-2 text-center font-display text-[15px] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${entrega === e ? 'border-print bg-print text-paper' : 'border-print/40'}`}
            >
              <input id={`entrega-${e}`} type="radio" name="entrega" value={e} checked={entrega === e} onChange={() => setEntrega(e)} className="sr-only" />
              {ENTREGAS[e]}
            </label>
          ))}
        </div>
        {intentado && !entrega && (
          <p id="entrega-error" className="font-display text-xs font-bold">
            ✗ Elegí cómo te la llevás.
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="cupon" className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">
          Cupón de los pasatiempos <span className="font-normal normal-case tracking-normal italic">(opcional)</span>
        </label>
        <input
          id="cupon"
          value={cupon}
          onChange={(e) => setCupon(e.target.value)}
          maxLength={MAX_CUPON + 10}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={cuponMal}
          aria-describedby="cupon-ayuda"
          className="mt-1 block min-h-11 w-full border border-print/40 bg-paper px-3 font-headline text-base uppercase tracking-widest"
        />
        <p id="cupon-ayuda" className={`mt-1 font-display text-xs ${cuponMal ? 'font-bold' : 'italic text-print-muted'}`}>
          {cuponMal ? `✗ El cupón es una sola palabra, solo letras (hasta ${MAX_CUPON}).` : 'Uno por pedido. Lo chequeamos a mano antes de confirmar.'}
        </p>
      </div>

      <div>
        <label htmlFor="nota" className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">
          Nota para la redacción <span className="font-normal normal-case tracking-normal italic">(opcional, va solo por WhatsApp)</span>
        </label>
        <textarea
          id="nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          maxLength={MAX_NOTA}
          placeholder="Horario, timbre, referencias…"
          rows={3}
          className="mt-1 block w-full border border-print/40 bg-paper p-3 text-base"
        />
      </div>

      {/* Turnstile: casi siempre se resuelve solo. Va antes del botón, fuera de la franja pegada abajo */}
      {TURNSTILE_SITE_KEY ? (
        <Turnstile siteKey={TURNSTILE_SITE_KEY} alCambiar={setToken} reinicio={reinicio} />
      ) : (
        <p className="text-sm text-print-muted">Configurá VITE_TURNSTILE_SITE_KEY en web/.env para activar el envío.</p>
      )}

      {/* Total y envío pegados abajo en mobile (sticky, igual que en el aviso) */}
      <div className="sticky bottom-0 -mx-3 space-y-2 border-t border-print/30 bg-paper px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:p-0">
        {error && (
          <p role="alert" className="border-l-4 border-red pl-2 font-display text-sm font-bold">
            {error}
          </p>
        )}
        {BRAND.whatsappNumber ? (
          <button
            onClick={enviar}
            disabled={!puedeEnviar}
            className="flex min-h-12 w-full items-center justify-center bg-red px-2 font-display text-[19px] font-bold uppercase leading-tight tracking-wider text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            {enviando ? 'Enviando a imprenta…' : `Enviar boleta · ${formatoPesos(total)}`}
          </button>
        ) : (
          <p className="text-sm text-print-muted">Configurá VITE_WHATSAPP_NUMBER en web/.env para activar el botón.</p>
        )}
        <p role="status" className="text-center font-display text-xs italic text-print-muted">
          {enviando ? 'Esperando el número de boleta…' : hayInvalidos ? 'Quite los artículos marcados con ✗ para enviar.' : 'Se abre WhatsApp con el N° de boleta.'}
        </p>
      </div>
    </div>
  )
}

/** Campo de texto de los datos de entrega, con su error debajo (después del primer intento de envío) */
function Campo(props: { id: string; etiqueta: string; valor: string; cambiar: (v: string) => void; autoComplete: string; error: boolean }) {
  const { id, etiqueta, valor, cambiar, autoComplete, error } = props
  return (
    <div>
      <label htmlFor={id} className="font-display text-sm">
        {etiqueta}
      </label>
      <input
        id={id}
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        maxLength={MAX_TEXTO + 10}
        autoComplete={autoComplete}
        aria-invalid={error}
        aria-describedby={error ? `${id}-error` : undefined}
        // 16 px: con menos, el iPhone hace zoom al tocar el campo
        className={`mt-1 block min-h-11 w-full border bg-paper px-3 font-display text-base ${error ? 'border-2 border-red' : 'border-print/40'}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 font-display text-xs font-bold">
          ✗ Entre {MIN_TEXTO} y {MAX_TEXTO} letras.
        </p>
      )}
    </div>
  )
}

function Renglon({ item, importe, cambiar }: { item: CartItem; importe: number | null; cambiar: (qty: number) => void }) {
  const p = getProduct(item.slug)
  const titulo = p?.titular ?? item.name
  return (
    <li className="py-3">
      {/* Mobile-first: el importe va arriba a la derecha para que − + y Quitar entren a 375 px sin achicarse */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {p && <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-print-muted">Art. N° {numeroArticulo(p)}</p>}
          <p className="font-display text-lg leading-tight">{titulo}</p>
          <p className="font-display text-sm text-print-muted">
            Talle {item.size} · {item.color}
          </p>
        </div>
        <span className="shrink-0 font-headline text-xl">{importe === null ? '—' : formatoPesos(importe)}</span>
      </div>
      {importe === null && <p className="mt-1 font-display text-sm font-bold">✗ Ya no se puede pedir así: quítelo de la boleta.</p>}
      <div className="mt-2 flex items-center gap-2 [&>button]:shrink-0">
        <button onClick={() => cambiar(item.qty - 1)} aria-label={`Sacar una ${titulo}`} className="h-11 w-11 border border-print/40 text-lg">
          −
        </button>
        <span className="w-7 text-center font-headline text-xl" aria-label={`Cantidad: ${item.qty}`}>
          {item.qty}
        </span>
        <button
          onClick={() => cambiar(item.qty + 1)}
          disabled={item.qty >= MAX_CANTIDAD}
          aria-label={`Sumar una ${titulo}`}
          className="h-11 w-11 border border-print/40 text-lg disabled:opacity-40"
        >
          +
        </button>
        <button onClick={() => cambiar(0)} className="min-h-11 px-2 font-display text-sm underline decoration-red decoration-2 underline-offset-4">
          Quitar
        </button>
      </div>
    </li>
  )
}

/** Después de enviar: el número de boleta y el botón para volver a abrir WhatsApp, por si no se mandó el mensaje */
function Enviada({ boleta, otra }: { boleta: BoletaEnviada; otra: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="border-4 border-double border-print p-3 text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.15em]">Enviada a imprenta</p>
        <h1 className="mt-1 font-headline text-3xl uppercase leading-none">Boleta N° {boleta.boleta}</h1>
      </header>
      <p className="font-display">
        Falta un paso: mandar el mensaje de WhatsApp con este número. Si ya lo mandó, la redacción le responde para coordinar pago y envío.
      </p>
      <p className="whitespace-pre-line border-l-4 border-print/40 pl-3 font-display text-sm">{boleta.resumen}</p>
      <a
        href={whatsappLink(mensajeBoleta(boleta))}
        className="flex min-h-12 w-full items-center justify-center bg-red px-2 text-center font-display text-[19px] font-bold uppercase leading-tight text-paper"
      >
        Abrir WhatsApp con la boleta
      </a>
      <button onClick={otra} className="flex min-h-11 w-full items-center justify-center font-display font-bold underline decoration-red decoration-2 underline-offset-4">
        Empezar otra boleta
      </button>
    </div>
  )
}
