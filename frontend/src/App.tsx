import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Import Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LikedProductsPage from './pages/LikedProductsPage';
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage'; // This will now handle Stripe internally
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
// import OrderCancelledPage from './pages/OrderCancelledPage';
import NotFoundPage from './pages/NotFoundPage';

// NO Stripe code should be in this file.

const App: React.FC = () => {
  return (
    <>
      <Header />
      <main>
        <div className="container">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/order/success" element={<OrderSuccessPage />} />
            {/* <Route path="/order/cancelled" element={<OrderCancelledPage />} /> */}

            {/* --- PROTECTED ROUTES --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/liked" element={<LikedProductsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
            </Route>

            {/* --- CATCH-ALL ROUTE --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default App;