import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import Order from './pages/Order.jsx'
import Subscription from './pages/Subscription.jsx'
import Favorite from './pages/Favorite.jsx'
import Catering from './pages/Catering.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { FavoriteProvider } from './context/FavoriteContext.jsx'
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function App() {
  return (
    <CartProvider>
      <FavoriteProvider>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route index element={<Home/>} />
          <Route path="/menu" element={<Menu/>} />
          <Route path="/order" element={<Order/>} />
          <Route path="/subscription" element={<Subscription/>} />
          <Route path="/favorite" element={<Favorite/>} />
          <Route path="/catering" element={<Catering/>} />
        </Routes>
        <Footer />
      </FavoriteProvider>
    </CartProvider>
  )
}

export default App
