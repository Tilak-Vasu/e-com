import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  type ReactNode
} from 'react';
import type { Product } from '../api/types';
import useApi from '../hooks/useApi';

// --- Context Type ---
interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
}

// --- Create Context ---
export const ProductContext = createContext<ProductContextType | undefined>(undefined);

// --- Provider ---
export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  
  // Add ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Cache-busting URL
      const urlWithCacheBuster = `/products/?_=${new Date().getTime()}`;
      const response = await api.get<Product[]>(urlWithCacheBuster);
      
      // Validate response data
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        throw new Error('Invalid response format: expected array of products');
      }
      
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      
      // More specific error messages
      if (err.code === 'ERR_NETWORK') {
        setError("Network error. Please check your connection and try again.");
      } else if (err.response?.status === 401) {
        setError("Authentication required. Please log in again.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.message || "Could not load products. Please try again later.");
      }
      
      // Keep existing products on error (don't clear them)
      // setProducts([]); // Remove this line to preserve existing data
      
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [api]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <ProductContext.Provider value={{ products, loading, error, fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

// --- Custom Hook ---
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};