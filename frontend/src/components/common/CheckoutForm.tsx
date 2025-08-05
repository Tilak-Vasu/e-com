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

// --- STYLES OBJECT (Inline CSS for the entire component) ---
const styles: { [key: string]: React.CSSProperties } = {
  h1: {
    textAlign: 'center',
    marginBottom: '2rem',
    fontSize: '2.5em',
    fontWeight: 700,
  },
  checkoutLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '1.5rem',
    fontSize: '1.5em',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '1rem',
  },
  inputMargin: {
    marginBottom: '1.5rem',
  },
  detailsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem',
  },
  paymentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  paymentLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderWidth: '2px',         // Specific width
    borderStyle: 'solid',       // Specific style
    borderColor: '#dee2e6',     // Specific color (default grey)
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paymentLabelActive: {
    borderColor: '#007bff',
    backgroundColor: '#e7f1ff',
    boxShadow: '0 0 0 1px #007bff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    padding: '1.5rem',
    position: 'sticky',
    top: '100px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  summaryTotal: {
    fontWeight: 'bold',
    fontSize: '1.2em',
    borderTop: '2px solid #212529',
    paddingTop: '1rem',
    marginTop: '1rem',
  },
  stripeCardElement: {
    backgroundColor: 'white',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  apiErrorBanner: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    textAlign: 'center',
    fontWeight: 500,
  },
  emptyCart: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #dee2e6',
    margin: '1rem 0'
  }
};

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
      const { error, paymentMethod: createdPaymentMethod } = await stripe.createPaymentMethod({
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
      <div style={styles.emptyCart}>
        <h2>Your cart is empty.</h2>
        <p>Please add products before proceeding to checkout.</p>
      </div>
    );
  }

  const isButtonDisabled = isLoading || cartItems.length === 0 || (paymentMethod === 'card' && !stripe);

  return (
    <>
      <h1 style={styles.h1}>Checkout</h1>
      {apiError && <div style={styles.apiErrorBanner}><p>{apiError}</p></div>}
      
      <form onSubmit={handlePlaceOrder} style={styles.checkoutLayout}>
        <div className="checkout-form">
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Shipping Information</h2>
            <div style={styles.inputMargin}><Input type="text" name="fullName" placeholder="Full Name" required value={shippingInfo.fullName} onChange={handleInputChange} /></div>
            <div style={styles.inputMargin}><Input type="text" name="address" placeholder="Street Address" required value={shippingInfo.address} onChange={handleInputChange} /></div>
            <div style={styles.inputMargin}><Input type="text" name="city" placeholder="City" required value={shippingInfo.city} onChange={handleInputChange} /></div>
            <div style={styles.detailsRow}>
              <Input type="text" name="state" placeholder="State / Province" required value={shippingInfo.state} onChange={handleInputChange} />
              <Input type="text" name="pincode" placeholder="Pincode / ZIP Code" required value={shippingInfo.pincode} onChange={handleInputChange} />
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Payment Method</h2>
            <div style={styles.paymentOptions}>
              <label style={{...styles.paymentLabel, ...(paymentMethod === 'card' ? styles.paymentLabelActive : {})}}>
                <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                Pay with Credit Card
              </label>
              <label style={{...styles.paymentLabel, ...(paymentMethod === 'delivery' ? styles.paymentLabelActive : {})}}>
                <input type="radio" name="paymentMethod" value="delivery" checked={paymentMethod === 'delivery'} onChange={() => setPaymentMethod('delivery')} />
                Pay on Delivery
              </label>
            </div>
          </section>

          {paymentMethod === 'card' && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Card Details</h2>
              <div style={styles.stripeCardElement}>
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </section>
          )}
        </div>

        <aside style={styles.summaryCard}>
          <h2 style={styles.sectionTitle}>Order Summary</h2>
          <div style={styles.summaryRow}><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
          <div style={styles.summaryRow}><span>Shipping</span><span>Free</span></div>
          <hr style={styles.hr} />
          <div style={{...styles.summaryRow, ...styles.summaryTotal}}><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
          <Button type="submit" disabled={isButtonDisabled} style={{ width: '100%', marginTop: '1rem' }}>
            {isLoading ? 'Processing...' : 'Place Order'}
          </Button>
        </aside>
      </form>
    </>
  );
};

export default CheckoutForm;