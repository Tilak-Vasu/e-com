// src/api/axiosConfig.ts

import axios from 'axios';

/**
 * Creates a pre-configured instance of Axios.
 * The baseURL is set to point to your Django backend's API endpoint.
 */
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Make sure this matches your backend's address
});

export default api;