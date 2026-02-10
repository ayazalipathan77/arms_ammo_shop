import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Artwork } from '../../types';
import { favoriteApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const convertPrice = (price: number) => `PKR ${price.toLocaleString()}`;

interface ArtworkCardProps {
    artwork: Artwork;
    className?: string;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, className }) => {
    const location = useLocation();
    const { user, token } = useAuth();
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check if artwork is favorited when component mounts
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (user && token) {
                try {
                    const { isFavorited: favorited } = await favoriteApi.checkIsFavorited(artwork.id);
                    setIsFavorited(favorited);
                } catch (error) {
                    console.error('Failed to check favorite status:', error);
                }
            }
        };
        checkFavoriteStatus();
    }, [artwork.id, user, token]);

    // Toggle favorite status
    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation to artwork detail
        e.stopPropagation(); // Stop event from bubbling

        if (!user || !token) {
            // User not logged in, redirect to login with message
            alert('Please sign in to save favorites');
            window.location.href = '/auth';
            return;
        }

        setIsLoading(true);
        try {
            if (isFavorited) {
                await favoriteApi.remove(artwork.id);
                setIsFavorited(false);
            } else {
                await favoriteApi.add(artwork.id);
                setIsFavorited(true);
            }
        } catch (error: any) {
            console.error('Failed to toggle favorite:', error);
            // Don't show alert here - authFetch will handle 401 errors by redirecting
            // Only show error for non-auth related errors
            if (!error.message?.toLowerCase().includes('token') && 
                !error.message?.toLowerCase().includes('unauthorized')) {
                alert('Failed to update favorites. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Link to={`/artwork/${artwork.id}`} state={{ from: location.pathname + location.search }} className="block w-full h-full">
            <motion.div
                className={cn("group relative w-full aspect-[3/4] cursor-pointer perspective-1000", className)}
                whileHover="hover"
                initial="rest"
            >
                {/* The Physical Canvas Block */}
                <motion.div
                    className="relative w-full h-full bg-charcoal overflow-hidden transition-all duration-500 ease-dry"
                    variants={{
                        rest: { scale: 1, zIndex: 1 },
                        hover: { scale: 1.02, zIndex: 10 }
                    }}
                    animate="breathing"
                >
                    <motion.div
                        className="w-full h-full"
                        variants={{
                            breathing: {
                                scale: [1, 1.015, 1],
                                transition: {
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }
                        }}
                    >
                        {/* Orange Border Bleed */}
                        <div className="absolute inset-0 border-0 border-tangerine transition-all duration-300 group-hover:border-[6px] z-20 pointer-events-none opacity-0 group-hover:opacity-100 mix-blend-screen" />

                        <img
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className={cn(
                                "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0",
                                !artwork.inStock && "grayscale-[60%] group-hover:grayscale-[30%]"
                            )}
                            loading="lazy"
                        />
                    </motion.div>

                    {/* Sold Overlay */}
                    {!artwork.inStock && (
                        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />
                </motion.div>

                {/* Sold Badge */}
                {!artwork.inStock && (
                    <div className="absolute top-4 left-4 z-30">
                        <div className="bg-red-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg border border-red-400/30">
                            SOLD
                        </div>
                    </div>
                )}

                {/* Info Sticker */}
                <motion.div
                    className="absolute bottom-8 -left-4 bg-pearl text-void px-4 py-2 rotate-[-2deg] z-30 shadow-xl origin-bottom-left max-w-[85%]"
                    variants={{
                        rest: { x: 0, rotate: -2 },
                        hover: { x: 10, rotate: 0 }
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <h3 className="font-display font-bold uppercase tracking-tight truncate text-[clamp(0.75rem,3.5cqi,1.125rem)] leading-tight">{artwork.title}</h3>
                    <p className="text-[clamp(0.55rem,2.5cqi,0.75rem)] font-mono text-void/70 uppercase flex justify-between gap-3 leading-tight mt-0.5">
                        <span className="truncate">{artwork.artistName}</span>
                        <span className="flex-shrink-0">{artwork.year}</span>
                    </p>
                    <p className="text-[clamp(0.6rem,2.8cqi,0.8rem)] font-mono font-bold text-void/90 mt-1 leading-tight">{convertPrice(artwork.price)}</p>
                </motion.div>

                {/* Favorite Button - positioned below sold badge area to avoid overlap */}
                <motion.button
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    className={cn(
                        "absolute top-14 left-4 z-30 p-2 bg-stone-900/80 backdrop-blur-sm hover:bg-stone-900 transition-all duration-300",
                        isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Heart
                        className={cn(
                            "w-5 h-5 transition-all duration-300",
                            isFavorited ? "fill-amber-500 text-amber-500" : "text-white/80 hover:text-amber-500"
                        )}
                    />
                </motion.button>

                {/* Hover Reveal Action */}
                <motion.div
                    className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <div className="bg-tangerine p-3 rounded-none">
                        <ArrowUpRight className="text-void w-6 h-6" />
                    </div>
                </motion.div>
            </motion.div>
        </Link>
    );
};

export default ArtworkCard;
