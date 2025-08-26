// src/api/index.ts

import api from './axiosConfig'; // Your pre-configured axios instance
import type { AxiosResponse } from 'axios';

// Import all the necessary, specific types for type safety
import type {
  Product,
  Order,
  UserCredentials,
  UserRegistrationData,
  OrderPayload,
  Review // Import the Review type for the new functions
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

// --- THIS FUNCTION WAS MISSING ---
/**
 * Fetches the details for a single product by its ID.
 */
export const fetchProductDetailAPI = (productId: string | number): Promise<AxiosResponse<Product>> => {
  return api.get(`/products/${productId}/`);
};

export const fetchLikedProductsAPI = (): Promise<AxiosResponse<Product[]>> => {
  return api.get('/products/liked/');
};

export const toggleLikeProductAPI = (productId: number): Promise<AxiosResponse> => {
  return api.post('/products/like/', { product_id: productId });
};

// ====================================================================
// --- REVIEW API FUNCTIONS (THIS ENTIRE SECTION WAS MISSING) ---
// ====================================================================

/**
 * Fetches all reviews for a specific product.
 * Corresponds to: GET /api/products/<product_id>/reviews/
 */
export const fetchReviewsAPI = (productId: number): Promise<AxiosResponse<Review[]>> => {
  return api.get(`/products/${productId}/reviews/`);
};

/**
 * Creates a new review for a specific product.
 * Corresponds to: POST /api/products/<product_id>/reviews/
 */
export const createReviewAPI = (productId: number, data: { text: string }): Promise<AxiosResponse<Review>> => {
  return api.post(`/products/${productId}/reviews/`, data);
};

/**
 * Updates an existing review by its own ID.
 * Corresponds to: PUT /api/reviews/<review_id>/
 */
export const updateReviewAPI = (reviewId: number, data: { text: string }): Promise<AxiosResponse<Review>> => {
  return api.put(`/reviews/${reviewId}/`, data);
};

/**
 * Deletes a review by its own ID.
 * Corresponds to: DELETE /api/reviews/<review_id>/
 */
export const deleteReviewAPI = (reviewId: number): Promise<AxiosResponse> => {
  return api.delete(`/reviews/${reviewId}/`);
};

// ====================================================================
// --- ORDER & PAYMENT API FUNCTIONS ---
// ====================================================================

export const fetchOrderHistoryAPI = (): Promise<AxiosResponse<Order[]>> => {
  return api.get('/orders/');
};

export const createOrderAPI = (orderData: OrderPayload): Promise<AxiosResponse<Order>> => {
  return api.post('/orders/', orderData);
};

export const createPaymentIntentAPI = async (data: { total_amount: number }) => {
  const response = await api.post('/create-payment-intent/', data);
  return response.data; // Expects a response like { clientSecret: "pi_..." }
};