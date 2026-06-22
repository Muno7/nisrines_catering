import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import ProductOverlay from '../components/ProductOverlay.jsx'
import DayConflictModal from '../components/DayConflictModal.jsx'
import { useSEO } from '../hooks/useSEO.js'
import { API_BASE_URL, fetchJSON } from '../utils/api.js'
import { DAY_ORDER, isProductAvailable } from '../utils/days.js'

const MotionLink = motion(Link)

// ============================================================
// Hero Section
// ============================================================
const TRANSITION_MS = 1750
const INTERVAL_MS = 4000
const FALLBACK_HERO_IMAGE = '/assets/images/catering-hero.jpg'

function HeroSection() {
  const [slides, setSlides] = useState([])
  const [heroReady, setHeroReady] = useState(false)
  const trackRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const markBothReady = () => {
      if (cancelled) return
      setHeroReady(true)
    }

    const fallbackTimer = setTimeout(markBothReady, 2500)

    async function fetchSlideshow() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/slideshow`)
        if (!res.ok) throw new Error()
        const { data } = await res.json()
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          const srcs = data.map(d => d.image).filter(Boolean)
          if (srcs.length > 0) {
            setSlides(srcs)
            clearTimeout(fallbackTimer)
            const img = new window.Image()
            img.onload = img.onerror = () => { markBothReady() }
            img.src = srcs[0]
            return
          }
        }
      } catch {
        // use fallback hero image
      }
      if (!cancelled) markBothReady()
    }

    fetchSlideshow()
    return () => { cancelled = true; clearTimeout(fallbackTimer) }
  }, [])

  const images = slides.length > 0 ? slides : [FALLBACK_HERO_IMAGE]
  // +1 for the cloned first slide that enables seamless forward looping
  const totalSlides = images.length > 1 ? images.length + 1 : 1

  // Horizontal sliding slideshow (matches old frontend slideShow.js)
  useEffect(() => {
    if (images.length <= 1) return
    const track = trackRef.current
    if (!track) return

    const n = images.length + 1 // total slides including clone

    track.style.transition = 'none'
    track.style.transform = 'translateX(0)'

    let currentIndex = 0
    let jumpTimeoutId = null

    const nextSlide = () => {
      currentIndex++
      track.style.transition = `transform ${TRANSITION_MS}ms ease`
      track.style.transform = `translateX(-${currentIndex * (100 / n)}%)`

      // When we reach the clone, instantly jump back to slide 0
      if (currentIndex === n - 1) {
        jumpTimeoutId = setTimeout(() => {
          currentIndex = 0
          track.style.transition = 'none'
          track.style.transform = 'translateX(0)'
          setTimeout(() => {
            if (trackRef.current) {
              trackRef.current.style.transition = `transform ${TRANSITION_MS}ms ease`
            }
          }, 20)
        }, TRANSITION_MS)
      }
    }

    const intervalId = setInterval(nextSlide, INTERVAL_MS)
    return () => {
      clearInterval(intervalId)
      if (jumpTimeoutId) clearTimeout(jumpTimeoutId)
    }
  }, [images])

  return (
    <>
      <div
        aria-hidden
        className={`fixed inset-0 z-[100] bg-background transition-opacity duration-500 ease-out ${heroReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />
      <section className="relative h-screen overflow-hidden bg-transparent">
        <div className={`fixed inset-0 -z-10 overflow-hidden home-hero__media${heroReady ? ' home-hero__media--ready' : ''}`}>
          <div
            ref={trackRef}
            style={{ display: 'flex', width: `${totalSlides * 100}%`, height: '100%' }}
          >
            {images.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Homemade Lebanese dish from Nisrine's Catering, Beirut${images.length > 1 ? ` – photo ${idx + 1}` : ''}`}
                aria-hidden
                fetchPriority={idx === 0 ? 'high' : undefined}
                style={{ width: `${100 / totalSlides}%`, height: '100%', objectFit: 'cover', flexShrink: 0 }}
              />
            ))}
            {images.length > 1 && (
              <img
                src={images[0]}
                alt=""
                aria-hidden
                style={{ width: `${100 / totalSlides}%`, height: '100%', objectFit: 'cover', flexShrink: 0 }}
              />
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
            transition={{ duration: 0.8, delay: 0.12, ease: 'easeOut' }}
          >
            <h1 className="text-4xl md:text-6xl font-bold">Welcome to Nisrine's Catering</h1>
            <p className="mt-4 text-lg md:text-2xl">Homemade Lebanese meals, made with love, delivered across Beirut</p>
          </motion.div>
        </div>
      </section>
    </>
  )
}

