import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { favoriteApi } from '../services/api';
import ProductCard from '../components/ui/ProductCard';

interface FavoriteWithArtwork {
    id: string;
    artworkId: string;
    userId: string;
    createdAt: string;
    artwork: any; // Full product data
}

export const Wishlist: React.FC = () => {
    const { user, token } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteWithArtwork[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user || !token) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const { favorites: fetchedFavorites } = await favoriteApi.getAll();
                setFavorites(fetchedFavorites);
            } catch (err: any) {
                console.error('Failed to fetch favorites:', err);
                setError(err.message || 'Failed to load favorites');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [user, token]);

    const handleRemoveFavorite = async (artworkId: string) => {
        try {
            await favoriteApi.remove(artworkId);
            setFavorites(prev => prev.filter(fav => fav.artworkId !== artworkId));
        } catch (err) {
            console.error('Failed to remove favorite:', err);
            alert('Failed to remove from wishlist. Please try again.');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-void via-charcoal/30 to-void pt-24 pb-20 px-6 md:px-12 flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                    <Heart className="w-16 h-16 text-warm-gray mx-auto mb-4" />
                    <h2 className="text-2xl font-serif text-pearl mb-2">Sign in to view your wishlist</h2>
                    <p className="text-warm-gray mb-6">Save your favorite artworks and never lose track of them.</p>
                    <Link
                        to="/auth"
                        className="inline-block border border-tangerine text-tangerine px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-tangerine hover:text-void transition-all"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-void via-charcoal/30 to-void pt-24 pb-20 px-6 md:px-12 flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-tangerine animate-spin mx-auto mb-4" />
                    <p className="text-warm-gray text-sm uppercase tracking-widest">Loading your wishlist...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-void via-charcoal/30 to-void pt-24 pb-20 px-6 md:px-12 flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="border border-tangerine text-tangerine px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-tangerine hover:text-void transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-void via-charcoal/30 to-void pt-24 pb-20 px-6 md:px-12 relative overflow-hidden">
            {/* Animated Background Gradient Orbs */}
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-[600px] h-[600px] bg-tangerine/10 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
                animate={{ scale: [1.3, 1, 1.3], opacity: [0.03, 0.1, 0.03] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber/5 rounded-full blur-3xl pointer-events-none"
            />

            {/* Header */}
            <div className="border-b border-pearl/10 relative z-10">
                <div className="max-w-[1920px] mx-auto pb-8 mb-16">
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-8 h-8 text-tangerine fill-tangerine" />
                        <h1 className="text-4xl md:text-5xl font-serif text-pearl">My Wishlist</h1>
                    </div>
                    <p className="text-warm-gray font-mono text-sm uppercase tracking-widest">
                        {favorites.length} {favorites.length === 1 ? 'artwork' : 'artworks'} saved
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1920px] mx-auto relative z-10">
                {favorites.length === 0 ? (
                    <div className="text-center py-20">
                        <Heart className="w-20 h-20 text-charcoal mx-auto mb-6" />
                        <h2 className="text-2xl font-serif text-pearl mb-3">Your wishlist is empty</h2>
                        <p className="text-warm-gray mb-8 max-w-md mx-auto">
                            Start exploring our collection and save your favorite artworks to this list.
                        </p>
                        <Link
                            to="/collections"
                            className="inline-block border border-tangerine text-tangerine px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-tangerine hover:text-void transition-all"
                        >
                            Explore Collection
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence mode="popLayout">
                            {favorites.map((favorite) => (
                                <motion.div
                                    key={favorite.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative"
                                >
                                    {/* Artwork Card */}
                                    <ProductCard
                                        product={favorite.artwork}
                                        className="h-full"
                                    />

                                    {/* Quick Action Buttons */}
                                    <div className="absolute bottom-2 right-2 z-40 flex gap-2">
                                        <motion.button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRemoveFavorite(favorite.artworkId);
                                            }}
                                            className="p-2 bg-red-600/90 backdrop-blur-sm hover:bg-red-600 transition-all"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            title="Remove from wishlist"
                                        >
                                            <Trash2 className="w-4 h-4 text-white" />
                                        </motion.button>
                                    </div>

                                    {/* Saved date (subtle) */}
                                    <div className="mt-2 text-warm-gray/50 text-xs font-mono">
                                        Saved {new Date(favorite.createdAt).toLocaleDateString()}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Stats/Actions Footer */}
            {favorites.length > 0 && (
                <div className="border-t border-pearl/10 bg-charcoal/30 backdrop-blur-sm py-8 mt-16 relative z-10">
                    <div className="max-w-[1920px] mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-warm-gray text-sm font-mono">
                                    Total value: PKR {favorites.reduce((sum, fav) => sum + parseFloat(fav.artwork.price), 0).toLocaleString()}
                                </p>
                                <p className="text-warm-gray/50 text-xs mt-1">
                                    Based on {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Link
                                    to="/collections"
                                    className="border border-pearl/20 text-pearl px-6 py-2 text-sm font-bold uppercase tracking-widest hover:border-tangerine hover:text-tangerine transition-all"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wishlist;
