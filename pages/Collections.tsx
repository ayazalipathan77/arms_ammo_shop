import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../context/GalleryContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Sparkles, Layers, Search, Filter, X, ChevronDown } from 'lucide-react';
import ArtworkCard from '../components/ui/ArtworkCard';
import Button from '../components/ui/Button';

export const Collections: React.FC = () => {
    const { artworks } = useGallery();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters State
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [availability, setAvailability] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Initial Load from URL
    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) setActiveCategory(cat);
    }, [searchParams]);

    // Categories
    const categories = ['All', 'Painting', 'Digital', 'Sculpture', 'Photography', 'Mixed Media'];

    // Smart Filter Logic
    const filteredArtworks = useMemo(() => {
        return artworks.filter(art => {
            // Category Filter
            if (activeCategory !== 'All' && art.category !== activeCategory) return false;

            // Availability Filter
            if (availability === 'available' && !art.inStock) return false;
            if (availability === 'sold' && art.inStock) return false;

            // Search Query (Smart Filter)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchTitle = art.title.toLowerCase().includes(query);
                const matchArtist = art.artistName.toLowerCase().includes(query);
                const matchDesc = art.description?.toLowerCase().includes(query);
                // Can add tags check here if tags exist in type
                if (!matchTitle && !matchArtist && !matchDesc) return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'lowest') return a.price - b.price;
            if (sortBy === 'highest') return b.price - a.price;
            if (sortBy === 'oldest') return (a.year || 0) - (b.year || 0);
            // Default newest
            return (b.year || 0) - (a.year || 0);
        });
    }, [artworks, activeCategory, availability, sortBy, searchQuery]);

    const updateCategory = (cat: string) => {
        setActiveCategory(cat);
        if (cat === 'All') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    return (
        <div className="min-h-screen bg-void pt-32 pb-20 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tangerine/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-charcoal/50 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-pearl/10 pb-8 gap-6">
                    <div>
                        <h1 className="font-display text-5xl md:text-7xl text-pearl tracking-tighter uppercase mb-4">
                            Collection <span className="text-tangerine">Archive</span>
                        </h1>
                        <p className="text-warm-gray font-mono text-sm max-w-xl">
                            Explore our curated selection of contemporary masterpieces. Use the filters to refine your search.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Sidebar Filters (Desktop) */}
                    <aside className="hidden lg:block w-64 space-y-8 flex-shrink-0">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Smart Filter..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-charcoal border border-pearl/20 rounded-sm px-4 py-3 pl-10 text-pearl focus:border-tangerine outline-none transition-all font-mono text-xs"
                            />
                            <Search className="absolute left-3 top-3 text-warm-gray w-4 h-4" />
                        </div>

                        {/* Categories */}
                        <div>
                            <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-4 font-bold">Categories</h3>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => updateCategory(cat)}
                                        className={`block w-full text-left font-display uppercase tracking-wider text-sm hover:text-white transition-colors ${activeCategory === cat ? 'text-white font-bold pl-2 border-l-2 border-tangerine' : 'text-warm-gray'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Availability */}
                        <div>
                            <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-4 font-bold">Availability</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 border border-pearl/20 flex items-center justify-center transition-colors ${availability === 'all' ? 'bg-tangerine border-tangerine' : ''}`}>
                                        {availability === 'all' && <div className="w-2 h-2 bg-void" />}
                                    </div>
                                    <input type="radio" name="availability" className="hidden" checked={availability === 'all'} onChange={() => setAvailability('all')} />
                                    <span className="text-warm-gray group-hover:text-white text-sm font-mono">All Artworks</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 border border-pearl/20 flex items-center justify-center transition-colors ${availability === 'available' ? 'bg-tangerine border-tangerine' : ''}`}>
                                        {availability === 'available' && <div className="w-2 h-2 bg-void" />}
                                    </div>
                                    <input type="radio" name="availability" className="hidden" checked={availability === 'available'} onChange={() => setAvailability('available')} />
                                    <span className="text-warm-gray group-hover:text-white text-sm font-mono">Available</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 border border-pearl/20 flex items-center justify-center transition-colors ${availability === 'sold' ? 'bg-tangerine border-tangerine' : ''}`}>
                                        {availability === 'sold' && <div className="w-2 h-2 bg-void" />}
                                    </div>
                                    <input type="radio" name="availability" className="hidden" checked={availability === 'sold'} onChange={() => setAvailability('sold')} />
                                    <span className="text-warm-gray group-hover:text-white text-sm font-mono">Sold</span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden mb-6">
                        <Button variant="outline" onClick={() => setMobileFiltersOpen(true)} className="w-full flex justify-between items-center">
                            <span>FILTERS / SORT</span>
                            <Filter size={16} />
                        </Button>
                    </div>

                    {/* Main Grid */}
                    <div className="flex-1">
                        {/* Sorting and Results Count */}
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-warm-gray font-mono text-xs">{filteredArtworks.length} RESULTS</p>
                            <div className="flex gap-4">
                                <select
                                    className="bg-transparent text-pearl font-mono text-xs uppercase outline-none cursor-pointer hover:text-tangerine"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest" className="bg-void">Newest First</option>
                                    <option value="oldest" className="bg-void">Oldest First</option>
                                    <option value="lowest" className="bg-void">Price: Low to High</option>
                                    <option value="highest" className="bg-void">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {filteredArtworks.length > 0 ? (
                            <motion.div
                                layout
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
                            >
                                <AnimatePresence>
                                    {filteredArtworks.map((art) => (
                                        <motion.div
                                            key={art.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {/* Adjusted Artcard for smaller size by wrapper className handled in grid cols, internal aspect ratio stays */}
                                            <ArtworkCard artwork={art} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="py-20 text-center border border-dashed border-pearl/10 rounded-sm">
                                <Sparkles className="mx-auto mb-4 text-tangerine/50" />
                                <h3 className="text-pearl font-display text-xl mb-2">No Artworks Found</h3>
                                <p className="text-warm-gray font-mono text-sm max-w-md mx-auto">
                                    Try adjusting your filters or search query to find what you're looking for.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="mt-6"
                                    onClick={() => {
                                        setActiveCategory('All');
                                        setAvailability('all');
                                        setSearchQuery('');
                                    }}
                                >
                                    CLEAR FILTERS
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            <AnimatePresence>
                {mobileFiltersOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-void/90 backdrop-blur-md z-50 p-6 overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-display font-bold text-pearl">Refine</h2>
                            <button onClick={() => setMobileFiltersOpen(false)} className="text-pearl hover:text-tangerine">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Mobile Search */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-4 font-bold">Search</h3>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Smart Filter..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-charcoal border border-pearl/20 rounded-sm px-4 py-3 pl-10 text-pearl focus:border-tangerine outline-none transition-all font-mono text-xs"
                                    />
                                    <Search className="absolute left-3 top-3 text-warm-gray w-4 h-4" />
                                </div>
                            </div>

                            {/* Mobile Categories */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-4 font-bold">Categories</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => updateCategory(cat)}
                                            className={`p-3 border rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-tangerine text-void border-tangerine font-bold' : 'border-pearl/20 text-warm-gray'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Availability & Sort */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-4 font-bold">Filter & Sort</h3>
                                <div className="space-y-4">
                                    <select
                                        className="w-full bg-charcoal border border-pearl/20 rounded-sm px-4 py-3 text-pearl focus:border-tangerine outline-none font-mono text-xs"
                                        value={availability}
                                        onChange={(e) => setAvailability(e.target.value)}
                                    >
                                        <option value="all">All Availability</option>
                                        <option value="available">Available Only</option>
                                        <option value="sold">Sold Only</option>
                                    </select>
                                    <select
                                        className="w-full bg-charcoal border border-pearl/20 rounded-sm px-4 py-3 text-pearl focus:border-tangerine outline-none font-mono text-xs"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="lowest">Price: Low to High</option>
                                        <option value="highest">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            <Button onClick={() => setMobileFiltersOpen(false)} className="w-full mt-8">
                                VIEW RESULTS
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
