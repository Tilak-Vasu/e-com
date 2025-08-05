// src/pages/LikedProductsPage.tsx

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useLikedProducts from '../hooks/useLikedProducts';
import useProducts from '../hooks/useProducts';
import ProductList from '../components/products/ProductList';
import Button from '../components/common/Button';
import './LikedProductsPage.css'; // This is a new CSS file

const LikedProductsPage: React.FC = () => {
  const { likedProductIds } = useLikedProducts();
  const { products, loading } = useProducts();

  // useMemo ensures this filtering logic only re-runs when necessary
  const likedProducts = useMemo(() => {
    if (loading) return [];
    // Filter the main product list to find only the products whose IDs are in our liked list
    return products.filter(product => likedProductIds.includes(product.id));
  }, [likedProductIds, products, loading]);

  if (loading) {
    return <div className="page-status">Loading...</div>;
  }

  // If there are no liked products, show a helpful "empty state" message
  if (likedProducts.length === 0) {
    return (
      <div className="empty-liked-page">
        <h2>You haven't liked any products yet.</h2>
        <p>Click the "Like" button on any product to save it here for later.</p>
        <Link to="/">
          <Button>Find Products</Button>
        </Link>
      </div>
    );
  }

  // If products have been liked, display them using our reusable ProductList component
  return (
    <div className="liked-page">
      <h1>My Liked Products</h1>
      <ProductList products={likedProducts} />
    </div>
  );
};

export default LikedProductsPage;