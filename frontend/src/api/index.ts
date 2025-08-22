// src/api/index.ts

import api from './axiosConfig'; // Your pre-configured axios instance
import type { AxiosResponse } from 'axios';

// Import all the necessary, specific types for type safety
import type { 
  Product, 
  Order, 
  UserCredentials, 
  UserRegistrationData, 
  OrderPayload // This import will now succeed
} from './types';

// ====================================================================
// --- AUTHENTICATION API FUNCTIONS ---
// ====================================================================

export const registerUserAPI = (userData: UserRegistrationData): Promise<AxiosResponse> => {
  return api.post('/register/', userData);
};

export const loginUserAPI = (credentials: UserCredentials): Promise<AxiosResponse> => {
  return api.post('/token/', credentials);
};

// ====================================================================
// --- PRODUCT API FUNCTIONS ---
// ====================================================================

export const fetchProductsAPI = (): Promise<AxiosResponse<Product[]>> => {
  return api.get('/products/');
};

export const fetchLikedProductsAPI = (): Promise<AxiosResponse<Product[]>> => {
  return api.get('/products/liked/');
};

export const toggleLikeProductAPI = (productId: number): Promise<AxiosResponse> => {
  return api.post('/products/like/', { product_id: productId });
};

// ====================================================================
// --- ORDER & PAYMENT API FUNCTIONS ---
// ====================================================================

export const fetchOrderHistoryAPI = (): Promise<AxiosResponse<Order[]>> => {
  return api.get('/orders/');
};

// This function is now correctly typed with OrderPayload
export const createOrderAPI = (orderData: OrderPayload): Promise<AxiosResponse<Order>> => {
  return api.post('/orders/', orderData);
};

export const createPaymentIntentAPI = async (data: { total_amount: number }) => {
  const response = await api.post('/create-payment-intent/', data);
  return response.data; 
};