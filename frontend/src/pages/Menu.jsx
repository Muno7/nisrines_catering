import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useFavorite } from '../context/FavoriteContext'
import SharedProductCard from '../components/ProductCard.jsx'
import ProductOverlay from '../components/ProductOverlay.jsx'
import { useSEO } from '../hooks/useSEO.js'


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const DAY_OPTIONS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_ORDER = Object.fromEntries(DAY_OPTIONS.map((d, i) => [d, i]))
const DEFAULT_CATEGORY = 'all'

const INITIAL_FILTER = {
  categories: new Set(),
  portions: new Set(),
  priceMin: '',
  priceMax: '',
  favoritesOnly: false,
  days: new Set(),
}

// ── Utilities ────────────────────────────────────────────────────────

function isProductAvailable(product) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const now = new Date()
  const currentDay = days[now.getDay()]
  const currentHour = now.getHours()
  const pd = product.day
  if (!pd) return true
  const pi = days.indexOf(pd)
  const ci = days.indexOf(currentDay)
  if (pi < ci) return false
  if (pi === ci && currentHour >= 17) return false
  return true
}

// ── Day Conflict Modal ────────────────────────────────────────────────

function DayConflictModal({ currentDay, productDay, onClose }) {
  const fmt = d => d.charAt(0).toUpperCase() + d.slice(1)
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4 transform scale-95 transition-transform duration-300">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="bg-secondary/10 rounded-full p-3 mr-4">
              <svg className="text-secondary w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text">Order Day Conflict</h2>
          </div>
          <div className="space-y-4 text-muted">
            <p className="text-lg">This meal is only available for <span className="font-semibold text-text">{fmt(productDay)}</span>.</p>
            <p className="text-lg">Your basket already contains products for <span className="font-semibold text-text">{fmt(currentDay)}</span>.</p>
            <p className="text-lg">To order for <span className="font-semibold text-text">{fmt(productDay)}</span>, please place a separate order.</p>
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-secondary hover:bg-secondary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filter Drawer ─────────────────────────────────────────────────────

function FilterDrawer({ isOpen, onClose, filterState, onFilterChange, onClear, categories }) {
  function toggleSet(key, value, checked) {
    const next = new Set(filterState[key])
    checked ? next.add(value) : next.delete(value)
    onFilterChange({ [key]: next })
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose} />
      )}
      <div className={`filter-navigation fixed bg-surface top-0 w-[75%] sm:w-[50%] lg:w-[33%] h-[100vh] shadow-lg transition-all duration-500 z-30 ${isOpen ? 'left-0' : 'left-[-75%] sm:left-[-50%] lg:left-[-33%]'}`}>
        <nav className="flex flex-col w-full pl-4 sm:pl-8 lg:pl-10 py-4 h-full">
          {/* Header */}
          <div className="flex items-center justify-between pr-6">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted/90">Filter & Sort</p>
              <h3 className="text-lg font-semibold text-text">Menu Filters</h3>
            </div>
            <button
              type="button"
              className="h-9 w-9 flex items-center justify-center rounded-full border border-muted/30 text-text hover:bg-white shadow-sm transition"
              onClick={onClose}
              aria-label="Close filters"
            >
              <span className="text-base">&times;</span>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="mt-6 flex-1 overflow-y-auto pr-6 space-y-6 filter-scroll-area">
            <div className="filter-section">
              <h4 className="filter-section-title">Category</h4>
              <div className="space-y-3">
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={filterState.categories.size === 0}
                    onChange={e => { if (e.target.checked) onFilterChange({ categories: new Set() }) }}
                  />
                  <span>All</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.slug} className={`filter-option ${cat.hidden ? 'hidden' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filterState.categories.has(cat.slug)}
                      onChange={e => toggleSet('categories', cat.slug, e.target.checked)}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4 className="filter-section-title">Portion Size</h4>
              <div className="space-y-3">
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={filterState.portions.has('family')}
                    onChange={e => toggleSet('portions', 'family', e.target.checked)}
                  />
                  <span>Family of 4</span>
                </label>
              </div>
            </div>

            <div className="filter-section">
              <h4 className="filter-section-title">Price</h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="filter-input-label">
                  <span className="text-xs text-muted/90">Min</span>
                  <div className="filter-input">
                    <span className="text-muted">$</span>
                    <input
                      type="number" min="0" step="0.5" placeholder="0"
                      value={filterState.priceMin}
                      onChange={e => onFilterChange({ priceMin: e.target.value })}
                    />
                  </div>
                </label>
                <label className="filter-input-label">
                  <span className="text-xs text-muted/90">Max</span>
                  <div className="filter-input">
                    <span className="text-muted">$</span>
                    <input
                      type="number" min="0" step="0.5" placeholder="99"
                      value={filterState.priceMax}
                      onChange={e => onFilterChange({ priceMax: e.target.value })}
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="filter-section">
              <h4 className="filter-section-title">Favorites</h4>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filterState.favoritesOnly}
                  onChange={e => onFilterChange({ favoritesOnly: e.target.checked })}
                />
                <span>Show only favorites</span>
              </label>
            </div>

            <div className="filter-section">
              <h4 className="filter-section-title">Day</h4>
              <div className="grid grid-cols-2 gap-2">
                {DAY_OPTIONS.map(day => (
                  <label key={day} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filterState.days.has(day)}
                      onChange={e => toggleSet('days', day, e.target.checked)}
                    />
                    <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pr-6 flex items-center justify-between gap-3 border-t border-muted/20 pt-4">
            <button
              type="button"
              className="flex-1 py-3 text-sm font-semibold text-text underline underline-offset-4 decoration-muted hover:decoration-text transition"
              onClick={onClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="flex-1 button-cta py-3 text-sm uppercase tracking-wide"
              onClick={onClose}
            >
              Apply
            </button>
          </div>
        </nav>
      </div>
    </>
  )
}

// ── Active Filter Chips ───────────────────────────────────────────────

function ActiveFilterChips({ filterState, categories, onRemove }) {
  const chips = []

  filterState.categories.forEach(slug => {
    const cat = categories.find(c => c.slug === slug)
    chips.push({ type: 'category', value: slug, label: cat?.name ?? slug })
  })
  filterState.portions.forEach(p => {
    chips.push({ type: 'portion', value: p, label: p === 'family' ? 'Family of 4' : p })
  })
  if (filterState.priceMin) chips.push({ type: 'priceMin', value: filterState.priceMin, label: `Min $${Number(filterState.priceMin).toFixed(2)}` })
  if (filterState.priceMax) chips.push({ type: 'priceMax', value: filterState.priceMax, label: `Max $${Number(filterState.priceMax).toFixed(2)}` })
  if (filterState.favoritesOnly) chips.push({ type: 'favorites', value: 'favorites', label: 'Favorites' })
  filterState.days.forEach(day => {
    chips.push({ type: 'day', value: day, label: day.charAt(0).toUpperCase() + day.slice(1) })
  })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap gap-2 items-center px-1 text-sm">
      {chips.map(({ type, value, label }) => (
        <span key={`${type}-${value}`} className="filter-chip">
          <span>{label}</span>
          <button type="button" aria-label={`Remove ${label}`} onClick={() => onRemove(type, value)}>×</button>
        </span>
      ))}
      <button type="button" className="filter-chip clear-all" onClick={() => onRemove('clear', 'all')}>Clear all</button>
    </div>
  )
}

// ── Category Tabs ─────────────────────────────────────────────────────

function CategoryTabs({ categories, activeCategory, onSelect }) {
  const listRef = useRef(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const allCategories = [
    { slug: DEFAULT_CATEGORY, name: 'All', hidden: false },
    ...categories,
  ]

  function updateButtons() {
    const el = listRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const edge = 6
    const canScroll = scrollWidth - clientWidth > 8
    setShowLeft(canScroll && scrollLeft > edge)
    setShowRight(canScroll && scrollLeft < scrollWidth - clientWidth - edge)
  }

  useEffect(() => {
    updateButtons()
    window.addEventListener('resize', updateButtons)
    return () => window.removeEventListener('resize', updateButtons)
  }, [categories])

  function scrollBy(dir) {
    const el = listRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.5, 140), behavior: 'smooth' })
  }

  return (
    <div className="menu-categories-wrapper px-4">
      <button
        className={`menu-scroll-button menu-scroll-left ${showLeft ? 'visible' : ''}`}
        onClick={() => scrollBy(-1)}
        tabIndex={showLeft ? 0 : -1}
        aria-hidden={!showLeft}
        type="button"
        aria-label="Scroll categories left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L12.17 12z" />
        </svg>
      </button>
      <nav className="whitespace-nowrap flex-1 overflow-hidden">
        <ul
          ref={listRef}
          className="menu-categories flex overflow-x-auto lg:justify-center gap-6 lg:gap-8 px-2 list-none text-sm"
          onScroll={() => requestAnimationFrame(updateButtons)}
        >
          {allCategories.map(({ slug, name, hidden }) => (
            <li key={slug} className={`menu-links${hidden ? ' hidden' : ''}`}>
              <a
                href="#"
                role="button"
                className={activeCategory === slug ? 'active' : ''}
                onClick={e => {
                  e.preventDefault()
                  onSelect(slug)
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                }}
              >
                {name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        className={`menu-scroll-button menu-scroll-right ${showRight ? 'visible' : ''}`}
        onClick={() => scrollBy(1)}
        tabIndex={showRight ? 0 : -1}
        aria-hidden={!showRight}
        type="button"
        aria-label="Scroll categories right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L12.17 12z" />
        </svg>
      </button>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 p-3 bg-white shadow-sm w-full max-w-[11rem]">
          <div className="h-36 sm:h-40 lg:h-44 rounded-xl bg-gray-200 animate-pulse" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Menu Page ─────────────────────────────────────────────────────────

export default function Menu() {
  useSEO({
    title: "Menu – Fresh Lebanese Dishes | Nisrine's Catering",
    description: "Browse Nisrine's full menu of homemade Lebanese dishes. Plats du jour, family portions, fresh & frozen meals. Order online today.",
  })

  const { favoriteItems } = useFavorite()
  const { dayConflict, dismissDayConflict } = useCart()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORY)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState(INITIAL_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`),
          fetch(`${API_BASE_URL}/api/products`),
        ])
        if (catRes.ok) {
          const { data } = await catRes.json()
          if (Array.isArray(data)) {
            setCategories(data.slice().sort((a, b) => a.sort_order - b.sort_order))
          }
        }
        if (prodRes.ok) {
          const { data } = await prodRes.json()
          setProducts(
            data.map(p => ({
              id: p.id,
              image: p.image,
              name: p.name,
              nameAr: p.name_ar || p.nameAr || '',
              ingredients: p.ingredients,
              category: p.category,
              day: p.day,
              price: p.price,
            }))
          )
        }
      } catch (err) {
        console.error('Failed to load menu data', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  // After categories portal into header, re-measure header height for site-main padding
  useEffect(() => {
    if (loading || !categories.length) return
    const id = requestAnimationFrame(() => {
      const header = document.querySelector('header.header-js')
      if (header) {
        document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`)
      }
    })
    return () => cancelAnimationFrame(id)
  }, [loading, categories.length])

  function handleFilterChange(updates) {
    setFilterState(prev => ({ ...prev, ...updates }))
  }

  function handleClearFilters() {
    setFilterState(INITIAL_FILTER)
    setActiveCategory(DEFAULT_CATEGORY)
  }

  function handleRemoveChip(type, value) {
    setFilterState(prev => {
      const next = { ...prev }
      if (type === 'category') { const s = new Set(prev.categories); s.delete(value); next.categories = s }
      else if (type === 'portion') { const s = new Set(prev.portions); s.delete(value); next.portions = s }
      else if (type === 'priceMin') next.priceMin = ''
      else if (type === 'priceMax') next.priceMax = ''
      else if (type === 'favorites') next.favoritesOnly = false
      else if (type === 'day') { const s = new Set(prev.days); s.delete(value); next.days = s }
      else if (type === 'clear') return INITIAL_FILTER
      return next
    })
    if (type === 'category' || type === 'clear') setActiveCategory(DEFAULT_CATEGORY)
  }

  function handleCategorySelect(slug) {
    setActiveCategory(slug)
    setFilterState(prev => ({
      ...prev,
      categories: slug === DEFAULT_CATEGORY ? new Set() : new Set([slug]),
    }))
    const section = document.querySelector('.menu-sections')
    if (section) {
      const header = document.querySelector('header')
      const top = section.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight ?? 0)
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
  }

  const filteredProducts = (() => {
    const { categories: catFilter, portions, priceMin, priceMax, favoritesOnly, days } = filterState
    return products
      .filter(isProductAvailable)
      .filter(p => !catFilter.size || catFilter.has(p.category))
      .filter(p => {
        if (!portions.size) return true
        const hasSingle = typeof p.price?.single === 'number'
        const hasFamily = typeof p.price?.family === 'number'
        return (portions.has('single') && hasSingle) || (portions.has('family') && hasFamily)
      })
      .filter(p => {
        if (!priceMin && !priceMax) return true
        const prices = []
        if (typeof p.price?.single === 'number') prices.push(p.price.single)
        if (typeof p.price?.family === 'number') prices.push(p.price.family)
        if (!prices.length) return false
        let minC = priceMin ? Math.round(Number(priceMin) * 100) : null
        let maxC = priceMax ? Math.round(Number(priceMax) * 100) : null
        if (minC !== null && maxC !== null && minC > maxC) [minC, maxC] = [maxC, minC]
        return prices.some(pr => (minC === null || pr >= minC) && (maxC === null || pr <= maxC))
      })
      .filter(p => !favoritesOnly || favoriteItems.some(f => String(f.productId) === String(p.id)))
      .filter(p => !days.size || (p.day && days.has(p.day.toLowerCase())))
      .filter(p => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return true
        return [p.name, p.nameAr, p.ingredients].some(f => typeof f === 'string' && f.toLowerCase().includes(q))
      })
      .sort((a, b) => {
        const aDay = (a.day || '').toLowerCase()
        const bDay = (b.day || '').toLowerCase()
        const aHas = aDay in DAY_ORDER
        const bHas = bDay in DAY_ORDER
        if (aHas && bHas && DAY_ORDER[aDay] !== DAY_ORDER[bDay]) return DAY_ORDER[aDay] - DAY_ORDER[bDay]
        if (aHas !== bHas) return aHas ? -1 : 1
        return (a.name || '').localeCompare(b.name || '')
      })
  })()

  const headerEl = document.querySelector('header.header-js')

  return (
    <main className="site-main">
      {headerEl && !loading && categories.length > 0 && createPortal(
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategorySelect}
        />,
        headerEl
      )}
      <div className="container mx-auto py-2 md:py-8 menu-sections">
        <section className="lg:px-8 lg:py-4 space-y-6">
          <div className="px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
            <div className="flex flex-col gap-4">
              {/* Search + filter toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="w-full sm:w-auto sm:flex-1">
                  <span className="sr-only">Search menu</span>
                  <div className="relative">
                    <input
                      type="search"
                      className="js-menu-search w-full sm:w-[360px] lg:w-[420px] rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/60"
                      placeholder="Search dishes or ingredients"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <svg className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 7.5 16.5a7.5 7.5 0 0 0 9.15 0Z" />
                    </svg>
                  </div>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFilterOpen(true)}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition"
                    aria-label="Open filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M6 12h12M10 18h4" />
                    </svg>
                  </button>
                  <div className="js-products-count text-sm text-gray-600 text-right">
                    <span className="js-products-count__number font-numeric">{filteredProducts.length}</span>
                    <span className="js-products-count__label"> item{filteredProducts.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Filter chips */}
              <ActiveFilterChips
                filterState={filterState}
                categories={categories}
                onRemove={handleRemoveChip}
              />

              {/* Product grid */}
              {loading ? (
                <SkeletonGrid />
              ) : filteredProducts.length === 0 ? (
                <div className="w-full py-12 text-center text-gray-500 text-lg">
                  {products.length === 0
                    ? 'No products available right now. Please check back soon.'
                    : 'No dishes match these filters yet.'}
                </div>
              ) : (
                <div className="products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.45,
                        delay: Math.min(index * 0.04, 0.8),
                        ease: 'easeOut',
                      }}
                      className="w-full flex justify-center"
                    >
                      <SharedProductCard
                        product={product}
                        onOpen={setSelectedProduct}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        categories={categories}
      />

      <AnimatePresence>
        {selectedProduct && (
          <ProductOverlay key="overlay" product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>

      {dayConflict && (
        <DayConflictModal
          currentDay={dayConflict.currentDay}
          productDay={dayConflict.productDay}
          onClose={dismissDayConflict}
        />
      )}
    </main>
  )
}
