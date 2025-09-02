// src/context/CartContext.tsx

import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  type ReactNode 
} from 'react';
import useApi from '../hooks/useApi'; // For making authenticated API calls
import { useAuth } from '../hooks/useAuth'; // To check if the user is logged in
import type { CartItem, Product } from '../api/types';

// Define the shape of the context's value, adding a loading state
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartInvalid: boolean;
  isCartLoading: boolean; // To show spinners while syncing
}

const CartContext = createContext<CartContextType | null>(null);
export default CartContext;

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // We now use standard React state, not localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  
  const api = useApi();
  const { isAuthenticated } = useAuth();
  
  // A ref to prevent saving the cart on the very first render
  const isInitialMount = useRef(true);

  // --- 1. Cart Synchronization (Load from and Save to Database) ---

  // Effect to LOAD the cart when authentication status changes
  useEffect(() => {
    const loadCart = async () => {
      setIsCartLoading(true);
      if (isAuthenticated) {
        try {
          // User is logged in, fetch their cart from the database
          const response = await api.get('/cart/');
          // Assuming the backend returns an array of cart items with full product details
          // This requires the backend serializer to be configured correctly
          setCartItems(response.data || []);
        } catch (error) {
          console.error("Failed to fetch user cart from DB:", error);
          setCartItems([]); // Start with an empty cart on error
        }
      } else {
        // User is logged out, clear the cart
        setCartItems([]);
      }
      setIsCartLoading(false);
    };

    loadCart();
  }, [isAuthenticated, api]);

  // A memoized function to save the cart to the DB
  const saveCartToDB = useCallback(async (items: CartItem[]) => {
    if (!isAuthenticated) return;
    // Transform the items to the format the backend expects
    const payload = { 
        items: items.map(item => ({ id: item.id, quantity: item.quantity }))
    };
    try {
        await api.post('/cart/', payload);
    } catch (error) {
        console.error("Failed to sync cart to DB:", error);
    }
  }, [isAuthenticated, api]);

  // Effect to SAVE the cart when it changes (with a debounce)
  useEffect(() => {
    // Skip the very first run to prevent saving an empty cart over a real one
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    // Set up a timer to save the cart 800ms after the last change
    const timer = setTimeout(() => {
        saveCartToDB(cartItems);
    }, 800);

    // Cleanup function: if cartItems changes again, clear the previous timer
    return () => clearTimeout(timer);
  }, [cartItems, saveCartToDB]);


  // --- 2. Cart Logic Functions (Now they only modify local state) ---

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
          alert(`Cannot add more of "${product.name}". Only ${product.stock_quantity} units are in stock.`);
          return prevItems;
        }
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      if (product.stock_quantity < 1) {
          alert(`Sorry, "${product.name}" is out of stock.`);
          return prevItems;
      }
      // Add the full product object to the cart state. We cast it to CartItem.
      return [...prevItems, { ...product, quantity: 1 } as CartItem];
    });
  };

  const decreaseQuantity = (productId: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productId);
      if (existingItem?.quantity === 1) {
        return prevItems.filter(item => item.id !== productId);
      }
      return prevItems.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };


  // --- 3. Derived State (Calculated from local state) ---

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);

  const isCartInvalid = useMemo(() => {
    return cartItems.some(item => item.quantity > item.stock_quantity);
  }, [cartItems]);

  // --- Provide the context value to children ---
  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isCartInvalid,
    isCartLoading
  };

  return React.createElement(CartContext.Provider, { value }, children);
};