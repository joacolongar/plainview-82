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
    <div className="grid md:grid-cols-2 gap-10">
      <div className="aspect-[4/5] bg-line flex items-center justify-center text-muted font-mono text-xs">
        {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : 'sin foto'}
      </div>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">{p.movie} · {p.director} · {p.year}</p>
          <h1 className="font-display text-4xl">{p.name}</h1>
          <p className="font-mono mt-2">{p.status === 'disponible' ? CURRENCY.format(p.price) : p.status}</p>
        </div>
        <p>{p.description}</p>
        <details className="border-l-2 border-red pl-4">
          <summary className="cursor-pointer uppercase text-sm tracking-widest">Watch closer: la referencia</summary>
          <p className="mt-2 text-muted">{p.reference}</p>
        </details>
        <fieldset>
          <legend className="text-sm text-muted mb-2">Talle</legend>
          <div className="flex gap-2">
            {p.sizes.map((s) => (
              <button key={s} onClick={() => setSize(s)} className={`w-12 py-2 border ${size === s ? 'border-red text-red' : 'border-line'}`}>{s}</button>
            ))}
          </div>
        </fieldset>
        {p.colors.length > 1 && (
          <fieldset>
            <legend className="text-sm text-muted mb-2">Color</legend>
            <div className="flex gap-2">
              {p.colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`px-3 py-2 border ${color === c ? 'border-red text-red' : 'border-line'}`}>{c}</button>
              ))}
            </div>
          </fieldset>
        )}
        <button
          disabled={!canBuy}
          onClick={() => { add({ slug: p.slug, name: p.name, price: p.price, size: size!, color }); setAdded(true) }}
          className="w-full bg-red py-3 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {p.status === 'proximamente' ? 'Próximamente' : size ? 'Agregar al pedido' : 'Elegí un talle'}
        </button>
        {added && <p className="text-sm">Agregado. <Link to="/carrito" className="text-red underline">Ver pedido</Link></p>}
      </div>
    </div>
  )
}
