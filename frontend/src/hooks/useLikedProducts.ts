// src/hooks/useLikedProducts.ts
import { useContext } from 'react';
// FIX THIS LINE: Remove the file extension
import LikedProductsContext from '../context/LikedProductsContext'; 

const useLikedProducts = () => {
  const context = useContext(LikedProductsContext);
  if (context === null) {
    throw new Error('useLikedProducts must be used within a LikedProductsProvider');
  }
  return context;
};
export default useLikedProducts;