// src/api/index.ts

import api from './axiosConfig';
import type { AxiosResponse } from 'axios';

// Import the types we defined
import type {
  UserRegistrationData,
  UserCredentials,
  AuthTokenResponse
} from './types';


// === AUTHENTICATION ENDPOINTS ===

/**
 * Sends a POST request to register a new user.
 * @param userData - The user's registration details (username, email, password).
 * @returns A promise that resolves with the Axios response.
 */
export const registerUser = (userData: UserRegistrationData): Promise<AxiosResponse> => {
  return api.post('/auth/register/', userData);
};

/**
 * Sends a POST request to log in a user and get authentication tokens.
 * @param credentials - The user's login credentials (username, password).
 * @returns A promise that resolves with the authentication tokens.
 */
export const loginUser = (credentials: UserCredentials): Promise<AxiosResponse<AuthTokenResponse>> => {
  return api.post('/auth/token/', credentials);
};

/**
 * Note: A function to refresh the access token using the refresh token would also go here.
 * This is an important part of a full production application.
 */