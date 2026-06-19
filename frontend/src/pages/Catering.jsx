import { useState, useEffect, useRef } from 'react'
import './Catering.css'
import { useHeroReady } from '../utils/useHeroReady.js'
import { useSEO } from '../hooks/useSEO.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function Catering() {
  useSEO({
    title: "Catering Services | Nisrine's Catering",
    description: "Professional catering for events and gatherings. Customised Lebanese menus, fresh homemade food for any occasion in Beirut.",
  })

  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })
  const touchRef = useRef({ startX: 0, startY: 0, touching: false })
  const { markReady } = useHeroReady()

  useEffect(() => {
    const img = new Image()
    let done = false
    const onReady = () => {
      if (done) return
      done = true
      clearTimeout(timeoutId)
      markReady()
    }
    const timeoutId = setTimeout(onReady, 2500)
    img.onload = onReady
    img.onerror = onReady
    img.src = '/assets/images/catering-hero.jpg'
    if (img.complete) onReady()
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/catering-menus`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { data } = await res.json()
        const filtered = (Array.isArray(data) ? data : []).filter(
          (m) => m?.image?.toString().trim()
        )
        setMenus(filtered)
      } catch {
        setMenus([])
      } finally {
        setLoading(false)
      }
    }
    fetchMenus()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (!lightbox.open) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') navigate(-1)
      if (e.key === 'ArrowRight') navigate(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  useEffect(() => {
    document.body.classList.toggle('no-scroll', lightbox.open)
    return () => document.body.classList.remove('no-scroll')
  }, [lightbox.open])

  const openLightbox = (index) => setLightbox({ open: true, index })
  const closeLightbox = () => setLightbox((prev) => ({ ...prev, open: false }))
  const navigate = (delta) =>
    setLightbox((prev) => ({
      ...prev,
      index: Math.max(0, Math.min(prev.index + delta, menus.length - 1)),
    }))

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0]
    if (!touch) return
    touchRef.current = { startX: touch.clientX, startY: touch.clientY, touching: true }
  }
  const handleTouchEnd = (e) => {
    if (!touchRef.current.touching) return
    touchRef.current.touching = false
    const touch = e.changedTouches?.[0]
    if (!touch) return
    const dx = touch.clientX - touchRef.current.startX
    const dy = touch.clientY - touchRef.current.startY
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
    navigate(dx < 0 ? 1 : -1)
  }

  const currentMenu = menus[lightbox.index]
  const atStart = lightbox.index <= 0
  const atEnd = lightbox.index >= menus.length - 1
  const showNav = menus.length > 1

  return (
    <main className="site-main">
      <section className="catering-hero">
        <div className="catering-hero__media" aria-hidden="true" />
        <div className="container mx-auto px-4 lg:px-8 catering-hero__inner">
          <div className="catering-hero__copy">
            <p className="catering-eyebrow">Catering</p>
            <h1 className="catering-title">Menus made for your next event.</h1>
            <div className="catering-hero__actions">
              <a href="#catering-menus" className="button-cta catering-hero__cta">
                View catering menus
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="catering-menus" className="catering-menus-section">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="catering-section-header">
            <div>
              <p className="catering-eyebrow">Menus</p>
              <h2 className="catering-section-title">Catering menus</h2>
            </div>
          </div>

          <div className="catering-menus-grid">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="menu-skeleton">
                  <div className="menu-skeleton__image" />
                  <div className="menu-skeleton__label" />
                </div>
              ))
            ) : menus.length === 0 ? (
              <div className="catering-empty">Menus will be posted here soon.</div>
            ) : (
              menus.map((menu, index) => (
                <button
                  key={index}
                  type="button"
                  className="menu-card"
                  onClick={() => openLightbox(index)}
                  aria-label={`Zoom Menu ${index + 1}`}
                >
                  <img
                    className="menu-card__image"
                    src={menu.image.toString().trim()}
                    alt={`Menu ${index + 1}`}
                  />
                  <span className="menu-card__hint">Tap to zoom</span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <div
        className={`catering-lightbox${lightbox.open ? ' is-open' : ''}`}
        aria-hidden={!lightbox.open}
        onClick={(e) => { if (e.target === e.currentTarget) closeLightbox() }}
      >
        <div
          className="catering-lightbox__dialog"
          role="dialog"
          aria-modal={lightbox.open}
          aria-label="Catering menu preview"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentMenu && (
            <img
              className="catering-lightbox__image"
              src={currentMenu.image.toString().trim()}
              alt={`Menu ${lightbox.index + 1}`}
            />
          )}
        </div>
        <button
          type="button"
          className="catering-lightbox__close"
          onClick={closeLightbox}
          aria-label="Close menu preview"
        >
          &times;
        </button>
        {showNav && (
          <>
            <button
              type="button"
              className={`catering-lightbox__nav catering-lightbox__nav--prev${atStart ? ' is-hidden' : ''}`}
              onClick={(e) => { e.stopPropagation(); navigate(-1) }}
              disabled={atStart}
              aria-label="Previous menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L12.17 12z" />
              </svg>
              <span>Prev</span>
            </button>
            <button
              type="button"
              className={`catering-lightbox__nav catering-lightbox__nav--next${atEnd ? ' is-hidden' : ''}`}
              onClick={(e) => { e.stopPropagation(); navigate(1) }}
              disabled={atEnd}
              aria-label="Next menu"
            >
              <span>Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L12.17 12z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default Catering
