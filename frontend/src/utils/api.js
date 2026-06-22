export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function fetchJSON(path) {
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
