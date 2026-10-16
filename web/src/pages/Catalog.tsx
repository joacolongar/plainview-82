import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'

export default function Catalog() {
  const [director, setDirector] = useState('todos')
  const directors = useMemo(() => [...new Set(products.map((p) => p.director))].sort(), [])
  const list = director === 'todos' ? products : products.filter((p) => p.director === director)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-print/30 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h1 className="font-display text-4xl">Catálogo</h1>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-print-muted">Director</span>
          {/* text-base (16px): con menos, Safari en iPhone hace zoom al tocar el select */}
          <select value={director} onChange={(e) => setDirector(e.target.value)} className="min-h-11 min-w-0 flex-1 bg-paper border border-print/30 px-2 text-base sm:flex-none">
            <option value="todos">Todos</option>
            {directors.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </div>
  )
}
