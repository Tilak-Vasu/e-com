import React from 'react';
import type { Product } from '../../api/types';
import ProductCard from './ProductCard';
import './ProductList.css';

interface ProductListProps {
  products: Product[];
  onLikeToggle: (productId: number, currentLikeStatus: boolean) => void;
  // --- FIX 1: Make the prop optional with a `?` ---
  likedProductIds?: Set<number>;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onLikeToggle,
  // --- FIX 2: Provide a default empty Set if the prop isn't passed ---
  likedProductIds = new Set(),
}) => {
  if (products.length === 0) {
    return <p className="no-products-message">No products found matching your criteria.</p>;
  }

  return (
    <div className="product-list">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onLikeToggle={onLikeToggle}
          // This will now always pass down a valid Set, never undefined
          likedProductIds={likedProductIds}
        />
      ))}
    </div>
  );
};

export default ProductList;