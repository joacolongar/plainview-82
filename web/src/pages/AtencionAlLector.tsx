import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../config'
import { textoValido, MAX_TEXTO, MIN_TEXTO } from '../lib/pedido'
import { whatsappLink } from '../lib/whatsapp'

/**
 * Atención al lector (antes "Cómo comprar", S7b): cómo se compra, envíos y pagos, cambios y devoluciones y el
 * Botón de arrepentimiento (Res. 424/2020 de la Secretaría de Comercio Interior: tiene que estar a la vista y
 * a un toque; el pie de todas las páginas, la portada incluida, lleva el link a #arrepentimiento).
 *
 * Los textos legales son BORRADOR: mientras BORRADOR_LEGAL sea true se muestra el aviso. Antes de lanzar,
 * que los revise alguien que sepa (plazos, costos de envío, datos del vendedor) y pasar la bandera a false.
 */
export const BORRADOR_LEGAL = true

const INDICE = [
  { id: 'como-se-compra', titulo: 'Cómo se compra' },
  { id: 'envios-y-pagos', titulo: 'Envíos y pagos' },
  { id: 'cambios-y-devoluciones', titulo: 'Cambios y devoluciones' },
  { id: 'arrepentimiento', titulo: 'Botón de arrepentimiento' },
]

export default function AtencionAlLector() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-headline text-4xl uppercase leading-none md:text-5xl">Atención al lector</h1>
        <p className="mt-1 font-display italic">Consultas, reclamos y arrepentimientos. La redacción contesta todo, menos los finales.</p>
      </header>

      {/* Sumario de la página: cada sección a un toque */}
      <nav aria-label="En esta página" className="border-y-4 border-double border-print py-1">
        <ol className="grid grid-cols-2 gap-x-3">
          {INDICE.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex min-h-11 items-center font-display text-sm underline-offset-4 hover:underline">
                {i + 1}. {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Seccion id="como-se-compra" titulo="Cómo se compra">
        <ol className="list-decimal space-y-2 pl-5 font-display text-[15px] leading-snug">
          <li>
            Elegí tu remera y tu talle en el <Link to="/catalogo" className="underline underline-offset-2">índice de avisos</Link> y agregala a la boleta.
          </li>
          <li>En la boleta completá a nombre de quién va, tu zona y si preferís envío o retiro.</li>
          <li>Tocá «Enviar boleta»: la imprenta te da un N° de boleta y se abre WhatsApp con el pedido armado.</li>
          <li>Mandá ese mensaje. Te respondemos para coordinar el pago y la entrega.</li>
        </ol>
      </Seccion>

      <Seccion id="envios-y-pagos" titulo="Envíos y pagos" borrador>
        <ul className="list-disc space-y-2 pl-5 font-display text-[15px] leading-snug">
          <li>Retiro en mano en Córdoba capital, a coordinar por WhatsApp.</li>
          <li>Envíos a todo el país por correo; el costo se calcula según el destino y se informa antes de pagar.</li>
          <li>Pago por transferencia bancaria o link de pago. El pedido se prepara cuando se acredita.</li>
          <li>Los precios del sitio son finales, en pesos argentinos.</li>
        </ul>
      </Seccion>

      <Seccion id="cambios-y-devoluciones" titulo="Cambios y devoluciones" borrador>
        <ul className="list-disc space-y-2 pl-5 font-display text-[15px] leading-snug">
          <li>
            <b>Cambio de talle o color:</b> dentro de los 30 días de recibida, sin uso, sin lavar y con su etiqueta. Sujeto a
            stock; si no hay, te devolvemos el dinero.
          </li>
          <li>
            <b>Remera fallada:</b> la cambiamos sin costo o te devolvemos el total, incluido el envío (garantía legal, Ley 24.240).
          </li>
          <li>
            <b>Derecho de arrepentimiento:</b> por ser una compra a distancia, tenés 10 días corridos desde que la recibís para
            revocarla sin dar explicaciones (art. 34 de la Ley 24.240 y art. 1110 del Código Civil y Comercial). Te devolvemos
            el total pagado y los gastos de la devolución corren por nuestra cuenta. Podés pedirlo con el botón de abajo.
          </li>
        </ul>
      </Seccion>

      <Seccion id="arrepentimiento" titulo="Botón de arrepentimiento" borrador>
        <p className="font-display text-[15px] leading-snug">
          Si te arrepentiste de una compra, avisanos acá dentro de los 10 días corridos desde que la recibiste. Dentro de las
          24 horas te mandamos un código de trámite para seguir el pedido.
        </p>
        <FormularioArrepentimiento />
      </Seccion>

      <p className="font-display text-sm">
        ¿Otra consulta? Escribinos por WhatsApp o a{' '}
        <a href={BRAND.instagram} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2">
          @plainview.82
        </a>
        .
      </p>
    </div>
  )
}

