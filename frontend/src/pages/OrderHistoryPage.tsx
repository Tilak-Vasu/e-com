// src/pages/OrderHistoryPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import useOrderHistory from '../hooks/useOrderHistory';
import Button from '../components/common/Button';
import './OrderHistoryPage.css';

const OrderHistoryPage: React.FC = () => {
  const { orders } = useOrderHistory();

  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="empty-history-page">
        <h2>No Order History</h2>
        <p>You haven't placed any orders yet. Your past orders will appear here.</p>
        <Link to="/">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container order-history-page">
      <h1>Your Order History</h1>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <header className="order-header">
              <div>
                <span className="order-label">ORDER PLACED</span>
                <span>{order.date || 'N/A'}</span>
              </div>
              <div>
                <span className="order-label">TOTAL</span>
                <span>${order.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div>
                <span className="order-label">PAYMENT METHOD</span>
                <span>{order.paymentMethod || 'N/A'}</span>
              </div>
            </header>

            <div className="order-details-body">
              <div className="order-items">
                <h4>Items in this order:</h4>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map(item => (
                    <div key={item.id} className="order-item">
                      <span className="item-name">
                        {item.name} (x{item.quantity})
                      </span>
                      <span className="item-price">
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No items found in this order.</p>
                )}
              </div>

              <div className="order-shipping-details">
                <h4>Delivering to:</h4>
                {order.shippingInfo ? (
                  <>
                    <p>{order.shippingInfo.fullName}</p>
                    <p>{order.shippingInfo.address}</p>
                    <p>
                      {order.shippingInfo.city}, {order.shippingInfo.state}{' '}
                      {order.shippingInfo.pincode}
                    </p>
                  </>
                ) : (
                  <p>Shipping information not available.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
