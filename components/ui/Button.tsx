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
            primary: 'bg-tangerine text-void hover:bg-void hover:text-tangerine hover:border-tangerine border border-tangerine',
            secondary: 'bg-transparent border-2 border-tangerine text-pearl hover:bg-tangerine/10 hover:text-tangerine',
            outline: 'bg-transparent border border-pearl/30 text-pearl hover:text-tangerine hover:border-tangerine hover:bg-tangerine/5',
        };

        return (
            <motion.button
                ref={ref}
                className={cn(
                    'font-mono font-bold uppercase tracking-widest text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-tangerine focus:ring-offset-2 focus:ring-offset-void disabled:opacity-50 disabled:cursor-not-allowed',
                    sizes[size],
                    variants[variant],
                    className
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                {...(props as any)}
            >
                {children}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
