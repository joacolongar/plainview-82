import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { BRAND } from '../config'
import { products } from '../data/products'

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center space-y-4 border-b border-line pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Edición única · Córdoba</p>
        <h1 className="font-display text-5xl md:text-7xl font-black leading-none">
          PLAINVIEW <span className="text-red">8:2</span>
        </h1>
        <p className="font-display italic text-xl">{BRAND.slogan}</p>
        <div className="flex justify-center gap-3 pt-4">
          <Link to="/catalogo" className="bg-red px-5 py-2 uppercase text-sm tracking-widest">Ver catálogo</Link>
          <Link to="/juego" className="border border-paper px-5 py-2 uppercase text-sm tracking-widest">Adiviná la peli</Link>
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl mb-6">Últimos estrenos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.slice(0, 3).map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>
    </div>
  )
}
