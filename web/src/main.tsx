import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './App'
import { CartProvider } from './context/CartContext'
import { prepararEntrada } from './lib/entrada'

// Antes de dibujar: decide si va la entrada (el diario con la faja) y, si va, frena el scroll y el logo
prepararEntrada()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  </StrictMode>,
)
