// src/context/ProductContext.ts

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { products as mockProducts } from '../api/mockData';
import type { Product } from '../api/types';

/**
 * Defines the shape of the value provided by the ProductContext.
 */
interface ProductContextType {
  products: Product[];
  loading: boolean;
  // You could add more functions here later, e.g., for filtering:
  // filterByPrice: (min: number, max: number) => void;
}

// Create the context
const ProductContext = createContext<ProductContextType | undefined>(undefined);
export default ProductContext;


// --- Provider Component ---

/**
 * The ProductProvider component holds the global state for the product catalog.
 */
export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // In a real-world application, you would fetch products from an API here.
    // For this project, we are loading them from a static mock data file.
    setProducts(mockProducts);
    setLoading(false);
  }, []);

  const value: ProductContextType = { products, loading };

  return React.createElement(
    ProductContext.Provider,
    { value },
    children
  );
};