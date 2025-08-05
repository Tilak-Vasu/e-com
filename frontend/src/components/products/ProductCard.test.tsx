import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';

// Import the component we are testing
import ProductCard from './ProductCard';

// Import all necessary contexts and providers
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import LikedProductsContext from '../../context/LikedProductsContext';
import type { Product } from '../../api/types'; // Import the Product type

// --- MOCK DATA AND TYPES ---

// A mock product to use in our tests, typed correctly
const mockProduct: Product = {
  id: 101,
  name: 'Super Gadget',
  category: 'Testing',
  price: 99.99,
  image: 'test-image.jpg',
};

// Define the shape of our context values for TypeScript
interface AuthContextType {
  user: { user_id: number; username: string; exp: number } | null;
  // Add other properties if your component uses them
}
interface LikedProductsContextType {
  isLiked: (id: number) => boolean;
  likeProduct: jest.Mock;
  unlikeProduct: jest.Mock;
}
interface CartContextType {
  cartItems: any[];
  addToCart: jest.Mock;
  decreaseQuantity: jest.Mock;
}

// --- RENDER HELPER ---

// A custom render function to wrap our component in the necessary providers
const renderWithProviders = (
  component: React.ReactElement, 
  authValue: AuthContextType, 
  likedValue: LikedProductsContextType, 
  cartValue: CartContextType
) => {
  return render(
    <Router>
      <AuthContext.Provider value={authValue as any}>
        <LikedProductsContext.Provider value={likedValue as any}>
          <CartContext.Provider value={cartValue as any}>
            {component}
          </CartContext.Provider>
        </LikedProductsContext.Provider>
      </AuthContext.Provider>
    </Router>
  );
};


describe('ProductCard Component', () => {

  // --- GUEST USER SCENARIO ---
  describe('when user is a guest (not logged in)', () => {
    
    // Define the mock context values for a guest
    const guestAuthContext = { user: null };
    const guestLikedContext = { isLiked: () => false, likeProduct: jest.fn(), unlikeProduct: jest.fn() };
    const guestCartContext = { cartItems: [], addToCart: jest.fn(), decreaseQuantity: jest.fn() };

    it('should render product details correctly', () => {
      renderWithProviders(
        <ProductCard product={mockProduct} />, 
        guestAuthContext, 
        guestLikedContext, 
        guestCartContext
      );
      expect(screen.getByText('Super Gadget')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('should have disabled Like and Add to Cart buttons', () => {
      renderWithProviders(
        <ProductCard product={mockProduct} />, 
        guestAuthContext, 
        guestLikedContext, 
        guestCartContext
      );
      expect(screen.getByRole('button', { name: /Like/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeDisabled();
    });
  });

  // --- LOGGED-IN USER SCENARIO ---
  describe('when user is logged in', () => {

    // Define the mock context values for a logged-in user
    const loggedInUser = { user_id: 1, username: 'testuser', exp: 9999999999 };
    const loggedInAuthContext = { user: loggedInUser };
    const loggedInLikedContext = { isLiked: () => false, likeProduct: jest.fn(), unlikeProduct: jest.fn() };

    it('should have enabled Like and Add to Cart buttons', () => {
      const loggedInCartContext = { cartItems: [], addToCart: jest.fn(), decreaseQuantity: jest.fn() };
      renderWithProviders(
        <ProductCard product={mockProduct} />, 
        loggedInAuthContext, 
        loggedInLikedContext, 
        loggedInCartContext
      );
      expect(screen.getByRole('button', { name: /Like/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeEnabled();
    });

    it('should call addToCart when "Add to Cart" is clicked', () => {
      // Create a mock function specifically for this test
      const mockAddToCart = jest.fn();
      const loggedInCartContext = { 
        cartItems: [], 
        addToCart: mockAddToCart, // Use our specific mock
        decreaseQuantity: jest.fn() 
      };

      renderWithProviders(
        <ProductCard product={mockProduct} />, 
        loggedInAuthContext, 
        loggedInLikedContext, 
        loggedInCartContext
      );

      const addToCartButton = screen.getByRole('button', { name: /Add to Cart/i });
      fireEvent.click(addToCartButton);
      
      expect(mockAddToCart).toHaveBeenCalledTimes(1);
      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
    });
  });
});