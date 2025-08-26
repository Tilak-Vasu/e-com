import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../api/types';

// Auth hook & API
import { useAuth } from '../../hooks/useAuth';
import { toggleLikeProductAPI } from '../../api';

// Cart hook
import useCart from '../../hooks/useCart';

// Assets & styles
import placeholderImage from '../../assets/images/product-placeholder.webp';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onLikeToggle: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onLikeToggle }) => {
  // The error will be gone now because useAuth() provides the correct value.
  const { isAuthenticated } = useAuth();
  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const itemInCart = cartItems.find(item => item.id === product.id);

  const isLiked = product.is_liked;

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like products.');
      return;
    }
    try {
      await toggleLikeProductAPI(product.id);
      onLikeToggle();
    } catch (error) {
      console.error("Failed to toggle like status:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleInitialAddToCart = () => {
    if (!isAuthenticated) {
      alert('Please log in to add items to your cart.');
      return;
    }
    addToCart(product);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`}>
        <img
          src={product.image || placeholderImage}
          alt={product.name}
          className="product-image"
        />
      </Link>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <Link to={`/products/${product.id}`} className="product-name-link">
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
      </div>
      <div className="product-actions">
        <button
          type='button'
          onClick={handleToggleLike}
          disabled={!isAuthenticated}
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          title={!isAuthenticated ? 'Log in to like' : (isLiked ? 'Unlike product' : 'Like product')}
        >
          {isLiked ? '❤️' : '🤍'}
        </button>
        {itemInCart ? (
          <div className="quantity-controller">
            <button onClick={() => decreaseQuantity(product.id)} className="quantity-btn">-</button>
            <span className="quantity-display">{itemInCart.quantity}</span>
            <button onClick={() => addToCart(product)} className="quantity-btn">+</button>
          </div>
        ) : (
          <button
            onClick={handleInitialAddToCart}
            disabled={!isAuthenticated}
            className="add-to-cart-btn"
            title={!isAuthenticated ? 'Log in to add to cart' : 'Add to cart'}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;