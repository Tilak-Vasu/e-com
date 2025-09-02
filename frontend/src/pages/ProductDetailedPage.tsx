// src/pages/ProductDetailedPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// --- Import all necessary hooks ---
import useCart from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import useProducts from '../hooks/useProducts';

// --- Import all necessary API functions ---
import { fetchProductDetailAPI, fetchRecommendationsAPI, toggleLikeProductAPI } from '../api';
import { type Product } from '../api/types';

// --- Import reusable components ---
import ProductReviews from '../components/ProductReviews';
import ProductCarousel from '../components/carousel/ProductCarousel';
import placeholderImage from '../assets/images/product-placeholder.webp';
import './ProductDetailedPage.css';

const ProductDetailedPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();

  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { fetchProducts } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const itemInCart = cartItems.find(item => item.id === product?.id);

  useEffect(() => {
    const loadPageData = async () => {
      if (!productId) {
        setError('Product ID is missing from the URL.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadingRecs(true);
      setError('');

      try {
        const [productResponse, recsResponse] = await Promise.all([
          fetchProductDetailAPI(productId),
          fetchRecommendationsAPI(productId),
        ]);
        setProduct(productResponse.data);
        setRecommendations(recsResponse.data);
      } catch (err) {
        setError('Failed to load product details. It may not exist.');
        console.error('Fetch product detail error:', err);
      } finally {
        setLoading(false);
        setLoadingRecs(false);
      }
    };
    loadPageData();
  }, [productId]);

  const handleToggleLike = async () => {
    if (!isAuthenticated || !product) {
      alert('Please log in to like products.');
      return;
    }
    try {
      const isCurrentlyLiked = product.is_liked;
      setProduct(prev => (prev ? { ...prev, is_liked: !isCurrentlyLiked } : null));
      await toggleLikeProductAPI(product.id);
      await fetchProducts();
    } catch (error) {
      console.error('Failed to toggle like status:', error);
      alert('Something went wrong. Please try again.');
      setProduct(prev => (prev ? { ...prev, is_liked: !prev.is_liked } : null));
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!product) return <div className="page-error">Product not found.</div>;

  return (
    <div className="product-detail-page">
      <Link to="/" className="back-link">&larr; Back to Products</Link>

      <main className="detail-layout">
        {/* --- IMAGE LEFT --- */}
        <div className="product-image-container">
          <img src={product.image || placeholderImage} alt={product.name} />

          <button
            className={`detail-like-btn ${product.is_liked ? 'liked' : ''}`}
            onClick={handleToggleLike}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? 'Log in to like' : (product.is_liked ? 'Unlike' : 'Like')}
          >
            {product.is_liked ? '❤️' : '🤍'}
          </button>
        </div>

        {/* --- INFO RIGHT --- */}
        <div className="product-detail-info">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-category-detail">{product.category}</p>
          <p className="product-price-detail">${Number(product.price).toFixed(2)}</p>

          <div className="product-cart-controls">
            {itemInCart ? (
              <div className="quantity-controller-detail">
                <button
                  onClick={() => decreaseQuantity(product.id)}
                  className="quantity-btn-detail"
                >
                  -
                </button>
                <span className="quantity-display-detail">{itemInCart.quantity}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="quantity-btn-detail"
                >
                  +
                </button>
              </div>
            ) : (
              <button className="btn-add-to-cart" onClick={() => addToCart(product)}>
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </main>
      
      {/* --- DESCRIPTION (MOVED HERE) --- */}
      <section className="product-description-section">
        <h2>Description</h2>
        <p className="product-description">{product.description}</p>
      </section>

      {!loadingRecs && recommendations.length > 0 && (
        <section className="recommendations-section">
          <hr className="section-divider" />
          <h2>You Might Also Like</h2>
          <ProductCarousel products={recommendations} />
        </section>
      )}

      <hr className="section-divider" />
      <ProductReviews productId={product.id} />
    </div>
  );
};

export default ProductDetailedPage;