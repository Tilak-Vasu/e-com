// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';

// --- FIX THESE LINES ---
// Remove the .ts or .tsx extension from the import path.
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { LikedProductsProvider } from './context/LikedProductsContext';
import { OrderHistoryProvider } from './context/OrderHistoryContext.tsx';
// --- END OF FIX ---

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ProductProvider>
          <LikedProductsProvider>
            <OrderHistoryProvider>
            <CartProvider>
              <App />
            </CartProvider>
            </OrderHistoryProvider>
          </LikedProductsProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);