import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useFavorite } from '../context/FavoriteContext'
import { useCart } from '../context/CartContext'
import { getProductPrice, formatCurrency } from '../utils/pricing'
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js'
import { fetchJSON } from '../utils/api.js'
import { mapProduct } from '../utils/mapProduct.js'
import ProductOverlay from '../components/ProductOverlay.jsx'
import BasketNotification from '../components/BasketNotification.jsx'
import DayConflictModal from '../components/DayConflictModal.jsx'
import QuantityStepper from '../components/QuantityStepper.jsx'
import { useSEO } from '../hooks/useSEO.js'

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
    <div className="md:col-span-2 flex flex-col items-center justify-center gap-3 w-full py-16 px-4 text-center">
      <div className="w-12 h-12 text-muted">
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
      <p className="text-lg font-semibold text-accent">Your favorites list is empty</p>
      <p className="text-sm text-muted max-w-xs">Save dishes you love and they'll show up here.</p>
      <Link to="/menu" className="button-primary mt-2">
        Explore Menu
      </Link>
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
              size="sm"
            />
          )}
        </div>
        <div className="flex flex-col justify-between gap-4 w-full lg:py-2 lg:gap-8">
          <h3 className="text-base md:text-xl font-bold text-accent line-clamp-2">{product.name}</h3>
          <div className="flex justify-between items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted font-numeric"><span translate="no">$</span>{formatCurrency(price)}</p>
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
                <div onClick={e => e.stopPropagation()}>
                  <QuantityStepper
                    className="p-0.5"
                    quantityClassName="text-base font-medium w-9 text-center"
                    quantity={quantity}
                    onDecrease={() => {
                      triggerNotification(false)
                      removeFromCart(product.id, 'single')
                    }}
                    onIncrease={() => {
                      const added = addToCart(product.id, product.day || null, 'single')
                      if (added) triggerNotification(true)
                    }}
                  />
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
    path: '/favorite',
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
        const { data } = await fetchJSON('/api/products')
        setProducts(data.map(mapProduct))
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
    <main className="site-main">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-6 lg:pt-12 lg:pb-10">
        <header className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-accent">Your Favorites</h1>
          <p className="mt-1 text-sm text-muted">
            {favoriteProducts.length > 0
              ? `${favoriteProducts.length} saved dish${favoriteProducts.length > 1 ? 'es' : ''}`
              : "Dishes you love, saved for later."}
          </p>
        </header>

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
