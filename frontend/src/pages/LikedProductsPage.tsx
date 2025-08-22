import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import ProductList from '../components/products/ProductList';
import Button from '../components/common/Button';
import type { Product } from '../api/types';
import './LikedProductsPage.css';

const LikedProductsPage: React.FC = () => {
  const api = useApi();
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiked = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/liked/');
      setLikedProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch liked products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiked();
  }, []);

  if (loading) {
    return <div className="page-status">Loading your liked products...</div>;
  }

  if (likedProducts.length === 0) {
    return (
      <div className="empty-liked-page">
        <h2>You haven't liked any products yet.</h2>
        <p>Click the "Like" button on any product to save it here for later.</p>
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
        onLikeToggle={fetchLiked} // ✅ refresh list after toggle
      />
    </div>
  );
};

export default LikedProductsPage;
