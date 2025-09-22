// src/api/axiosConfig.ts

import axios from 'axios';

// Create a pre-configured instance of Axios
const api = axios.create({
  // [# 1. THIS IS THE ONLY CHANGE NEEDED]
  // Use the environment variable to set the base URL.
  // This single line works for both local development and production.
  // The value of the variable itself will change depending on the environment.
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// [# 2. THIS INTERCEPTOR IS ALREADY PERFECT]
// This "interceptor" runs before every single request is sent.
// No changes are needed here.
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