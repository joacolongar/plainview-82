import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import NewspaperPage from './components/NewspaperPage'
import Home from './pages/Home'
import IndiceAvisos from './pages/IndiceAvisos'
import AvisoComercial, { RedirigirAviso } from './pages/AvisoComercial'
import Boleta from './pages/Boleta'
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
      <Route path="catalogo" element={<IndiceAvisos />} />
      <Route path="catalogo/:slug" element={<AvisoComercial />} />
      {/* ruta vieja: redirige para no romper links ya compartidos */}
      <Route path="producto/:slug" element={<RedirigirAviso />} />
      <Route path="carrito" element={<Boleta />} />
      <Route path="pasatiempos" element={<Pasatiempos />} />
      <Route path="juego" element={<Game />} />
      <Route path="como-comprar" element={<HowToBuy />} />
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
)
