// src/components/layout/Footer.test.tsx

import { render, screen } from '@testing-library/react';
import Footer from './Footer';

// `describe` groups related tests together
describe('Footer Component', () => {

  // `it` or `test` defines a single test case
  it('should render the correct copyright text', () => {
    // 1. Arrange: Render the component into a virtual DOM
    render(<Footer />);

    // 2. Act & Assert: Find the element and check its content
    // We look for the text that the user would see on the screen.
    const copyrightText = screen.getByText(/© \d{4} E-Shop. All Rights Reserved./i);
    
    // `expect` is the assertion. Is the element we found actually in the document?
    expect(copyrightText).toBeInTheDocument();
  });
});