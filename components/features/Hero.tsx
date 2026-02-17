import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { useShop } from '../../context/ShopContext';

// Default Fallback Images
const DEFAULT_BANNERS = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1549887552-93f954d4393e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        title: 'CHROMATIC',
        subtitle: 'DEPTHS'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        title: 'VOID',
        subtitle: 'WALKER'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1569031023594-8178a9c27943?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        title: 'ETHEREAL',
        subtitle: 'FORMS'
    }
];

const Hero = () => {
    const { landingPageContent, isContentLoading } = useShop();
    const [current, setCurrent] = useState(0);

    // Determine content source
    const heroConfig = landingPageContent?.hero;
    const hasDynamicContent = heroConfig?.enabled && heroConfig?.backgroundImages && heroConfig.backgroundImages.length > 0;

    const banners = hasDynamicContent
        ? heroConfig.backgroundImages.map((img, idx) => ({
            id: idx,
            image: img,
            title: heroConfig.title || 'ARMS & AMMO',
            subtitle: heroConfig.subtitle || 'CONTEMPORARY ART'
        }))
        : DEFAULT_BANNERS;

    // useEffect must be called before any conditional returns
    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 7000);
        return () => clearInterval(timer);
    }, [banners.length]);

    // Show loader while initial content is loading
    if (isContentLoading) {
        return (
            <section className="relative h-screen w-full bg-void overflow-hidden flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-tangerine animate-spin mx-auto mb-4" />
                    <p className="text-pearl/60 text-sm uppercase tracking-widest font-mono">Loading Gallery...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="relative h-screen w-full bg-void overflow-hidden">

            {/* Slideshow Container */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, scale: current % 2 === 0 ? 1 : 1.15 }}
                        animate={{
                            opacity: 1,
                            scale: current % 2 === 0 ? 1.15 : 1
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: 0.6, ease: "easeInOut" },
                            scale: { duration: 7, ease: "linear" }
                        }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <div className="w-full h-full relative">
                            {/* Image with overlay - Dark Grayscale */}
                            <img
                                src={banners[current].image}
                                alt={banners[current].title}
                                className="w-full h-full object-cover grayscale brightness-50"
                            />
                            <div className="absolute inset-0 bg-void/40 mix-blend-multiply"></div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Content - Static Layer (no animation, stays constant) */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-4 md:space-y-6 max-w-4xl px-6">
                    <h2 className="text-tangerine font-mono text-sm md:text-base tracking-[0.3em] uppercase">
                        {heroConfig?.subtitle || banners[0].subtitle}
                    </h2>

                    <h1 className="text-7xl md:text-9xl font-display text-white tracking-tighter uppercase mix-blend-difference">
                        {heroConfig?.title || banners[0].title}
                    </h1>

                    <div className="pt-8 pointer-events-auto">
                        <Button variant="outline" className="text-white border-white hover:border-tangerine hover:text-tangerine">
                            EXPLORE COLLECTION
                        </Button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-12 left-6 md:left-12 right-6 md:right-12 z-20 flex gap-2">
                {banners.map((_, idx) => (
                    <div key={idx} className="h-[2px] flex-1 bg-white/10 overflow-hidden">
                        {idx === current && (
                            <motion.div
                                layoutId="progress"
                                className="h-full bg-tangerine"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 7, ease: "linear" }}
                            />
                        )}
                        {idx < current && <div className="h-full w-full bg-white/30" />}
                    </div>
                ))}
            </div>

        </section>
    );
};

export default Hero;
