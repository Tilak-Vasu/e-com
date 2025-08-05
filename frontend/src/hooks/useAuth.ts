// src/hooks/useAuth.ts

import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * A custom hook to access the AuthContext.
 * It provides a convenient way to get authentication state and functions.
 * @throws Will throw an error if used outside of a component wrapped in AuthProvider.
 * @returns The authentication context.
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    // This error is helpful for debugging. It means you forgot to wrap
    // a component in the AuthProvider.
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;