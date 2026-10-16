import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { BRAND } from '../config'
import { products } from '../data/products'

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center space-y-4 border-b border-line pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Edición única · Córdoba</p>
        {/* En mobile el 8:2 baja de línea: "PLAINVIEW 8:2" a 48px no entra en 375px */}
        <h1 className="font-display text-5xl md:text-7xl font-black leading-none">
          PLAINVIEW <span className="block sm:inline text-red">8:2</span>
        </h1>
        <p className="font-display italic text-xl">{BRAND.slogan}</p>
        <div className="flex flex-col sm:flex-row sm:justify-center gap-3 pt-4">
          <Link to="/catalogo" className="flex min-h-11 items-center justify-center bg-red px-5 uppercase text-sm tracking-widest">Ver catálogo</Link>
          <Link to="/juego" className="flex min-h-11 items-center justify-center border border-paper px-5 uppercase text-sm tracking-widest">Adiviná la peli</Link>
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl mb-6">Últimos estrenos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {products.slice(0, 3).map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>
    </div>
  )
}
