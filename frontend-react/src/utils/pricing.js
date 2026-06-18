export function formatCurrency(cents) {
  return (Math.round(cents ?? 0) / 100).toFixed(2)
}

// Backend sends either a flat `priceCents` (single-price items) or a nested
// `price: { single, family }` (items with a family portion) - this works
// against either shape, and against callers that already normalized it to
// top-level `single`/`family`/`priceCents` fields.
export function getProductPrice(product, portion = 'single') {
  if (!product) return null

  const single = typeof product.single === 'number'
    ? product.single
    : typeof product.price?.single === 'number'
      ? product.price.single
      : null

  const family = typeof product.family === 'number'
    ? product.family
    : typeof product.price?.family === 'number'
      ? product.price.family
      : null

  if (single !== null && family !== null) return portion === 'family' ? family : single
  if (single !== null) return single
  if (family !== null) return family

  return typeof product.priceCents === 'number' ? product.priceCents : null
}
