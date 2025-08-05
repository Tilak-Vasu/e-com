import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react'; // Clerk's hook for auth status

// Your custom hooks
import useProducts from '../hooks/useProducts';
import useCart from '../hooks/useCart';

// Reusable components and assets
import NotFoundPage from './NotFoundPage';
import Button from '../components/common/Button';
import productImage from '../assets/images/product-placeholder.webp'; // Using the optimized thumbnail is fine here too
import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
  // 1. Get the product ID from the URL (e.g., "/product/101")
  const { productId } = useParams<{ productId: string }>();
  
  // 2. Get data from your contexts using custom hooks
  const { products, loading } = useProducts();
  const { addToCart } = useCart();
  const { isSignedIn } = useUser(); // Get authentication status from Clerk

  // 3. Handle the loading state while products are being fetched
  if (loading) {
    return <div className="page-status">Loading product details...</div>;
  }

  // 4. Find the specific product that matches the ID from the URL
  //    We convert productId to a Number for a strict comparison (===)
  const product = products.find(p => p.id === Number(productId));

  // 5. If no product with that ID exists, show the 404 page
  if (!product) {
    return <NotFoundPage />;
  }
  
  const handleAddToCart = () => {
    if (!isSignedIn) {
        alert('Please sign in to add items to your cart.');
        return;
    }
    addToCart(product);
    alert(`${product.name} has been added to your cart!`);
  };

  // 6. Render the final page with all the product details
  return (
    <div className="product-detail-page">
      <Link to="/" className="back-link">← Back to all products</Link>
      
      <div className="detail-layout">
        <div className="product-detail-image">
          <img src={productImage} alt={product.name} />
        </div>

        <div className="product-detail-info">
          <span className="product-category-detail">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-price-detail">${product.price.toFixed(2)}</p>
          <p className="product-description">
            This is a placeholder description for the product. In a real-world application, this detailed information would be fetched from the backend API along with other product data, providing key features, materials, and benefits to the customer.
          </p>
          <div className="detail-actions">
            <Button onClick={handleAddToCart} disabled={!isSignedIn}>
              Add to Cart
            </Button>
            {!isSignedIn && (
              <p className="auth-prompt">
                Please <Link to="/login">sign in</Link> to purchase.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;