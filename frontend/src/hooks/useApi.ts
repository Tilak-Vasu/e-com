// src/hooks/useApi.ts

import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
// We have removed 'useCallback' from this import because it was not being used.
import { useEffect } from 'react';

const useApi = () => {
  const { getToken } = useAuth();

  const api = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api',
  });

  // Using useEffect to set up the interceptor.
  // This is a more stable pattern inside a custom hook.
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Cleanup function to remove the interceptor when the component unmounts
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken, api.interceptors.request]);

  return api;
};

export default useApi;