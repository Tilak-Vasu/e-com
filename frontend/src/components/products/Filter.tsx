// src/components/products/Filter.tsx

import React from 'react';
import './Filter.css';

// Define the shape of the component's props
interface PriceRange {
  min: string;
  max: string;
}

interface FilterProps {
  priceRange: PriceRange;
  onPriceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyFilter: () => void;
  // NEW: Add props for categories
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Filter: React.FC<FilterProps> = ({
  priceRange,
  onPriceChange,
  onApplyFilter,
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="filter-container">
      {/* Category Filter */}
      <div className="filter-group">
        <h4>Category</h4>
        <select
          className="category-select"
          value={selectedCategory}
          onChange={onCategoryChange}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {/* Capitalize the first letter for display */}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Price Filter */}
      <div className="filter-group">
        <h4>Filter by Price</h4>
        <div className="price-inputs">
          <input
            type="number"
            name="min"
            placeholder="Min"
            value={priceRange.min}
            onChange={onPriceChange}
            min="0"
          />
          <input
            type="number"
            name="max"
            placeholder="Max"
            value={priceRange.max}
            onChange={onPriceChange}
            min="0"
          />
        </div>
      </div>
      
      <button onClick={onApplyFilter} className="apply-filter-btn">
        Apply Filters
      </button>
    </div>
  );
};

export default Filter;