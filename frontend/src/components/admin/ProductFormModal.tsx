// import React, { useState, useEffect } from 'react';
// import { type Product } from '../../api/types';

// interface ProductFormModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (formData: FormData) => void;
//   productToEdit: Product | null;
//   categories: string[];
// }

// const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   onSubmit, 
//   productToEdit, 
//   categories 
// }) => {
//   console.log('Modal render - isOpen:', isOpen);
//   console.log('Modal render - productToEdit:', productToEdit);

//   const [formData, setFormData] = useState({
//     name: '',
//     category: '',
//     price: '',
//     description: '',
//     stock_quantity: ''
//   });
  
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   useEffect(() => {
//     console.log('Modal useEffect - isOpen:', isOpen, 'productToEdit:', productToEdit);
//     if (isOpen) {
//       if (productToEdit) {
//         console.log('Setting form data for edit:', productToEdit);
//         setFormData({
//           name: productToEdit.name || '',
//           category: productToEdit.category || '',
//           price: productToEdit.price ? String(productToEdit.price) : '',
//           description: productToEdit.description || '',
//           stock_quantity: productToEdit.stock_quantity ? String(productToEdit.stock_quantity) : ''
//         });
//       } else {
//         console.log('Setting form data for new product');
//         setFormData({
//           name: '',
//           category: '',
//           price: '',
//           description: '',
//           stock_quantity: ''
//         });
//       }
//       setSelectedFile(null);
//     }
//   }, [productToEdit, isOpen]);

//   // Always render, but conditionally display
//   if (!isOpen) {
//     console.log('Modal not rendering - isOpen is false');
//     return null;
//   }

//   console.log('Modal IS rendering - isOpen is true');

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null;
//     setSelectedFile(file);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log('Form submitted with data:', formData);
    
//     const submitData = new FormData();
//     submitData.append('name', formData.name.trim());
//     submitData.append('category', formData.category.trim());  
//     submitData.append('price', formData.price.trim());
//     submitData.append('description', formData.description.trim());
//     submitData.append('stock_quantity', formData.stock_quantity.trim());
    
//     if (selectedFile) {
//       submitData.append('image', selectedFile);
//     }

//     console.log('Submitting FormData...');
//     onSubmit(submitData);
//   };

//   const handleOverlayClick = (e: React.MouseEvent) => {
//     // Only close if clicking the overlay, not the modal content
//     if (e.target === e.currentTarget) {
//       onClose();
//     }
//   };

//   return (
//     <div 
//       style={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 9999
//       }}
//       onClick={handleOverlayClick}
//     >
//       <div 
//         style={{
//           backgroundColor: 'white',
//           padding: '20px',
//           borderRadius: '8px',
//           width: '90%',
//           maxWidth: '500px',
//           maxHeight: '90vh',
//           overflow: 'auto'
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
        
//         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//           <div>
//             <label htmlFor="name">Product Name *</label>
//             <input
//               id="name"
//               name="name"
//               type="text"
//               value={formData.name}
//               onChange={handleInputChange}
//               required
//               style={{ width: '100%', padding: '8px', marginTop: '4px' }}
//             />
//           </div>

//           <div>
//             <label htmlFor="category">Category *</label>
//             <select
//               id="category"
//               name="category"
//               value={formData.category}
//               onChange={handleInputChange}
//               required
//               style={{ width: '100%', padding: '8px', marginTop: '4px' }}
//             >
//               <option value="">Select a category</option>
//               {categories.map(cat => (
//                 <option key={cat} value={cat}>{cat}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label htmlFor="price">Price *</label>
//             <input
//               id="price"
//               name="price"
//               type="number"
//               step="0.01"
//               min="0"
//               value={formData.price}
//               onChange={handleInputChange}
//               required
//               style={{ width: '100%', padding: '8px', marginTop: '4px' }}
//             />
//           </div>

//           <div>
//             <label htmlFor="stock_quantity">Stock Quantity *</label>
//             <input
//               id="stock_quantity"
//               name="stock_quantity"
//               type="number"
//               min="0"
//               value={formData.stock_quantity}
//               onChange={handleInputChange}
//               required
//               style={{ width: '100%', padding: '8px', marginTop: '4px' }}
//             />
//           </div>

//           <div>
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               rows={4}
//               style={{ width: '100%', padding: '8px', marginTop: '4px' }}
//             />
//           </div>

//           <div>
//             <label htmlFor="image">Product Image</label>
//             <input
//               id="image"
//               name="image"
//               type="file"
//               accept="image/*"
//               onChange={handleFileChange}
//               style={{ width: '100%', padding: '8px', marginTop: '4px' }}
//             />
//           </div>

//           <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
//             <button type="button" onClick={onClose} style={{ padding: '10px 20px' }}>
//               Cancel
//             </button>
//             <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
//               {productToEdit ? 'Update Product' : 'Create Product'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ProductFormModal;

// ------------------------------------------------------------------------------------------------------------------------------------------------------

// src/components/admin/ProductFormModal.tsx

import React, { useState, useEffect } from 'react';
import { type Product } from '../../api/types';
import { generateProductContentAPI } from '../../api';
import { Sparkles, X } from 'lucide-react';

// Your existing interfaces
interface GeneratedContent { description: string; seo_keywords: string; }
interface APIResponse { data: GeneratedContent; fallback_used?: boolean; message?: string; error_details?: string; }

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '', category: '', price: '',
    description: '', seo_keywords: '', stock_quantity: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          name: productToEdit.name || '',
          category: productToEdit.category || '',
          price: productToEdit.price ? String(productToEdit.price) : '',
          description: productToEdit.description || '',
          seo_keywords: productToEdit.seo_keywords || '',
          stock_quantity: productToEdit.stock_quantity ? String(productToEdit.stock_quantity) : ''
        });
      } else {
        setFormData({ name: '', category: '', price: '', description: '', seo_keywords: '', stock_quantity: '' });
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsGenerating(false);
      setErrors({});
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  }, [productToEdit, isOpen]);

  useEffect(() => {
    return () => { if (previewUrl) { URL.revokeObjectURL(previewUrl); } };
  }, [previewUrl]);

  if (!isOpen) return null;

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    const price = parseFloat(formData.price);
    if (!formData.price.trim() || isNaN(price) || price < 0) {
      newErrors.price = 'Valid price is required';
    }

    const stockQuantity = parseInt(formData.stock_quantity);
    if (!formData.stock_quantity.trim() || isNaN(stockQuantity) || stockQuantity < 0) {
      newErrors.stock_quantity = 'Valid stock quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Create new preview URL
    if (file) {
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleGenerateClick = async () => {
    if (!formData.name.trim() || !formData.category.trim()) {
      setErrors({
        name: !formData.name.trim() ? 'Product name is required for AI generation' : '',
        category: !formData.category.trim() ? 'Category is required for AI generation' : ''
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Calling AI API with:', { name: formData.name.trim(), category: formData.category.trim() });
      
      const axiosResponse = await generateProductContentAPI(formData.name.trim(), formData.category.trim());
      const responseData = axiosResponse.data;
      
      console.log('Full axios response:', axiosResponse);
      console.log('Response data:', responseData);
      console.log('Actual structure:', JSON.stringify(responseData, null, 2));
      
      // Check if response has expected structure
      if (responseData && responseData.data && 
          typeof responseData.data.description === 'string' && 
          typeof responseData.data.seo_keywords === 'string') {
        
        setFormData(prev => ({
          ...prev,
          description: responseData.data.description,
          seo_keywords: responseData.data.seo_keywords,
        }));
        
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.generate;
          return newErrors;
        });
        
      } else {
        let description = '';
        let seoKeywords = '';
        
        if (responseData.data?.description) {
          description = responseData.data.description;
          seoKeywords = responseData.data.seo_keywords || '';
        } else if (responseData.description) {
          description = responseData.description;
          seoKeywords = responseData.seo_keywords || '';
        }
        
        if (description) {
          setFormData(prev => ({
            ...prev,
            description: description,
            seo_keywords: seoKeywords,
          }));
          
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.generate;
            return newErrors;
          });
        } else {
          throw new Error('Invalid API response structure - no content found');
        }
      }

    } catch (error: any) {
      console.error("AI Generation Error:", error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error?.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.data?.error || error.response.statusText}`;
        console.error('Error response data:', error.response.data);
      } else if (error?.request) {
        errorMessage = 'Network error - please check your connection';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({ 
        ...prev, 
        generate: `Failed to generate AI content: ${errorMessage}` 
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('category', formData.category.trim());  
    submitData.append('price', formData.price.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('seo_keywords', formData.seo_keywords.trim());
    submitData.append('stock_quantity', formData.stock_quantity.trim());
    
    if (selectedFile) {
      submitData.append('image', selectedFile);
    }
    
    onSubmit(submitData);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSaveNewCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      alert("Category name cannot be empty.");
      return;
    }
    
    onCategoryAdded(trimmedName);
    setFormData(prev => ({ ...prev, category: trimmedName }));
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  return (
    <div style={modalOverlayStyles} onClick={handleBackdropClick}>
      <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyles}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button type="button" onClick={onClose} style={closeButtonStyles} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={formStyles}>
          {/* Product Name */}
          <div style={formGroupStyles}>
            <label htmlFor="name" style={labelStyles}>Product Name *</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              value={formData.name} 
              onChange={handleInputChange} 
              style={{...inputStyles, borderColor: errors.name ? '#ef4444' : '#d1d5db'}} 
              required 
            />
            {errors.name && <span style={errorStyles}>{errors.name}</span>}
          </div>

          {/* Category Section */}
          <div style={formGroupStyles}>
            <label htmlFor="category" style={labelStyles}>Category *</label>
            {isAddingCategory ? (
              <div style={addCategoryFormStyles}>
                <input 
                  type="text" 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
                  placeholder="New category name..." 
                  style={{ ...inputStyles, flexGrow: 1 }} 
                  autoFocus 
                />
                <button type="button" onClick={handleSaveNewCategory} style={saveCategoryButtonStyles}>
                  Save
                </button>
                <button type="button" onClick={() => setIsAddingCategory(false)} style={cancelCategoryButtonStyles}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={categorySelectWrapperStyles}>
                <select 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  style={{...inputStyles, borderColor: errors.category ? '#ef4444' : '#d1d5db'}}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setIsAddingCategory(true)}
                  style={addNewCategoryButtonStyles}
                >
                  + Add New
                </button>
              </div>
            )}
            {errors.category && <span style={errorStyles}>{errors.category}</span>}
          </div>
          
          {/* AI Generate Button */}
          <div style={formGroupStyles}>
            <button 
              type="button" 
              onClick={handleGenerateClick} 
              disabled={isGenerating || !formData.name.trim() || !formData.category.trim()}
              style={{
                ...aiGenerateButtonStyles,
                opacity: (isGenerating || !formData.name.trim() || !formData.category.trim()) ? 0.6 : 1,
                cursor: (isGenerating || !formData.name.trim() || !formData.category.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              <Sparkles size={16} style={{ marginRight: '8px' }} />
              {isGenerating ? 'Generating...' : 'Generate Content with AI'}
            </button>
            {errors.generate && <span style={errorStyles}>{errors.generate}</span>}
          </div>

          {/* Description */}
          <div style={formGroupStyles}>
            <label htmlFor="description" style={labelStyles}>Description</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              rows={6}
              style={textareaStyles}
              placeholder="Enter product description..."
            />
          </div>
          
          {/* SEO Keywords */}
          <div style={formGroupStyles}>
            <label htmlFor="seo_keywords" style={labelStyles}>SEO Keywords (for Google, comma-separated)</label>
            <textarea 
              id="seo_keywords" 
              name="seo_keywords" 
              value={formData.seo_keywords} 
              onChange={handleInputChange} 
              rows={2}
              style={textareaStyles}
              placeholder="keyword1, keyword2, keyword3..."
            />
          </div>

          {/* Price and Stock Row */}
          <div style={formRowStyles}>
            <div style={formGroupStyles}>
              <label htmlFor="price" style={labelStyles}>Price *</label>
              <input 
                id="price" 
                name="price" 
                type="number" 
                step="0.01" 
                min="0" 
                value={formData.price} 
                onChange={handleInputChange}
                style={{...inputStyles, borderColor: errors.price ? '#ef4444' : '#d1d5db'}}
                required 
              />
              {errors.price && <span style={errorStyles}>{errors.price}</span>}
            </div>
            <div style={formGroupStyles}>
              <label htmlFor="stock_quantity" style={labelStyles}>Stock Quantity *</label>
              <input 
                id="stock_quantity" 
                name="stock_quantity" 
                type="number" 
                min="0" 
                value={formData.stock_quantity} 
                onChange={handleInputChange}
                style={{...inputStyles, borderColor: errors.stock_quantity ? '#ef4444' : '#d1d5db'}}
                required 
              />
              {errors.stock_quantity && <span style={errorStyles}>{errors.stock_quantity}</span>}
            </div>
          </div>

          {/* Image Upload */}
          <div style={formGroupStyles}>
            <label htmlFor="image" style={labelStyles}>Product Image</label>
            <input 
              id="image" 
              name="image" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              style={inputStyles}
            />
            {previewUrl && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db'
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={formActionsStyles}>
            <button 
              type="button" 
              onClick={onClose} 
              style={cancelButtonStyles}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={submitButtonStyles}
            >
              {productToEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline Styles
const modalOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 24px 0 24px',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '24px'
};

const closeButtonStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  transition: 'all 0.2s'
};

const formStyles: React.CSSProperties = {
  padding: '0 24px 24px 24px'
};

const formGroupStyles: React.CSSProperties = {
  marginBottom: '20px'
};

const formRowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  marginBottom: '20px'
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: '500',
  color: '#374151'
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const textareaStyles: React.CSSProperties = {
  ...inputStyles,
  resize: 'vertical',
  fontFamily: 'inherit'
};

const aiGenerateButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 20px',
  backgroundColor: '#8b5cf6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  width: '100%'
};

const formActionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '32px'
};

const cancelButtonStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const submitButtonStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const errorStyles: React.CSSProperties = {
  display: 'block',
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '4px'
};

// Missing styles for category functionality
const addCategoryFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
};

const categorySelectWrapperStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
};

const saveCategoryButtonStyles: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  whiteSpace: 'nowrap'
};

const cancelCategoryButtonStyles: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  whiteSpace: 'nowrap'
};

const addNewCategoryButtonStyles: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#8b5cf6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  whiteSpace: 'nowrap'
};

export default ProductFormModal;