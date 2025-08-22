import React from 'react';
import type { Product } from '../../api/types';

// Auth hook & API
import { useAuth } from '../../hooks/useAuth';
import { toggleLikeProductAPI } from '../../api';

// Cart hook
import useCart from '../../hooks/useCart';

// Assets & styles
import productImage from '../../assets/images/product-placeholder.webp';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onLikeToggle: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onLikeToggle }) => {
  const { user } = useAuth();
  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const itemInCart = cartItems.find(item => item.id === product.id);

  const isLiked = product.is_liked;

  const handleToggleLike = async () => {
    if (!user) {
      alert('Please log in to like products.');
      return;
    }
    try {
      await toggleLikeProductAPI(product.id);
      onLikeToggle(); // ✅ refresh product list
    } catch (error) {
      console.error("Failed to toggle like status:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleInitialAddToCart = () => {
    if (!user) {
      alert('Please log in to add items to your cart.');
      return;
    }
    addToCart(product);
  };

  return (
    <div className="product-card">
      <img src={productImage} alt={product.name} className="product-image" />
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">${product.price}</p>
      </div>
      <div className="product-actions">
        <button
          onClick={handleToggleLike}
          disabled={!user}
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          title={!user ? 'Log in to like' : (isLiked ? 'Unlike product' : 'Like product')}
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
            disabled={!user}
            className="add-to-cart-btn"
            title={!user ? 'Log in to add to cart' : 'Add to cart'}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
