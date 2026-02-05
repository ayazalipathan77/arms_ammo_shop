import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { useGallery } from '../../context/GalleryContext';

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
    const { landingPageContent } = useGallery();
    const [current, setCurrent] = useState(0);

    // Determine content source
    const heroConfig = landingPageContent?.hero;
    const hasDynamicContent = heroConfig?.enabled && heroConfig?.backgroundImages && heroConfig.backgroundImages.length > 0;

    const banners = hasDynamicContent
        ? heroConfig.backgroundImages.map((img, idx) => ({
            id: idx,
            image: img,
            title: heroConfig.title || 'MURAQQA',
            subtitle: heroConfig.subtitle || 'CONTEMPORARY ART'
        }))
        : DEFAULT_BANNERS;

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    return (
        <section className="relative h-screen w-full bg-void overflow-hidden">

            {/* Slideshow Container */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: 100, rotateY: 5, scale: 1.1 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -100, rotateY: -5, scale: 0.9 }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="absolute inset-0 w-full h-full perspective-1000"
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

            {/* Content Content - Static Layer */}
            {/* Content Content - Static Layer - REMOVED */}
            <div className="hidden" />

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
                                transition={{ duration: 5, ease: "linear" }}
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