// ============================================================
// About Section
// ============================================================
function AboutSection() {
  return (
    <section className="relative px-4 py-16 sm:px-8 lg:px-16 bg-background">
      <div className="flex flex-col gap-10 max-w-6xl mx-auto lg:flex-row lg:items-center lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'tween', duration: 0.6, ease: 'easeOut' }}
          className="relative w-full lg:w-1/2"
        >
          <div className="relative overflow-hidden rounded-3xl shadow-lg shadow-cta/10 aspect-[4/3] sm:aspect-[16/10]">
            <img
              src="/assets/images/catering-hero.jpg"
              alt="A spread of Nisrine's Catering homemade Lebanese dishes"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cta/30 via-transparent to-transparent" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'tween', duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="w-full lg:w-1/2 flex flex-col gap-4"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Our story</span>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl text-accent leading-tight">
            Genuine Lebanese flavor, made fresh every day
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Nisrine's Catering brings warm, home-style Lebanese cooking to your table — from
            everyday family meals to fully catered events. We taste, season, and plate every
            order the way we would for our own family.
          </p>
          <Link
            to="/catering"
            className="button-cta group relative inline-flex items-center justify-center self-start mt-2 px-8 py-3 font-medium rounded-full overflow-hidden transition-all duration-300 ease-out hover:scale-105"
          >
            <span className="relative">Discover catering</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="relative w-5 h-5 ml-2 -mr-1 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// Features Section
// ============================================================
const FEATURES = [
  {
    title: 'Family-portion, serves 4',
    desc: 'Perfect for family dinners or meal prep throughout the week.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M23.121,9.069,15.536,1.483a5.008,5.008,0,0,0-7.072,0L.879,9.069A2.978,2.978,0,0,0,0,11.19v9.817a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V11.19A2.978,2.978,0,0,0,23.121,9.069ZM15,22.007H9V18.073a3,3,0,0,1,6,0Zm7-1a1,1,0,0,1-1,1H17V18.073a5,5,0,0,0-10,0v3.934H3a1,1,0,0,1-1-1V11.19a1.008,1.008,0,0,1,.293-.707L9.878,2.9a3.008,3.008,0,0,1,4.244,0l7.585,7.586A1.008,1.008,0,0,1,22,11.19Z" />
      </svg>
    ),
  },
  {
    title: 'Fresh/Frozen prepared meals',
    desc: 'Choose from our selection of fresh or frozen prepared meals.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12,24C5.383,24,0,18.617,0,12S5.383,0,12,0s12,5.383,12,12-5.383,12-12,12Zm0-22C6.486,2,2,6.486,2,12s4.486,10,10,10,10-4.486,10-10S17.514,2,12,2Zm2.5,14.33c.479-.276,.643-.888,.366-1.366l-1.866-3.232V6c0-.552-.447-1-1-1s-1,.448-1,1v6c0,.176,.046,.348,.134,.5l2,3.464c.186,.321,.521,.5,.867,.5,.17,0,.342-.043,.499-.134Z" />
      </svg>
    ),
  },
  {
    title: 'Weekly/Monthly subscription',
    desc: 'Subscribe to a monthly or weekly meal plan tailored to your preferences.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 4 14 14" className="w-6 h-6 fill-current">
        <path fillRule="evenodd" clipRule="evenodd" d="M10.5 5C10.5 4.72386 10.2761 4.5 10 4.5C9.72386 4.5 9.5 4.72386 9.5 5V5.5H7C6.17157 5.5 5.5 6.17157 5.5 7V16C5.5 16.8284 6.17157 17.5 7 17.5H17C17.8284 17.5 18.5 16.8284 18.5 16V7C18.5 6.17157 17.8284 5.5 17 5.5H14.5V5C14.5 4.72386 14.2761 4.5 14 4.5C13.7239 4.5 13.5 4.72386 13.5 5V5.5H10.5V5ZM9.5 6.5C9.5 6.77614 9.72386 7 10 7C10.2761 7 10.5 6.77614 10.5 6.5H13.5C13.5 6.77614 13.7239 7 14 7C14.2761 7 14.5 6.77614 14.5 6.5H17C17.2761 6.5 17.5 6.72386 17.5 7V8.5H6.5V7C6.5 6.72386 6.72386 6.5 7 6.5H9.5ZM6.5 9.5V16C6.5 16.2761 6.72386 16.5 7 16.5H17C17.2761 16.5 17.5 16.2761 17.5 16V9.5H6.5Z" />
      </svg>
    ),
  },
  {
    title: 'Catering',
    desc: 'Customized catering services for events and gatherings.',
    to: '/catering',
    spanClass: 'sm:col-span-2 lg:col-span-1',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="68 96 887 800" className="w-6 h-6 fill-current">
        <path d="M384.064 274.56l.064-50.688A128 128 0 01512.128 96c70.528 0 127.68 57.152 127.68 127.68v50.752A448.192 448.192 0 01955.392 768H68.544A448.192 448.192 0 01384 274.56zM96 832h832a32 32 0 110 64H96a32 32 0 110-64zm32-128h768a384 384 0 10-768 0zm447.808-448v-32.32a63.68 63.68 0 00-63.68-63.68 64 64 0 00-64 63.936V256h127.68z" />
      </svg>
    ),
  },
  {
    title: 'Delivery or pick-up',
    desc: 'Choose what works best for your schedule.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="m20.5,15c-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5,3.5-1.57,3.5-3.5-1.57-3.5-3.5-3.5Zm2.5-2c.553,0,1-.448,1-1s-.447-1-1-1h-2.5c-.268,0-.534.018-.797.049l-1.676-4.312c.289.163.618.263.974.263.552,0,1-.448,1-1v-2c0-.552-.448-1-1-1-.893,0-1.64.589-1.897,1.397-.639-1.458-2.051-2.397-3.655-2.397h-.448c-.553,0-1,.448-1,1s.447,1,1,1h.448c.817,0,1.566.513,1.864,1.275l2.447,6.292c-.932.399-1.783.996-2.484,1.775l-1.641,1.947c-.381.452-.938.711-1.529.711h-.229l-2.194-5.485c-.61-1.528-2.068-2.515-3.714-2.515h-1.969c-2.206,0-4,1.794-4,4v2c0,1.533.877,2.852,2.146,3.523-.091.315-.146.641-.146.977,0,1.93,1.57,3.5,3.5,3.5s3.5-1.57,3.5-3.5c0-.169-.016-.335-.04-.5h3.145c1.182,0,2.297-.518,3.059-1.422l1.619-1.923c.947-1.052,2.302-1.655,3.717-1.655h2.5Z" />
      </svg>
    ),
  },
  {
    title: 'Order Online via WhatsApp',
    desc: 'Simple ordering process with direct communication.',
    spanClass: 'sm:col-span-2 lg:col-span-1',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-6 h-6 fill-current">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
      </svg>
    ),
  },
]

