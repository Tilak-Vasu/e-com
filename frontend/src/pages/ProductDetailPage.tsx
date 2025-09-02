// src/pages/ProductDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import useCart from '../hooks/useCart';
// --- THE FIX #1: Import the useProducts hook ---
import useProducts  from '../hooks/useProducts';

import { fetchProductDetailAPI, fetchRecommendationsAPI } from '../api';
import { type Product } from '../api/types';
import ProductList from '../components/products/ProductList';
import Button from '../components/common/Button';
import NotFoundPage from './NotFoundPage';
import placeholderImage from '../assets/images/product-placeholder.webp';
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { addToCart } = useCart();
  const { isSignedIn } = useUser();
  // --- THE FIX #2: Call the hook to get the fetchProducts function ---
  const { fetchProducts } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    const loadPageData = async () => {
      if (!productId) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadingRecs(true);
      setError('');
      try {
        const [productResponse, recsResponse] = await Promise.all([
          fetchProductDetailAPI(productId),
          fetchRecommendationsAPI(productId)
        ]);
        setProduct(productResponse.data);
        setRecommendations(recsResponse.data);
      } catch (err) {
        setError('Failed to load product. It may not exist or there was a network issue.');
        console.error("Fetch product detail error:", err);
      } finally {
        setLoading(false);
        setLoadingRecs(false);
      }
    };
    loadPageData();
  }, [productId]);

  const handleAddToCart = () => {
    if (!isSignedIn) {
      alert('Please sign in to add items to your cart.');
      return;
    }
    if (product) {
      addToCart(product);
      alert(`${product.name} has been added to your cart!`);
    }
  };

  if (loading) {
    return <div className="page-status">Loading product details...</div>;
  }
  
  if (error) {
    return <div className="page-status error-message">{error}</div>;
  }

  if (!product) {
    return <NotFoundPage />;
  }

  return (
    <div className="product-detail-page">
      <Link to="/" className="back-link">← Back to all products</Link>
      
      <div className="detail-layout">
        <div className="product-detail-image">
          <img src={product.image || placeholderImage} alt={product.name} />
        </div>
        <div className="product-detail-info">
          <span className="product-category-detail">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-price-detail">${Number(product.price).toFixed(2)}</p>
          <p className="product-description">
            {product.description || "No description available for this product."}
          </p>
          <div className="detail-actions">
            <Button onClick={handleAddToCart} disabled={!isSignedIn}>
              Add to Cart
            </Button>
            {!isSignedIn && (
              <p className="auth-prompt">
                Please <Link to="/login">sign in</Link> to purchase.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {!loadingRecs && recommendations.length > 0 && (
        <section className="recommendations-section">
          <hr className="section-divider" />
          <h2>You Might Also Like</h2>
          {/* Now 'fetchProducts' is correctly defined and the error is gone */}
          <ProductList products={recommendations} onLikeToggle={fetchProducts} />
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;