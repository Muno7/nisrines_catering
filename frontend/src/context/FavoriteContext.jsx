import { createContext, useContext, useState } from 'react'

const FavoriteContext = createContext(null)

const STORAGE_KEY = 'favorite'

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function FavoriteProvider({ children }) {
  const [favoriteItems, setFavoriteItems] = useState(loadFromStorage)

  function isFavorite(productId) {
    return favoriteItems.some(i => String(i.productId) === String(productId))
  }

  function toggleFavorite(productId) {
    setFavoriteItems(prev => {
      const next = prev.some(i => String(i.productId) === String(productId))
        ? prev.filter(i => String(i.productId) !== String(productId))
        : [...prev, { productId }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function removeFromFavorite(productId) {
    setFavoriteItems(prev => {
      const next = prev.filter(i => String(i.productId) !== String(productId))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <FavoriteContext.Provider value={{ favoriteItems, isFavorite, toggleFavorite, removeFromFavorite }}>
      {children}
    </FavoriteContext.Provider>
  )
}

export function useFavorite() {
  return useContext(FavoriteContext)
}
