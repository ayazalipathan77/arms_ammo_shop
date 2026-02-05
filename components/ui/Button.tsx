import React, { useRef } from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {

        // Size styles
        const sizes = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-8 py-3 text-base',
            lg: 'px-12 py-4 text-lg',
        };

        // Variant styles
        const variants = {
            primary: 'bg-transparent text-void', // SVG handles background
            secondary: 'bg-transparent border-2 border-amber/70 hover:border-amber text-pearl hover:bg-amber/10',
            outline: 'bg-transparent border border-warm-gray text-pearl hover:text-white',
        };

        return (
            <motion.button
                ref={ref}
                className={cn(
                    'relative group font-body font-medium tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-tangerine focus:ring-offset-2 focus:ring-offset-void disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
                    sizes[size],
                    variants[variant],
                    className
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                {...(props as any)}
            >
                {variant === 'primary' && (
                    /* SVG Paint Stroke Background */
                    <span className="absolute inset-0 w-full h-full -z-10 select-none">
                        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full fill-tangerine group-hover:fill-amber transition-colors duration-300">
                            <path d="M5,30 Q20,5 50,15 T150,25 T195,30 Q180,55 150,45 T50,35 T5,30 Z" vectorEffect="non-scaling-stroke" style={{ filter: 'url(#roughness)' }} />
                        </svg>
                        {/* Roughness filter def moved to global or valid place, or inline SVG filter */}
                    </span>
                )}

                {/* Paint Fill Animation for Secondary */}
                {variant === 'secondary' && (
                    <span className="absolute bottom-0 left-0 w-full h-0 bg-amber transition-all duration-300 group-hover:h-full -z-10 opacity-20" />
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                    {children}
                </span>
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
