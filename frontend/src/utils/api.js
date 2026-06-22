export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Admin content (products, categories, slideshow, etc.) only changes in
// occasional manual batches, so a short cache avoids refetching the same
// data on every page mount without risking meaningfully stale content.
const CACHE_TTL_MS = 10 * 60 * 1000

const cache = new Map() // path -> { promise, timestamp }

export async function fetchJSON(path) {
  const cached = cache.get(path)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.promise
  }

  const promise = fetch(`${API_BASE_URL}${path}`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })

  // Don't keep a failed request cached — let the next caller retry.
  promise.catch(() => cache.delete(path))

  cache.set(path, { promise, timestamp: Date.now() })
  return promise
}
