import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MetaPixelTracker from './components/MetaPixelTracker'
import Home from './Pages/Home'
import Wallet from './Pages/Wallet'
import Tshirt from './Pages/Tshirt'
import CodFrom from './Pages/CodFrom'
import Admin from './Pages/Admin'
import ProductDetail from './Pages/ProductDetail'
import Cart from './Pages/Cart'
import { CartProvider } from './context/CartContext.jsx'

const App = () => {
  const location = useLocation()

  return (
    <CartProvider>
      <MetaPixelTracker />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/tshirt" element={<Tshirt />} />
        <Route path="/cod-from" element={<CodFrom />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
      <div className={location.pathname === '/admin' ? 'md:ml-64' : ''}>
        <Footer />
      </div>
    </CartProvider>
  )
}
      

export default App