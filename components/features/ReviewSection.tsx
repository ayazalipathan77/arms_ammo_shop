import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, CheckCircle, Trash2, Edit, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reviewApi } from '../../services/api';
import StarRating from '../ui/StarRating';

interface Review {
    id: string;
    userId: string;
    artworkId: string;
    rating: number;
    comment: string | null;
    photos: string[];
    isVerifiedPurchase: boolean;
    isApproved: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        avatarUrl?: string;
    };
}

interface ReviewSectionProps {
    artworkId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ artworkId }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState({ count: 0, averageRating: 0, verifiedCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);

    // Review form state
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setIsLoading(true);
                const { reviews: fetchedReviews, stats: fetchedStats } = await reviewApi.getArtworkReviews(artworkId);
                setReviews(fetchedReviews);
                setStats(fetchedStats);
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, [artworkId]);

    // Submit review
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!user) {
            setSubmitError('Please sign in to submit a review');
            return;
        }

        if (rating === 0) {
            setSubmitError('Please select a rating');
            return;
        }

        try {
            setIsSubmitting(true);
            const { message } = await reviewApi.createReview({
                artworkId,
                rating,
                comment: comment.trim() || undefined,
            });

            // Reset form
            setRating(0);
            setComment('');
            setShowReviewForm(false);

            alert(message || 'Review submitted successfully! It will be visible after approval.');

            // Refresh reviews
            const { reviews: updatedReviews, stats: updatedStats } = await reviewApi.getArtworkReviews(artworkId);
            setReviews(updatedReviews);
            setStats(updatedStats);
        } catch (error: any) {
            setSubmitError(error.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Vote on review
    const handleVote = async (reviewId: string, helpful: boolean) => {
        try {
            await reviewApi.voteReview(reviewId, helpful);
            // Update local state
            setReviews(prev => prev.map(r =>
                r.id === reviewId
                    ? { ...r, [helpful ? 'helpfulCount' : 'unhelpfulCount']: r[helpful ? 'helpfulCount' : 'unhelpfulCount'] + 1 }
                    : r
            ));
        } catch (error) {
            console.error('Failed to vote:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="py-8 text-center">
                <p className="text-stone-500">Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Reviews Header */}
            <div className="border-b border-stone-800 pb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-serif text-white mb-2">Customer Reviews</h3>
                        <div className="flex items-center gap-4">
                            <StarRating rating={stats.averageRating} readonly size="md" />
                            <span className="text-stone-400 text-sm">
                                {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
                            </span>
                            {stats.verifiedCount > 0 && (
                                <span className="text-green-500 text-sm flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    {stats.verifiedCount} verified {stats.verifiedCount === 1 ? 'purchase' : 'purchases'}
                                </span>
                            )}
                        </div>
                    </div>

                    {user && !showReviewForm && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="border border-amber-500 text-amber-500 px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-stone-950 transition-all"
                        >
                            Write a Review
                        </button>
                    )}
                </div>
            </div>

            {/* Review Form */}
            <AnimatePresence>
                {showReviewForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-stone-900/40 border border-stone-800 p-6 rounded-lg"
                    >
                        <h4 className="text-lg font-serif text-white mb-4">Write Your Review</h4>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-stone-300 text-sm mb-2">Your Rating *</label>
                                <StarRating
                                    rating={rating}
                                    onRatingChange={setRating}
                                    size="lg"
                                />
                            </div>

                            <div>
                                <label className="block text-stone-300 text-sm mb-2">Your Review (Optional)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full bg-stone-950 border border-stone-800 text-white p-3 rounded-lg focus:border-amber-500 focus:outline-none min-h-[120px]"
                                    placeholder="Share your thoughts about this artwork..."
                                />
                            </div>

                            {submitError && (
                                <div className="flex items-center gap-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {submitError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || rating === 0}
                                    className="bg-amber-500 text-stone-950 px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReviewForm(false);
                                        setRating(0);
                                        setComment('');
                                        setSubmitError(null);
                                    }}
                                    className="border border-stone-700 text-stone-300 px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-stone-500 mb-4">No reviews yet. Be the first to review this artwork!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-stone-900/20 border border-stone-800/50 p-6 rounded-lg"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                                        {review.user.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{review.user.fullName}</p>
                                        <p className="text-stone-500 text-xs">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    {review.isVerifiedPurchase && (
                                        <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-medium">
                                            <CheckCircle className="w-3 h-3" />
                                            Verified Purchase
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-3">
                                <StarRating rating={review.rating} readonly size="sm" />
                            </div>

                            {review.comment && (
                                <p className="text-stone-300 mb-4 leading-relaxed">{review.comment}</p>
                            )}

                            {/* Review Photos */}
                            {review.photos && review.photos.length > 0 && (
                                <div className="flex gap-2 mb-4">
                                    {review.photos.map((photo, idx) => (
                                        <img
                                            key={idx}
                                            src={photo}
                                            alt={`Review photo ${idx + 1}`}
                                            className="w-20 h-20 object-cover rounded border border-stone-800"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Helpfulness Voting */}
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-stone-500">Was this helpful?</span>
                                <button
                                    onClick={() => handleVote(review.id, true)}
                                    className="flex items-center gap-1 text-stone-400 hover:text-green-500 transition-colors"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>{review.helpfulCount}</span>
                                </button>
                                <button
                                    onClick={() => handleVote(review.id, false)}
                                    className="flex items-center gap-1 text-stone-400 hover:text-red-500 transition-colors"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    <span>{review.unhelpfulCount}</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewSection;
