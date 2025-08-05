// src/components/products/ProductCard.tsx

import React from 'react';
import type { Product } from '../../api/types';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart'; // <-- We need the full cart context now
import useLikedProducts from '../../hooks/useLikedProducts';
import productImage from '../../assets/images/product-placeholder.webp';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  // Get all the functions and data we need from the cart context
  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const { likeProduct, unlikeProduct, isLiked } = useLikedProducts();

  // --- NEW LOGIC: Check if this specific product is in the cart ---
  // The .find() method will return the item object (including its quantity) or undefined
  const itemInCart = cartItems.find(item => item.id === product.id);

  const liked = isLiked(product.id);

  const handleToggleLike = () => {
    if (!user) {
      alert('Please log in to like products.');
      return;
    }
    if (liked) {
      unlikeProduct(product.id);
    } else {
      likeProduct(product.id);
    }
  };

  // This function is now only for the initial "Add to Cart" button click
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
        <p className="product-price">${product.price.toFixed(2)}</p>
      </div>
      <div className="product-actions">
        {/* The Like/Unlike button is always visible */}
        <button
          onClick={handleToggleLike}
          disabled={!user}
          className={`like-btn ${liked ? 'liked' : ''}`}
          title={!user ? 'Log in to like' : (liked ? 'Unlike product' : 'Like product')}
        >
          {liked ? '❤️ Unlike' : '🤍 Like'}
        </button>

        {/* --- THIS IS THE CONDITIONAL RENDERING LOGIC --- */}
        {itemInCart ? (
          // If the item is in the cart, show the quantity controller
          <div className="quantity-controller">
            <button onClick={() => decreaseQuantity(product.id)} className="quantity-btn">-</button>
            <span className="quantity-display">{itemInCart.quantity}</span>
            <button onClick={() => addToCart(product)} className="quantity-btn">+</button>
          </div>
        ) : (
          // Otherwise, show the "Add to Cart" button
          <button onClick={handleInitialAddToCart} disabled={!user} className="add-to-cart-btn" title={!user ? 'Log in to add to cart' : 'Add to cart'}>
          🛒 Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;