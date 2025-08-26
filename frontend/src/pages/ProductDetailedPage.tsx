import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductDetailAPI } from '../api';
import ProductReviews from '../components/ProductReviews';
import placeholderImage from '../assets/images/product-placeholder.webp';
import './ProductDetailedPage.css';

// --- THIS IS THE FIX ---
// Import the definitive Product type from your central types file.
// This ensures consistency across your entire application.
import { type Product } from '../api/types';

const ProductDetailedPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProduct = async () => {
            if (!productId) {
                setError('Product ID is missing from the URL.');
                setLoading(false);
                return;
            }
            try {
                const response = await fetchProductDetailAPI(productId);
                // The error is now resolved because the imported 'Product' type
                // is the single source of truth and matches the API response.
                setProduct(response.data);
            } catch (err) {
                setError('Failed to load product details. It may not exist.');
                console.error("Fetch product detail error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [productId]);

    if (loading) return <div className="page-loading">Loading...</div>;
    if (error) return <div className="page-error">{error}</div>;
    if (!product) return <div className="page-error">Product not found.</div>;

    return (
        <div className="product-detail-page">
            <Link to="/" className="back-link">&larr; Back to Products</Link>

            <main className="detail-layout">
                <div className="product-detail-image">
                    <img src={product.image || placeholderImage} alt={product.name} />
                </div>
                <div className="product-detail-info">
                    <p className="product-category-detail">{product.category}</p>
                    <h1>{product.name}</h1>
                    <p className="product-price-detail">${Number(product.price).toFixed(2)}</p>
                    <p className="product-description">{product.description}</p>
                    <button className="btn-add-to-cart">Add to Cart</button>
                </div>
            </main>

            <hr className="section-divider" />

            <ProductReviews productId={product.id} />
        </div>
    );
};

export default ProductDetailedPage;