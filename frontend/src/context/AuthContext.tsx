// import React, { createContext, useState, useEffect, type ReactNode } from 'react';
// import { jwtDecode } from 'jwt-decode';
// import api from '../api/axiosConfig'; // Assuming this sets the base URL to /api
// import type { UserCredentials } from '../api/types';

// interface AuthTokenResponse {
//   access: string;
//   refresh: string;
// }

// interface User {
//   user_id: number;
//   username: string;
// }

// interface AuthContextType {
//   user: User | null;
//   authTokens: AuthTokenResponse | null;
//   loginUser: (credentials: UserCredentials) => Promise<void>;
//   registerUser: (userData: any) => Promise<void>;
//   logoutUser: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);
// export default AuthContext;

// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [authTokens, setAuthTokens] = useState<AuthTokenResponse | null>(() =>
//     localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')!) : null
//   );
  
//   const [user, setUser] = useState<User | null>(() =>
//     authTokens ? jwtDecode<User>(authTokens.access) : null
//   );

//   const loginUser = async (credentials: UserCredentials) => {
//     // --- FIX #1: Corrected the URL path to match urls.py ---
//     const response = await api.post('/token/', credentials);
    
//     if (response.status === 200) {
//       const data: AuthTokenResponse = response.data;
//       setAuthTokens(data);
//       setUser(jwtDecode<User>(data.access));
//       localStorage.setItem('authTokens', JSON.stringify(data));
//     } else {
//       throw new Error('Login Failed');
//     }
//   };

//   const registerUser = async (userData: any) => {
//     // --- FIX #2: Corrected the URL path to match urls.py ---
//     await api.post('/register/', userData);
//   };

//   const logoutUser = () => {
//     setAuthTokens(null);
//     setUser(null);
//     localStorage.removeItem('authTokens');
//     localStorage.removeItem('shoppingCart');
//     localStorage.removeItem('likedProducts');
    
//     window.location.href = '/login';
//   };

//   const contextData = {
//     user,
//     authTokens,
//     loginUser,
//     registerUser,
//     logoutUser,
//   };

//   return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>;
// };


// contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfig';
import type { UserCredentials } from '../api/types';

interface AuthTokenResponse {
  access: string;
  refresh: string;
}

// --- UPDATE THIS INTERFACE ---
interface User {
  user_id: number;
  username: string;
  is_staff: boolean; // <-- ADD THIS PROPERTY
}

interface AuthContextType {
  user: User | null;
  authTokens: AuthTokenResponse | null;
  loginUser: (credentials: UserCredentials) => Promise<void>;
  registerUser: (userData: any) => Promise<void>;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export default AuthContext;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authTokens, setAuthTokens] = useState<AuthTokenResponse | null>(() =>
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')!) : null
  );
  
  // jwt-decode will now automatically extract 'is_staff' into the user object
  const [user, setUser] = useState<User | null>(() =>
    authTokens ? jwtDecode<User>(authTokens.access) : null
  );

  const loginUser = async (credentials: UserCredentials) => {
    const response = await api.post('/token/', credentials);
    
    if (response.status === 200) {
      const data: AuthTokenResponse = response.data;
      setAuthTokens(data);
      setUser(jwtDecode<User>(data.access)); // This will now include is_staff
      localStorage.setItem('authTokens', JSON.stringify(data));
    } else {
      throw new Error('Login Failed');
    }
  };

  const registerUser = async (userData: any) => {
    await api.post('/register/', userData);
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('shoppingCart');
    localStorage.removeItem('likedProducts');
    window.location.href = '/login';
  };

  const contextData = {
    user,
    authTokens,
    loginUser,
    registerUser,
    logoutUser,
  };

  return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>;
};