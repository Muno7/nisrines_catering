export default function QuantityStepper({ quantity, onDecrease, onIncrease, size = 'md', className = '', quantityClassName = 'text-base font-medium w-9 text-center font-numeric', unitLabel = 'item' }) {
  const buttonSize = size === 'lg' ? 'h-full w-[25%]' : 'w-7 h-6'
  const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'

  return (
    <div className={`flex justify-between items-center rounded-full bg-primary ${className}`}>
      <button
        className={`rounded-full bg-surface lg:hover:bg-surface/70 active:bg-white flex items-center justify-center ${buttonSize}`}
        onClick={onDecrease}
        aria-label={`Decrease ${unitLabel} quantity`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={`fill-current ${iconSize}`}>
          <path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z" />
        </svg>
      </button>
      <span className={quantityClassName} aria-label={`${quantity} ${unitLabel}${quantity === 1 ? '' : 's'}`}>{quantity}</span>
      <button
        className={`rounded-full bg-surface lg:hover:bg-surface/70 active:bg-white flex items-center justify-center ${buttonSize}`}
        onClick={onIncrease}
        aria-label={`Increase ${unitLabel} quantity`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={`fill-current ${iconSize}`}>
          <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
        </svg>
      </button>
    </div>
  )
}
