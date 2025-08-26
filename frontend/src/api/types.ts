// src/api/types.ts

// --- USER & AUTH ---

export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface AuthTokenResponse {
  access: string;
  refresh: string;
}

// This represents the decoded user object from the JWT token
export interface User {
  user_id: number;
  username: string;
  is_staff: boolean;
}


// --- PRODUCT ---

export interface Product {
  id: number;
  name: string;
  category: string;
  price: string; // CORRECTED: Django's DecimalField serializes to a string
  description: string;
  stock_quantity: number;
  image: string | null;
  is_liked: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}


// --- REVIEWS ---

export interface Review {
  id: number;
  author: {
    id: number;
    username: string;
  };
  text: string;
  created_at: string;
  updated_at: string;
}


// --- ORDER ---

// Represents the frontend state for shipping info (using camelCase)
export interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// This is the specific data structure for CREATING a new order.
export interface OrderPayload {
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

// Represents an order object as RECEIVED from the backend
export interface Order {
  id: number;
  created_at: string;
  items: CartItem[];
  total_amount: number;
  payment_method: 'Credit Card' | 'Pay on Delivery';
  shipping_info: {
    full_name: string;
    address: string;
    city: string;
    state: string;
    pin_code: string;
  };
}