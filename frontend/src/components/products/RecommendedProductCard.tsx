// src/components/products/RecommendedProductCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../api/types';
import placeholderImage from '../../assets/images/product-placeholder.webp';
import './RecommendedProductCard.css'; // We'll create this next

interface RecCardProps {
  product: Product;
}

const RecommendedProductCard: React.FC<RecCardProps> = ({ product }) => {
  return (
    <Link to={`/products/${product.id}`} className="rec-product-card">
      <div className="rec-image-wrapper">
        <img
          src={product.image || placeholderImage}
          alt={product.name}
          className="rec-product-image"
        />
      </div>
      <div className="rec-product-info">
        <p className="rec-product-category">{product.category}</p>
        <h4 className="rec-product-name">{product.name}</h4>
        <p className="rec-product-price">${Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  );
};

export default RecommendedProductCard;