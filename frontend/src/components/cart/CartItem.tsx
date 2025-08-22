// src/components/cart/CartItem.tsx

import React from 'react';
import useCart from '../../hooks/useCart';
import type { CartItem as CartItemType } from '../../api/types';
import productImage from '../../assets/images/product-placeholder.webp';
import './CartItem.css';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { addToCart, decreaseQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <img src={productImage} alt={item.name} className="cart-item-image" />
      <div className="cart-item-details">
        <span className="cart-item-name">{item.name}</span>
        {/* This new wrapper helps with spacing */}
        <div className="cart-item-price-quantity">
          {/* Ensure item.price is a valid number and fallback to '0.00' if not */}
          <span className="cart-item-price">
            ${item.price && !isNaN(Number(item.price)) ? Number(item.price).toFixed(2) : '0.00'}
          </span>
          <span className="cart-item-quantity">Qty: {item.quantity}</span>
        </div>
      </div>
      <div className="cart-item-actions">
        {/* We use buttons for better accessibility and styling */}
        <button onClick={() => decreaseQuantity(item.id)} className="quantity-btn">-</button>
        <span className="quantity-display">{item.quantity}</span>
        <button onClick={() => addToCart(item)} className="quantity-btn">+</button>
        <button onClick={() => removeFromCart(item.id)} className="remove-btn" title="Remove Item">×</button>
      </div>
    </div>
  );
};

export default CartItem;
