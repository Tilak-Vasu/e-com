import React, { useState, useContext, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Your existing hooks and context
import useCart from '../../hooks/useCart';
import OrderHistoryContext from '../../context/OrderHistoryContext';

// Your existing components and types
import Button from './Button';
import Input from './Input';
import type { Order } from '../../api/types';

// --- IMPORT THE DEDICATED CSS FILE ---
import './CheckoutForm.css';

// Custom styling for the Stripe CardElement (this is a JS object, not CSS)
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const CheckoutForm: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const orderHistoryContext = useContext(OrderHistoryContext);
  const navigate = useNavigate();
  
  const stripe = useStripe();
  const elements = useElements();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'delivery'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({ fullName: '', address: '', city: '', state: '', pincode: '' });
  const [apiError, setApiError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (apiError) setApiError(null);
    setShippingInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    if (!orderHistoryContext) {
      setApiError('Order service is unavailable. Please try again later.');
      setIsLoading(false);
      return;
    }

    let wasOrderSuccessful = false;

    if (paymentMethod === 'card') {
      if (!stripe || !elements || !elements.getElement(CardElement)) {
        setApiError('Payment form is not ready. Please wait a moment.');
        setIsLoading(false);
        return;
      }
      
      const cardElement = elements.getElement(CardElement)!;
      const { error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { name: shippingInfo.fullName },
      });

      if (error) {
        setApiError(error.message || 'An unexpected error occurred.');
        setIsLoading(false);
        return;
      }
      
      console.log('Stripe validation successful! Simulating final processing...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      wasOrderSuccessful = true;

    } else { // Pay on Delivery
      await new Promise(resolve => setTimeout(resolve, 1000));
      wasOrderSuccessful = true;
    }

    if (wasOrderSuccessful) {
      const { addOrder } = orderHistoryContext;
      const newOrder: Order = {
        id: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        items: cartItems,
        totalAmount: cartTotal,
        paymentMethod: paymentMethod === 'card' ? 'Credit Card' : 'Pay on Delivery',
        shippingInfo: shippingInfo,
      };

      addOrder(newOrder);
      clearCart();
      navigate('/order/success');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart-checkout">
        <h2>Your cart is empty.</h2>
        <p>Please add products before proceeding to checkout.</p>
      </div>
    );
  }

  const isButtonDisabled = isLoading || cartItems.length === 0 || (paymentMethod === 'card' && !stripe);

  return (
    <>
      <h1>Checkout</h1>
      {apiError && <div className="api-error-banner"><p>{apiError}</p></div>}
      
      <form onSubmit={handlePlaceOrder} className="checkout-layout">
        <div className="checkout-form-main">
          <section>
            <h2 className="section-title">Shipping Information</h2>
            <div className="input-margin"><Input type="text" name="fullName" placeholder="Full Name" required value={shippingInfo.fullName} onChange={handleInputChange} /></div>
            <div className="input-margin"><Input type="text" name="address" placeholder="Street Address" required value={shippingInfo.address} onChange={handleInputChange} /></div>
            <div className="input-margin"><Input type="text" name="city" placeholder="City" required value={shippingInfo.city} onChange={handleInputChange} /></div>
            <div className="details-row">
              <Input type="text" name="state" placeholder="State / Province" required value={shippingInfo.state} onChange={handleInputChange} />
              <Input type="text" name="pincode" placeholder="Pincode / ZIP Code" required value={shippingInfo.pincode} onChange={handleInputChange} />
            </div>
          </section>

          <section>
            <h2 className="section-title">Payment Method</h2>
            <div className="payment-options">
              <label className={`payment-label ${paymentMethod === 'card' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                Pay with Credit Card
              </label>
              <label className={`payment-label ${paymentMethod === 'delivery' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="delivery" checked={paymentMethod === 'delivery'} onChange={() => setPaymentMethod('delivery')} />
                Pay on Delivery
              </label>
            </div>
          </section>

          {paymentMethod === 'card' && (
            <section>
              <h2 className="section-title">Card Details</h2>
              <div className="stripe-card-element">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </section>
          )}
        </div>

        <aside className="summary-card">
          <h2 className="section-title">Order Summary</h2>
          <div className="summary-row"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <hr />
          <div className="summary-row summary-total"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
          <Button type="submit" disabled={isButtonDisabled} style={{ width: '100%', marginTop: '1rem' }}>
            {isLoading ? 'Processing...' : 'Place Order'}
          </Button>
        </aside>
      </form>
    </>
  );
};

export default CheckoutForm;