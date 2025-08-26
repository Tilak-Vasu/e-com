// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfig';
// Import all necessary types from your single source of truth
import type { UserCredentials, UserRegistrationData, User, AuthTokenResponse } from '../api/types';

// --- THIS IS THE "CONTRACT" ---
// It defines exactly what the useAuth() hook will provide.
interface AuthContextType {
  user: User | null;
  authTokens: AuthTokenResponse | null;
  isAuthenticated: boolean; // <-- THE MISSING PROPERTY IS ADDED
  loginUser: (credentials: UserCredentials) => Promise<void>;
  registerUser: (userData: UserRegistrationData) => Promise<void>;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export default AuthContext;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authTokens, setAuthTokens] = useState<AuthTokenResponse | null>(() =>
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')!) : null
  );
  
  const [user, setUser] = useState<User | null>(() =>
    authTokens ? jwtDecode<User>(authTokens.access) : null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authTokens) {
      setUser(jwtDecode<User>(authTokens.access));
    }
    setLoading(false);
  }, [authTokens]);

  const loginUser = async (credentials: UserCredentials) => {
    const response = await api.post('/token/', credentials);
    if (response.status === 200) {
      const data: AuthTokenResponse = response.data;
      setAuthTokens(data);
      setUser(jwtDecode<User>(data.access));
      localStorage.setItem('authTokens', JSON.stringify(data));
    } else {
      throw new Error('Login Failed');
    }
  };

  const registerUser = async (userData: UserRegistrationData) => {
    await api.post('/register/', userData);
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    window.location.href = '/login';
  };
  
  // --- DERIVE THE isAuthenticated FLAG FROM THE USER STATE ---
  const isAuthenticated = !!user;

  // This value object MUST perfectly match the AuthContextType interface
  const contextData: AuthContextType = {
    user,
    authTokens,
    isAuthenticated, // <-- THE VALUE IS NOW PROVIDED
    loginUser,
    registerUser,
    logoutUser,
  };

  // Render children only after the initial token check is complete
  return <AuthContext.Provider value={contextData}>{!loading && children}</AuthContext.Provider>;
};