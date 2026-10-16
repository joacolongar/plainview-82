import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import NewspaperPage from './components/NewspaperPage'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import AvisoComercial, { RedirigirAviso } from './pages/AvisoComercial'
import Cart from './pages/Cart'
import Game from './pages/Game'
import HowToBuy from './pages/HowToBuy'
import Pasatiempos from './pages/Pasatiempos'
import NotFound from './pages/NotFound'

/**
 * Router "de datos" (createBrowserRouter). Hace falta para la transición de hoja: en React Router 7,
 * `viewTransition` en <Link> y navigate() solo funciona con este router, no con <BrowserRouter>.
 * Las rutas se siguen escribiendo en JSX gracias a createRoutesFromElements.
 */
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<NewspaperPage />}>
      <Route index element={<Home />} />
      <Route path="catalogo" element={<Catalog />} />
      <Route path="catalogo/:slug" element={<AvisoComercial />} />
      {/* ruta vieja: redirige para no romper links ya compartidos */}
      <Route path="producto/:slug" element={<RedirigirAviso />} />
      <Route path="carrito" element={<Cart />} />
      <Route path="pasatiempos" element={<Pasatiempos />} />
      <Route path="juego" element={<Game />} />
      <Route path="como-comprar" element={<HowToBuy />} />
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
)
