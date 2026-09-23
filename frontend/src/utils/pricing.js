export function formatCurrency(cents) {
  return (Math.round(cents ?? 0) / 100).toFixed(2)
}

// Backend always sends `price: { single, family }`, with `family` null when
// the product has no family-size option.
export function getProductPrice(product, portion = 'single') {
  if (!product) return null

  const single = typeof product.price?.single === 'number' ? product.price.single : null
  const family = typeof product.price?.family === 'number' ? product.price.family : null

  if (portion === 'family') return family ?? single
  return single ?? family
}

export function isSoldByDozen(product) {
  return product?.orderUnit === 'dozen' || product?.order_unit === 'dozen'
}
