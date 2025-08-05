
import React, { useRef, useEffect } from 'react';
import useCart from '../../hooks/useCart';
import CartItem from './CartItem'; // Your detailed CartItem component
import { Link } from 'react-router-dom';
import './CartDropdown.css';

interface CartDropdownProps {
  closeDropdown: () => void;
}

const CartDropdown: React.FC<CartDropdownProps> = ({ closeDropdown }) => {
  const { cartItems, cartTotal } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeDropdown]);

  return (
    <div className="cart-dropdown" ref={dropdownRef}>
      <div className="cart-items-container">
        {cartItems.length > 0 ? (
          // It will render your detailed CartItem component for each item
          cartItems.map(item => <CartItem key={item.id} item={item} />)
        ) : (
          <p className="empty-message">Your cart is empty.</p>
        )}
      </div>
      <div className="cart-summary">
        <span className="total">Total: ${cartTotal.toFixed(2)}</span>
        {/* Using a Link is better for routing */}
        <Link to="/cart" onClick={closeDropdown} className="go-to-cart-btn">
          Go to Cart
        </Link>
      </div>
    </div>
  );
};

export default CartDropdown;