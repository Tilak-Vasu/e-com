// src/components/admin/ProductFormModal.tsx

import React, { useState, useEffect, type FormEvent } from 'react';
import { type Product } from '../../api/types'; // Make sure this path is correct for your project
import { generateProductContentAPI } from '../../api';
import { Sparkles, X, FileImage, Link as LinkIcon } from 'lucide-react';
import { verifyImageAPI } from '../../api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: FormData) => void;
  productToEdit: Product | null;
  categories: string[];
  onCategoryAdded: (newCategory: string) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  productToEdit, 
  categories,
  onCategoryAdded
}) => {
  // --- ALL HOOKS MUST BE AT THE TOP LEVEL ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    seo_keywords: '',
    stock_quantity: '',
    image_url: '',
    image_file: null as File | null,
  });
  const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Effect to populate form data from props when the modal opens
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          name: productToEdit.name || '',
          category: productToEdit.category || '',
          price: productToEdit.price ? String(productToEdit.price) : '',
          description: productToEdit.description || '',
          seo_keywords: productToEdit.seo_keywords || '',
          stock_quantity: productToEdit.stock_quantity ? String(productToEdit.stock_quantity) : '',
          image_url: (productToEdit as any).image || '', // Use 'image' from read serializer
          image_file: null,
        });
        setImageInputMode('url');
      } else {
        // Reset form for a new product
        setFormData({
          name: '', category: '', price: '', description: '', 
          seo_keywords: '', stock_quantity: '', 
          image_url: '', image_file: null
        });
        setImageInputMode('url');
      }
      // Reset auxiliary states
      setErrors({});
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  }, [productToEdit, isOpen]);

  // Derived variable for image preview, memoized for efficiency
  const imagePreviewSource = React.useMemo(() => {
    if (formData.image_file) {
      return URL.createObjectURL(formData.image_file);
    }
    return formData.image_url;
  }, [formData.image_file, formData.image_url]);


  // Effect to clean up the object URL created for the file preview
  useEffect(() => {
    return () => {
      if (imagePreviewSource && imagePreviewSource.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewSource);
      }
    };
  }, [imagePreviewSource]);

  // --- EARLY RETURN (CONDITIONAL LOGIC) MUST BE AFTER ALL HOOKS ---
  if (!isOpen) {
    return null;
  }
  
  // --- ALL HANDLERS AND RENDER LOGIC CAN SAFELY GO HERE ---

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    const price = parseFloat(formData.price);
    if (!formData.price.trim() || isNaN(price) || price < 0) newErrors.price = 'Valid price is required';
    const stockQuantity = parseInt(formData.stock_quantity);
    if (!formData.stock_quantity.trim() || isNaN(stockQuantity) || stockQuantity < 0) newErrors.stock_quantity = 'Valid stock quantity is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
        const file = (e.target as HTMLInputElement).files?.[0] || null;
        setFormData(prev => ({ ...prev, image_file: file, image_url: '' })); // Clear URL when file is chosen
        if (file) setImageInputMode('file');
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        // If user starts typing in the URL field, clear any selected file
        if (name === 'image_url' && value) {
            setFormData(prev => ({ ...prev, image_file: null }));
            setImageInputMode('url');
        }
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handleImageModeToggle = (mode: 'url' | 'file') => {
    setImageInputMode(mode);
    // Clear the other input's value to prevent confusion
    if (mode === 'url') {
        setFormData(prev => ({ ...prev, image_file: null }));
    } else {
        setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleGenerateClick = async () => {
    const { name, category, image_file } = formData;

    if (!name.trim() || !category.trim()) {
      setErrors(prev => ({ ...prev, name: !name.trim() ? 'Name required' : '', category: !category.trim() ? 'Category required' : '' }));
      return;
    }
    
    setIsGenerating(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.generate;
      return newErrors;
    });

    try {
      if (image_file) {
        const verificationFormData = new FormData();
        verificationFormData.append('name', name.trim());
        // --- THE FIX: Add the category to the verification data ---
        verificationFormData.append('category', category.trim());
        verificationFormData.append('image_file', image_file);

        console.log("Verifying image against product name and category...");
        const verifyResponse = await verifyImageAPI(verificationFormData);
        
        if (verifyResponse.data.match === false) {
          throw new Error("Product name/category does not match the uploaded image. Please change the details or the image.");
        }
        console.log("Image verification successful.");
      }

      console.log("Generating text content...");
      const contentResponse = await generateProductContentAPI(name.trim(), category.trim());
      const content = contentResponse.data.data;

      if (content?.description && content?.seo_keywords) {
        setFormData(prev => ({
          ...prev,
          description: content.description,
          seo_keywords: content.seo_keywords,
        }));
      } else {
        throw new Error(contentResponse.data.message || "Invalid AI response for text content.");
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred.';
      setErrors(prev => ({ ...prev, generate: `AI Error: ${errorMessage}` }));
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('category', formData.category.trim());
    submitData.append('price', formData.price.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('seo_keywords', formData.seo_keywords.trim());
    submitData.append('stock_quantity', formData.stock_quantity.trim());
    if (formData.image_url.trim()) {
        submitData.append('image_url', formData.image_url.trim());
    } else if (formData.image_file) {
        submitData.append('image_file', formData.image_file);
    }
    onSubmit(submitData);
  };
  
  const handleSaveNewCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return alert("Category name cannot be empty.");
    onCategoryAdded(trimmedName);
    setFormData(prev => ({ ...prev, category: trimmedName }));
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={modalOverlayStyles} onClick={handleBackdropClick}>
      <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyles}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button type="button" onClick={onClose} style={closeButtonStyles} aria-label="Close modal"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={formStyles}>
          {/* Product Name */}
          <div style={formGroupStyles}>
            <label htmlFor="name" style={labelStyles}>Product Name *</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} style={{ ...inputStyles, borderColor: errors.name ? '#ef4444' : '#d1d5db' }} required />
            {errors.name && <span style={errorStyles}>{errors.name}</span>}
          </div>

          {/* Category */}
          <div style={formGroupStyles}>
            <label htmlFor="category" style={labelStyles}>Category *</label>
            {isAddingCategory ? (
              <div style={addCategoryFormStyles}>
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name..." style={{ ...inputStyles, flexGrow: 1 }} autoFocus />
                <button type="button" onClick={handleSaveNewCategory} style={saveCategoryButtonStyles}>Save</button>
                <button type="button" onClick={() => setIsAddingCategory(false)} style={cancelCategoryButtonStyles}>Cancel</button>
              </div>
            ) : (
              <div style={categorySelectWrapperStyles}>
                <select id="category" name="category" value={formData.category} onChange={handleInputChange} style={{ ...inputStyles, borderColor: errors.category ? '#ef4444' : '#d1d5db' }} required>
                  <option value="">Select a category</option>
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <button type="button" onClick={() => setIsAddingCategory(true)} style={addNewCategoryButtonStyles}>+ Add New</button>
              </div>
            )}
            {errors.category && <span style={errorStyles}>{errors.category}</span>}
          </div>

          {/* Image */}
          <div style={formGroupStyles}>
            <label style={labelStyles}>Product Image</label>
            <div style={imageInputToggleStyles}>
                <button type="button" onClick={() => handleImageModeToggle('url')} style={imageModeButtonStyles({ active: imageInputMode === 'url' })}>
                    <LinkIcon size={16} style={{ marginRight: '8px' }} /> Use URL
                </button>
                <button type="button" onClick={() => handleImageModeToggle('file')} style={imageModeButtonStyles({ active: imageInputMode === 'file' })}>
                    <FileImage size={16} style={{ marginRight: '8px' }} /> Upload File
                </button>
            </div>
            {imageInputMode === 'url' ? (
                <input id="image_url" name="image_url" type="url" value={formData.image_url || ''} onChange={handleInputChange} style={inputStyles} placeholder="https://example.com/image.jpg" />
            ) : (
                <input id="image_file" name="image_file" type="file" accept="image/*" onChange={handleInputChange} style={{ ...inputStyles, padding: '10px' }} />
            )}
            {imagePreviewSource && (
                <div style={imagePreviewContainerStyles}>
                    <p style={previewLabelStyles}>Preview:</p>
                    <img src={imagePreviewSource} alt="Product Preview" style={imagePreviewStyles} />
                </div>
            )}
          </div>

          {/* AI Content Generation */}
          <div style={formGroupStyles}>
            <button type="button" onClick={handleGenerateClick} disabled={isGenerating || !formData.name.trim() || !formData.category.trim()} style={{ ...aiGenerateButtonStyles, opacity: (isGenerating || !formData.name.trim() || !formData.category.trim()) ? 0.6 : 1, cursor: (isGenerating || !formData.name.trim() || !formData.category.trim()) ? 'not-allowed' : 'pointer' }}>
              <Sparkles size={16} style={{ marginRight: '8px' }} />
              {isGenerating ? 'Generating...' : 'Generate Content with AI'}
            </button>
            {errors.generate && <span style={errorStyles}>{errors.generate}</span>}
          </div>

          {/* Description */}
          <div style={formGroupStyles}>
            <label htmlFor="description" style={labelStyles}>Description</label>
            <textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} rows={6} style={textareaStyles} placeholder="Enter product description..."/>
          </div>
          
          {/* SEO Keywords */}
          <div style={formGroupStyles}>
            <label htmlFor="seo_keywords" style={labelStyles}>SEO Keywords (comma-separated)</label>
            <textarea id="seo_keywords" name="seo_keywords" value={formData.seo_keywords || ''} onChange={handleInputChange} rows={2} style={textareaStyles} placeholder="keyword1, keyword2, keyword3..."/>
          </div>

          {/* Price & Stock */}
          <div style={formRowStyles}>
            <div style={formGroupStyles}>
              <label htmlFor="price" style={labelStyles}>Price *</label>
              <input id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleInputChange} style={{ ...inputStyles, borderColor: errors.price ? '#ef4444' : '#d1d5db' }} required />
              {errors.price && <span style={errorStyles}>{errors.price}</span>}
            </div>
            <div style={formGroupStyles}>
              <label htmlFor="stock_quantity" style={labelStyles}>Stock Quantity *</label>
              <input id="stock_quantity" name="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={handleInputChange} style={{ ...inputStyles, borderColor: errors.stock_quantity ? '#ef4444' : '#d1d5db' }} required />
              {errors.stock_quantity && <span style={errorStyles}>{errors.stock_quantity}</span>}
            </div>
          </div>

          {/* Form Actions */}
          <div style={formActionsStyles}>
            <button type="button" onClick={onClose} style={cancelButtonStyles}>Cancel</button>
            <button type="submit" style={submitButtonStyles}>{productToEdit ? 'Update Product' : 'Create Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---
const modalOverlayStyles: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' };
const modalContentStyles: React.CSSProperties = { backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const modalHeaderStyles: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' };
const closeButtonStyles: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' };
const formStyles: React.CSSProperties = { padding: '0 24px 24px 24px' };
const formGroupStyles: React.CSSProperties = { marginBottom: '20px' };
const formRowStyles: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' };
const labelStyles: React.CSSProperties = { display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' };
const inputStyles: React.CSSProperties = { width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };
const textareaStyles: React.CSSProperties = { ...inputStyles, resize: 'vertical', fontFamily: 'inherit' };
const aiGenerateButtonStyles: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', width: '100%' };
const formActionsStyles: React.CSSProperties = { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' };
const cancelButtonStyles: React.CSSProperties = { padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };
const submitButtonStyles: React.CSSProperties = { padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };
const errorStyles: React.CSSProperties = { display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px' };
const categorySelectWrapperStyles: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const addNewCategoryButtonStyles: React.CSSProperties = { padding: '12px 16px', backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' };
const addCategoryFormStyles: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
const saveCategoryButtonStyles: React.CSSProperties = { ...addNewCategoryButtonStyles, backgroundColor: '#10b981', color: 'white', borderColor: '#059669' };
const cancelCategoryButtonStyles: React.CSSProperties = { ...addNewCategoryButtonStyles, backgroundColor: '#6b7280', color: 'white', borderColor: '#4b5563' };
const imageInputToggleStyles: React.CSSProperties = { display: 'flex', marginBottom: '10px', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' };
const imageModeButtonStyles = ({ active }: { active: boolean }): React.CSSProperties => ({ flex: 1, padding: '10px 15px', backgroundColor: active ? '#e0e7ff' : 'white', color: active ? '#4f46e5' : '#374151', border: 'none', borderRadius: '0px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e5e7eb', transition: 'background-color 0.2s, color 0.2s' });
const imagePreviewContainerStyles: React.CSSProperties = { marginTop: '12px', padding: '10px', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#f9fafb', textAlign: 'center' };
const previewLabelStyles: React.CSSProperties = { fontSize: '13px', color: '#6b7280', marginBottom: '8px', display: 'block' };
const imagePreviewStyles: React.CSSProperties = { maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e0e0e0' };

export default ProductFormModal;