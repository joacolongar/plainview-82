import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BRAND, CURRENCY } from '../config'
import { useCart } from '../context/CartContext'
import { buildOrderMessage, whatsappLink } from '../lib/whatsapp'

export default function Cart() {
  const { items, setQty, count } = useCart()
  const [note, setNote] = useState('')
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  if (count === 0)
    return (
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl">Tu pedido está vacío</h1>
        <Link to="/catalogo" className="text-red underline">Ir al catálogo</Link>
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-4xl">Tu pedido</h1>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((i, idx) => (
          <li key={`${i.slug}-${i.size}-${i.color}`} className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-display">{i.name}</p>
              <p className="text-sm text-muted">Talle {i.size} · {i.color}</p>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <button onClick={() => setQty(idx, i.qty - 1)} className="px-2 border border-line">−</button>
              <span>{i.qty}</span>
              <button onClick={() => setQty(idx, i.qty + 1)} className="px-2 border border-line">+</button>
              <span className="w-24 text-right">{CURRENCY.format(i.price * i.qty)}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-right font-mono">Total: {CURRENCY.format(total)}</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota opcional (zona de envío, horario, etc.)"
        className="w-full bg-ink border border-line p-3"
        rows={3}
      />
      {BRAND.whatsappNumber ? (
        <a href={whatsappLink(buildOrderMessage(items, note))} target="_blank" rel="noreferrer" className="block text-center w-full bg-red py-3 uppercase tracking-widest">
          Enviar pedido por WhatsApp
        </a>
      ) : (
        <p className="text-sm text-muted">Configurá VITE_WHATSAPP_NUMBER en web/.env para activar el botón.</p>
      )}
    </div>
  )
}
