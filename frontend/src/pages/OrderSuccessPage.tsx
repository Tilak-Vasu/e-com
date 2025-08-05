// src/pages/OrderSuccessPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import './OrderSuccessPage.css'; // We'll create a shared CSS file for success/cancelled pages

const OrderSuccessPage: React.FC = () => {
  return (
    <div className="order-result-container">
      <div className="order-result-card">
        <div className="success-icon">✓</div>
        <h1>Thank You For Your Order!</h1>
        <p>Your order has been placed successfully. You can view the details in your order history.</p>
        <div className="order-result-actions">
          <Link to="/">
            <Button variant="primary">Continue Shopping</Button>
          </Link>
          <Link to="/orders">
            <Button variant="secondary">View My Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;