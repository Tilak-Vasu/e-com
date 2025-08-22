import React from 'react';
import type { Product } from '../../api/types';
import ProductCard from './ProductCard';
import './ProductList.css';

interface ProductListProps {
  products: Product[];
  onLikeToggle: () => void; // ✅ callback from parent to refresh products
}

const ProductList: React.FC<ProductListProps> = ({ products, onLikeToggle }) => {
  if (products.length === 0) {
    return <p className="no-products-message">No products found matching your criteria.</p>;
  }

  return (
    <div className="product-list">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onLikeToggle={onLikeToggle} // ✅ forward to ProductCard
        />
      ))}
    </div>
  );
};

export default ProductList;
