import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { useProducts } from '../context/ProductContext'; // <-- 1. IMPORT THE GLOBAL PRODUCT HOOK
import ProductFormModal from '../components/admin/ProductFormModal';
import { Edit, Trash2 } from 'lucide-react';
import './AdminProductManagementPage.css';
import placeholderImage from '../assets/images/product-placeholder.webp';
// import { type AxiosResponse } from 'axios';
import { type Product } from '../api/types'; // Import the shared Product type

const AdminProductManagementPage: React.FC = () => {
  // --- 2. GET PRODUCTS AND REFRESH FUNCTION FROM THE GLOBAL CONTEXT ---
  const { products, loading, error, fetchProducts } = useProducts();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Local error state for form-specific errors
  const [formError, setFormError] = useState<string | null>(null);

  const api = useApi();

  // --- 3. REMOVE THE LOCAL PRODUCT FETCH ---
  // The ProductContext already handles this for us.
  // We only need to fetch categories locally for the form.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await api.get('/categories/');
        setCategories(categoriesResponse.data);
      } catch (err) {
        setFormError('Failed to fetch categories.');
        console.error("Fetch Categories Error:", err);
      }
    };
    fetchCategories();
  }, []); // The api dependency is removed as useApi handles memoization

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // --- 4. THE CORRECTED AND SIMPLIFIED SUBMIT FUNCTION ---

  // Updated handleFormSubmit with better error handling and no manual Content-Type header
const handleFormSubmit = async (formData: FormData) => {
  setFormError(null);
  
  // Debug: Log the FormData contents
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(key, ':', value);
  }
  
  try {
    let response;
    if (editingProduct) {
      console.log(`Updating product ${editingProduct.id}`);
      // DON'T set Content-Type header manually - let axios handle it for FormData
      response = await api.put(`/products/${editingProduct.id}/`, formData);
    } else {
      console.log('Creating new product');
      // DON'T set Content-Type header manually - let axios handle it for FormData
      response = await api.post('/products/', formData);
    }
    
    console.log('API Response:', response);
    
    // Refresh the products list
    await fetchProducts();
    handleCloseModal();

  } catch (err: any) {
    // Enhanced error logging
    console.error("Form Submit Error:", err);
    console.error("Error response:", err.response?.data);
    console.error("Error status:", err.response?.status);
    
    // More specific error messages based on common issues
    if (err.response?.status === 400) {
      const errorData = err.response.data;
      if (typeof errorData === 'object') {
        // Format validation errors nicely
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          })
          .join('\n');
        setFormError(`Validation errors:\n${errorMessages}`);
      } else {
        setFormError(`Validation Error: ${errorData}`);
      }
    } else if (err.response?.status === 401) {
      setFormError('Authentication failed. Please log in again.');
    } else if (err.response?.status === 403) {
      setFormError('Permission denied. You may not have admin privileges.');
    } else if (err.response?.status === 413) {
      setFormError('File too large. Please select a smaller image.');
    } else if (err.response?.status === 415) {
      setFormError('Unsupported file type. Please select a valid image.');
    } else if (err.response?.status === 500) {
      setFormError('Server error. Please try again later.');
    } else {
      setFormError(`Failed to save product: ${err.message || 'Unknown error'}`);
    }
  }
};

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}/`);
        // Tell the ProductContext to refresh its list after a delete.
        await fetchProducts();
      } catch (err) {
        setFormError('Failed to delete product.');
        console.error("Delete Product Error:", err);
      }
    }
  };

  // Use the loading and error state from the global context
  if (loading) return <div className="loading-spinner">Loading Products...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-product-management">
      <header className="page-header">
        <h1>Manage Products</h1>
        <button onClick={handleOpenAddModal} className="add-new-product-btn">
          + Add New Product
        </button>
      </header>
      
      {/* Display form-specific errors here */}
      {formError && <div className="error-message">{formError}</div>}
      
      <div className="product-list-table">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map(product => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.image || placeholderImage} 
                      alt={product.name} 
                      className="product-table-image"
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td>{product.stock_quantity}</td>
                  <td>
                    <div className="product-actions">
                      <button onClick={() => handleOpenEditModal(product)} className="btn-edit">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="btn-delete">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-products-message">a
                  No products found. Click "Add New Product" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        productToEdit={editingProduct}
        categories={categories}
      />
    </div>
  );
};

export default AdminProductManagementPage;