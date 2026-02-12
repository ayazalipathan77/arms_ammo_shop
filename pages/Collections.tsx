import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../context/GalleryContext';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowRight, Layers, Search, Filter, X, ChevronDown, AlertCircle } from 'lucide-react';
import ArtworkCard from '../components/ui/ArtworkCard';
import Button from '../components/ui/Button';

export const Collections: React.FC = () => {
    const { artworks } = useGallery();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters State
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [activeMedium, setActiveMedium] = useState<string>('All');
    const [availability, setAvailability] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
    const [yearRange, setYearRange] = useState<[number, number]>([0, 0]);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Derive available categories and mediums from artworks
    const categories = useMemo(() => {
        const cats = [...new Set(artworks.map(a => a.category))].sort();
        return ['All', ...cats];
    }, [artworks]);

    const mediums = useMemo(() => {
        const meds = [...new Set(artworks.map(a => a.medium).filter(Boolean))].sort();
        return ['All', ...meds];
    }, [artworks]);

    // Derive price and year bounds
    const priceBounds = useMemo(() => {
        if (artworks.length === 0) return { min: 0, max: 1000000 };
        const prices = artworks.map(a => a.price);
        return { min: Math.min(...prices), max: Math.max(...prices) };
    }, [artworks]);

    const yearBounds = useMemo(() => {
        if (artworks.length === 0) return { min: 2000, max: new Date().getFullYear() };
        const years = artworks.map(a => a.year).filter(Boolean);
        if (years.length === 0) return { min: 2000, max: new Date().getFullYear() };
        return { min: Math.min(...years), max: Math.max(...years) };
    }, [artworks]);

    // Track initialization state
    const filtersInitialized = useRef(false);
    const initialUrlParams = useRef(new URLSearchParams(window.location.search));
    const isFirstSync = useRef(true);

    // Combined initialization: restore from URL params or use bounds defaults
    useEffect(() => {
        if (filtersInitialized.current) {
            // Bounds changed after init — clamp existing ranges
            setPriceRange(prev => [
                Math.max(prev[0], priceBounds.min),
                Math.min(prev[1], priceBounds.max)
            ]);
            setYearRange(prev => [
                Math.max(prev[0], yearBounds.min),
                Math.min(prev[1], yearBounds.max)
            ]);
            return;
        }

        // Wait for artworks to load so bounds are real
        if (artworks.length === 0) return;

        const params = initialUrlParams.current;

        // Simple filters
        const cat = params.get('category');
        if (cat) setActiveCategory(cat);
        const med = params.get('medium');
        if (med) setActiveMedium(med);
        const avail = params.get('availability');
        if (avail) setAvailability(avail);
        const sort = params.get('sort');
        if (sort) setSortBy(sort);
        const search = params.get('search');
        if (search) setSearchQuery(search);

        // Price range — restore from URL or default to full bounds
        if (params.has('priceMin') || params.has('priceMax')) {
            setPriceRange([
                Number(params.get('priceMin')) || priceBounds.min,
                Number(params.get('priceMax')) || priceBounds.max
            ]);
        } else {
            setPriceRange([priceBounds.min, priceBounds.max]);
        }

        // Year range
        if (params.has('yearMin') || params.has('yearMax')) {
            setYearRange([
                Number(params.get('yearMin')) || yearBounds.min,
                Number(params.get('yearMax')) || yearBounds.max
            ]);
        } else {
            setYearRange([yearBounds.min, yearBounds.max]);
        }

        filtersInitialized.current = true;
    }, [artworks.length, priceBounds.min, priceBounds.max, yearBounds.min, yearBounds.max]);

    // Sync filter state → URL search params (skip first render)
    useEffect(() => {
        if (isFirstSync.current) {
            isFirstSync.current = false;
            return;
        }
        if (!filtersInitialized.current) return;

        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.set('category', activeCategory);
        if (activeMedium !== 'All') params.set('medium', activeMedium);
        if (availability !== 'all') params.set('availability', availability);
        if (sortBy !== 'newest') params.set('sort', sortBy);
        if (searchQuery) params.set('search', searchQuery);
        if (priceRange[0] > priceBounds.min) params.set('priceMin', String(priceRange[0]));
        if (priceRange[1] < priceBounds.max) params.set('priceMax', String(priceRange[1]));
        if (yearRange[0] > yearBounds.min) params.set('yearMin', String(yearRange[0]));
        if (yearRange[1] < yearBounds.max) params.set('yearMax', String(yearRange[1]));

        setSearchParams(params, { replace: true });
    }, [activeCategory, activeMedium, availability, sortBy, searchQuery, priceRange, yearRange]);

    // Active filter count
    const activeFilterCount = [
        activeCategory !== 'All',
        activeMedium !== 'All',
        availability !== 'all',
        searchQuery !== '',
        priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max,
        yearRange[0] > yearBounds.min || yearRange[1] < yearBounds.max,
    ].filter(Boolean).length;

    // Smart Filter Logic
    const filteredArtworks = useMemo(() => {
        return artworks.filter(art => {
            // Category Filter
            if (activeCategory !== 'All' && art.category !== activeCategory) return false;

            // Medium Filter
            if (activeMedium !== 'All' && art.medium !== activeMedium) return false;

            // Availability Filter
            if (availability === 'available' && !art.inStock) return false;
            if (availability === 'sold' && art.inStock) return false;

            // Price Range Filter
            if (art.price < priceRange[0] || art.price > priceRange[1]) return false;

            // Year Range Filter
            if (art.year && (art.year < yearRange[0] || art.year > yearRange[1])) return false;

            // Search Query (Smart Filter)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchTitle = art.title.toLowerCase().includes(query);
                const matchArtist = art.artistName.toLowerCase().includes(query);
                const matchDesc = art.description?.toLowerCase().includes(query);
                const matchMedium = art.medium?.toLowerCase().includes(query);
                if (!matchTitle && !matchArtist && !matchDesc && !matchMedium) return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'lowest') return a.price - b.price;
            if (sortBy === 'highest') return b.price - a.price;
            if (sortBy === 'oldest') return (a.year || 0) - (b.year || 0);
            // Default newest
            return (b.year || 0) - (a.year || 0);
        });
    }, [artworks, activeCategory, activeMedium, availability, sortBy, searchQuery, priceRange, yearRange]);

    const updateCategory = (cat: string) => {
        setActiveCategory(cat);
    };

    const clearAllFilters = () => {
        setActiveCategory('All');
        setActiveMedium('All');
        setAvailability('all');
        setSearchQuery('');
        setSortBy('newest');
        setPriceRange([priceBounds.min, priceBounds.max]);
        setYearRange([yearBounds.min, yearBounds.max]);
    };

    // Radio button component for reuse
    const RadioOption = ({ name, value, checked, onChange, label }: { name: string; value: string; checked: boolean; onChange: () => void; label: string }) => (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-4 h-4 border border-pearl/20 flex items-center justify-center transition-colors ${checked ? 'bg-tangerine border-tangerine' : ''}`}>
                {checked && <div className="w-2 h-2 bg-void" />}
            </div>
            <input type="radio" name={name} className="hidden" checked={checked} onChange={onChange} />
            <span className="text-warm-gray group-hover:text-tangerine text-sm font-mono">{label}</span>
        </label>
    );

    // Format price for display
    const formatPrice = (price: number) => {
        if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
        return price.toString();
    };

    return (
        <div className="min-h-screen bg-void pt-24 pb-20 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tangerine/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-charcoal/50 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-pearl/10 pb-8 high-contrast:border-black/20">
                        <div>
                            <h1 className="text-4xl md:text-7xl font-display font-bold text-pearl high-contrast:text-black mb-2">
                                COLLECTIONS
                            </h1>
                            <p className="text-tangerine font-mono text-sm tracking-widest uppercase high-contrast:text-[#D35400]">
                                Curated Artworks
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Sidebar Filters (Desktop) */}
                    <aside className="hidden lg:block w-64 space-y-5 flex-shrink-0">
                        {/* Search + Clear */}
                        <div className="space-y-2">
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
                            <button
                                onClick={clearAllFilters}
                                disabled={activeFilterCount === 0}
                                className={`w-full py-2 border font-mono text-[10px] uppercase tracking-widest transition-all ${activeFilterCount > 0 ? 'border-tangerine/40 text-tangerine hover:bg-tangerine/10' : 'border-pearl/10 text-warm-gray/30 cursor-not-allowed'}`}
                            >
                                Clear All Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                            </button>
                        </div>

                        {/* Availability */}
                        <div>
                            <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Availability</h3>
                            <div className="space-y-2">
                                <RadioOption name="availability" value="all" checked={availability === 'all'} onChange={() => setAvailability('all')} label="All Artworks" />
                                <RadioOption name="availability" value="available" checked={availability === 'available'} onChange={() => setAvailability('available')} label="Available" />
                                <RadioOption name="availability" value="sold" checked={availability === 'sold'} onChange={() => setAvailability('sold')} label="Sold" />
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Price Range</h3>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-warm-gray font-mono text-xs">
                                    <span>PKR {formatPrice(priceRange[0])}</span>
                                    <span className="text-pearl/20">—</span>
                                    <span>PKR {formatPrice(priceRange[1])}</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">Min</span>
                                        <input
                                            type="range"
                                            min={priceBounds.min}
                                            max={priceBounds.max}
                                            value={priceRange[0]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">Max</span>
                                        <input
                                            type="range"
                                            min={priceBounds.min}
                                            max={priceBounds.max}
                                            value={priceRange[1]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Categories</h3>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => updateCategory(cat)}
                                        className={`block w-full text-left font-display uppercase tracking-wider text-sm hover:text-tangerine transition-colors ${activeCategory === cat ? 'text-white font-bold pl-2 border-l-2 border-tangerine' : 'text-warm-gray'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Medium */}
                        <div>
                            <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Medium</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                                {mediums.map(med => (
                                    <button
                                        key={med}
                                        onClick={() => setActiveMedium(med)}
                                        className={`block w-full text-left font-display uppercase tracking-wider text-sm hover:text-tangerine transition-colors ${activeMedium === med ? 'text-white font-bold pl-2 border-l-2 border-tangerine' : 'text-warm-gray'}`}
                                    >
                                        {med}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Year Range */}
                        <div>
                            <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Year</h3>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-warm-gray font-mono text-xs">
                                    <span>{yearRange[0]}</span>
                                    <span className="text-pearl/20">—</span>
                                    <span>{yearRange[1]}</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">From</span>
                                        <input
                                            type="range"
                                            min={yearBounds.min}
                                            max={yearBounds.max}
                                            value={yearRange[0]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val <= yearRange[1]) setYearRange([val, yearRange[1]]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">To</span>
                                        <input
                                            type="range"
                                            min={yearBounds.min}
                                            max={yearBounds.max}
                                            value={yearRange[1]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= yearRange[0]) setYearRange([yearRange[0], val]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                    </aside>

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden mb-6">
                        <Button variant="outline" onClick={() => setMobileFiltersOpen(true)} className="w-full flex justify-between items-center">
                            <span>FILTERS / SORT {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
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
                                            <ArtworkCard artwork={art} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="py-20 text-center border border-dashed border-pearl/10 rounded-sm">
                                <AlertCircle className="mx-auto mb-4 text-tangerine/50" />
                                <h3 className="text-pearl font-display text-xl mb-2">No Artworks Found</h3>
                                <p className="text-warm-gray font-mono text-sm max-w-md mx-auto">
                                    Try adjusting your filters or search query to find what you're looking for.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="mt-6"
                                    onClick={clearAllFilters}
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
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Search</h3>
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

                            {/* Mobile Availability */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Availability</h3>
                                <select
                                    className="w-full bg-charcoal border border-pearl/20 rounded-sm px-4 py-3 text-pearl focus:border-tangerine outline-none font-mono text-xs"
                                    value={availability}
                                    onChange={(e) => setAvailability(e.target.value)}
                                >
                                    <option value="all">All Availability</option>
                                    <option value="available">Available Only</option>
                                    <option value="sold">Sold Only</option>
                                </select>
                            </div>

                            {/* Mobile Price Range */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Price Range</h3>
                                <div className="flex items-center gap-2 text-warm-gray font-mono text-xs mb-3">
                                    <span>PKR {formatPrice(priceRange[0])}</span>
                                    <span className="text-pearl/20">—</span>
                                    <span>PKR {formatPrice(priceRange[1])}</span>
                                </div>
                                <div className="space-y-3">
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">Min</span>
                                        <input
                                            type="range"
                                            min={priceBounds.min}
                                            max={priceBounds.max}
                                            value={priceRange[0]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">Max</span>
                                        <input
                                            type="range"
                                            min={priceBounds.min}
                                            max={priceBounds.max}
                                            value={priceRange[1]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Mobile Categories */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Categories</h3>
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

                            {/* Mobile Medium */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Medium</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {mediums.map(med => (
                                        <button
                                            key={med}
                                            onClick={() => setActiveMedium(med)}
                                            className={`p-3 border rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${activeMedium === med ? 'bg-tangerine text-void border-tangerine font-bold' : 'border-pearl/20 text-warm-gray'}`}
                                        >
                                            {med}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Year Range */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Year</h3>
                                <div className="flex items-center gap-2 text-warm-gray font-mono text-xs mb-3">
                                    <span>{yearRange[0]}</span>
                                    <span className="text-pearl/20">—</span>
                                    <span>{yearRange[1]}</span>
                                </div>
                                <div className="space-y-3">
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">From</span>
                                        <input
                                            type="range"
                                            min={yearBounds.min}
                                            max={yearBounds.max}
                                            value={yearRange[0]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val <= yearRange[1]) setYearRange([val, yearRange[1]]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-warm-gray/50 text-[10px] font-mono uppercase">To</span>
                                        <input
                                            type="range"
                                            min={yearBounds.min}
                                            max={yearBounds.max}
                                            value={yearRange[1]}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val >= yearRange[0]) setYearRange([yearRange[0], val]);
                                            }}
                                            className="w-full accent-amber-600 h-1 bg-charcoal appearance-none cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Mobile Sort */}
                            <div>
                                <h3 className="text-tangerine font-mono text-xs uppercase tracking-widest mb-2 font-bold">Sort By</h3>
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

                            <div className="flex gap-3 mt-8">
                                {activeFilterCount > 0 && (
                                    <Button variant="secondary" onClick={clearAllFilters} className="flex-1">
                                        CLEAR ALL
                                    </Button>
                                )}
                                <Button onClick={() => setMobileFiltersOpen(false)} className="flex-1">
                                    VIEW RESULTS ({filteredArtworks.length})
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
