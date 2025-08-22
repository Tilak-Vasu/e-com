// // src/components/layout/Header.tsx

// import React from 'react';
// import { NavLink, Link } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';
// import CartIcon from '../cart/CartIcon';
// import {
//   LayoutDashboard,
//   Heart,
//   Package,
//   LogOut,
//   LogIn
// } from 'lucide-react'; // 🎯 Lucide icons
// import './Header.css';

// const Header: React.FC = () => {
//   const { user, logoutUser } = useAuth();

//   return (
//     <header className="main-header">
//       <Link to="/" className="logo">E-SHOP</Link>

//       <nav className="main-nav">
//         <ul>
//           {/* --- ADMIN ONLY LINK --- */}
//           {user?.is_staff && (
//             <li>
//               <NavLink to="/admin/dashboard" className="nav-icon-link">
//                 <LayoutDashboard size={18} />
//                 <span className="nav-text">Admin Dashboard</span>
//               </NavLink>
//             </li>
//           )}

//           <li>
//             <NavLink to="/liked" className="nav-icon-link">
//               <Heart size={24} />
//               {/* <span className="nav-text"></span> */}
//             </NavLink>
//           </li>

//           {user ? (
//             <>
//               <li>
//                 <NavLink to="/orders" className="nav-icon-link">
//                   <Package size={18} />
//                   <span className="nav-text">My Orders</span>
//                 </NavLink>
//               </li>
//               <li className="welcome-message">
//                 <span>Welcome, {user.username}</span>
//               </li>
//               <li>
//                 <button onClick={logoutUser} className="logout-btn nav-icon-link">
//                   <LogOut size={18} />
//                   <span className="nav-text">Logout</span>
//                 </button>
//               </li>
//             </>
//           ) : (
//             <li>
//               <NavLink to="/login" className="login-register-link nav-icon-link">
//                 <LogIn size={18} />
//                 <span className="nav-text">Login / Register</span>
//               </NavLink>
//             </li>
//           )}

//           <li>
//             {/* keep custom CartIcon wrapper, but style with same nav-icon-link */}
//             {/* <div className="cart-button"> */}
//               <CartIcon />
//             {/* </div> */}
//           </li>
//         </ul>
//       </nav>
//     </header>
//   );
// };

// export default Header;


import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import CartIcon from '../cart/CartIcon';
import {
  LayoutDashboard,
  Heart,
  Package,
  LogOut,
  LogIn,
  ShoppingCart // <<< 1. IMPORT A NEW ICON
} from 'lucide-react';
import './Header.css';

const Header: React.FC = () => {
  const { user, logoutUser } = useAuth();

  return (
    <header className="main-header">
      <Link to="/" className="logo">E-SHOP</Link>

      <nav className="main-nav">
        <ul>
          {/* --- ADMIN ONLY LINKS --- */}
          {user?.is_staff && (
            // Use a Fragment to group the admin links
            <>
              {/* <<< 2. ADD THE NEW "MANAGE PRODUCTS" LINK HERE */}
              <li>
                <NavLink to="/admin/products" className="nav-icon-link">
                  <ShoppingCart size={18} />
                  <span className="nav-text">Manage Products</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/dashboard" className="nav-icon-link">
                  <LayoutDashboard size={18} />
                  <span className="nav-text">Admin Dashboard</span>
                </NavLink>
              </li>
            </>
          )}

          <li>
            <NavLink to="/liked" className="nav-icon-link">
              <Heart size={24} />
            </NavLink>
          </li>

          {user ? (
            <>
              <li>
                <NavLink to="/orders" className="nav-icon-link">
                  <Package size={18} />
                  <span className="nav-text">My Orders</span>
                </NavLink>
              </li>
              <li className="welcome-message">
                <span>Welcome, {user.username}</span>
              </li>
              <li>
                <button onClick={logoutUser} className="logout-btn nav-icon-link">
                  <LogOut size={18} />
                  <span className="nav-text">Logout</span>
                </button>
              </li>
            </>
          ) : (
            <li>
              <NavLink to="/login" className="login-register-link nav-icon-link">
                <LogIn size={18} />
                <span className="nav-text">Login / Register</span>
              </NavLink>
            </li>
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