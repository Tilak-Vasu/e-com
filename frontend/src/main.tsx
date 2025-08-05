// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';

import App from './App.tsx';
// Import your other providers
import { ProductProvider } from './context/ProductContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { LikedProductsProvider } from './context/LikedProductsContext.tsx';
import { OrderHistoryProvider } from './context/OrderHistoryContext.tsx';
import './index.css';

// Get your publishable key from the environment variables
const PUBLISHABLE_KEY = 'pk_test_bW9kZWwtZ29ibGluLTkxLmNsZXJrLmFjY291bnRzLmRldiQ';

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env.local file.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <Router>
      {/* --- THIS IS THE KEY FIX --- */}
      {/* The ClerkProvider MUST be one of the outermost providers. */}
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        
        {/* All your other application-specific providers go INSIDE ClerkProvider */}
        <ProductProvider>
          <LikedProductsProvider>
            <CartProvider>
              <OrderHistoryProvider>
                <App />
              </OrderHistoryProvider>
            </CartProvider>
          </LikedProductsProvider>
        </ProductProvider>
        
      </ClerkProvider>
    </Router>
  // </React.StrictMode>,
);