// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { loginUser as apiLogin } from '../api';
import type { UserCredentials, AuthTokenResponse } from '../api/types';
import { jwtDecode } from 'jwt-decode';

// This interface defines the shape of the user object we expect from the JWT token
interface User {
  user_id: number;
  username: string;
  exp: number;
}

// This interface defines all the values the context will provide
interface AuthContextType {
  user: User | null;
  authTokens: AuthTokenResponse | null;
  loginUser: (credentials: UserCredentials) => Promise<void>;
  logoutUser: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
export default AuthContext;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authTokens, setAuthTokens] = useState<AuthTokenResponse | null>(() => {
    // On initial load, try to get tokens from localStorage
    const tokens = localStorage.getItem('authTokens');
    return tokens ? JSON.parse(tokens) : null;
  });

  const [user, setUser] = useState<User | null>(() => {
    // If tokens exist on load, decode them to get user info immediately
    if (authTokens) {
      return jwtDecode<User>(authTokens.access);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loginUser = async (credentials: UserCredentials) => {
    try {
      const response = await apiLogin(credentials);

      // DEBUG CHECK #1: See if the API call is successful and what it returns.
      // Uncomment the line below, then try to log in.
      // console.log('DEBUG 1: Login API Response:', response.data);

      if (response.status === 200) {
        const data: AuthTokenResponse = response.data;
        
        // Decode the token to get the user's payload
        const decodedUser = jwtDecode<User>(data.access);

        // DEBUG CHECK #2: See if the decoded token contains the correct user info.
        // Uncomment the line below, then try to log in.
        // console.log('DEBUG 2: Decoded User from Token:', decodedUser);

        // Set state to trigger a re-render throughout the app
        setAuthTokens(data);
        setUser(decodedUser);
        
        // Persist the tokens in localStorage
        localStorage.setItem('authTokens', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
      // Re-throw the error so the LoginPage can catch it and show a message
      throw error;
    }
  };

  const logoutUser = () => {
    // Clear all auth state and remove from localStorage
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
  };

  useEffect(() => {
    // This effect runs once on initial load. In a production app, you might
    // add logic here to verify the token with the backend. For now, we just stop loading.
    setIsLoading(false);
  }, []);

  const contextData: AuthContextType = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextData}>
      {/* Don't render children until we've checked for tokens from localStorage */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};