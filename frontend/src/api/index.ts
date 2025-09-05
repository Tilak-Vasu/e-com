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
  Review, // Import the Review type for the new functions
  PolicyDocument,
  ApiChatMessage // <-- IMPORT THE NEW TYPE

} from './types';

// ====================================================================
// --- AUTHENTICATION API FUNCTIONS ---
// ====================================================================
export const fetchBestsellersAPI = (): Promise<AxiosResponse<Product[]>> => {
  return api.get('/products/bestsellers/');
};
export const registerUserAPI = (userData: UserRegistrationData): Promise<AxiosResponse> => {
  return api.post('/register/', userData);
};

export const loginUserAPI = (credentials: UserCredentials): Promise<AxiosResponse> => {
  return api.post('/token/', credentials);
};

// ====================================================================
// --- PRODUCT API FUNCTIONS ---
// ====================================================================
export const generateProductContentAPI = (name: string, category: string): Promise<AxiosResponse<{
  error: string | undefined;
  description?: string;
  seo_keywords?: string;
  data?: {
    description: string;
    seo_keywords: string;
  };
  fallback_used?: boolean;
  message?: string;
  error_details?: string;
}>> => {
  return api.post('/products/generate-content/', { name, category });
};

export const searchProductsByTagsAPI = (query: string): Promise<AxiosResponse<Product[]>> => {
  return api.get(`/products/tag-search/`, { params: { query } });
};

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

export const fetchRecommendationsAPI = (productId: string | number): Promise<AxiosResponse<Product[]>> => {
  return api.get(`/products/${productId}/recommendations/`);
};


export const askChatbotAPI = (query: string): Promise<AxiosResponse<{ response: string }>> => {
  return api.post('/chatbot/', { query });
};



// ====================================================================
// --- NEW: DOCUMENT ASSISTANT API FUNCTIONS ---
// ====================================================================

/**
 * Fetches all uploaded policy documents.
 * Corresponds to: GET /api/documents/
 */
export const fetchDocumentsAPI = (): Promise<AxiosResponse<PolicyDocument[]>> => {
  return api.get('/documents/');
};

/**
 * Uploads a new document file with a title.
 * This requires a FormData object.
 * Corresponds to: POST /api/documents/
 */
export const uploadDocumentAPI = (formData: FormData): Promise<AxiosResponse<PolicyDocument>> => {
  return api.post('/documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Deletes a document by its ID.
 * Corresponds to: DELETE /api/documents/<doc_id>/
 */
export const deleteDocumentAPI = (documentId: number): Promise<AxiosResponse> => {
  return api.delete(`/documents/${documentId}/`);
};

/**
 * (Placeholder for future feature) Asks a question to the document-specific chatbot.
 */
export const askDocumentChatbotAPI = (query: string): Promise<AxiosResponse<{ response: string }>> => {
  // We will build the backend for this endpoint next
  return api.post('/documents/ask/', { query });
};

export const verifyImageAPI = (formData: FormData): Promise<AxiosResponse<{ match: boolean; decision: string }>> => {
  return api.post('/products/verify-image/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


export const askAdminChatbotAPI = (query: string): Promise<AxiosResponse<{ response: string }>> => {
  return api.post('/admin-chatbot/', { query });
};

export const getAdminChatHistoryAPI = (): Promise<AxiosResponse<ApiChatMessage[]>> => {
  return api.get('/admin-chatbot/');
};