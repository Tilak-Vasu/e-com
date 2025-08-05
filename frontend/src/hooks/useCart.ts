// src/hooks/useCart.ts
import { useContext } from 'react';
// FIX THIS LINE: Remove the file extension
import CartContext from '../context/CartContext';

const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
export default useCart;