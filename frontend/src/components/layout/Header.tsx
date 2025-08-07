// src/components/layout/Header.tsx

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Heart, Package } from 'lucide-react';
import CartIcon from '../cart/CartIcon';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="main-header">
      <Link to="/" className="logo">E-SHOP</Link>
      
      <nav className="main-nav">
        <ul>
          {/* These links are always visible */}
          <li>
            <NavLink to="/liked" className="nav-icon-link">
              <Heart size={20} />
              <span className="nav-text">Liked</span>
            </NavLink>
          </li>
          
          {/* --- This block will only render if the user is signed IN --- */}
          <SignedIn>
            <li>
              <NavLink to="/orders" className="nav-icon-link">
                <Package size={20} />
                <span className="nav-text">My Orders</span>
              </NavLink>
            </li>
            <li><UserButton afterSignOutUrl="/" /></li>
          </SignedIn>

          {/* --- THIS IS THE KEY CHANGE --- */}
          {/* --- This block will only render if the user is signed OUT --- */}
          <SignedOut>
            {/* We now have a single, combined link */}
            <li>
              <NavLink to="/login" className="login-register-link">
                Login / Register
              </NavLink>
            </li>
          </SignedOut>

          {/* The cart icon is always visible */}
          <li><CartIcon /></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;