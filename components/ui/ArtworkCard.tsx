import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Artwork } from '../../types';

interface ArtworkCardProps {
    artwork: Artwork;
    className?: string;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, className }) => {
    return (
        <Link to={`/artwork/${artwork.id}`} className="block w-full h-full">
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
                        {/* Thick Edge Simulation (Top/Left shadow/highlight handled via pseudo, simplifying here to border logic for now as requested) */}
                        {/* Orange Border Bleed */}
                        <div className="absolute inset-0 border-0 border-tangerine transition-all duration-300 group-hover:border-[6px] z-20 pointer-events-none opacity-0 group-hover:opacity-100 mix-blend-screen" />

                        <img
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                            loading="lazy"
                        />
                    </motion.div>

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />
                </motion.div>

                {/* Sticker Title */}
                <motion.div
                    className="absolute bottom-8 -left-4 bg-pearl text-void px-4 py-2 rotate-[-2deg] z-30 shadow-xl origin-bottom-left"
                    variants={{
                        rest: { x: 0, rotate: -2 },
                        hover: { x: 10, rotate: 0 }
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight">{artwork.title}</h3>
                    <p className="text-xs font-mono text-void/70 uppercase flex justify-between gap-4">
                        <span>{artwork.artistName}</span>
                        <span>{artwork.year}</span>
                    </p>
                </motion.div>

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
