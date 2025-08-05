// src/components/layout/Header.tsx

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import CartIcon from '../cart/CartIcon';
import './Header.css';

const Header: React.FC = () => {
  // Get the user object from the context.
  const { user, logoutUser } = useAuth();

  // DEBUG CHECK #3: See what the `user` object looks like inside this component.
  // This log will run every time the Header renders or re-renders.
  // Uncomment the line below to use it.
  // console.log('DEBUG 3: User object in Header component:', user);

  return (
    <header className="main-header">
      <Link to="/" className="logo">
        E-SHOP
      </Link>
      <nav className="main-nav">
        <ul>
          <li>
            <NavLink to="/liked">Liked Products</NavLink>
          </li>

          {/* This is the conditional rendering logic */}
          {user ? (
            // If `user` is an object (not null), show this:
            <>
              <li className="welcome-message">
                {/* Ensure you are using `user.username` */}
                <span>Welcome, {user.username}</span>
              </li>
              <li><NavLink to="/orders">My Orders</NavLink></li>
              <li>
                <button onClick={logoutUser} className="logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            // If `user` is null, show this:
            <>
              <li>
                <NavLink to="/login">Login</NavLink>
              </li>
              <li>
                <NavLink to="/register">Register</NavLink>
              </li>
            </>
          )}

          <li>
            <CartIcon />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;