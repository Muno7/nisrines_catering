import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useFavorite } from '../context/FavoriteContext'
import { useCart } from '../context/CartContext'
import { getProductPrice, formatCurrency } from '../utils/pricing'
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js'
import ProductOverlay from '../components/ProductOverlay.jsx'
import BasketNotification from '../components/BasketNotification.jsx'
import { useSEO } from '../hooks/useSEO.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function SkeletonCard() {
  return (
    <div className="favorite-card relative bg-surface rounded-2xl overflow-hidden animate-pulse">
      <div className="flex flex-row items-center gap-2 p-2 lg:gap-4">
        <div className="flex-shrink-0">
          <div className="w-28 h-28 lg:w-40 lg:h-40 bg-muted/30 rounded-xl" />
        </div>
        <div className="flex flex-col justify-between gap-16 w-full lg:py-2 lg:gap-20">
          <div className="w-full h-4 bg-muted/30 rounded" />
          <div className="flex justify-between items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <div className="w-14 h-4 bg-muted/30 rounded" />
              <div className="w-20 h-6 bg-muted/30 rounded-full" />
            </div>
            <div className="w-6 h-6 bg-muted/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col justify-center items-center gap-4 col-span-2 py-16">
      <div className="w-10 h-10 text-muted">
        <svg viewBox="0 0 256 256" className="w-full h-full">
          <rect fill="none" height="256" width="256" />
          <path
            d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z"
            strokeWidth="20"
            stroke="currentColor"
            fill="none"
          />
        </svg>
      </div>
      <p className="text-xl font-bold">Your favorites list is empty!</p>
      <Link to="/menu" className="button-primary">
        Explore Menu
      </Link>
    </div>
  )
}

function DayConflictModal({ currentDay, productDay, onClose }) {
  const fmt = d => d.charAt(0).toUpperCase() + d.slice(1)
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="bg-secondary/10 rounded-full p-3 mr-4">
              <svg className="text-secondary w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text">Order Day Conflict</h2>
          </div>
          <div className="space-y-4 text-muted">
            <p className="text-lg">This meal is only available for <span className="font-semibold text-text">{fmt(productDay)}</span>.</p>
            <p className="text-lg">Your basket already contains products for <span className="font-semibold text-text">{fmt(currentDay)}</span>.</p>
            <p className="text-lg">To order for <span className="font-semibold text-text">{fmt(productDay)}</span>, please place a separate order.</p>
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-secondary hover:bg-secondary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function FavoriteCard({ product, onRemove, onOpen }) {
  const { getCartItem, addToCart, removeFromCart } = useCart()
  const [notification, setNotification] = useState(null)
  const notifKeyRef = useRef(0)
  const cartItem = getCartItem(product.id, 'single')
  const quantity = cartItem?.quantity ?? 0
  const price = getProductPrice(product, 'single') ?? 0
  const imageSrc = resolveProductImageSrc(product.image, product.name)

  function triggerNotification(isAdding) {
    notifKeyRef.current += 1
    setNotification({ isAdding, key: notifKeyRef.current })
  }

  return (
    <div
      className="favorite-card relative bg-surface rounded-2xl overflow-hidden transition-all duration-300 sm:hover:-translate-y-1.5 cursor-pointer"
      onClick={() => onOpen(product)}
    >
      <div className="flex flex-row gap-2 p-2 lg:gap-4">
        <div className="relative shrink-0">
          <img
            className="w-28 h-28 lg:w-40 lg:h-40 object-cover rounded-xl"
            src={imageSrc}
            alt={product.name}
          />
          {notification && (
            <BasketNotification
              key={notification.key}
              isAdding={notification.isAdding}
              onDone={() => setNotification(null)}
            />
          )}
        </div>
        <div className="flex flex-col justify-between gap-4 w-full lg:py-2 lg:gap-8">
          <h3 className="text-base md:text-xl font-semibold line-clamp-2">{product.name}</h3>
          <div className="flex justify-between items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">${formatCurrency(price)}</p>
              {!cartItem ? (
                <button
                  className="button-primary h-7 w-24 text-sm flex items-center justify-center"
                  onClick={e => {
                    e.stopPropagation()
                    const added = addToCart(product.id, product.day || null, 'single')
                    if (added) triggerNotification(true)
                  }}
                >
                  Add
                </button>
              ) : (
                <div
                  className="flex justify-between items-center p-0.5 rounded-full bg-primary"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="rounded-full bg-surface lg:hover:bg-surface/70 active:bg-white w-7 h-6 flex items-center justify-center"
                    onClick={() => {
                      triggerNotification(false)
                      removeFromCart(product.id, 'single')
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="fill-current w-3 h-3">
                      <path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z" />
                    </svg>
                  </button>
                  <span className="text-base font-medium w-9 text-center">{quantity}</span>
                  <button
                    className="rounded-full bg-surface lg:hover:bg-surface/70 active:bg-white w-7 h-6 flex items-center justify-center"
                    onClick={() => {
                      const added = addToCart(product.id, product.day || null, 'single')
                      if (added) triggerNotification(true)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="fill-current w-3 h-3">
                      <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <button
              className="text-primary hover:text-primary-hover lg:absolute bottom-4 right-4"
              onClick={e => { e.stopPropagation(); onRemove() }}
              aria-label="Remove from favorites"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Favorite() {
  useSEO({
    title: "Your Favorites | Nisrine's Catering",
    description: "Your saved favorite dishes from Nisrine's Catering. Add them to your basket and order in a click.",
  })

  const { favoriteItems, removeFromFavorite } = useFavorite()
  const { dayConflict, dismissDayConflict } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    if (favoriteItems.length === 0) {
      setLoading(false)
      return
    }
    async function fetchProducts() {
      try {
        const res = await fetch(`${API_BASE}/api/products`)
        if (!res.ok) throw new Error('Failed to fetch products')
        const { data } = await res.json()
        setProducts(
          data.map(p => ({
            id: p.id,
            image: p.image,
            name: p.name,
            ingredients: p.ingredients,
            category: p.category,
            day: p.day,
            priceCents: typeof p.priceCents === 'number' ? p.priceCents : null,
            single: p.price?.single ?? null,
            family: p.price?.family ?? null,
          }))
        )
      } catch {
        // empty state will render on error
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const favoriteIds = new Set(favoriteItems.map(item => String(item.productId)))
  const favoriteProducts = products.filter(p => favoriteIds.has(String(p.id)))
  const showEmpty = !loading && favoriteProducts.length === 0

  return (
    <main className="site-main container mx-auto py-6 lg:px-12">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center sm:items-start">
          <h1 className="text-3xl font-bold mb-5 px-2">Your Favorites</h1>
          <div className="w-full px-2 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              ) : showEmpty ? (
                <EmptyState />
              ) : (
                favoriteProducts.map(product => (
                  <FavoriteCard
                    key={product.id}
                    product={product}
                    onRemove={() => removeFromFavorite(String(product.id))}
                    onOpen={setSelectedProduct}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <ProductOverlay key="overlay" product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>

      {dayConflict && (
        <DayConflictModal
          currentDay={dayConflict.currentDay}
          productDay={dayConflict.productDay}
          onClose={dismissDayConflict}
        />
      )}
    </main>
  )
}

export default Favorite
