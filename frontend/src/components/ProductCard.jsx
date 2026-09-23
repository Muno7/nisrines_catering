import { useLanguage } from '../context/LanguageContext.jsx'
import { getProductPrice, formatCurrency, isSoldByDozen } from '../utils/pricing.js'
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js'
import HeartButton from './HeartButton.jsx'

export default function ProductCard({ product, onOpen, className, style }) {
  const { language } = useLanguage()
  const imageSrc = resolveProductImageSrc(product.image, product.name)
  const price = getProductPrice(product, 'single')
  const soldByDozen = isSoldByDozen(product)
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
        {soldByDozen && (
          <span className="absolute bottom-0 right-0 rounded-tl-lg bg-accent px-2 py-1 text-xs font-bold text-white shadow-sm">
            Sold by dozen
          </span>
        )}
      </div>

      <HeartButton productId={product.id} />

      <div className="flex flex-col px-1 gap-1">
        {price !== null && (
          <p className="price-js text-xs font-medium text-muted">
            <span translate="no">$</span>{formatCurrency(price)}{soldByDozen && ' / dozen'}
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
