import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchReviewsAPI, createReviewAPI, updateReviewAPI, deleteReviewAPI } from '../api';
import { MoreVertical } from 'lucide-react'; // Icon for the three-dots menu

interface Review {
  id: number;
  author: { id: number; username: string; };
  text: string;
  created_at: string;
}

const ProductReviews: React.FC<{ productId: number }> = ({ productId }) => {
    const { user, isAuthenticated } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newReviewText, setNewReviewText] = useState('');
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [editText, setEditText] = useState('');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    useEffect(() => {
        const loadReviews = async () => {
            try {
                const response = await fetchReviewsAPI(productId);
                setReviews(response.data);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            }
        };
        loadReviews();
    }, [productId]);

    const handlePostReview = async (e: FormEvent) => {
        e.preventDefault();
        if (!newReviewText.trim()) return;
        try {
            const response = await createReviewAPI(productId, { text: newReviewText });
            setReviews([response.data, ...reviews]);
            setNewReviewText('');
        } catch (error) {
            console.error("Failed to post review:", error);
            alert("You have already reviewed this product.");
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            try {
                await deleteReviewAPI(reviewId);
                setReviews(reviews.filter(r => r.id !== reviewId));
            } catch (error) {
                console.error("Failed to delete review:", error);
            }
        }
        setActiveMenu(null);
    };
    
    const handleStartEdit = (review: Review) => {
        setEditingReview(review);
        setEditText(review.text);
        setActiveMenu(null);
    };

    const handleCancelEdit = () => {
        setEditingReview(null);
        setEditText('');
    };

    const handleUpdateReview = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingReview || !editText.trim()) return;
        try {
            const response = await updateReviewAPI(editingReview.id, { text: editText });
            setReviews(reviews.map(r => r.id === editingReview.id ? response.data : r));
            handleCancelEdit();
        } catch (error) {
            console.error("Failed to update review:", error);
        }
    };

    return (
        <section className="reviews-section">
            <h2>Ratings & Reviews</h2>

            {isAuthenticated && (
                <form className="add-review-form" onSubmit={handlePostReview}>
                    <textarea
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder="Share your thoughts about this product..."
                        rows={4}
                        required
                    />
                    <button type="submit" className="btn-post-review">Post Review</button>
                </form>
            )}

            <div className="review-list">
                {reviews.length > 0 ? reviews.map(review => (
                    <div key={review.id} className="review-item">
                        <div className="review-header">
                            <p className="review-author">{review.author.username}</p>
                            
                            {isAuthenticated && (
                                <div className="review-actions-menu">
                                    <button onClick={() => setActiveMenu(activeMenu === review.id ? null : review.id)} className="menu-toggle-btn">
                                        <MoreVertical size={20} />
                                    </button>
                                    {activeMenu === review.id && (
                                        <div className="dropdown-menu">
                                            {/* --- THIS IS THE FIX --- */}
                                            {/* Changed user?.id to user?.user_id to match the JWT token structure */}
                                            {(user?.user_id === review.author.id || user?.is_staff) ? (
                                                <>
                                                    <button onClick={() => handleStartEdit(review)}>Edit</button>
                                                    <button onClick={() => handleDeleteReview(review.id)}>Delete</button>
                                                </>
                                            ) : (
                                                <button onClick={() => alert('Review Reported!')}>Report</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {editingReview?.id === review.id ? (
                            <form className="edit-review-form" onSubmit={handleUpdateReview}>
                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} required />
                                <div className="edit-actions">
                                    <button type="button" onClick={handleCancelEdit}>Cancel</button>
                                    <button type="submit">Save Changes</button>
                                </div>
                            </form>
                        ) : (
                            <p className="review-text">{review.text}</p>
                        )}
                    </div>
                )) : <p>Be the first to ask about this product.</p>}
            </div>
        </section>
    );
};

export default ProductReviews;