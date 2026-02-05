import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChromaticClock = () => {
    // State for Pakistan time
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            // Get Pakistan time directly
            const pkTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
            setTime(new Date(pkTime));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Color bar gradient based on time (simple day/night cycle simulation for now) or random shift
    // User requested "Dominant colors of artwork currently in view" + "Living color bar"
    // Since we don't have artwork view context yet, we'll placeholder a shifting gradient.

    return (
        <div className="fixed bottom-0 left-0 right-0 h-10 bg-void flex items-center justify-between border-t border-white/5 z-50 px-6 font-mono text-xs text-warm-gray tracking-widest backdrop-blur-sm">
            {/* Context Info */}
            <div className="flex items-center gap-4">
                <span className="text-tangerine">KARACHI, PK</span>
                <span>{formatTime(time)}</span>
            </div>

            {/* Living Color Bar (Visual Indicator) */}
            <div className="flex-1 mx-8 h-[2px] bg-gradient-to-r from-void via-tangerine to-amber opacity-50 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-1/2"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Coordinates / Meta */}
            <div className="hidden md:block">
                LAT: 24.8607° N | LONG: 67.0011° E
            </div>
        </div>
    );
};

export default ChromaticClock;
