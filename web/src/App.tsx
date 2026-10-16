import { Route, Routes } from 'react-router-dom'
import NewspaperPage from './components/NewspaperPage'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Game from './pages/Game'
import HowToBuy from './pages/HowToBuy'
import Pasatiempos from './pages/Pasatiempos'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<NewspaperPage />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="producto/:slug" element={<ProductDetail />} />
        <Route path="carrito" element={<Cart />} />
        <Route path="pasatiempos" element={<Pasatiempos />} />
        <Route path="juego" element={<Game />} />
        <Route path="como-comprar" element={<HowToBuy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
