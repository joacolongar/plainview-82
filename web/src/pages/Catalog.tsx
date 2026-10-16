import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'

export default function Catalog() {
  const [director, setDirector] = useState('todos')
  const directors = useMemo(() => [...new Set(products.map((p) => p.director))].sort(), [])
  const list = director === 'todos' ? products : products.filter((p) => p.director === director)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
        <h1 className="font-display text-4xl">Catálogo</h1>
        <label className="text-sm">
          <span className="text-muted mr-2">Director</span>
          <select value={director} onChange={(e) => setDirector(e.target.value)} className="bg-ink border border-line px-2 py-1">
            <option value="todos">Todos</option>
            {directors.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </div>
  )
}
