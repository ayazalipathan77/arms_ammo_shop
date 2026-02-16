
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Filter, Search, Loader2, X, ChevronDown, Check, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';

const ITEMS_PER_PAGE = 20;

export const Shop: React.FC = () => {
    const {
        products,
        isLoading,
        error,
        availableCategories,
        availableTypes, // Was mediums
        fetchProducts,
        pagination
    } = useShop();

    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const isInitialMount = useRef(true);

    // Initialize state from URL params
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
    const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'All'); // Was medium
    const [selectedStock, setSelectedStock] = useState<'All' | 'Available' | 'Out of Stock'>(
        (searchParams.get('stock') as 'All' | 'Available' | 'Out of Stock') || 'All'
    );
    const [currentPage, setCurrentPage] = useState<number>(
        parseInt(searchParams.get('page') || '1', 10)
    );
    const brandIdParam = searchParams.get('brandId'); // Was artistId

    // Sync state from URL params
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        const urlCategory = searchParams.get('category') || 'All';
        const urlType = searchParams.get('type') || 'All';
        const urlStock = (searchParams.get('stock') as 'All' | 'Available' | 'Out of Stock') || 'All';
        const urlPage = parseInt(searchParams.get('page') || '1', 10);

        if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
        if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
        if (urlType !== selectedType) setSelectedType(urlType);
        if (urlStock !== selectedStock) setSelectedStock(urlStock);
        if (urlPage !== currentPage) setCurrentPage(urlPage);
    }, [searchParams]);

    const categories = ['All', ...availableCategories];
    const types = ['All', ...availableTypes];
    const stockOptions: ('All' | 'Available' | 'Out of Stock')[] = ['All', 'Available', 'Out of Stock'];

    const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'All' || selectedType !== 'All' || selectedStock !== 'All' || brandIdParam;

    const updateUrlParams = useCallback((page: number = currentPage) => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedCategory !== 'All') params.set('category', selectedCategory);
        if (selectedType !== 'All') params.set('type', selectedType);
        if (selectedStock !== 'All') params.set('stock', selectedStock);
        if (brandIdParam) params.set('brandId', brandIdParam);
        if (page > 1) params.set('page', String(page));
        setSearchParams(params, { replace: true });
    }, [searchTerm, selectedCategory, selectedType, selectedStock, brandIdParam, currentPage, setSearchParams]);

    // Client-side filter for stock (if API doesn't handle it yet)
    const filteredProducts = products.filter(prod => {
        if (selectedStock === 'All') return true;
        if (selectedStock === 'Available') return prod.inStock;
        if (selectedStock === 'Out of Stock') return !prod.inStock;
        return true;
    });

    useEffect(() => {
        const filters: any = {
            page: currentPage,
            limit: ITEMS_PER_PAGE
        };
        if (selectedCategory !== 'All') filters.category = selectedCategory;
        if (selectedType !== 'All') filters.medium = selectedType; // Map type to medium for backend
        if (searchTerm) filters.search = searchTerm;
        if (brandIdParam) filters.artistId = brandIdParam; // Map brandId to artistId

        const timeoutId = setTimeout(() => {
            fetchProducts(filters);
            updateUrlParams(currentPage);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [selectedCategory, selectedType, searchTerm, brandIdParam, currentPage, fetchProducts, updateUrlParams]);

    // Reset page when filters change
    const prevFiltersRef = useRef({ searchTerm, selectedCategory, selectedType, brandIdParam });
    useEffect(() => {
        const prev = prevFiltersRef.current;
        if (
            prev.searchTerm !== searchTerm ||
            prev.selectedCategory !== selectedCategory ||
            prev.selectedType !== selectedType ||
            prev.brandIdParam !== brandIdParam
        ) {
            setCurrentPage(1);
        }
        prevFiltersRef.current = { searchTerm, selectedCategory, selectedType, brandIdParam };
    }, [searchTerm, selectedCategory, selectedType, brandIdParam]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setSelectedType('All');
        setSelectedStock('All');
        setCurrentPage(1);
        setSearchParams({});
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const total = pagination.totalPages;
        const current = currentPage;

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 3) pages.push('...');
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 2) pages.push('...');
            pages.push(total);
        }
        return pages;
    };

    const removeFilter = (filterType: 'search' | 'category' | 'type' | 'stock' | 'brandId') => {
        switch (filterType) {
            case 'search': setSearchTerm(''); break;
            case 'category': setSelectedCategory('All'); break;
            case 'type': setSelectedType('All'); break;
            case 'stock': setSelectedStock('All'); break;
            case 'brandId':
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('brandId');
                setSearchParams(newParams);
                break;
        }
    };

    return (
        <div className="pt-24 pb-20 min-h-screen bg-void relative overflow-hidden px-6 md:px-12">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-tangerine/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-stone-800/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1920px] mx-auto relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 border-b border-stone-800 pb-8 flex flex-col md:flex-row justify-between items-end gap-6"
                >
                    <div>
                        <h1 className="font-display text-4xl text-pearl uppercase tracking-tighter mb-2 flex items-center gap-3">
                            <Target className="text-tangerine" />
                            Armory
                        </h1>
                        <p className="text-stone-500 text-xs uppercase tracking-[0.2em] font-mono">
                            {isLoading ? 'Loading Inventory...' : `${filteredProducts.length} Products Available`}
                        </p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto items-center">
                        {/* Search */}
                        <div className="relative flex-1 md:w-72 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-tangerine transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search By Name, Caliber..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-charcoal border border-stone-800 rounded-sm pl-11 pr-4 py-3 text-xs focus:outline-none text-pearl placeholder:text-stone-600 focus:border-tangerine transition-all uppercase tracking-wider font-mono"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setFilterOpen(true)}
                            className={`relative flex items-center gap-2 uppercase tracking-widest text-xs border px-6 py-3 rounded-sm transition-all font-bold ${hasActiveFilters ? 'text-tangerine border-tangerine/50 bg-tangerine/10' : 'text-stone-400 border-stone-800 hover:border-tangerine hover:text-tangerine'}`}
                        >
                            <Filter size={14} /> Filters
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-tangerine text-void text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {[searchTerm, selectedCategory !== 'All', selectedType !== 'All', selectedStock !== 'All', brandIdParam].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Active Filters */}
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-wrap items-center gap-3 mb-8"
                    >
                        <span className="text-stone-600 text-[10px] uppercase tracking-widest font-bold">Active Filters:</span>

                        {searchTerm && (
                            <button onClick={() => removeFilter('search')} className="filter-tag">
                                Search: "{searchTerm}" <X size={10} />
                            </button>
                        )}
                        {selectedCategory !== 'All' && (
                            <button onClick={() => removeFilter('category')} className="filter-tag">
                                Category: {selectedCategory} <X size={10} />
                            </button>
                        )}
                        {selectedType !== 'All' && (
                            <button onClick={() => removeFilter('type')} className="filter-tag">
                                Type: {selectedType} <X size={10} />
                            </button>
                        )}
                        {selectedStock !== 'All' && (
                            <button onClick={() => removeFilter('stock')} className="filter-tag">
                                Status: {selectedStock} <X size={10} />
                            </button>
                        )}
                        {brandIdParam && (
                            <button onClick={() => removeFilter('brandId')} className="filter-tag">
                                Specific Brand <X size={10} />
                            </button>
                        )}
                        <button onClick={clearFilters} className="text-red-500 text-[10px] uppercase tracking-widest hover:underline ml-2">
                            Clear All
                        </button>
                    </motion.div>
                )}

                {/* Product Grid */}
                <div className="min-h-[50vh]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="w-8 h-8 text-tangerine animate-spin" />
                            <p className="text-stone-500 text-xs uppercase tracking-widest">Loading Arsenal...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-500 mb-4 font-mono">{error}</p>
                            <button onClick={() => fetchProducts()} className="text-stone-400 hover:text-tangerine underline text-xs uppercase tracking-widest">Retry</button>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-32 border border-dashed border-stone-800 bg-charcoal/30">
                            <p className="text-pearl font-display text-2xl mb-2 uppercase tracking-wide">No Results Found</p>
                            <p className="text-stone-600 text-xs uppercase tracking-wider mb-6">Adjust your filters to see more results</p>
                            <button onClick={clearFilters} className="text-tangerine hover:text-white text-xs uppercase tracking-widest border-b border-tangerine pb-1">Reset Filters</button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-16 pb-8">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="pagination-btn disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ChevronLeft size={14} /> Prev
                                    </button>
                                    <div className="flex gap-1">
                                        {getPageNumbers().map((page, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => typeof page === 'number' && goToPage(page)}
                                                disabled={page === '...'}
                                                className={`w-8 h-8 flex items-center justify-center text-xs font-mono border ${page === currentPage ? 'bg-tangerine border-tangerine text-void font-bold' : 'border-stone-800 text-stone-400 hover:border-tangerine hover:text-tangerine'}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === pagination.totalPages}
                                        className="pagination-btn disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        Next <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            {/* Filter Sidebar */}
            <div className={`fixed inset-0 z-50 pointer-events-none transition-visibility duration-500 ${filterOpen ? 'pointer-events-auto' : ''}`}>
                <div
                    className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${filterOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setFilterOpen(false)}
                />
                <div className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-void border-l border-stone-800 shadow-2xl transition-transform duration-500 ${filterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-8 border-b border-stone-800 pb-4">
                            <h2 className="font-display text-2xl text-pearl uppercase tracking-wider">Filters</h2>
                            <button onClick={() => setFilterOpen(false)} className="text-stone-500 hover:text-tangerine">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                            <FilterGroup title="Category" options={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
                            <FilterGroup title="Type" options={types} selected={selectedType} onSelect={setSelectedType} />
                            <FilterGroup title="Availability" options={stockOptions} selected={selectedStock} onSelect={setSelectedStock} />
                        </div>

                        <div className="pt-8 border-t border-stone-800">
                            <button
                                onClick={clearFilters}
                                className="w-full py-3 border border-stone-700 text-stone-400 uppercase tracking-widest text-xs hover:bg-stone-800 hover:text-tangerine hover:border-tangerine transition-all"
                            >
                                Reset All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FilterGroup = ({ title, options, selected, onSelect }: any) => (
    <div>
        <h3 className="text-tangerine text-xs uppercase tracking-widest mb-3 font-bold">{title}</h3>
        <div className="space-y-1">
            {options.map((opt: string) => (
                <button
                    key={opt}
                    onClick={() => onSelect(opt)}
                    className={`flex items-center justify-between w-full text-left py-2 px-3 text-xs uppercase tracking-wider transition-all border border-transparent ${selected === opt ? 'bg-stone-800 text-white border-stone-700' : 'text-stone-500 hover:text-tangerine hover:bg-stone-900'}`}
                >
                    {opt}
                    {selected === opt && <Check size={12} className="text-tangerine" />}
                </button>
            ))}
        </div>
    </div>
);
