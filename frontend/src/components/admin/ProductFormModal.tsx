import React, { useState, useEffect } from 'react';

// Define the structure of a Product for the form
interface ProductData {
  name: string;
  category: string;
  price: string;
  description: string;
  stock_quantity: number;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  productToEdit: (ProductData & { id?: number }) | null;
  categories: string[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSubmit, productToEdit, categories }) => {
  const [productData, setProductData] = useState<ProductData>({
    name: '', category: '', price: '', description: '', stock_quantity: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (productToEdit) {
      // Pre-fill the form with the product being edited
      setProductData({ ...productToEdit, price: String(productToEdit.price) });
    } else {
      // Reset the form for a new product
      setProductData({ name: '', category: '', price: '', description: '', stock_quantity: 0 });
    }
    // Always reset the selected file when the modal opens
    setSelectedFile(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    Object.entries(productData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={productData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={productData.category} onChange={handleChange} required>
              <option value="" disabled>Select a category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Price</label>
            <input type="number" name="price" value={productData.price} onChange={handleChange} required step="0.01" />
          </div>
          <div className="form-group">
            <label>Stock Quantity</label>
            <input type="number" name="stock_quantity" value={productData.stock_quantity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Image</label>
            <input type="file" name="image" onChange={handleFileChange} accept="image/*" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={productData.description} onChange={handleChange} rows={4} />
          </div>
          
          {/* --- REVISED BUTTONS SECTION --- */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-submit">
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;