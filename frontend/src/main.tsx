import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

// Import your custom context providers
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext'; // You will create this for products
import { CartProvider } from './context/CartContext';
import { LikedProductsProvider } from './context/LikedProductsContext';
import { OrderHistoryProvider } from './context/OrderHistoryContext';

import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <Router>
      {/* 
        This is the provider hierarchy. AuthProvider is at the top 
        so that all other contexts and components can access auth state. 
      */}
      <AuthProvider>
        <ProductProvider>
          <LikedProductsProvider>
            <CartProvider>
              <OrderHistoryProvider>
                <App />
              </OrderHistoryProvider>
            </CartProvider>
          </LikedProductsProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  // </React.StrictMode>
);