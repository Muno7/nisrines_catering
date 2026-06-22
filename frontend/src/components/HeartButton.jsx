import { useFavorite } from '../context/FavoriteContext.jsx'

export default function HeartButton({ productId, size = 'md', className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorite()
  const checked = isFavorite(productId)

  const wrapperSize = size === 'lg' ? 'p-2 top-2 right-2' : 'p-1.75 top-4 right-4'
  const iconSize = size === 'lg' ? 'w-[24px] h-[24px]' : 'h-4 w-4'
  const shadow = size === 'lg' ? 'shadow-sm' : 'shadow-md'

  return (
    <label
      className={`z-3 product-heart-button absolute bg-white rounded-full cursor-pointer select-none transition duration-100 ${shadow} ${wrapperSize} ${className}`}
      onClick={e => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="absolute opacity-0 cursor-pointer h-0 w-0"
        checked={checked}
        onChange={() => toggleFavorite(productId)}
      />
      <div className={`heart-checkmark ${iconSize}`}>
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
