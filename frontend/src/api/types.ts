// src/api/types.ts

/**
 * Defines the structure of a single product object.
 * This is used for mock data and will match the data from a future product API.
 */
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string; // The filename of the image, e.g., 'product-placeholder.webp'
}

/**
 * Defines the data required to register a new user.
 * This matches the fields expected by the Django backend's UserSerializer.
 */
export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
}

/**
 * Defines the data required for a user to log in.
 * This matches the fields expected by the Simple JWT TokenObtainPairView.
 */
export interface UserCredentials {
  username: string;
  password: string;
}

/**
 * Defines the structure of the successful response from the JWT login endpoint.
 */
export interface AuthTokenResponse {
  access: string;
  refresh: string;
}

/**
 * Defines the structure of an item within the shopping cart.
 * It extends the Product type with a quantity.
 */

export interface CartItem extends Product {
  quantity: number;
}



export interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'Credit Card' | 'Pay on Delivery';
  shippingInfo: ShippingInfo; // <-- ADD THIS LINE
}