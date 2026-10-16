import { Link } from 'react-router-dom'
import { CURRENCY } from '../config'
import type { Product } from '../data/products'

export default function ProductCard({ p }: { p: Product }) {
  return (
    <Link to={`/producto/${p.slug}`} className="group block border border-line hover:border-red transition-colors">
      <div className="aspect-[4/5] bg-line flex items-center justify-center text-muted font-mono text-xs">
        {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : 'sin foto'}
      </div>
      <div className="p-3">
        <p className="text-xs uppercase tracking-widest text-muted">{p.movie} · {p.year}</p>
        <h3 className="font-display text-lg group-hover:text-red">{p.name}</h3>
        <p className="font-mono text-sm">{p.status === 'disponible' ? CURRENCY.format(p.price) : p.status}</p>
      </div>
    </Link>
  )
}
