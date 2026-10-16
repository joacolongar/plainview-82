import { Link } from 'react-router-dom'
import { CURRENCY } from '../config'
import { ESTADOS, numeroArticulo, rutaAviso, type Product } from '../data/products'

export default function ProductCard({ p }: { p: Product }) {
  // El hover es solo decoración: en el celular la card entera es el link, se toca y listo
  return (
    <Link to={rutaAviso(p.slug)} className="group block min-w-0 border border-print/30 transition-colors hover:border-red">
      <div className="aspect-[4/5] bg-print/10 flex items-center justify-center text-print-muted font-mono text-xs">
        {p.images[0] ? (
          <img src={p.images[0]} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          'sin foto'
        )}
      </div>
      <div className="p-3">
        <p className="font-mono text-[11px] text-print-muted">Art. N° {numeroArticulo(p)}</p>
        <p className="truncate text-xs uppercase tracking-widest text-print-muted">{p.movie} · {p.year}</p>
        <h3 className="font-display text-lg leading-tight group-hover:underline">{p.name}</h3>
        <p className="font-mono text-sm">{p.status === 'disponible' ? CURRENCY.format(p.price) : ESTADOS[p.status]}</p>
      </div>
    </Link>
  )
}
