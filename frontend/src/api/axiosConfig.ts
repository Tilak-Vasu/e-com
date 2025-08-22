// src/api/axiosConfig.ts

import axios from 'axios';

// Create a pre-configured instance of Axios
const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api',
});

// --- THIS IS THE MOST IMPORTANT PART ---
// This "interceptor" runs before every single request is sent.
api.interceptors.request.use(
  (config) => {
    // 1. Get the authentication tokens from localStorage.
    const tokens = localStorage.getItem('authTokens');
    
    if (tokens) {
      // 2. If tokens exist, parse them to get the access token.
      const accessToken = JSON.parse(tokens).access;
      // 3. Add the access token to the 'Authorization' header.
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // 4. Return the modified request configuration.
    return config;
  },
  (error) => {
    // Handle any errors during the request setup
    return Promise.reject(error);
  }
);

export default api;