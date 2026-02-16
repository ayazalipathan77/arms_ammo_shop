
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, Award, Search, X, Shield } from 'lucide-react';
import { artistApi, transformArtist } from '../services/api'; // Using artistApi for manufacturers for now
import { Manufacturer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleSystem from '../components/features/ParticleSystem';

export const Brands: React.FC = () => {
    const [brands, setBrands] = useState<Manufacturer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBrands = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await artistApi.getAll();
                const transformedBrands = response.artists.map(transformArtist);
                setBrands(transformedBrands);
            } catch (err) {
                console.error('Error fetching brands:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch brands');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBrands();
    }, []);

    const filteredBrands = useMemo(() => {
        if (!searchTerm.trim()) return brands;
        const term = searchTerm.toLowerCase();
        return brands.filter(brand =>
            brand.name.toLowerCase().includes(term) ||
            brand.countryOfOrigin?.toLowerCase().includes(term) ||
            brand.description?.toLowerCase().includes(term)
        );
    }, [brands, searchTerm]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-void">
                <Loader2 className="w-10 h-10 text-tangerine animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-void text-pearl">
                <p className="text-red-500 font-mono mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="text-xs uppercase tracking-widest border border-tangerine px-6 py-3 hover:bg-tangerine hover:text-void transition-colors">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 md:px-12 relative overflow-hidden bg-void">
            <ParticleSystem />

            {/* Background Gradient Orbs */}
            <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-tangerine/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-stone-800/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1920px] mx-auto relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-800 pb-8">
                        <div>
                            <h1 className="text-4xl md:text-7xl font-display font-bold text-pearl mb-2 flex items-center gap-4">
                                <Shield className="text-tangerine w-12 h-12 md:w-20 md:h-20" />
                                BRANDS
                            </h1>
                            <p className="text-stone-500 font-mono text-sm tracking-widest uppercase ml-2">
                                Trusted Manufacturers
                            </p>
                        </div>

                        <div className="relative group w-full md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-tangerine transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search Brands..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-charcoal border border-stone-800 rounded-sm py-3 pl-11 pr-10 text-xs font-mono text-pearl focus:border-tangerine outline-none transition-all placeholder:text-stone-600 uppercase tracking-widest"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-tangerine transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Grid */}
                <div className="w-full">
                    {filteredBrands.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            <AnimatePresence>
                                {filteredBrands.map((brand, i) => (
                                    <motion.div
                                        key={brand.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link to={`/brands/${brand.id}`} className="group relative block bg-charcoal border border-stone-800 hover:border-tangerine transition-all duration-300 p-8 flex flex-col items-center justify-center aspect-square text-center">
                                            <div className="w-24 h-24 mb-6 rounded-full overflow-hidden bg-void border border-stone-800 group-hover:scale-110 transition-transform duration-500 relative">
                                                {/* Placeholder generic image if none */}
                                                <img
                                                    src={brand.imageUrl}
                                                    alt={brand.name}
                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${brand.name}&background=1a1a1a&color=d65a31`;
                                                    }}
                                                />
                                            </div>

                                            <h2 className="font-display text-lg text-pearl group-hover:text-tangerine transition-colors uppercase tracking-tight mb-1">{brand.name}</h2>
                                            <p className="text-stone-500 text-[10px] font-mono uppercase tracking-widest">{brand.countryOfOrigin}</p>

                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                <ArrowRight size={16} className="text-tangerine" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {filteredBrands.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-stone-800 bg-charcoal/30">
                            <p className="font-display text-2xl text-stone-500 mb-2 uppercase tracking-wide">No Brands Found</p>
                            <button onClick={() => setSearchTerm('')} className="text-tangerine text-xs uppercase tracking-widest hover:underline">Clear Search</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
