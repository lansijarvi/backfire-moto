import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import Admin from './pages/Admin';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import Donate from './pages/Donate';
import DonateSuccess from './pages/DonateSuccess';
import DonateDisplay from './pages/DonateDisplay';
import Community from './pages/Community';
import BikeOfTheMonth from './pages/BikeOfTheMonth';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/bike-of-the-month" element={<BikeOfTheMonth />} />
          <Route path="/community" element={<Community />} />
          <Route path="/login" element={<Login />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/donate/success" element={<DonateSuccess />} />
          <Route path="/donate/display" element={<DonateDisplay />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
        <CartDrawer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
