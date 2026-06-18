import { useFavorite } from '../context/FavoriteContext.jsx'
import { getProductPrice, formatCurrency } from '../utils/pricing.js'
import { resolveProductImageSrc } from '../utils/imagePlaceholder.js'

export default function ProductCard({ product, onOpen, onAdd, onRemove, qty, className, style }) {
  const { isFavorite, toggleFavorite } = useFavorite()
  const imageSrc = resolveProductImageSrc(product.image, product.name)
  const price = getProductPrice(product, 'single')

  return (
    <div
      className={`product-container relative flex flex-col gap-2 bg-surface border border-muted/30 p-2 rounded-[10px] transition-all duration-500 sm:hover:-translate-y-1 sm:hover:shadow-lg${onOpen ? ' cursor-pointer' : ''}${className ? ' ' + className : ''}`}
      style={style}
      onClick={onOpen ? () => onOpen(product) : undefined}
    >
      <div className="relative h-[10rem] w-full">
        <img
          loading="lazy"
          className="w-full h-full object-cover rounded-[10px]"
          src={imageSrc}
          alt={product.name}
        />
        {product.day && (
          <span className="bg-primary absolute left-0 top-0 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md capitalize">
            {product.day.charAt(0).toUpperCase() + product.day.slice(1)}
          </span>
        )}
      </div>

      {/* Heart button: direct child of card (not image div), matching old frontend DOM structure */}
      <label
        className="z-[3] shadow-sm product-heart-button absolute bg-white rounded-full p-[7px] top-4 right-4 cursor-pointer select-none transition duration-100"
        onClick={e => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="absolute opacity-0 cursor-pointer h-0 w-0"
          checked={isFavorite(product.id)}
          onChange={() => toggleFavorite(product.id)}
        />
        <div className="heart-checkmark h-[16px] w-[16px]">
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

      <div className="flex flex-col p-2 gap-1 items-center text-center">
        <p
          className="text-lg font-semibold leading-tight line-clamp-1 truncate text-accent w-full text-center"
          translate="no"
        >
          {product.name}
        </p>
        {price !== null && (
          <p className="price-js text-center">
            <span translate="no">$</span>{formatCurrency(price)}
          </p>
        )}
        {onAdd !== undefined && (
          <div className="relative w-full mt-1">
            {!qty ? (
              <button
                onClick={e => { e.stopPropagation(); onAdd() }}
                className="flex w-full text-sm justify-center button-primary py-1 rounded-xl transition-opacity duration-300"
              >
                Add
              </button>
            ) : (
              <div className="flex justify-between items-center rounded-xl border-2 bg-muted/20">
                <button
                  onClick={e => { e.stopPropagation(); onRemove() }}
                  className="rounded-full transition-all active:bg-muted/30 w-6 h-6 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="fill-current w-[12px] h-[12px]">
                    <path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z" />
                  </svg>
                </button>
                <span className="bg-surface rounded-md font-medium w-10 text-center font-numeric">{qty}</span>
                <button
                  onClick={e => { e.stopPropagation(); onAdd() }}
                  className="rounded-full transition-all active:bg-muted/30 w-6 h-6 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="fill-current w-[12px] h-[12px]">
                    <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
