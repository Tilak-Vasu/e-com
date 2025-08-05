// src/components/layout/Header.tsx

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import CartIcon from '../cart/CartIcon';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="main-header">
      <Link to="/" className="logo">E-SHOP</Link>
      <nav className="main-nav">
        <ul>
          {/* These links are visible to everyone */}
          <li><NavLink to="/liked">Liked Products</NavLink></li>
          <li><NavLink to="/orders">My Orders</NavLink></li>

          {/* This block will only render if the user is signed IN */}
          <SignedIn>
            <li><UserButton afterSignOutUrl="/" /></li>
          </SignedIn>

          {/* This block will only render if the user is signed OUT */}
          <SignedOut>
            <li><NavLink to="/login">Login</NavLink></li>
            <li><NavLink to="/register">Register</NavLink></li>
          </SignedOut>

          <li><CartIcon /></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;