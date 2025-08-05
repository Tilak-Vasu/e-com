// src/context/CartContext.ts

import React, { createContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { CartItem, Product } from '../api/types';

// Define the shape of the context's value
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

// Create the context
const CartContext = createContext<CartContextType | null>(null);
export default CartContext;


// Create the provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('shoppingCart', []);

  // --- CART LOGIC FUNCTIONS ---

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        // If item exists, map over items and update quantity
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // If item does not exist, add it to the cart with quantity 1
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const decreaseQuantity = (productId: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productId);
      if (existingItem?.quantity === 1) {
        // If quantity is 1, remove the item from the cart
        return prevItems.filter(item => item.id !== productId);
      }
      // Otherwise, decrease the quantity
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


  // --- DERIVED STATE ---

  // Calculate the total number of items in the cart
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Calculate the total price of all items in the cart
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);


  // --- PROVIDE CONTEXT VALUE ---

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    clearCart,
    cartCount,
    cartTotal
  };

  return React.createElement(CartContext.Provider, { value }, children);
};