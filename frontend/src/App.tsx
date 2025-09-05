// // src/App.tsx

// import React from 'react';
// import { Routes, Route } from 'react-router-dom';

// // Layout Components
// import Header from './components/layout/Header';
// import Footer from './components/layout/Footer';
// import ProtectedRoute from './components/layout/ProtectedRoute.tsx';
// import AdminRoute from './components/layout/AdminRoute.tsx'; // <-- IMPORT NEW ADMIN ROUTE

// // Page Components
// import HomePage from './pages/HomePage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import LikedProductsPage from './pages/LikedProductsPage';
// import CartPage from './pages/CartPage';
// import ProductDetailPage from './pages/ProductDetailPage';
// import CheckoutPage from './pages/CheckoutPage';
// import OrderHistoryPage from './pages/OrderHistoryPage';
// import OrderSuccessPage from './pages/OrderSuccessPage';
// import NotFoundPage from './pages/NotFoundPage';
// import AdminDashboardPage from './pages/AdminDashboardPage'; // <-- IMPORT NEW DASHBOARD PAGE
// import ChatWidget from './components/chat/ChatWidget';
// const App: React.FC = () => {
//   return (
//     <>
//       <Header />
//       <main>
//         <div className="container">
//           <Routes>
//             {/* --- PUBLIC ROUTES --- */}
//             <Route path="/" element={<HomePage />} />
//             <Route path="/login" element={<LoginPage />} />
//             <Route path="/register" element={<RegisterPage />} />
//             <Route path="/product/:productId" element={<ProductDetailPage />} />

//             {/* --- PROTECTED CUSTOMER ROUTES --- */}
//             <Route element={<ProtectedRoute />}>
//               <Route path="/liked" element={<LikedProductsPage />} />
//               <Route path="/cart" element={<CartPage />} />
//               <Route path="/checkout" element={<CheckoutPage />} />
//               <Route path="/orders" element={<OrderHistoryPage />} />
//               <Route path="/order/success" element={<OrderSuccessPage />} />
//             </Route>

//             {/* --- PROTECTED ADMIN ROUTES --- */}
//             <Route element={<AdminRoute />}>
//               <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
//             </Route>

//             {/* --- CATCH-ALL ROUTE --- */}
//             <Route path="*" element={<NotFoundPage />} />
//           </Routes>
//         </div>
//       </main>
//       <ChatWidget />
//       <Footer />
//     </>
//   );
// };

// export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute.tsx';
import AdminRoute from './components/layout/AdminRoute.tsx';
import ProductDetailedPage from './pages/ProductDetailedPage';
// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LikedProductsPage from './pages/LikedProductsPage';
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ChatWidget from './components/chat/ChatWidget';
// <<< 1. IMPORT THE NEW PAGE COMPONENT
import AdminProductManagementPage from './pages/AdminProductManagementPage';
import DocumentAssistantPage from './pages/DocumentAssistantPage';
import AdminChatbotPage from './pages/AdminChatbotPage.tsx'; // You will create this file next



const App: React.FC = () => {
  return (
    <>
      <Header />
      <main>
        <div className="container">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/products/:productId" element={<ProductDetailedPage />} />


            {/* --- PROTECTED CUSTOMER ROUTES --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/liked" element={<LikedProductsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/order/success" element={<OrderSuccessPage />} />
            </Route>

            {/* --- PROTECTED ADMIN ROUTES --- */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              {/* <<< 2. ADD THE NEW ADMIN ROUTE HERE */}
              <Route path="/admin/products" element={<AdminProductManagementPage />} />
              <Route path="/admin/documents" element={<DocumentAssistantPage />} />
              <Route path="/admin/chatbot" element={<AdminChatbotPage />} />

            </Route>

            {/* --- CATCH-ALL ROUTE --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <ChatWidget />
      <Footer />
    </>
  );
};

export default App;