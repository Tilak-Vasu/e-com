// src/pages/ProductDetailPage.tsx

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import NotFoundPage from './NotFoundPage';
import Button from '../components/common/Button';
import productImage from '../assets/images/product-placeholder.webp';
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products, loading } = useProducts();
  const { user } = useAuth();
  const { addToCart } = useCart();

  if (loading) {
    return <div>Loading product...</div>;
  }

  const product = products.find(p => p.id === Number(productId));

  if (!product) {
    return <NotFoundPage />;
  }

  return (
    <div className="product-detail-page">
      <Link to="/" className="back-link">← Back to all products</Link>
      <div className="detail-layout">
        <div className="product-detail-image">
          <img src={productImage} alt={product.name} />
        </div>
        <div className="product-detail-info">
          <span className="product-category-detail">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-price-detail">${product.price.toFixed(2)}</p>
          <p className="product-description">
            This is a placeholder description. In a real application, this would come from the product data. It would describe the key features, materials, and benefits of the product.
          </p>
          <div className="detail-actions">
            <Button onClick={() => addToCart(product)} disabled={!user}>
              Add to Cart
            </Button>
            {!user && <p className="auth-prompt">Please <Link to="/login">log in</Link> to purchase.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;