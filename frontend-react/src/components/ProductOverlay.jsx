import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useFavorite } from '../context/FavoriteContext'
import { getProductPrice, formatCurrency } from '../utils/pricing'
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js'
import BasketNotification from './BasketNotification.jsx'

function HeartButton({ productId }) {
  const { isFavorite, toggleFavorite } = useFavorite()
  const checked = isFavorite(productId)

  return (
    <label
      className="z-[3] shadow-sm product-heart-button absolute bg-white rounded-full p-2 top-2 right-2 cursor-pointer select-none transition duration-100"
      onClick={e => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="absolute opacity-0 cursor-pointer h-0 w-0"
        checked={checked}
        onChange={() => toggleFavorite(productId)}
      />
      <div className="heart-checkmark w-[24px] h-[24px]">
        <svg viewBox="0 0 256 256">
          <rect fill="none" height="256" width="256" />
          <path
            d="M224.6,51.9a59.5,59.5,0,0,0-43-19.9,60.5,60.5,0,0,0-44,17.6L128,59.1l-7.5-7.4C97.2,28.3,59.2,26.3,35.9,47.4a59.9,59.9,0,0,0-2.3,87l83.1,83.1a15.9,15.9,0,0,0,22.6,0l81-81C243.7,113.2,245.6,75.2,224.6,51.9Z"
            strokeWidth="20px"
            stroke="#2a1810"
            fill="none"
          />
        </svg>
      </div>
    </label>
  )
}

function FamilyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="fill-white w-[18px] h-[18px] md:w-5 md:h-5">
      <path d="m.213,9.145c-.341-.435-.264-1.063.171-1.404L8.919,1.062c1.814-1.419,4.348-1.42,6.162,0l8.535,6.679c.435.34.512.969.171,1.404-.197.252-.491.384-.788.384-.215,0-.433-.069-.615-.212L13.849,2.638c-1.088-.852-2.609-.852-3.697,0L1.616,9.316c-.436.34-1.063.262-1.403-.171Zm3.524,8.89c-2.166.591-3.737,2.679-3.737,4.965,0,.553.447,1,1,1s1-.447,1-1c0-1.379.973-2.684,2.263-3.035.533-.146.848-.695.702-1.228-.146-.534-.699-.847-1.228-.702Zm16.525,0c-.526-.146-1.082.168-1.228.702-.146.532.169,1.082.702,1.228,1.29.352,2.263,1.656,2.263,3.035,0,.553.447,1,1,1s1-.447,1-1c0-2.286-1.571-4.374-3.737-4.965Zm-15.763-7.035c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5-1.119-2.5-2.5-2.5Zm17.5,2.5c0-1.381-1.119-2.5-2.5-2.5s-2.5,1.119-2.5,2.5,1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5Zm-10-5.5c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5,2.5-1.119,2.5-2.5-1.119-2.5-2.5-2.5Zm0,7c-2.757,0-5,2.243-5,5v3c0,.553.447,1,1,1s1-.447,1-1v-3c0-1.654,1.346-3,3-3s3,1.346,3,3v3c0,.553.447,1,1,1s1-.447,1-1v-3c0-2.757-2.243-5-5-5Z" />
    </svg>
  )
}

function SingleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="fill-white w-[18px] h-[18px] md:w-5 md:h-5">
      <path d="M12,12A6,6,0,1,0,6,6,6.006,6.006,0,0,0,12,12ZM12,2A4,4,0,1,1,8,6,4,4,0,0,1,12,2Z" />
      <path d="M12,14a9.01,9.01,0,0,0-9,9,1,1,0,0,0,2,0,7,7,0,0,1,14,0,1,1,0,0,0,2,0A9.01,9.01,0,0,0,12,14Z" />
    </svg>
  )
}

function getPrice(product, portion) {
  const cents = getProductPrice(product, portion)
  return cents === null ? null : formatCurrency(cents)
}

