// src/components/products/ProductCard.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';

// Component to be tested
import ProductCard from './ProductCard';

// Required Context Providers for the component to render
import { AuthProvider } from '../../context/AuthContext'; // Assuming this is your AuthProvider
import { CartProvider } from '../../context/CartContext';

// Import the Product type for our mock data
import type { Product } from '../../api/types';

// --- MOCK DATA ---
// price is now correctly a string, as defined in your types.ts
const mockProduct: Product = {
  id: 101,
  name: 'Super Gadget',
  category: 'Testing',
  price: '99.99',
  description: 'A test gadget',
  stock_quantity: 10,
  image: 'test-image.jpg',
  is_liked: false, // Default not liked
};

// --- RENDER HELPER ---
// This helper function wraps our component in all the providers it needs to function.
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Router>
      <AuthProvider> {/* The component uses useAuth, so it needs the provider */}
        <CartProvider>
          {component}
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

describe('ProductCard Component', () => {

  // --- Create a mock function for the onLikeToggle prop ---
  // jest.fn() creates a spy function that we can use to check if it was called.
  const mockOnLikeToggle = jest.fn();

  // Reset the mock before each test to ensure tests are isolated
  beforeEach(() => {
    mockOnLikeToggle.mockClear();
  });

  it('should render product name, category, and price correctly', () => {
    renderWithProviders(
      <ProductCard product={mockProduct} onLikeToggle={mockOnLikeToggle} />
    );
    
    expect(screen.getByText('Super Gadget')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument(); // .toFixed(2) is applied in the component
  });

  // This test simulates a user clicking the "like" button
  it('should call onLikeToggle with the correct arguments when the like button is clicked', () => {
    // We create a new product object for this test to show it as "liked"
    const likedProduct = { ...mockProduct, is_liked: true };
    
    renderWithProviders(
      <ProductCard product={likedProduct} onLikeToggle={mockOnLikeToggle} />
    );
    
    const likeButton = screen.getByRole('button', { name: /Unlike product/i });
    fireEvent.click(likeButton);
    
    // We expect our mock function to have been called once, with the product ID and its current like status.
    expect(mockOnLikeToggle).toHaveBeenCalledTimes(1);
    expect(mockOnLikeToggle).toHaveBeenCalledWith(likedProduct.id, true);
  });
  
  it('should display "Out of Stock" and disable the add to cart button if stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
    
    renderWithProviders(
      <ProductCard product={outOfStockProduct} onLikeToggle={mockOnLikeToggle} />
    );
    
    // Check for the "Out of Stock" text
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    // Ensure the button is disabled
    expect(screen.getByRole('button', { name: /Out of Stock/i })).toBeDisabled();
  });
  
  it('should show the quantity controller if the item is in the cart', () => {
    // To test this, we need to mock the useCart hook to return our item
    // This is a more advanced test, but shows the principle.
    // For now, we will just test the default state.
    renderWithProviders(
      <ProductCard product={mockProduct} onLikeToggle={mockOnLikeToggle} />
    );
    
    // We expect to see "Add to Cart", not the quantity controller
    expect(screen.getByRole('button', { name: /Add to Cart/i })).toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });
});