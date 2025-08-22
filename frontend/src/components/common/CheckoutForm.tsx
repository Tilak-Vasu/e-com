import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// --- API and Hook Imports ---
import { createOrderAPI, createPaymentIntentAPI } from '../../api';
import useCart from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth'; // Correctly uses named import

// --- Component Imports ---
import Button from './Button';
import Input from './Input';
import './CheckoutForm.css';

// --- Type Imports from your types.ts file ---
// It's good practice to create a specific type for the data being sent to the backend
import { type ShippingInfo } from '../../api/types';

// This specific type defines the payload for creating an order, matching the backend serializer
interface OrderPayload {
  items: { product: number; quantity: number }[];
  shipping_info: {
    full_name: string;
    address: string;
    city: string;
    state: string;
    pin_code: string;
  };
  payment_method: 'Credit Card' | 'Pay on Delivery';
}

// --- Card Element Styling ---
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'delivery'>('card');
  const [isLoading, setIsLoading] = useState(false);
  // Use the imported ShippingInfo type for the state
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: user?.username || '', // Pre-fill with logged-in user's name
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [apiError, setApiError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (apiError) setApiError(null);
    setShippingInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    // Create the order payload with the specific type.
    // This transforms the frontend state (camelCase) to what the backend expects (snake_case).
    const orderPayload: OrderPayload = {
        items: cartItems.map(item => ({ 
            product: item.id, // The ID of the product
            quantity: item.quantity 
        })),
        shipping_info: {
            full_name: shippingInfo.fullName,
            address: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            pin_code: shippingInfo.pincode
        },
        payment_method: paymentMethod === 'card' ? 'Credit Card' : 'Pay on Delivery',
    };

    // --- SECURE PAYMENT FLOW ---
    if (paymentMethod === 'card') {
        if (!stripe || !elements || !elements.getElement(CardElement)) {
            setApiError('Payment form is not ready. Please wait a moment.');
            setIsLoading(false);
            return;
        }

        try {
            // STEP 1: Create a Payment Intent on YOUR backend.
            const intentResponse = await createPaymentIntentAPI({ total_amount: cartTotal });
            const clientSecret = intentResponse.clientSecret;

            if (!clientSecret) throw new Error('Failed to get payment secret from server.');
            
            // STEP 2: Confirm the card payment with Stripe using the client secret.
            const cardElement = elements.getElement(CardElement)!;
            const paymentResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: { name: shippingInfo.fullName },
                },
            });

            if (paymentResult.error) {
                setApiError(paymentResult.error.message || 'Payment failed.');
                setIsLoading(false);
                return;
            }

            // STEP 3: If payment succeeds, create the order in YOUR database.
            if (paymentResult.paymentIntent.status === 'succeeded') {
                await createOrderAPI(orderPayload);
                clearCart();
                navigate('/order/success');
            }
        } catch (err: any) {
            setApiError(err.response?.data?.error || 'An unexpected payment error occurred.');
            setIsLoading(false);
        }
    
    } else { // "Pay on Delivery" Flow
        try {
            await createOrderAPI(orderPayload);
            clearCart();
            navigate('/order/success');
        } catch (err: any) {
            setApiError(err.response?.data?.detail || 'Failed to place the order.');
            setIsLoading(false);
        }
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

  const isButtonDisabled =
    isLoading ||
    cartItems.length === 0 ||
    !shippingInfo.fullName ||
    !shippingInfo.address ||
    !shippingInfo.city ||
    !shippingInfo.state ||
    !shippingInfo.pincode;

  return (
    <>
      <h1>Checkout</h1>
      {apiError && <div className="api-error-banner"><p>{apiError}</p></div>}

      <form onSubmit={handlePlaceOrder} className="checkout-layout">
        <div className="checkout-form-main">
          <section>
            <h2 className="section-title">Shipping Information</h2>
            <div className="input-margin">
              <Input type="text" name="fullName" placeholder="Full Name" required value={shippingInfo.fullName} onChange={handleInputChange} />
            </div>
            <div className="input-margin">
              <Input type="text" name="address" placeholder="Street Address" required value={shippingInfo.address} onChange={handleInputChange} />
            </div>
            <div className="input-margin">
              <Input type="text" name="city" placeholder="City" required value={shippingInfo.city} onChange={handleInputChange} />
            </div>
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
          <Button type="submit" disabled={isButtonDisabled}>
            {isLoading ? 'Processing...' : 'Place Order'}
          </Button>
        </aside>
      </form>
    </>
  );
};

export default CheckoutForm;