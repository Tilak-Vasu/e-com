
import React from 'react';
import type { Product } from '../../api/types';
import { useUser } from '@clerk/clerk-react'; // <-- IMPORT Clerk's hook
import useCart from '../../hooks/useCart';
import useLikedProducts from '../../hooks/useLikedProducts';
import productImage from '../../assets/images/product-placeholder.webp';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // --- THIS IS THE KEY CHANGE ---
  // We use Clerk's `useUser` hook. `isSignedIn` will be true or false.
  const { isSignedIn } = useUser(); 
  
  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const { likeProduct, unlikeProduct, isLiked } = useLikedProducts();

  const itemInCart = cartItems.find(item => item.id === product.id);
  const liked = isLiked(product.id);

  const handleToggleLike = () => {
    if (!isSignedIn) {
      alert('Please log in to like products.');
      return;
    }
    if (liked) {
      unlikeProduct(product.id);
    } else {
      likeProduct(product.id);
    }
  };

  const handleInitialAddToCart = () => {
    if (!isSignedIn) {
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
        {/* Use the `isSignedIn` boolean to disable the buttons */}
        <button
          onClick={handleToggleLike}
          disabled={!isSignedIn}
          className={`like-btn ${liked ? 'liked' : ''}`}
          title={!isSignedIn ? 'Log in to like' : (liked ? 'Unlike product' : 'Like product')}
        >
          {liked ? '❤️ Unlike' : '🤍 Like'}
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
            disabled={!isSignedIn}
            className="add-to-cart-btn"
            title={!isSignedIn ? 'Log in to add to cart' : 'Add to cart'}
          >
            🛒 Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;