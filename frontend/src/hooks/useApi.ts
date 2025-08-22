// src/hooks/useApi.ts
import axios from 'axios';
import { useAuth } from './useAuth'; // Your custom auth hook
import { useMemo } from 'react';

const useApi = () => {
  const { authTokens } = useAuth();

  const api = useMemo(() => {
    const axiosInstance = axios.create({
      baseURL: import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api',
    });

    axiosInstance.interceptors.request.use(
      (config) => {
        // If we have an access token, add it to the Authorization header
        if (authTokens?.access) {
          config.headers.Authorization = `Bearer ${authTokens.access}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return axiosInstance;
  }, [authTokens]); // Re-create the instance only if tokens change

  return api;
};

export default useApi;