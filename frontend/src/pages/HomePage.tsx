import React, { useState, useMemo, useEffect, type ChangeEvent } from 'react';

// Hooks and API
import useProducts from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
import { searchProductsByTagsAPI, toggleLikeProductAPI } from '../api';
import type { Product } from '../api/types';

// Assuming your store is in 'store/likedProductsStore'
import { useLikedProductsStore } from '../hooks/likedProductsStore';

// Components
import ProductList from '../components/products/ProductList';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/products/SearchBar';
import Filter from '../components/products/Filter';

// Styles
import './HomePage.css';

const HomePage: React.FC = () => {
  const { products: allProducts, loading: initialLoading, error } = useProducts();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const { likedProductIds, setInitialLikedProducts, likeProduct, unlikeProduct } = useLikedProductsStore();

  // ... (all other state declarations are the same)
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ... (mobile-specific useEffects are the same)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 992);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isMobileFilterOpen && !(event.target as Element).closest('.filter-sidebar, .mobile-filter-toggle')) {
        setIsMobileFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileFilterOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobile && isMobileFilterOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobile, isMobileFilterOpen]);

  
  // --- DATA LOADING AND SEARCH LOGIC ---
  useEffect(() => {
    const performSearchOrLoadAll = async () => {
      setSearchError(null);
      if (debouncedSearchTerm.trim().length > 2) {
        setIsSearching(true);
        try {
          const response = await searchProductsByTagsAPI(debouncedSearchTerm);
          setDisplayedProducts(response.data);
        } catch (err) {
          console.error("AI Tag Search failed:", err);
          setSearchError("Search failed. Showing all available products.");
          setDisplayedProducts(allProducts);
        } finally {
          setIsSearching(false);
        }
      } else {
        setDisplayedProducts(allProducts);
      }
      setCurrentPage(1);
    };

    if (!initialLoading) {
      performSearchOrLoadAll();

      // --- THE FIX ---
      // Only initialize the global store if it's currently empty.
      // This prevents the homepage from overwriting the correct state with
      // stale data when you navigate back to it.
      if (allProducts.length > 0 && likedProductIds.size === 0) {
        setInitialLikedProducts(allProducts);
      }
    }
    // Add likedProductIds to the dependency array because our logic now depends on it
  }, [debouncedSearchTerm, allProducts, initialLoading, setInitialLikedProducts, likedProductIds]);


  // === LIKE HANDLER (NO CHANGES NEEDED HERE) ===
  const handleProductLike = async (productId: number, currentLikeStatus: boolean) => {
    setDisplayedProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, is_liked: !p.is_liked } : p
      )
    );
    if (currentLikeStatus) {
      unlikeProduct(productId);
    } else {
      likeProduct(productId);
    }
    try {
      await toggleLikeProductAPI(productId);
    } catch (err) {
      console.error("Failed to update like status on the server:", err);
      alert("There was an error updating your like. Please try again.");
      setDisplayedProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? { ...p, is_liked: currentLikeStatus } : p
        )
      );
      if (currentLikeStatus) {
        likeProduct(productId);
      } else {
        unlikeProduct(productId);
      }
    }
  };

  // ... (The rest of the component remains exactly the same)
  const categories = useMemo(() => {
    const allCategories = allProducts.map(p => p.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return displayedProducts.filter(product => {
      const price = parseFloat(product.price);
      const minPrice = priceRange.min ? Number(priceRange.min) : 0;
      const maxPrice = priceRange.max ? Number(priceRange.max) : Infinity;
      const matchesPrice = price >= minPrice && price <= maxPrice;
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesPrice && matchesCategory;
    });
  }, [displayedProducts, priceRange, selectedCategory]);

  const currentProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value);
  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPriceRange(prev => ({ ...prev, [event.target.name]: event.target.value }));
    setCurrentPage(1);
  };
  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };
  const handleApplyFilter = () => { if (isMobile) setIsMobileFilterOpen(false); };

  const isLoading = initialLoading || isSearching;
  
  if (error && !initialLoading && allProducts.length === 0) {
    return <div className="page-status error-message">{error}</div>;
  }

  return (
    <>
      <aside className={`filter-sidebar ${isMobile && isMobileFilterOpen ? 'mobile-open' : ''}`}>
        <Filter
          priceRange={priceRange} onPriceChange={handlePriceChange} onApplyFilter={handleApplyFilter}
          categories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange}
        />
      </aside>
      <div className="home-page-layout">
        <main className="product-content">
          <div className="product-wrapper">
            <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
            {searchError && <div className="search-error-message">{searchError}</div>}
            {isLoading ? (
              <div className="page-status">{isSearching ? 'Searching products...' : 'Loading products...'}</div>
            ) : filteredProducts.length > 0 ? (
              <>
                <ProductList products={currentProducts} onLikeToggle={handleProductLike} likedProductIds={likedProductIds} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
              </>
            ) : (
              <div className="page-status">
                <h3>No products found</h3>
                <p>{searchTerm ? `We couldn't find any products matching "${searchTerm}". Try different keywords.` : 'There are no products to display at the moment.'}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default HomePage;