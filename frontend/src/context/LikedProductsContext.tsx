// src/context/LikedProductsContext.tsx

import React, { createContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Define the shape of the value our context will provide
interface LikedProductsContextType {
  likedProductIds: number[];
  likeProduct: (productId: number) => void;
  unlikeProduct: (productId: number) => void;
  isLiked: (productId: number) => boolean;
}

// Create the context object
const LikedProductsContext = createContext<LikedProductsContextType | null>(null);
export default LikedProductsContext;

// Create the Provider component that will wrap our app
export const LikedProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use our custom hook to manage an array of numbers in localStorage
  const [likedProductIds, setLikedProductIds] = useLocalStorage<number[]>('likedProducts', []);

  // Function to add a product ID to the list
  const likeProduct = (productId: number) => {
    setLikedProductIds(prevIds => {
      if (!prevIds.includes(productId)) {
        return [...prevIds, productId];
      }
      return prevIds; // Return same array if ID already exists
    });
  };

  // Function to remove a product ID from the list
  const unlikeProduct = (productId: number) => {
    setLikedProductIds(prevIds => prevIds.filter(id => id !== productId));
  };

  // Helper function to quickly check if an ID is in the list
  const isLiked = (productId: number): boolean => {
    return likedProductIds.includes(productId);
  };

  // The value object that will be passed down to consuming components
  const value: LikedProductsContextType = {
    likedProductIds,
    likeProduct,
    unlikeProduct,
    isLiked,
  };

  return <LikedProductsContext.Provider value={value}>{children}</LikedProductsContext.Provider>;
};