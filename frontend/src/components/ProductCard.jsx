import { useFavorite } from '../context/FavoriteContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { getProductPrice, formatCurrency } from '../utils/pricing.js'
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js'

export default function ProductCard({ product, onOpen, className, style }) {
  const { isFavorite, toggleFavorite } = useFavorite()
  const { language } = useLanguage()
  const imageSrc = resolveProductImageSrc(product.image, product.name)
  const price = getProductPrice(product, 'single')
  const nameAr = product.nameAr || product.name_ar
  const displayName = language === 'ar' && nameAr ? nameAr : product.name

  return (
    <div
      className={`product-container relative flex flex-col gap-2 bg-surface p-2 rounded-2xl transition-all duration-300 sm:hover:-translate-y-1.5${onOpen ? ' cursor-pointer' : ''}${className ? ' ' + className : ''}`}
      style={style}
      onClick={onOpen ? () => onOpen(product) : undefined}
    >
      <div className="relative h-44 w-full overflow-hidden rounded-xl">
        <img
          loading="lazy"
          className="w-full h-full object-cover"
          src={imageSrc}
          alt={product.name}
        />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
        {product.day && (
          <span className="bg-primary absolute left-0 top-0 text-white text-xs font-bold px-2 py-1 rounded-tl-none rounded-br-lg shadow-sm capitalize">
            {product.day.charAt(0).toUpperCase() + product.day.slice(1)}
          </span>
        )}
      </div>

      <label
        className="z-3 shadow-md product-heart-button absolute bg-white rounded-full p-1.75 top-4 right-4 cursor-pointer select-none transition duration-100"
        onClick={e => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="absolute opacity-0 cursor-pointer h-0 w-0"
          checked={isFavorite(product.id)}
          onChange={() => toggleFavorite(product.id)}
        />
        <div className="heart-checkmark h-4 w-4">
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

      <div className="flex flex-col px-1 gap-1">
        {price !== null && (
          <p className="price-js text-xs font-medium text-muted">
            <span translate="no">$</span>{formatCurrency(price)}
          </p>
        )}
        <div className="h-10 overflow-hidden">
          <p
            className="text-sm font-bold leading-snug line-clamp-2 text-accent"
            translate="no"
          >
            {displayName}
          </p>
        </div>
      </div>
    </div>
  )
}