function FeaturesSection() {
  return (
    <section className="flex flex-col gap-12 relative h-auto px-4 py-16 sm:px-8 lg:px-16 sm:items-center bg-background">
      <div className="flex flex-col gap-6 sm:items-center max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-accent">
          What we offer
        </h2>
        <p className="text-xl sm:text-2xl text-accent leading-relaxed">
          Homemade Lebanese meals and catering, delivered to your door in Beirut
        </p>
        <Link
          to="/menu"
          className="button-cta group relative inline-flex items-center justify-center mt-4 px-8 py-3 font-medium rounded-full overflow-hidden transition-all duration-300 ease-out hover:scale-105"
        >
          <span className="relative">Explore menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="relative w-5 h-5 ml-2 -mr-1 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {FEATURES.map((feature, i) => {
          const MotionTag = feature.to ? MotionLink : motion.div
          const extraProps = feature.to ? { to: feature.to } : {}
          const spanClass = feature.spanClass ?? ''

          return (
            <MotionTag
              key={feature.title}
              {...extraProps}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: 'tween', duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { type: 'tween', duration: 0.25, ease: 'easeOut' } }}
              className={`feature-card group relative flex flex-col gap-4 p-6 sm:p-7 bg-surface rounded-2xl border border-muted/15 shadow-sm shadow-cta/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-cta/10 ${spanClass}`}
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-cta transition-all duration-300 group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-md">
                {feature.icon}
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg sm:text-xl text-accent font-semibold">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted leading-relaxed">{feature.desc}</p>
              </div>
            </MotionTag>
          )
        })}
      </div>
    </section>
  )
}

