const PALETTES = ['#F7E1CF', '#F1D6C2', '#EBD0C3', '#F7DEC9', '#EAD9CF']

function pickPalette(name) {
  const seed = (name || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return PALETTES[seed % PALETTES.length]
}

export function buildPlaceholderDataUrl(name) {
  const bg = pickPalette(name)
  // Serving dome (Streamline icon) centered in canvas, scale(6) maps 14px source → 84px
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'><rect width='320' height='320' rx='16' fill='${bg}'/><g transform='translate(118,118) scale(6)' fill='none' stroke='#A07050' stroke-opacity='0.45' stroke-linecap='round' stroke-linejoin='round' stroke-width='1'><path d='M7 3c1.72391 0 3.3772 0.68482 4.5962 1.90381C12.8152 6.12279 13.5 7.77609 13.5 9.5c0 0.26522-0.1054 0.5196-0.2929 0.7071-0.1875 0.1875-0.4419 0.2929-0.7071 0.2929h-11c-0.26522 0-0.51957-0.1054-0.707107-0.2929C0.605357 10.0196 0.5 9.76522 0.5 9.5c0-1.72391 0.68482-3.37721 1.90381-4.59619C3.62279 3.68482 5.27609 3 7 3Z'/><path d='M7 3V1.5'/><path d='M0.5 12.5h13'/></g></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function resolveProductImageSrc(image, name) {
  const src = (image ?? '').toString().trim()
  if (src) {
    if (/^https?:\/\//i.test(src) || src.startsWith('/') || src.startsWith('data:')) return src
    return `/assets/images/${src}`
  }
  return buildPlaceholderDataUrl(name)
}
