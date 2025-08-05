import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api',
});

// This is an interceptor that runs BEFORE each request is sent
api.interceptors.request.use(async (config) => {
  // We are getting the getToken function from Clerk's auth hook
  const { getToken } = useAuth();
  
  // Get the token. Clerk's SDK handles refreshing it if it's expired.
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;