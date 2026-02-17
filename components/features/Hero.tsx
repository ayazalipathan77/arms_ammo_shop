import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Crosshair, Target } from 'lucide-react';
import Button from '../ui/Button';
import { useShop } from '../../context/ShopContext';

// Default Fallback Images
const DEFAULT_BANNERS = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1549887552-93f954d4393e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        title: 'TACTICAL',
        subtitle: 'PRECISION'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        title: 'BALLISTIC',
        subtitle: 'DEFENSE'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1569031023594-8178a9c27943?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        title: 'OPERATOR',
        subtitle: 'SYSTEMS'
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
            title: heroConfig.title || 'AAA TACTICAL',
            subtitle: heroConfig.subtitle || 'TACTICAL SYSTEMS'
        }))
        : DEFAULT_BANNERS;

    // Use a ref to control auto-play, or just rely on state if keeping it simple
    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 7000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const nextSlide = () => setCurrent(prev => (prev + 1) % banners.length);
    const prevSlide = () => setCurrent(prev => (prev - 1 + banners.length) % banners.length);

    // Show loader while initial content is loading
    if (isContentLoading) {
        return (
            <section className="relative h-screen w-full bg-void overflow-hidden flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-safety animate-spin mx-auto mb-4" />
                    <p className="text-pearl/60 text-sm uppercase tracking-widest font-mono">Initializing Systems...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="relative h-screen w-full bg-void overflow-hidden group">

            {/* Slideshow Container */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <div className="w-full h-full relative">
                            {/* Image with overlay - Dark Grayscale */}
                            <img
                                src={banners[current].image}
                                alt={banners[current].title}
                                className="w-full h-full object-cover grayscale brightness-[0.4]"
                            />
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/40"></div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Interactive Grid Overlay (Static) */}
            <div className="absolute inset-0 pointer-events-none z-10 border-[20px] border-transparent">
                <div className="w-full h-full border border-white/5 relative">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-safety"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-safety"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-safety"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-safety"></div>

                    {/* Crosshairs */}
                    <div className="absolute top-1/2 left-8 w-4 h-[1px] bg-white/20"></div>
                    <div className="absolute top-1/2 right-8 w-4 h-[1px] bg-white/20"></div>
                </div>
            </div>

            {/* Content Layer */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-4 md:space-y-6 max-w-5xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={`sub-${current}`}
                        className="flex items-center justify-center gap-3 text-safety font-mono text-xs md:text-sm tracking-[0.5em] uppercase"
                    >
                        <Crosshair size={14} className="animate-spin-slow" />
                        {heroConfig?.subtitle || banners[current].subtitle}
                        <Crosshair size={14} className="animate-spin-slow" />
                    </motion.div>

                    <h1 className="text-6xl md:text-9xl font-display text-white tracking-tighter uppercase leading-none drop-shadow-2xl">
                        {heroConfig?.title || banners[current].title}
                    </h1>

                    <div className="pt-8 pointer-events-auto">
                        <Button variant="outline" className="text-white border-white/20 hover:border-safety hover:text-safety hover:bg-void/80 backdrop-blur-sm px-8 py-6 text-sm tracking-[0.2em]">
                            INIITIATE ACCESS
                        </Button>
                    </div>
                </div>
            </div>

            {/* Slider Controls */}
            <div className="absolute bottom-12 left-0 right-0 z-30 px-12 flex justify-between items-end pointer-events-none">

                {/* Counter */}
                <div className="font-mono text-xs flex flex-col gap-1 text-stone-500">
                    <span className="text-safety text-lg tracking-widest">0{current + 1}</span>
                    <span className="w-8 h-[1px] bg-stone-700"></span>
                    <span className="tracking-widest">0{banners.length}</span>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={prevSlide}
                        className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-safety text-stone-400 hover:text-safety transition-all bg-void/50 backdrop-blur-sm group/btn"
                    >
                        <ChevronLeft size={20} className="group-hover/btn:-translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-safety text-stone-400 hover:text-safety transition-all bg-void/50 backdrop-blur-sm group/btn"
                    >
                        <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Progress Bar (Top) */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5 z-30">
                <motion.div
                    key={current}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 7, ease: "linear" }}
                    className="h-full bg-safety"
                />
            </div>
        </section>
    );
};

export default Hero;
