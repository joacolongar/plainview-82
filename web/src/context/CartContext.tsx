import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Size } from '../data/products'

export type CartItem = { slug: string; name: string; price: number; size: Size; color: string; qty: number }

type Cart = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>) => void
  setQty: (index: number, qty: number) => void
  clear: () => void
  count: number
}

const CartCtx = createContext<Cart | null>(null)
const KEY = 'pv82-cart'

function load(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function guardar(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* storage no disponible: el carrito vive solo en memoria */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load)

  useEffect(() => guardar(items), [items])

  const add: Cart['add'] = (item) =>
    setItems((prev) => {
      const i = prev.findIndex((p) => p.slug === item.slug && p.size === item.size && p.color === item.color)
      if (i === -1) return [...prev, { ...item, qty: 1 }]
      return prev.map((p, idx) => (idx === i ? { ...p, qty: p.qty + 1 } : p))
    })

  const setQty: Cart['setQty'] = (index, qty) =>
    setItems((prev) => (qty <= 0 ? prev.filter((_, i) => i !== index) : prev.map((p, i) => (i === index ? { ...p, qty } : p))))

  // Vaciar también guarda en el acto: la boleta vacía y enseguida se va a WhatsApp, antes de que corra el efecto
  const clear = () => {
    guardar([])
    setItems([])
  }

  const value: Cart = { items, add, setQty, clear, count: items.reduce((s, i) => s + i.qty, 0) }
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
