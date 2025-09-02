import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  type ReactNode
} from 'react';
import type { Product } from '../api/types';
import useApi from '../hooks/useApi'; // ✅ Authenticated axios instance

// --- Context Type ---
interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>; // ✅ Can be called from anywhere
}

// --- Create Context ---
export const ProductContext = createContext<ProductContextType | undefined>(undefined);

// --- Provider ---
export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  // ✅ Wrapped fetching logic
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // --- FIX: Implement Cache-Busting ---
      // We create a unique URL on every call by adding the current time as a
      // query parameter. This forces the browser to bypass its cache and
      // always request fresh data from your server.

      // BEFORE:
      // const response = await api.get<Product[]>('/products/');

      // AFTER:
      const urlWithCacheBuster = `/products/?_=${new Date().getTime()}`;
      const response = await api.get<Product[]>(urlWithCacheBuster);

      setProducts(response.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Could not load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  // ✅ Initial fetch
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