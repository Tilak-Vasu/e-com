// src/pages/AdminProductManagementPage.tsx

import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { useProducts } from '../context/ProductContext';
import ProductFormModal from '../components/admin/ProductFormModal';
import { Edit, Trash2 } from 'lucide-react';
import './AdminProductManagementPage.css';
import placeholderImage from '../assets/images/product-placeholder.webp';
import { type Product } from '../api/types';

const AdminProductManagementPage: React.FC = () => {
  const { products, loading, error, fetchProducts } = useProducts();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const api = useApi();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await api.get('/categories/');
        setCategories(categoriesResponse.data.sort());
      } catch (err) {
        setFormError('Failed to fetch categories.');
        console.error("Fetch Categories Error:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- NEW: A function to handle adding a new category to the master list ---
  const handleCategoryAdded = (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories(prevCategories => [...prevCategories, newCategory].sort());
    }
  };

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

  const handleFormSubmit = async (formData: FormData) => {
    setFormError(null);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}/`, formData);
      } else {
        await api.post('/products/', formData);
      }
      await fetchProducts();
      handleCloseModal();
    } catch (err: any) {
      console.error("Form Submit Error:", err);
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        setFormError(`Validation errors:\n${errorMessages}`);
      } else {
        setFormError(`Failed to save product: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}/`);
        await fetchProducts();
      } catch (err) {
        setFormError('Failed to delete product.');
        console.error("Delete Product Error:", err);
      }
    }
  };

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
                <td colSpan={6} className="no-products-message">
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
        // --- NEW: Pass the handler function down to the modal ---
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  );
};

export default AdminProductManagementPage;