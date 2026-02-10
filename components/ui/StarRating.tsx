import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface StarRatingProps {
    rating: number; // 0-5
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    count?: number;
}

const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
};

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    readonly = false,
    size = 'md',
    showCount = false,
    count,
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const displayRating = hoverRating || rating;

    const handleClick = (index: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(index + 1);
        }
    };

    const handleMouseEnter = (index: number) => {
        if (!readonly && onRatingChange) {
            setHoverRating(index + 1);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly && onRatingChange) {
            setHoverRating(0);
        }
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, index) => {
                    const isFilled = index < Math.floor(displayRating);
                    const isPartial = index < displayRating && index >= Math.floor(displayRating);
                    const partialPercentage = ((displayRating - Math.floor(displayRating)) * 100).toFixed(0);

                    return (
                        <div key={index} className="relative">
                            {!readonly && onRatingChange ? (
                                <motion.button
                                    type="button"
                                    onClick={() => handleClick(index)}
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    onMouseLeave={handleMouseLeave}
                                    className={cn(
                                        "transition-all duration-200 cursor-pointer",
                                        readonly && "cursor-default"
                                    )}
                                    whileHover={!readonly ? { scale: 1.1 } : {}}
                                    whileTap={!readonly ? { scale: 0.95 } : {}}
                                >
                                    <Star
                                        className={cn(
                                            sizeMap[size],
                                            isFilled || isPartial
                                                ? "fill-amber-500 text-amber-500"
                                                : hoverRating > index
                                                    ? "fill-amber-400/50 text-amber-400"
                                                    : "text-stone-600"
                                        )}
                                    />
                                </motion.button>
                            ) : (
                                <Star
                                    className={cn(
                                        sizeMap[size],
                                        isFilled || isPartial
                                            ? "fill-amber-500 text-amber-500"
                                            : "text-stone-700"
                                    )}
                                />
                            )}

                            {/* Partial fill overlay (for displaying half-stars) */}
                            {isPartial && (
                                <div
                                    className="absolute top-0 left-0 overflow-hidden pointer-events-none"
                                    style={{ width: `${partialPercentage}%` }}
                                >
                                    <Star
                                        className={cn(
                                            sizeMap[size],
                                            "fill-amber-500 text-amber-500"
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Rating number and count */}
            {(showCount || count !== undefined) && (
                <span className="text-sm text-stone-400 ml-1 font-mono">
                    {rating.toFixed(1)}
                    {count !== undefined && (
                        <span className="text-stone-600"> ({count})</span>
                    )}
                </span>
            )}
        </div>
    );
};

export default StarRating;
