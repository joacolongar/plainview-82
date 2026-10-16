import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CURRENCY } from '../config'
import { useCart } from '../context/CartContext'
import { getProduct, type Size } from '../data/products'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const p = getProduct(slug)
  const { add } = useCart()
  const [size, setSize] = useState<Size | null>(null)
  const [color, setColor] = useState(p?.colors[0] ?? '')
  const [added, setAdded] = useState(false)

  if (!p) return <NotFound />
  const canBuy = p.status !== 'proximamente' && size !== null

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      <div className="aspect-[4/5] bg-print/10 flex items-center justify-center text-print-muted font-mono text-xs">
        {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : 'sin foto'}
      </div>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-print-muted">{p.movie} · {p.director} · {p.year}</p>
          <h1 className="font-display text-3xl md:text-4xl">{p.name}</h1>
          <p className="font-mono mt-2">{p.status === 'disponible' ? CURRENCY.format(p.price) : p.status}</p>
        </div>
        <p>{p.description}</p>
        <details className="border-l-2 border-red pl-4">
          <summary className="flex min-h-11 cursor-pointer items-center uppercase text-sm tracking-widest">Watch closer: la referencia</summary>
          <p className="mt-2 text-print-muted">{p.reference}</p>
        </details>
        <fieldset>
          <legend className="text-sm text-print-muted mb-2">Talle</legend>
          <div className="flex gap-2">
            {p.sizes.map((s) => (
              <button key={s} onClick={() => setSize(s)} aria-pressed={size === s} className={`h-11 w-12 border ${size === s ? 'border-2 border-red font-bold' : 'border-print/30'}`}>{s}</button>
            ))}
          </div>
        </fieldset>
        {p.colors.length > 1 && (
          <fieldset>
            <legend className="text-sm text-print-muted mb-2">Color</legend>
            <div className="flex flex-wrap gap-2">
              {p.colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-pressed={color === c} className={`min-h-11 px-3 border ${color === c ? 'border-2 border-red font-bold' : 'border-print/30'}`}>{c}</button>
              ))}
            </div>
          </fieldset>
        )}
        {/* sticky (no fixed): en mobile queda pegado abajo, al alcance del pulgar, mientras scrolleás la ficha,
            y al llegar al final vuelve a su lugar sin tapar el footer */}
        <div className="sticky bottom-0 -mx-3 space-y-2 border-t border-print/30 bg-paper px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:border-0 md:p-0">
          <button
            disabled={!canBuy}
            onClick={() => { add({ slug: p.slug, name: p.name, price: p.price, size: size!, color }); setAdded(true) }}
            className="min-h-12 w-full bg-red font-display text-[19px] font-bold uppercase tracking-wider text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            {p.status === 'proximamente' ? 'Próximamente' : size ? 'Agregar al pedido' : 'Elegí un talle'}
          </button>
          {added && (
            <p className="flex items-center justify-between text-sm">
              Agregado.
              <Link to="/carrito" className="flex min-h-11 items-center font-bold underline decoration-red decoration-2 underline-offset-4">Ver pedido</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
