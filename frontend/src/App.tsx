import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- CLERK IMPORTS ---
// These components from Clerk will now handle our authentication UI and logic.
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react';
import AuthPage from './pages/AuthPage'; // <-- IMPORT THE NEW PAGE

// --- LAYOUT AND PAGE IMPORTS ---
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LikedProductsPage from './pages/LikedProductsPage';
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
// import OrderCancelledPage from './pages/OrderCancelledPage';
import NotFoundPage from './pages/NotFoundPage';


const App: React.FC = () => {
  return (
    <>
      <Header />
      <main>
        <div className="container">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            {/* These routes are accessible to everyone, logged in or not. */}
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/order/success" element={<OrderSuccessPage />} />
            {/* <Route path="/order/cancelled" element={<OrderCancelledPage />} /> */}

            {/* --- CLERK AUTHENTICATION ROUTES --- */}
            {/* Clerk's components now render the entire login and registration pages. */}
            {/* The "/*" is important to allow Clerk to handle nested routes. */}
            <Route 
              path="/login/*" 
              element={
                <AuthPage>
                  <SignIn routing="path" path="/login" />
                </AuthPage>
              } 
            />
            <Route 
              path="/register/*" 
              element={
                <AuthPage>
                  <SignUp routing="path" path="/register" />
                </AuthPage>
              } 
            />


            {/* --- PROTECTED ROUTES --- */}
            {/* Any route that requires a user to be logged in goes here. */}
            <Route
              path="/liked"
              element={
                <>
                  <SignedIn>
                    <LikedProductsPage />
                  </SignedIn>
                  <SignedOut>
                    {/* When signed out, redirect to the sign-in page */}
                    <SignIn routing="path" path="/login" />
                  </SignedOut>
                </>
              }
            />
            <Route
              path="/cart"
              element={
                <>
                  <SignedIn><CartPage /></SignedIn>
                  <SignedOut><SignIn routing="path" path="/login" /></SignedOut>
                </>
              }
            />
            <Route
              path="/checkout"
              element={
                <>
                  <SignedIn><CheckoutPage /></SignedIn>
                  <SignedOut><SignIn routing="path" path="/login" /></SignedOut>
                </>
              }
            />
             <Route
              path="/orders"
              element={
                <>
                  <SignedIn><OrderHistoryPage /></SignedIn>
                  <SignedOut><SignIn routing="path" path="/login" /></SignedOut>
                </>
              }
            />

            {/* --- CATCH-ALL ROUTE (MUST BE LAST) --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default App;