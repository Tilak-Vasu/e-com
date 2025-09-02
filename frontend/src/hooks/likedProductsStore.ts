import { create } from 'zustand';
import type { Product } from '../api/types';

// Define the shape of the store's state
interface LikedProductsStoreState {
  likedProductIds: Set<number>;
  setInitialLikedProducts: (products: Product[]) => void;
  likeProduct: (productId: number) => void;
  unlikeProduct: (productId: number) => void;
  clearLikedProducts: () => void;
}

// Create the store
export const useLikedProductsStore = create<LikedProductsStoreState>((set) => ({
  // Initial state is an empty Set
  likedProductIds: new Set(),

  // Action to populate the store on initial load
  setInitialLikedProducts: (products) => {
    const initialLikedIds = new Set(
      products.filter(p => p.is_liked).map(p => p.id)
    );
    set({ likedProductIds: initialLikedIds });
  },

  // Action to add a liked product ID
  likeProduct: (productId) =>
    set((state) => {
      const newLikedIds = new Set(state.likedProductIds);
      newLikedIds.add(productId);
      return { likedProductIds: newLikedIds };
    }),

  // Action to remove a liked product ID
  unlikeProduct: (productId) =>
    set((state) => {
      const newLikedIds = new Set(state.likedProductIds);
      newLikedIds.delete(productId);
      return { likedProductIds: newLikedIds };
    }),
    
  // Action to clear the store (e.g., on logout)
  clearLikedProducts: () => set({ likedProductIds: new Set() }),
}));