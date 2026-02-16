import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Product } from '../../types';
import { favoriteApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const convertPrice = (price: number) => `PKR ${price.toLocaleString()}`;

interface ProductCardProps {
    product: Product;
    className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
    const location = useLocation();
    const { user, token } = useAuth();
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (user && token) {
                try {
                    const { isFavorited: favorited } = await favoriteApi.checkIsFavorited(product.id);
                    setIsFavorited(favorited);
                } catch (error) {
                    console.error('Failed to check favorite status:', error);
                }
            }
        };
        checkFavoriteStatus();
    }, [product.id, user, token]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user || !token) {
            alert('Please sign in to save favorites');
            window.location.href = '/auth';
            return;
        }

        setIsLoading(true);
        try {
            if (isFavorited) {
                await favoriteApi.remove(product.id);
                setIsFavorited(false);
            } else {
                await favoriteApi.add(product.id);
                setIsFavorited(true);
            }
        } catch (error: any) {
            console.error('Failed to toggle favorite:', error);
            if (!error.message?.toLowerCase().includes('token') &&
                !error.message?.toLowerCase().includes('unauthorized')) {
                alert('Failed to update favorites. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Link to={`/product/${product.id}`} state={{ from: location.pathname + location.search }} className="block w-full h-full">
            <motion.div
                className={cn("group relative w-full aspect-[3/4] cursor-pointer bg-void border border-stone-800 hover:border-amber-500/50 transition-colors duration-300", className)}
                whileHover="hover"
                initial="rest"
            >
                {/* Image Container */}
                <div className="relative w-full h-full overflow-hidden bg-charcoal/20">
                    <motion.div
                        className="w-full h-full"
                        variants={{
                            rest: { scale: 1 },
                            hover: { scale: 1.05 }
                        }}
                        transition={{ duration: 0.5 }}
                    >
                        <img
                            src={product.imageUrl}
                            alt={product.title}
                            className={cn(
                                "w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300",
                                !product.inStock && "grayscale opacity-50"
                            )}
                            loading="lazy"
                        />
                    </motion.div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent opacity-80" />

                    {/* Stock Status */}
                    {!product.inStock && (
                        <div className="absolute top-4 left-4 z-20">
                            <div className="bg-red-600/90 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-red-500/50 backdrop-blur-sm">
                                Out of Stock
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-4 z-20">
                    <div className="mb-2">
                        <span className="text-amber-500 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                            <Shield size={10} />
                            {product.manufacturerName}
                        </span>
                    </div>
                    <h3 className="text-pearl font-display font-bold text-lg uppercase tracking-wide truncate group-hover:text-tangerine transition-colors">
                        {product.title}
                    </h3>
                    <div className="flex justify-between items-end mt-2 border-t border-stone-800 pt-2 group-hover:border-amber-500/30 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-stone-500 text-[10px] uppercase tracking-wider">Caliber</span>
                            <span className="text-stone-300 text-xs font-mono">{product.caliber || 'N/A'}</span>
                        </div>
                        <span className="text-pearl font-mono font-bold text-lg">
                            {convertPrice(product.price)}
                        </span>
                    </div>
                </div>

                {/* Favorite Button */}
                <motion.button
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    className={cn(
                        "absolute top-4 right-4 z-30 p-2 rounded-full transition-all duration-300 hover:bg-stone-800/50 backdrop-blur-sm",
                        isFavorited ? "text-tangerine" : "text-stone-400 opacity-0 group-hover:opacity-100"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Heart
                        className={cn(
                            "w-5 h-5",
                            isFavorited && "fill-current"
                        )}
                    />
                </motion.button>
            </motion.div>
        </Link>
    );
};

export default ProductCard;
