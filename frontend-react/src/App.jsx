import Home from './pages/Home.jsx'
import Menu from './pages/Menu.jsx'
import Order from './pages/Order.jsx'
import Subscription from './pages/Subscription.jsx'
import Favorite from './pages/Favorite.jsx'
import Catering from './pages/Catering.jsx'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route index element={<Home/>} />
      <Route path="/menu" element={<Menu/>} />
      <Route path="/order" element={<Order/>} />
      <Route path="/subscription" element={<Subscription/>} />
      <Route path="/favorite" element={<Favorite/>} />
      <Route path="/catering" element={<Catering/>} />
    </Routes>
  )
}

export default App