function Seccion({ id, titulo, borrador = false, children }: { id: string; titulo: string; borrador?: boolean; children: ReactNode }) {
  return (
    // scroll-mt: al llegar por el ancla, el título no queda pegado al borde de arriba
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-4 space-y-3">
      <h2 id={`${id}-titulo`} className="border-b-2 border-print pb-1 font-headline text-2xl uppercase leading-none">
        {titulo}
      </h2>
      {borrador && BORRADOR_LEGAL && (
        <p className="border-2 border-dashed border-red px-2 py-1 font-display text-xs font-bold uppercase tracking-wider">
          Borrador legal · revisar antes de lanzar
        </p>
      )}
      {children}
    </section>
  )
}

// Las boletas que da el servidor: PV-AAMMDD-XXXX (ver numeroBoleta en functions/api/pedido.ts)
const FORMATO_BOLETA = /^PV-\d{6}-[A-HJ-NP-Z2-9]{4}$/

/**
 * El pedido de arrepentimiento sale por WhatsApp, como los pedidos, con nombre y N° de boleta.
 * No guarda nada: el mensaje lo arma el navegador y lo manda la persona.
 */
function FormularioArrepentimiento() {
  const [nombre, setNombre] = useState('')
  const [boleta, setBoleta] = useState('')
  const [intentado, setIntentado] = useState(false)
  const nombreMal = !textoValido(nombre)
  const boletaFinal = boleta.trim().toUpperCase()
  const boletaMal = boletaFinal !== '' && !FORMATO_BOLETA.test(boletaFinal)

  function enviar(e: FormEvent) {
    e.preventDefault()
    setIntentado(true)
    if (nombreMal || boletaMal || !BRAND.whatsappNumber) return
    const mensaje = [
      `Hola ${BRAND.name}! Uso el Botón de arrepentimiento.`,
      `Quiero revocar mi compra${boletaFinal ? ` de la boleta N° ${boletaFinal}` : ''}, a nombre de ${nombre.trim()}.`,
      'Quedo a la espera del código de trámite.',
    ].join('\n')
    window.location.assign(whatsappLink(mensaje))
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3 border-2 border-print p-3">
      <div>
        <label htmlFor="arr-nombre" className="font-display text-sm">
          A nombre de
        </label>
        <input
          id="arr-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="name"
          maxLength={MAX_TEXTO + 10}
          aria-invalid={intentado && nombreMal}
          aria-describedby={intentado && nombreMal ? 'arr-nombre-error' : undefined}
          className={`mt-1 block min-h-11 w-full border bg-paper px-3 font-display text-base ${intentado && nombreMal ? 'border-2 border-red' : 'border-print/40'}`}
        />
        {intentado && nombreMal && (
          <p id="arr-nombre-error" className="mt-1 font-display text-xs font-bold">
            ✗ Entre {MIN_TEXTO} y {MAX_TEXTO} letras.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="arr-boleta" className="font-display text-sm">
          N° de boleta <span className="italic text-print-muted">(si la tenés: PV-261018-ABCD)</span>
        </label>
        <input
          id="arr-boleta"
          value={boleta}
          onChange={(e) => setBoleta(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={20}
          aria-invalid={boletaMal}
          aria-describedby={boletaMal ? 'arr-boleta-error' : undefined}
          className={`mt-1 block min-h-11 w-full border bg-paper px-3 font-mono text-base uppercase ${boletaMal ? 'border-2 border-red' : 'border-print/40'}`}
        />
        {boletaMal && (
          <p id="arr-boleta-error" className="mt-1 font-display text-xs font-bold">
            ✗ Las boletas tienen la forma PV-AAMMDD-XXXX.
          </p>
        )}
      </div>
      {BRAND.whatsappNumber ? (
        <button type="submit" className="min-h-12 w-full bg-red px-2 font-display text-[19px] font-bold uppercase tracking-wider text-paper">
          Arrepentirme de la compra
        </button>
      ) : (
        <p className="text-sm text-print-muted">Configurá VITE_WHATSAPP_NUMBER en web/.env para activar el botón.</p>
      )}
    </form>
  )
}
