import Home from './pages/Home.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { FavoriteProvider } from './context/FavoriteContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { lazy, Suspense, useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'

const Menu = lazy(() => import('./pages/Menu.jsx'))
const Order = lazy(() => import('./pages/Order.jsx'))
const Subscription = lazy(() => import('./pages/Subscription.jsx'))
const Favorite = lazy(() => import('./pages/Favorite.jsx'))
const Catering = lazy(() => import('./pages/Catering.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <CartProvider>
          <FavoriteProvider>
            <ScrollToTop />
            <Navbar />
            <Suspense fallback={null}>
              <Routes>
                <Route index element={<Home/>} />
                <Route path="/menu" element={<Menu/>} />
                <Route path="/order" element={<Order/>} />
                <Route path="/subscription" element={<Subscription/>} />
                <Route path="/favorite" element={<Favorite/>} />
                <Route path="/catering" element={<Catering/>} />
                <Route path="*" element={<NotFound/>} />
              </Routes>
            </Suspense>
            <Footer />
            <Analytics />
          </FavoriteProvider>
        </CartProvider>
      </LanguageProvider>
    </MotionConfig>
  )
}

export default App
