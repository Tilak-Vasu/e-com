// src/pages/HomePage.tsx

import React, { useState, useMemo, type ChangeEvent } from 'react';
import useProducts from '../hooks/useProducts';
import ProductList from '../components/products/ProductList';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/products/SearchBar';
import Filter from '../components/products/Filter'; // We will update this component
import './HomePage.css';

const HomePage: React.FC = () => {
  const { products, loading } = useProducts();

  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // NEW: State for the selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [activeFilters, setActiveFilters] = useState({
    min: 0,
    max: Infinity,
    category: 'all',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8; // UPDATED: Changed from 10 to 9

  // --- DATA PROCESSING & FILTERING ---

  // Get a unique list of all categories from the product data
  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [products]);

  // Updated filtering logic to include category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = product.price >= activeFilters.min && product.price <= activeFilters.max;
      // Add a check for the category
      const matchesCategory = activeFilters.category === 'all' || product.category === activeFilters.category;
      return matchesSearch && matchesPrice && matchesCategory;
    });
  }, [products, searchTerm, activeFilters]);

  // Pagination logic remains the same
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // --- EVENT HANDLERS ---
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPriceRange(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };
  
  // NEW: Handler for when a category is selected
  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedCategory(event.target.value);
  };

  const handleApplyFilter = () => {
    setActiveFilters({
      min: priceRange.min ? Number(priceRange.min) : 0,
      max: priceRange.max ? Number(priceRange.max) : Infinity,
      category: selectedCategory, // Apply the selected category
    });
    setCurrentPage(1);
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return <div className="page-status">Loading products...</div>;
  }

  return (
    // This container div will enforce the max-width and central padding
    // <div className="container">
      <div className="home-page-layout">
        <aside className="filter-sidebar">
          <Filter
            priceRange={priceRange}
            onPriceChange={handlePriceChange}
            onApplyFilter={handleApplyFilter}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </aside>

        <main className="product-content">
  <div className="product-wrapper">
    <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />

    {filteredProducts.length > 0 ? (
      <>
        <ProductList products={currentProducts} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </>
    ) : (
      <div className="page-status">
        <h3>No products found</h3>
        <p>Try adjusting your search or filter settings.</p>
      </div>
    )}
  </div>
</main>
      </div>
    
  );
};

export default HomePage;