export default function ProductOverlay({ product, onClose }) {
  const { getCartItem, addToCart, removeFromCart } = useCart()
  const [portion, setPortion] = useState('single')
  const [notification, setNotification] = useState(null)
  const notifKeyRef = useRef(0)

  function triggerNotification(isAdding) {
    notifKeyRef.current += 1
    setNotification({ isAdding, key: notifKeyRef.current })
  }

  const hasFamilyPortion =
    typeof product.family === 'number' ||
    typeof product.price?.family === 'number'

  const cartItem = getCartItem(product.id, portion)
  const price = getPrice(product, portion)
  const imageSrc = resolveProductImageSrc(product.image, product.name)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    setPortion('single')
  }, [product.id])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pt-8 pb-12 sm:p-6 sm:pt-10 sm:pb-14"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="relative bg-white rounded-xl shadow-lg w-full max-w-[360px] h-[90vh] max-h-[700px] md:max-w-[720px] md:h-[85vh] flex flex-col md:flex-row overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 left-2 z-10 bg-white rounded-full p-2 shadow-md lg:hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#2a1810]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative w-full md:w-1/2 h-[40vh] md:h-full overflow-hidden">
          <img src={imageSrc} alt={product.name} className="w-full h-full object-cover object-center" />
          <HeartButton productId={product.id} />
          {notification && (
            <BasketNotification
              key={notification.key}
              isAdding={notification.isAdding}
              onDone={() => setNotification(null)}
            />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col bg-surface w-full md:w-1/2 h-[50vh] md:h-full overflow-hidden">
          <div className="flex-grow overflow-y-auto p-4 md:p-6">
            <div className="space-y-4">
              <h1 className="text-xl md:text-2xl font-bold leading-tight">{product.name}</h1>

              <div className="flex items-center gap-4">
                <span className="text-xl md:text-2xl price-js">
                  <span>$</span>{price}
                </span>

                {hasFamilyPortion && (
                  <div className="portion-container-js flex items-center gap-2">
                    <button
                      className={`button-primary portion-button rounded-full h-9 w-9 flex items-center justify-center ${portion === 'family' ? 'active' : ''}`}
                      onClick={() => setPortion('family')}
                      title="Family of 4"
                    >
                      <FamilyIcon />
                    </button>
                    <button
                      className={`button-primary portion-button rounded-full h-9 w-9 flex items-center justify-center ${portion === 'single' ? 'active' : ''}`}
                      onClick={() => setPortion('single')}
                      title="Single"
                    >
                      <SingleIcon />
                    </button>
                  </div>
                )}
              </div>

              {product.ingredients && (
                <div className="ingredients-js border-t border-gray-200 pt-4">
                  <h2 className="font-bold text-lg mb-1">Ingredients</h2>
                  <p className="text-sm md:text-base">{product.ingredients}</p>
                </div>
              )}
            </div>
          </div>

          {/* Add to basket */}
          <div className="p-2 border-t border-gray-200 mt-auto">
            <div className="relative w-full h-[46px]">
              {cartItem ? (
                <div className="h-full bg-primary p-1 flex justify-between items-center rounded-full">
                  <button
                    onClick={() => {
                      triggerNotification(false)
                      removeFromCart(product.id, portion)
                    }}
                    className="h-full w-[25%] rounded-full bg-surface lg:hover:bg-surface/70 transition-all active:bg-white flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512" className="fill-current w-4 h-4">
                      <path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z" />
                    </svg>
                  </button>
                  <span className="overlay-item-quantity-js w-full text-xl font-medium text-center text-white">{cartItem.quantity}</span>
                  <button
                    onClick={() => {
                      const added = addToCart(product.id, product.day || '', portion)
                      if (added) triggerNotification(true)
                    }}
                    className="h-full w-[25%] rounded-full bg-surface lg:hover:bg-surface/70 transition-all active:bg-white flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512" className="fill-current w-4 h-4">
                      <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const added = addToCart(product.id, product.day || '', portion)
                    if (added) triggerNotification(true)
                  }}
                  className="overlay-add-button-js flex w-full h-full text-sm items-center justify-center button-primary transition-opacity duration-300"
                >
                  Add to Basket
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
