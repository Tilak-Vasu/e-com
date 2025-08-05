import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import the component we are testing
import ProductCard from './ProductCard';

// Import the necessary providers that the component still uses
import { CartProvider } from '../../context/CartContext.tsx';
import { LikedProductsProvider } from '../../context/LikedProductsContext.tsx';

// Import the Product type for our mock data
import type { Product } from '../../api/types';

// --- JEST MOCK FOR CLERK ---
// This is the most important part. We are telling Jest that whenever any
// component calls `useUser` from `@clerk/clerk-react`, it should return
// the value we specify in the `mockReturnValue` for each test.
const mockUseUser = jest.fn();
jest.mock('@clerk/clerk-react', () => ({
  useUser: () => mockUseUser(),
}));


// --- MOCK DATA ---
const mockProduct: Product = {
  id: 101,
  name: 'Super Gadget',
  category: 'Testing',
  price: 99.99,
  image: 'test-image.jpg',
};


// --- RENDER HELPER ---
// This helper function wraps our component in the providers it needs.
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Router>
      <LikedProductsProvider>
        <CartProvider>
          {component}
        </CartProvider>
      </LikedProductsProvider>
    </Router>
  );
};


describe('ProductCard Component', () => {

  // This function runs before each test, resetting our mocks.
  beforeEach(() => {
    mockUseUser.mockClear();
  });


  // --- GUEST USER SCENARIO ---
  describe('when user is a guest (not logged in)', () => {
    
    beforeEach(() => {
      // For this block of tests, we make `useUser` return a "signed out" state.
      mockUseUser.mockReturnValue({
        isSignedIn: false,
        user: null,
      });
    });

    it('should render product name, category, and price', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText('Super Gadget')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('should have disabled Like and Add to Cart buttons', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      // We find the buttons by the text the user sees.
      expect(screen.getByRole('button', { name: /Like/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeDisabled();
    });
  });


  // --- LOGGED-IN USER SCENARIO ---
  describe('when user is logged in', () => {

    beforeEach(() => {
      // For this block of tests, we make `useUser` return a "signed in" state.
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: { id: 'user_123', fullName: 'Test User' },
      });
    });

    it('should have enabled Like and Add to Cart buttons', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      expect(screen.getByRole('button', { name: /Like/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeEnabled();
    });

    // You can add more specific tests for the logged-in user here,
    // like checking if the `addToCart` function from the CartContext is called on click.
  });
});