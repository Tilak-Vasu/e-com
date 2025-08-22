// src/hooks/useProducts.ts

import { useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

/**
 * A custom hook to access the ProductContext.
 * @throws Will throw an error if used outside of a component wrapped in ProductProvider.
 * @returns The product context.
 */
const useProducts = () => {
  const context = useContext(ProductContext);

  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }

  return context;
};

export default useProducts;