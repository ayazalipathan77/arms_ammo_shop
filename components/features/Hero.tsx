import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

// Placeholder Banner Images 
const banners = [
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
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

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
                            {/* Image with overlay */}
                            <img
                                src={banners[current].image}
                                alt={banners[current].title}
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/50 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent"></div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Content Content - Static Layer */}
            <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 md:px-12 pointer-events-none">
                <div className="max-w-[1920px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="pointer-events-auto"
                        >
                            <h2 className="text-tangerine font-mono text-sm md:text-base tracking-[0.5em] mb-4">
                                EXHIBITION 0{current + 1}
                            </h2>
                            <h1 className="text-7xl md:text-[10rem] font-display font-bold leading-none text-white mix-blend-overlay opacity-90 mb-8">
                                {banners[current].title}<br />
                                <span className="text-transparent text-stroke">{banners[current].subtitle}</span>
                            </h1>
                            <div className="flex gap-4">
                                <Button variant="primary">VIEW COLLECTION</Button>
                                <Button variant="outline">EXHIBITIONS</Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
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
