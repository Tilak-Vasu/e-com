// src/pages/CartPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import useCart from '../hooks/useCart';
import CartItem from '../components/cart/CartItem';
import Button from '../components/common/Button';
import './CartPage.css';

const CartPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your Shopping Cart</h1>
      <div className="cart-layout">
        <div className="cart-items-list">
          {cartItems.map(item => <CartItem key={item.id} item={item} />)}
        </div>
        <aside className="cart-summary-card">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <hr />
          <div className="summary-row total">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <Link to="/checkout">
            <Button disabled={cartItems.length === 0}>
              Proceed to Checkout
            </Button>
          </Link>
          <Button onClick={clearCart} variant="danger" disabled={cartItems.length === 0}>
            Clear Cart
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;