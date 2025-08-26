import React, { useState, useEffect } from 'react';
import { type Product } from '../../api/types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  productToEdit: Product | null;
  categories: string[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  productToEdit, 
  categories 
}) => {
  console.log('Modal render - isOpen:', isOpen);
  console.log('Modal render - productToEdit:', productToEdit);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    stock_quantity: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    console.log('Modal useEffect - isOpen:', isOpen, 'productToEdit:', productToEdit);
    if (isOpen) {
      if (productToEdit) {
        console.log('Setting form data for edit:', productToEdit);
        setFormData({
          name: productToEdit.name || '',
          category: productToEdit.category || '',
          price: productToEdit.price ? String(productToEdit.price) : '',
          description: productToEdit.description || '',
          stock_quantity: productToEdit.stock_quantity ? String(productToEdit.stock_quantity) : ''
        });
      } else {
        console.log('Setting form data for new product');
        setFormData({
          name: '',
          category: '',
          price: '',
          description: '',
          stock_quantity: ''
        });
      }
      setSelectedFile(null);
    }
  }, [productToEdit, isOpen]);

  // Always render, but conditionally display
  if (!isOpen) {
    console.log('Modal not rendering - isOpen is false');
    return null;
  }

  console.log('Modal IS rendering - isOpen is true');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('category', formData.category.trim());  
    submitData.append('price', formData.price.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('stock_quantity', formData.stock_quantity.trim());
    
    if (selectedFile) {
      submitData.append('image', selectedFile);
    }

    console.log('Submitting FormData...');
    onSubmit(submitData);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={handleOverlayClick}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="price">Price *</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label htmlFor="stock_quantity">Stock Quantity *</label>
            <input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>

          <div>
            <label htmlFor="image">Product Image</label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px' }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
              {productToEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;