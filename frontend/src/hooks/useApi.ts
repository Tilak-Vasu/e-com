import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

const useApi = () => {
  const { getToken } = useAuth();

  const api = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api',
  });

  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
};

export default useApi;