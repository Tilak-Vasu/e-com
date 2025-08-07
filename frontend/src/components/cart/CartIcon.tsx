// src/components/cart/CartIcon.tsx
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import useCart from '../../hooks/useCart';
import CartDropdown from './CartDropdown';
import './CartIcon.css';

const CartIcon: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { cartCount } = useCart();

  return (
    <div className="cart-icon-container">
      <button onClick={() => setIsOpen(!isOpen)} className="cart-button">
        <ShoppingCart size={20} style={{ marginRight: '8px' }} />
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        Cart
      </button>
      {isOpen && <CartDropdown closeDropdown={() => setIsOpen(false)} />}
    </div>
  );
};

export default CartIcon;