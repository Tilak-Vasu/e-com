import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';
import useCart from '../../hooks/useCart'; // This now points to our new Zustand-powered hook
import placeholderImage from '../../assets/images/product-placeholder.webp';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onLikeToggle: (productId: number, currentLikeStatus: boolean) => void;
  likedProductIds?: Set<number>;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onLikeToggle,
  likedProductIds = new Set(),
}) => {
  const { isAuthenticated } = useAuth();
  // --- FIX: Get all required functions from our new persistent cart hook ---
  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const itemInCart = cartItems.find(item => item.id === product.id);
  const isLiked = likedProductIds.has(product.id);

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      alert('Please log in to like products.');
      return;
    }
    onLikeToggle(product.id, isLiked);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`}>
        <img src={product.image || placeholderImage} alt={product.name} className="product-image" />
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

        {/* --- FIX: Full implementation of the quantity controller --- */}
        {itemInCart ? (
          <div className="quantity-controller">
            <button onClick={() => decreaseQuantity(product.id)} className="quantity-btn">-</button>
            <span className="quantity-display">{itemInCart.quantity}</span>
            <button 
              onClick={() => addToCart(product)} 
              className="quantity-btn"
              disabled={itemInCart.quantity >= product.stock_quantity}
              title={itemInCart.quantity >= product.stock_quantity ? "No more stock" : "Increase quantity"}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!isAuthenticated) {
                alert('Please log in to add items to your cart.');
                return;
              }
              addToCart(product);
            }}
            disabled={!isAuthenticated || product.stock_quantity < 1}
            className="add-to-cart-btn"
            title={!isAuthenticated ? 'Log in' : (product.stock_quantity < 1 ? 'Out of Stock' : 'Add to cart')}
          >
            {product.stock_quantity < 1 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;