// ============================================================
// Plat du Jour Section
// ============================================================

function ProductSkeleton() {
  return (
    <div className="product-container flex-shrink-0 flex flex-col gap-2 p-2 rounded-2xl animate-pulse">
      <div className="w-full h-44 bg-muted/30 rounded-xl" />
      <div className="flex flex-col gap-2">
        <div className="bg-muted/30 h-6 w-3/4 rounded" />
        <div className="bg-muted/30 h-4 w-1/2 rounded" />
      </div>
    </div>
  )
}

function PlatDuJourEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full py-12 px-4 text-center">
      <div className="w-12 h-12 text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h18M5 7l1.2 11.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.8L19 7M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-accent">No plat du jour today</p>
      <p className="text-sm text-muted max-w-xs">come back tomorrow for fresh plates!</p>
    </div>
  )
}

function PlatDuJourSection() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const { dayConflict, dismissDayConflict } = useCart()

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await fetchJSON('/api/products')

        const platDuJour = (data ?? [])
          .filter(p => p.category === 'plat-du-jour' && isProductAvailable(p))
          .sort((a, b) => {
            const aDay = (a.day ?? '').toLowerCase()
            const bDay = (b.day ?? '').toLowerCase()
            const aOrd = DAY_ORDER[aDay] ?? 99
            const bOrd = DAY_ORDER[bDay] ?? 99
            if (aOrd !== bOrd) return aOrd - bOrd
            return (a.name ?? '').localeCompare(b.name ?? '')
          })

        setProducts(platDuJour)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <>
      <section className="flex flex-col gap-2 relative h-auto py-6 sm:px-8 sm:py-10 bg-background">
        <div className="flex flex-col font-bold px-4">
          <h2 className="text-4xl text-accent">Plat du Jour</h2>
          <p className="font-normal">Note: (salad/yogurt included)</p>
        </div>
        {!loading && products.length === 0 ? (
          <PlatDuJourEmptyState />
        ) : (
          <div className="products-wrapper overflow-x-auto whitespace-nowrap relative">
            <div className="products-container inline-flex space-x-2 p-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
                : products.map(product => (
                    <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />
                  ))
              }
            </div>
          </div>
        )}
        <Link
          to="/menu"
          className="button-cta mx-4 group relative inline-flex items-center justify-center mt-4 px-8 py-3 font-medium rounded-full overflow-hidden transition-all duration-300 ease-out hover:scale-105 lg:max-w-[25%]"
        >
          <span className="relative">View more</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="relative w-5 h-5 ml-2 -mr-1 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>

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
    </>
  )
}

// ============================================================
// Home Page
// ============================================================
function Home() {
  useSEO({
    title: "Nisrine's Catering – Lebanese & International Cuisine, Beirut",
    description: "Homemade Lebanese & international meals in Beirut — plat du jour, pastries, catering & frozen products. Delivery, pickup, or order via WhatsApp.",
    path: '/',
  })

  return (
    <main>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <PlatDuJourSection />
    </main>
  )
}

export default Home
