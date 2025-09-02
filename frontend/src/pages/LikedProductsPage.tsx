import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../api/types';

// Components
import ProductList from '../components/products/ProductList';
import Button from '../components/common/Button';

// API and Hooks
import useApi from '../hooks/useApi';
import { toggleLikeProductAPI } from '../api'; 

// +++ NEW: IMPORT THE ZUSTAND STORE HOOK +++
import { useLikedProductsStore } from '../hooks/likedProductsStore';

// Styles
import './LikedProductsPage.css';

const LikedProductsPage: React.FC = () => {
  const api = useApi();
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // +++ NEW: GET STATE AND ACTIONS FROM THE GLOBAL STORE +++
  const { likedProductIds, unlikeProduct, setInitialLikedProducts } = useLikedProductsStore();

  useEffect(() => {
    const fetchLikedProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/products/liked/');
        setLikedProducts(response.data);
        // +++ NEW: Also populate the global store with this data +++
        setInitialLikedProducts(response.data); 
      } catch (err) {
        console.error("Failed to fetch liked products:", err);
        setError("We couldn't load your liked products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // The api and setInitialLikedProducts dependencies can be omitted for simplicity here

  // === UPDATED: UNLIKE HANDLER NOW USES THE GLOBAL STORE ===
  const handleUnlikeProduct = async (productId: number) => {
    const originalProducts = [...likedProducts];
    
    // 1. Optimistically remove the product from the local UI
    setLikedProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    
    // 2. Optimistically update the global store
    unlikeProduct(productId);

    try {
      // 3. Send the API request to the backend
      await toggleLikeProductAPI(productId);
    } catch (err) {
      console.error("Failed to unlike product on the server:", err);
      alert("An error occurred while unliking the product. Your list has been restored.");
      
      // 4. If the API call fails, revert both the local UI and the global store
      setLikedProducts(originalProducts);
      // To revert the global store, we simply add the ID back. We need the original product.
      const productToReLike = originalProducts.find(p => p.id === productId);
      if (productToReLike) {
        setInitialLikedProducts(originalProducts); // The easiest way to re-sync on failure
      }
    }
  };

  if (loading) {
    return <div className="page-status">Loading your liked products...</div>;
  }
  
  if (error) {
    return <div className="page-status error-message">{error}</div>;
  }

  if (!loading && likedProducts.length === 0) {
    return (
      <div className="empty-liked-page">
        <h2>You haven't liked any products yet.</h2>
        <p>Click the heart icon on any product to save it here for later.</p>
        <Link to="/">
          <Button>Find Products to Like</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container liked-page">
      <h1 style={{ marginTop: '20px', marginLeft:'40px'}}>My Liked Products</h1>
      <ProductList 
        products={likedProducts} 
        onLikeToggle={handleUnlikeProduct}
        // +++ FIX: Pass the required likedProductIds prop from the global store +++
        likedProductIds={likedProductIds}
      />
    </div>
  );
};

export default LikedProductsPage;