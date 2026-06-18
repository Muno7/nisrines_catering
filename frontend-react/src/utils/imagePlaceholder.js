const PALETTES = ['#F7E1CF', '#F1D6C2', '#EBD0C3', '#F7DEC9', '#EAD9CF']

function pickPalette(name) {
  const seed = (name || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return PALETTES[seed % PALETTES.length]
}

function cleanInitial(name) {
  const trimmed = (name || '').trim()
  return trimmed ? trimmed[0].toUpperCase() : '?'
}

export function buildPlaceholderDataUrl(name) {
  const fill = pickPalette(name)
  const initial = cleanInitial(name)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'><rect width='320' height='320' rx='24' ry='24' fill='${fill}'/><text x='50%' y='55%' text-anchor='middle' dominant-baseline='middle' font-family='Playfair Display, Lora, serif' font-size='140' font-weight='700' fill='#2a1810'>${initial}</text></svg>`
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
