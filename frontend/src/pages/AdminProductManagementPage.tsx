import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import ProductFormModal from '../components/admin/ProductFormModal';
import { Edit, Trash2 } from 'lucide-react'; // Import icons for buttons
import './AdminProductManagementPage.css';

// Import your local placeholder image
import placeholderImage from '../assets/images/product-placeholder.webp';

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  description: string;
  stock_quantity: number;
  image: string | null; // Image can be a URL string or null
}

const AdminProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const api = useApi();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [productsResponse, categoriesResponse] = await Promise.all([
          api.get('/products/'),
          api.get('/categories/')
        ]);
        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

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
    // ... (This function remains the same as the previous correct version)
    const isEditing = !!editingProduct;
    const url = isEditing ? `/products/${editingProduct.id}/` : '/products/';
    const method = isEditing ? 'put' : 'post';
    try {
      const response = await api[method](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (isEditing) {
        setProducts(products.map(p => (p.id === editingProduct.id ? response.data : p)));
      } else {
        setProducts([...products, response.data]);
      }
      handleCloseModal();
    } catch (err) {
      setError('Failed to save product.');
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    // ... (This function remains the same)
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}/`);
        setProducts(products.filter(p => p.id !== productId));
      } catch (err) {
        setError('Failed to delete product.');
        console.error(err);
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
                    {/* V V V --- UI IMPROVEMENT & FIX --- V V V */}
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
                      {/* --- UI IMPROVEMENT: Use icons in buttons --- */}
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
              // --- UI IMPROVEMENT: Handle empty state ---
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
      />
    </div>
  );
};

export default AdminProductManagementPage;