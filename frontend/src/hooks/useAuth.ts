// src/hooks/useAuth.ts
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * A custom hook to safely access the AuthContext for our Django JWT auth.
 * @throws Will throw an error if used outside of a component wrapped in AuthProvider.
 * @returns The authentication context.
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export { useAuth }; // Using a named export