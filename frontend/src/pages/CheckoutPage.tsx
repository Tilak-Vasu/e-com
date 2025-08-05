import React from 'react';

// Stripe Imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Import the actual form component that will contain all the logic
import CheckoutForm from '../components/common/CheckoutForm'; 

// ====================================================================
// ▼▼▼ IMPORTANT: REPLACE WITH YOUR STRIPE PUBLISHABLE KEY ▼▼▼
// ====================================================================
// Get this for free from your Stripe Dashboard. It starts with "pk_test_".
const stripePromise = loadStripe('pk_test_51RsKvKBi7lBGzFUlsmgFuN70cyeaWkrFbCmhBcCSK6sxeFI7QZDYSwo2HtPlM99KX8lrzlffkmlTnovYoBfU1vaB00ZEgsJHwW');


const CheckoutPage: React.FC = () => {
  return (
    <div className="checkout-page">
      {/* The Elements provider makes Stripe available to any child component */}
      {/* It MUST wrap the component that uses the useStripe() hook */}
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default CheckoutPage;