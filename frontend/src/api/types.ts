// src/api/types.ts

import type { ReactNode } from "react";

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

// --- PRODUCT ---

export interface Product {
  is_liked: boolean; // Should be a boolean
  id: number;
  name: string;
  category: string;
  price: number;
  image: string | null; // Image can be null
}

export interface CartItem extends Product {
  quantity: number;
}

// --- ORDER ---

export interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// This represents an order received from the backend (e.g., in order history)
export interface Order {
  id: string;
  created_at: string;
  items: CartItem[];
  total_amount: number; // Matches backend model
  payment_method: 'Credit Card' | 'Pay on Delivery';
  shipping_info: { // Matches backend JSONField structure
    full_name: string;
    address: string;
    city: string;
    state: string;
    pin_code: string;
  };
}

// --- V V V THIS IS THE FIX V V V ---
// This is the specific data structure for CREATING a new order.
// It perfectly matches what your Django OrderCreateSerializer expects.
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