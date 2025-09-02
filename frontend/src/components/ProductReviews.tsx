// import React, { useState, useEffect, type FormEvent } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import { fetchReviewsAPI, createReviewAPI, updateReviewAPI, deleteReviewAPI } from '../api';
// import { MoreVertical } from 'lucide-react'; // Icon for the three-dots menu
// import './ProductReviews.css'; // Assuming you have a CSS file for styling

// interface Review {
//   id: number;
//   author: { id: number; username: string; };
//   text: string;
//   created_at: string;
//   updated_at: string; 
// }

// // Define the shape of the user object from your useAuth hook
// interface AuthUser {
//   id: number;
//   is_staff: boolean;
//   is_superuser: boolean; // Add this to match the backend
//   // ... other user properties
// }

// const ProductReviews: React.FC<{ productId: number }> = ({ productId }) => {
//     // Cast the user object to your defined type for better type safety
//     const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
    
//     const [reviews, setReviews] = useState<Review[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
    
//     const [newReviewText, setNewReviewText] = useState('');
//     const [editingReview, setEditingReview] = useState<Review | null>(null);
//     const [editText, setEditText] = useState('');
//     const [activeMenu, setActiveMenu] = useState<number | null>(null);

//     useEffect(() => {
//         const loadReviews = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);
//                 const response = await fetchReviewsAPI(productId);
//                 if (Array.isArray(response.data)) {
//                     setReviews(response.data);
//                 }
//             } catch (err) {
//                 console.error("Failed to fetch reviews:", err);
//                 setError("Could not load reviews for this product.");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         loadReviews();
//     }, [productId]);

//     const handlePostReview = async (e: FormEvent) => {
//         e.preventDefault();
//         if (!newReviewText.trim()) return;
//         try {
//             const response = await createReviewAPI(productId, { text: newReviewText });
//             setReviews(prevReviews => [response.data, ...prevReviews]);
//             setNewReviewText('');
//         } catch (err: any) {
//             const errorMessage = err.response?.data?.[0] || err.response?.data?.detail || "Failed to post review.";
//             console.error("Failed to post review:", err);
//             alert(errorMessage);
//         }
//     };

//     const handleDeleteReview = async (reviewId: number) => {
//         if (window.confirm("Are you sure you want to delete this review?")) {
//             try {
//                 await deleteReviewAPI(reviewId);
//                 setReviews(reviews.filter(r => r.id !== reviewId));
//             } catch (error) {
//                 console.error("Failed to delete review:", error);
//             }
//         }
//         setActiveMenu(null);
//     };
    
//     const handleStartEdit = (review: Review) => {
//         setEditingReview(review);
//         setEditText(review.text);
//         setActiveMenu(null);
//     };

//     const handleCancelEdit = () => {
//         setEditingReview(null);
//         setEditText('');
//     };

//     const handleUpdateReview = async (e: FormEvent) => {
//         e.preventDefault();
//         if (!editingReview || !editText.trim()) return;
//         try {
//             const response = await updateReviewAPI(editingReview.id, { text: editText });
//             setReviews(reviews.map(r => r.id === editingReview.id ? response.data : r));
//             handleCancelEdit();
//         } catch (error) {
//             console.error("Failed to update review:", error);
//         }
//     };

//     return (
//         <section className="reviews-section">
//             <h2>Ratings & Reviews</h2>

//             {isAuthenticated && (
//                 <form className="add-review-form" onSubmit={handlePostReview}>
//                     <textarea
//                         value={newReviewText}
//                         onChange={(e) => setNewReviewText(e.target.value)}
//                         placeholder="Share your thoughts about this product..."
//                         rows={4}
//                         required
//                     />
//                     <button type="submit" className="btn-post-review">Post Review</button>
//                 </form>
//             )}

//             {loading && <p>Loading reviews...</p>}
//             {error && <p className="error-message">{error}</p>}
            
//             {!loading && !error && (
//                 <div className="review-list">
//                     {reviews.length > 0 ? reviews.map(review => (
//                         <div key={review.id} className="review-item">
//                             <div className="review-header">
//                                 <p className="review-author">{review.author.username}</p>
                                
