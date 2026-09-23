import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { getProductPrice, formatCurrency, isSoldByDozen } from '../utils/pricing.js'
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js'
import { fetchJSON } from '../utils/api.js'
import { useSEO } from '../hooks/useSEO.js'
import QuantityStepper from '../components/QuantityStepper.jsx'

function SkeletonLine() {
  return (
    <div className="relative bg-surface rounded-2xl overflow-hidden animate-pulse">
      <div className="flex flex-row items-center gap-2 p-2 lg:gap-4">
        <div className="w-28 h-28 lg:w-40 lg:h-40 bg-muted/30 rounded-xl flex-shrink-0" />
        <div className="flex flex-col justify-between gap-16 w-full lg:py-2 lg:gap-20">
          <div className="w-full h-4 bg-muted/30 rounded" />
          <div className="flex justify-between items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <div className="w-14 h-4 bg-muted/30 rounded" />
              <div className="w-20 h-6 bg-muted/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyBasket() {
  return (
    <div className="flex flex-col justify-center items-center gap-4 py-16">
      <div className="w-10 h-10 text-muted">
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <p className="text-xl font-bold">Your basket is empty!</p>
      <Link to="/menu" className="button-primary">
        Explore Menu
      </Link>
    </div>
  )
}

function CartLine({ item, product }) {
  const { addToCart, removeFromCart } = useCart()
  const price = getProductPrice(product, item.portion) ?? 0
  const name = product?.name ?? 'Item no longer available'
  const imageSrc = resolveProductImageSrc(product?.image, name)
  const soldByDozen = isSoldByDozen(product)

  return (
    <div className="relative bg-surface rounded-2xl overflow-hidden transition-all duration-300 sm:hover:-translate-y-1.5">
      <div className="flex flex-row gap-2 p-2 lg:gap-4">
        <div className="relative flex-shrink-0">
          <img className="w-28 h-28 lg:w-40 lg:h-40 object-cover rounded-xl" src={imageSrc} alt={name} />
          {item.day && (
            <span className="bg-primary absolute left-0 top-0 text-white text-xs font-bold px-2 py-1 rounded-tl-none rounded-br-lg shadow-sm capitalize">
              {item.day}
            </span>
          )}
        </div>
        <div className="flex flex-col justify-between gap-4 w-full lg:py-2 lg:gap-8">
          <div className="flex flex-col gap-1">
            <h3 className="text-base md:text-xl font-bold text-accent line-clamp-2">{name}</h3>
            <span className="text-xs text-muted">
              {item.portion === 'family' ? 'Family of 4' : 'Single'}{soldByDozen && ' · Sold by the dozen'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4 w-full">
            <p className="text-lg font-semibold font-numeric">
              <span translate="no">$</span>{formatCurrency(price)}{soldByDozen && ' / dozen'}
            </p>
            <div className="flex flex-col items-end gap-1">
              <QuantityStepper
                className="p-[2px]"
                quantity={item.quantity}
                unitLabel={soldByDozen ? 'dozen' : 'item'}
                onDecrease={() => removeFromCart(item.productId, item.portion)}
                onIncrease={() => addToCart(item.productId, item.day, item.portion)}
              />
              {soldByDozen && <span className="text-[11px] font-medium text-muted">Quantity in dozens</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fixed over the whole viewport, but doesn't lock body scroll: the page
// behind stays visible (dimmed) and scrollable, just not clickable, since
// this overlay sits on top of it and intercepts the clicks.
function ComingSoonOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface border border-muted/30 rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 text-secondary mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm.002 14a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM13 7v7a1 1 0 0 1-2 0V7a1 1 0 0 1 2 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text">Ordering is coming soon</h2>
        <p className="text-muted text-base">
          We&apos;re polishing the experience. In the meantime, feel free to browse the menu or revisit your favorites.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/menu" className="button-primary w-full text-center">
            Explore menu
          </Link>
          <Link
            to="/favorite"
            className="w-full text-center rounded-xl border border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors duration-200 px-4 py-2"
          >
            View favorites
          </Link>
        </div>
      </div>
    </div>
  )
}

function Order() {
  useSEO({
    title: "Order Basket | Nisrine's Catering",
    description: "Review your order from Nisrine's Catering and choose pickup or delivery.",
    path: '/order',
  })

  const { cartItems } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cartItems.length === 0) {
      setLoading(false)
      return
    }
    async function fetchProducts() {
      try {
        const { data } = await fetchJSON('/api/products')
        setProducts(data)
      } catch {
        // empty/fallback rendering handles the error case
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const productsById = new Map(products.map(p => [String(p.id), p]))
  const subtotal = cartItems.reduce((sum, item) => {
    const product = productsById.get(String(item.productId))
    return sum + (getProductPrice(product, item.portion) ?? 0) * item.quantity
  }, 0)

  const showEmpty = !loading && cartItems.length === 0

  return (
    <main className="site-main container mx-auto py-6 lg:px-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3 flex flex-col">
          <h1 className="text-3xl font-bold mb-5 px-2">Order Basket</h1>
          <div className="flex flex-col gap-4 px-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonLine key={i} />)
            ) : showEmpty ? (
              <EmptyBasket />
            ) : (
              cartItems.map(item => (
                <CartLine
                  key={`${item.productId}-${item.portion}`}
                  item={item}
                  product={productsById.get(String(item.productId))}
                />
              ))
            )}
          </div>
        </div>

        <div className="md:w-1/3 flex flex-col gap-6">
          <div className="bg-surface shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-lg p-6 mx-2 flex flex-col gap-6">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-numeric"><span translate="no">$</span>{formatCurrency(subtotal)}</span>
              </div>
<div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="font-numeric"><span translate="no">$</span>{formatCurrency(subtotal)}</span>
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold">Order Type</h3>
              <div className="flex bg-muted/20 p-1 rounded-lg">
                <button type="button" className="flex-1 py-1 px-4 rounded-md text-center transition-colors duration-200 bg-surface text-accent font-medium">
                  Pickup
                </button>
                <button type="button" className="flex-1 py-1 px-4 rounded-md text-center transition-colors duration-200 text-muted">
                  Delivery
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg">Customer Details</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name <span className="text-secondary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    readOnly
                    className="w-full p-2 bg-surface rounded-md border focus:ring-2 focus:ring-secondary focus:bg-muted/20 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-secondary">*</span>
                  </label>
                  <div className="flex min-w-0 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-surface rounded-md border cursor-default whitespace-nowrap">
                      <span>🇱🇧</span>
                      <span>+961</span>
                      <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      placeholder="No dashes or spaces"
                      readOnly
                      className="flex-1 min-w-0 p-2 bg-surface rounded-md border focus:ring-2 focus:ring-secondary focus:bg-muted/20 focus:outline-none transition-colors duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    placeholder="Enter any special requests (e.g., less salt, lactose-free)"
                    readOnly
                    rows={2}
                    style={{ resize: 'none' }}
                    className="w-full p-2 bg-surface rounded-md border focus:ring-2 focus:ring-secondary focus:bg-muted/20 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Delivery/Pick-up Date <span className="text-secondary">*</span>
                  </label>
                  <input
                    type="date"
                    readOnly
                    className="w-full p-2 bg-surface rounded-md border focus:ring-2 focus:ring-secondary focus:bg-muted/20 focus:outline-none transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button type="button" className="w-full button-primary transition-colors duration-200">
              Place Order
            </button>
          </div>
        </div>
      </div>

      <ComingSoonOverlay />
    </main>
  )
}

export default Order
