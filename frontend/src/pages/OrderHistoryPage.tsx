import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi'; // Your hook for making authenticated API calls
import Button from '../components/common/Button'; // Assuming you have a Button component
import './OrderHistoryPage.css';

// --- TYPE DEFINITIONS ---
// These interfaces now correctly match the snake_case format of your Django API response.

interface Product {
  id: number;
  name: string;
  price: string;
}

interface OrderItem {
  product: Product; // Product is a nested object
  quantity: number;
  price: string;
}

// Correctly defines the shipping info object with snake_case keys
interface ShippingInfo {
  full_name: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
}

// The main Order type, with all properties in snake_case
interface Order {
  id: number;
  created_at: string;
  total_amount: string;
  payment_method: string;
  shipping_info: ShippingInfo | null;
  items: OrderItem[];
}


const OrderHistoryPage: React.FC = () => {
  const api = useApi();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Order[]>('/orders/');
        setOrders(response.data);
      } catch (err) {
        console.error("Failed to fetch order history:", err);
        setError("Could not load your order history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [api]); // Dependency array ensures this runs only once when the component mounts

  if (loading) {
    return <div className="page-status">Loading your order history...</div>;
  }

  if (error) {
    return <div className="page-status error">{error}</div>;
  }

  if (orders.length === 0) {
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
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="order-label">TOTAL</span>
                <span>${Number(order.total_amount).toFixed(2)}</span>
              </div>
              <div>
                <span className="order-label">PAYMENT METHOD</span>
                <span>{order.payment_method}</span>
              </div>
            </header>

            <div className="order-details-body">
              <div className="order-items">
                <h4>Items in this order:</h4>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">
                        {/* CORRECTED: Access the .name property of the nested product object */}
                        {item.product.name} (x{item.quantity})
                      </span>
                      <span className="item-price">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>Item details not available for this order.</p>
                )}
              </div>

              <div className="order-shipping-details">
                <h4>Delivering to:</h4>
                {/* CORRECTED: Check for shipping_info and access its properties with snake_case */}
                {order.shipping_info ? (
                  <>
                    <p>{order.shipping_info.full_name}</p>
                    <p>{order.shipping_info.address}</p>
                    <p>
                      {order.shipping_info.city}, {order.shipping_info.state}{' '}
                      {order.shipping_info.pin_code}
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