//                                 {isAuthenticated && (
//                                     <div className="review-actions-menu">
//                                         <button onClick={() => setActiveMenu(activeMenu === review.id ? null : review.id)} className="menu-toggle-btn">
//                                             <MoreVertical size={20} />
//                                         </button>
//                                         {activeMenu === review.id && (
//                                             <div className="dropdown-menu">
//                                                 {/* --- FINAL CORRECTED LOGIC --- */}
//                                                 {(user?.id === review.author.id || user?.is_staff || user?.is_superuser) ? (
//                                                     <>
//                                                         <button type="button" onClick={() => handleStartEdit(review)}>Edit</button>
//                                                         <button type="button" onClick={() => handleDeleteReview(review.id)}>Delete</button>
//                                                     </>
//                                                 ) : (
//                                                     <button type="button" onClick={() => alert('Review Reported!')}>Report</button>
//                                                 )}
//                                             </div>
//                                         )}
//                                     </div>
//                                 )}
//                             </div>
                            
//                             {editingReview?.id === review.id ? (
//                                 <form className="edit-review-form" onSubmit={handleUpdateReview}>
//                                     <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} required />
//                                     <div className="edit-actions">
//                                         <button type="button" onClick={handleCancelEdit}>Cancel</button>
//                                         <button type="submit">Save Changes</button>
//                                     </div>
//                                 </form>
//                             ) : (
//                                 <p className="review-text">{review.text}</p>
//                             )}
//                         </div>
//                     )) : <p>Be the first to review this product.</p>}
//                 </div>
//             )}
//         </section>
//     );
// };

// export default ProductReviews;




// src/components/ProductReviews.tsx

import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchReviewsAPI, createReviewAPI, updateReviewAPI, deleteReviewAPI } from '../api';
import { MoreVertical } from 'lucide-react';
import './ProductReviews.css';
import { type Review, type User as AuthUser } from '../api/types'; // Assuming User type is exported from types

const ProductReviews: React.FC<{ productId: number }> = ({ productId }) => {
    const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
    
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    
    const [newReviewText, setNewReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- NEW: State specifically for the submission form error ---
    const [postError, setPostError] = useState<string | null>(null);

    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [editText, setEditText] = useState('');
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    useEffect(() => {
        const loadReviews = async () => {
            try {
                setLoading(true);
                setListError(null);
                const response = await fetchReviewsAPI(productId);
                if (Array.isArray(response.data)) {
                    setReviews(response.data);
                }
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
                setListError("Could not load reviews for this product.");
            } finally {
                setLoading(false);
            }
        };
        loadReviews();
    }, [productId]);

    const handlePostReview = async (e: FormEvent) => {
        e.preventDefault();
        
        // --- Clear previous errors on a new submission ---
        setPostError(null);
        setIsSubmitting(true);

        if (!newReviewText.trim()) {
            setPostError("Review text cannot be empty.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await createReviewAPI(productId, { text: newReviewText });
            // Add the new review to the top of the list
            setReviews(prevReviews => [response.data, ...prevReviews]);
            setNewReviewText(''); // Clear the textarea on success
        } catch (err: any) {
            console.error("Failed to post review:", err);
            
            // --- THE FIX: Display the specific error from the backend ---
            // The backend sends the moderation error in `err.response.data.detail`
            const errorMessage = err.response?.data?.detail || "An unknown error occurred. Please try again.";
            setPostError(errorMessage);
        } finally {
            setIsSubmitting(false);
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
                        disabled={isSubmitting}
                    />
                    {/* --- Display the moderation or validation error message --- */}
                    {postError && (
                        <p className="review-post-error">
                            {postError}
                        </p>
                    )}
                    <button type="submit" className="btn-post-review" disabled={isSubmitting}>
                        {isSubmitting ? 'Posting...' : 'Post Review'}
                    </button>
                </form>
            )}

            {loading && <p>Loading reviews...</p>}
            {listError && <p className="error-message">{listError}</p>}
            
                       
            {!loading && !listError && (
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
                                                {/* --- FINAL CORRECTED LOGIC --- */}
                                                {(user?.id === review.author.id || user?.is_staff || user?.is_superuser) ? (
                                                    <>
                                                        <button type="button" onClick={() => handleStartEdit(review)}>Edit</button>
                                                        <button type="button" onClick={() => handleDeleteReview(review.id)}>Delete</button>
                                                    </>
                                                ) : (
                                                    <button type="button" onClick={() => alert('Review Reported!')}>Report</button>
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
                    )) : <p>Be the first to review this product.</p>}
                </div>
            )}
        </section>
    );
};

export default ProductReviews;