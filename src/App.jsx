import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MetaPixelTracker from './components/MetaPixelTracker'
import Home from './Pages/Home'
import Wallet from './Pages/Wallet'
import Tshirt from './Pages/Tshirt'
import CodFrom from './Pages/CodFrom'
import Admin from './Pages/Admin'

const App = () => {
  const location = useLocation()

  return (
    <>
      <MetaPixelTracker />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/tshirt" element={<Tshirt />} />
        <Route path="/cod-from" element={<CodFrom />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <div className={location.pathname === '/admin' ? 'md:ml-64' : ''}>
        <Footer />
      </div>
    </>
  )
}
      

export default App