import React, { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import useProducts from '../hooks/useProducts';
import ProductList from '../components/products/ProductList';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/products/SearchBar';
import Filter from '../components/products/Filter';
import './HomePage.css';

const HomePage: React.FC = () => {
  // ✅ Destructure the new context value: `fetchProducts` and `error`
  const { products, loading, error, fetchProducts } = useProducts();

  // --- STATE MANAGEMENT ---
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState({
    min: 0,
    max: Infinity,
    category: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const productsPerPage = 8;

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isMobileFilterOpen) {
        const target = event.target as Element;
        if (!target.closest('.filter-sidebar') && !target.closest('.mobile-filter-toggle')) {
          setIsMobileFilterOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileFilterOpen]);

  // Prevent body scroll when mobile filter is open
  useEffect(() => {
    if (isMobile && isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isMobileFilterOpen]);

  // --- DATA PROCESSING & FILTERING ---
  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = product.price >= activeFilters.min && product.price <= activeFilters.max;
      const matchesCategory = activeFilters.category === 'all' || product.category === activeFilters.category;
      return matchesSearch && matchesPrice && matchesCategory;
    });
  }, [products, searchTerm, activeFilters]);

  // Pagination logic
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

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
  };

  const handleApplyFilter = () => {
    setActiveFilters({
      min: priceRange.min ? Number(priceRange.min) : 0,
      max: priceRange.max ? Number(priceRange.max) : Infinity,
      category: selectedCategory,
    });
    setCurrentPage(1);

    if (isMobile) {
      setIsMobileFilterOpen(false);
    }
  };

  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
  };
  
  // ✅ Use the new `fetchProducts` function for refreshing the list
  const handleLikeToggle = async () => {
    await fetchProducts(); 
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return <div className="page-status">Loading products...</div>;
  }
  
  // ✅ Handle the error state from the context
  if (error) {
    return <div className="page-status error-message">{error}</div>;
  }

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      {isMobile && (
        <button
          className={`mobile-filter-toggle ${isMobileFilterOpen ? 'active' : ''}`}
          onClick={toggleMobileFilter}
        >
          {isMobileFilterOpen ? '✕ Close Filters' : '⚙️ Show Filters'}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileFilterOpen && (
        <div
          className="mobile-filter-overlay"
          onClick={() => setIsMobileFilterOpen(false)}
        />
      )}

      {/* Filter Sidebar */}
      <aside className={`filter-sidebar ${isMobile && isMobileFilterOpen ? 'mobile-open' : ''}`}>
        <Filter
          priceRange={priceRange}
          onPriceChange={handlePriceChange}
          onApplyFilter={handleApplyFilter}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </aside>

      {/* Main Content */}
      <div className="home-page-layout">
        <main className="product-content">
          <div className="product-wrapper">
            <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />

            {filteredProducts.length > 0 ? (
              <>
                <ProductList
                  products={currentProducts}
                  onLikeToggle={handleLikeToggle} // ✅ Pass the updated handler
                />
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
    </>
  );
};

export default HomePage;