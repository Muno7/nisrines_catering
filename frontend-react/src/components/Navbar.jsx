import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/menu">Menu</Link>
      <Link to="/order">Order</Link>
      <Link to="/subscription">Subscription</Link> 
      <Link to="/favorite">Favorite</Link>
      <Link to="/catering">Catering</Link>
    </nav>
  )
}

export default Navbar