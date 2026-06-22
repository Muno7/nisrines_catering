import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'cart'

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadFromStorage)
  const [dayConflict, setDayConflict] = useState(null)

  const cartDay = cartItems.find(i => i.day)?.day ?? null
  const totalQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  function getCartItem(productId, portion) {
    return cartItems.find(i => String(i.productId) === String(productId) && i.portion === portion) ?? null
  }

  function addToCart(productId, productDay, portion) {
    const currentDay = cartDay
    if (productDay && currentDay && currentDay !== productDay) {
      setDayConflict({ currentDay, productDay })
      return false
    }
    setCartItems(prev => {
      const idx = prev.findIndex(i => String(i.productId) === String(productId) && i.portion === portion)
      let next
      if (idx !== -1) {
        next = prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item)
      } else {
        next = [...prev, { productId, quantity: 1, portion, day: productDay || null }]
      }
      save(next)
      return next
    })
    return true
  }

  function removeFromCart(productId, portion) {
    setCartItems(prev => {
      const idx = prev.findIndex(i => String(i.productId) === String(productId) && i.portion === portion)
      if (idx === -1) return prev
      const item = prev[idx]
      let next
      if (item.quantity <= 1) {
        next = prev.filter((_, i) => i !== idx)
      } else {
        next = prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity - 1 } : it)
      }
      save(next)
      return next
    })
  }

  function dismissDayConflict() {
    setDayConflict(null)
  }

  return (
    <CartContext.Provider value={{ cartItems, totalQuantity, getCartItem, addToCart, removeFromCart, dayConflict, dismissDayConflict }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
