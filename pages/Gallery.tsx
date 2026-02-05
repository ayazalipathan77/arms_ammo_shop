import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGallery } from '../context/GalleryContext';
import { Filter, Search, Loader2, X, ChevronDown, Check, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { artistApi } from '../services/api';
import { Artist } from '../types';
import { motion } from 'framer-motion';

const ITEMS_PER_PAGE = 20;

const convertPrice = (price: number) => `PKR ${price.toLocaleString()}`;

export const Gallery: React.FC = () => {
  const {
    artworks,
    isLoading,
    error,
    availableCategories,
    availableMediums,
    fetchArtworks,
    pagination
  } = useGallery();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isInitialMount = useRef(true);
  const prevLocation = useRef(location.pathname);

  // Initialize state from URL params for persistence
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
  const [selectedMedium, setSelectedMedium] = useState<string>(searchParams.get('medium') || 'All');
  const [selectedStock, setSelectedStock] = useState<'All' | 'Available' | 'Sold'>(
    (searchParams.get('stock') as 'All' | 'Available' | 'Sold') || 'All'
  );
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const artistIdParam = searchParams.get('artistId');

  // Sync state from URL params when navigating back (browser back button)
  useEffect(() => {
    // Only sync if we're on the gallery page and URL has params
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'All';
    const urlMedium = searchParams.get('medium') || 'All';
    const urlStock = (searchParams.get('stock') as 'All' | 'Available' | 'Sold') || 'All';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);

    // Update state if URL params differ from current state (handles back navigation)
    if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
    if (urlMedium !== selectedMedium) setSelectedMedium(urlMedium);
    if (urlStock !== selectedStock) setSelectedStock(urlStock);
    if (urlPage !== currentPage) setCurrentPage(urlPage);
  }, [searchParams]); // Only run when URL params change

  // Clean filter arrays
  const categories = ['All', ...availableCategories];
  const mediums = ['All', ...availableMediums];
  const stockOptions: ('All' | 'Available' | 'Sold')[] = ['All', 'Available', 'Sold'];

  // Check if any filter is active
  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'All' || selectedMedium !== 'All' || selectedStock !== 'All' || artistIdParam;

  // Update URL params when filters change (skip initial mount)
  const updateUrlParams = useCallback((page: number = currentPage) => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedMedium !== 'All') params.set('medium', selectedMedium);
    if (selectedStock !== 'All') params.set('stock', selectedStock);
    if (artistIdParam) params.set('artistId', artistIdParam);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, selectedMedium, selectedStock, artistIdParam, currentPage, setSearchParams]);

  // Client-side filter for stock availability
  const filteredArtworks = artworks.filter(art => {
    if (selectedStock === 'All') return true;
    if (selectedStock === 'Available') return art.inStock;
    if (selectedStock === 'Sold') return !art.inStock;
    return true;
  });

  // Fetch artworks when filters change and update URL
  useEffect(() => {
    const filters: any = {
      page: currentPage,
      limit: ITEMS_PER_PAGE
    };
    if (selectedCategory !== 'All') filters.category = selectedCategory;
    if (selectedMedium !== 'All') filters.medium = selectedMedium;
    if (searchTerm) filters.search = searchTerm;
    if (artistIdParam) filters.artistId = artistIdParam;

    const timeoutId = setTimeout(() => {
      fetchArtworks(filters);
      updateUrlParams(currentPage);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, selectedMedium, searchTerm, artistIdParam, currentPage, fetchArtworks, updateUrlParams]);

  // Reset to page 1 when filters change (not when page changes)
  const prevFiltersRef = useRef({ searchTerm, selectedCategory, selectedMedium, artistIdParam });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.searchTerm !== searchTerm ||
      prev.selectedCategory !== selectedCategory ||
      prev.selectedMedium !== selectedMedium ||
      prev.artistIdParam !== artistIdParam
    ) {
      setCurrentPage(1);
    }
    prevFiltersRef.current = { searchTerm, selectedCategory, selectedMedium, artistIdParam };
  }, [searchTerm, selectedCategory, selectedMedium, artistIdParam]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedMedium('All');
    setSelectedStock('All');
    setCurrentPage(1);
    setSearchParams({});
  };

  // Pagination handlers
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

  // Remove individual filter
  const removeFilter = (filterType: 'search' | 'category' | 'medium' | 'stock' | 'artistId') => {
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'category':
        setSelectedCategory('All');
        break;
      case 'medium':
        setSelectedMedium('All');
        break;
      case 'stock':
        setSelectedStock('All');
        break;
      case 'artistId':
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('artistId');
        setSearchParams(newParams);
        break;
    }
  };

  return (
    <div className="pt-32 min-h-screen bg-stone-950 relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative z-10">

        {/* Elegant Header & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-800/50 pb-8">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center gap-3 mb-2"
              >
                <Palette className="text-amber-500" size={28} />
                <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">
                  Collection
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-amber-500/60 uppercase tracking-[0.3em] text-xs flex items-center gap-2"
              >
                <Palette size={14} />
                {isLoading ? 'Curating...' : `${filteredArtworks.length} Masterpieces`}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex gap-4 w-full md:w-auto items-center"
            >
              {/* Search */}
              <div className="relative flex-1 md:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search Collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-900/50 backdrop-blur-sm border border-stone-800/50 rounded-full pl-11 pr-4 py-3 text-xs focus:outline-none text-white placeholder:text-stone-600 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setFilterOpen(true)}
                className={`relative flex items-center gap-2 uppercase tracking-widest text-xs border px-6 py-3 rounded-full transition-all ${hasActiveFilters ? 'text-amber-400 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20' : 'text-stone-400 hover:text-white border-stone-800/50 hover:border-amber-500 hover:bg-amber-500/5'}`}
              >
                <Filter size={14} /> Filters
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                    {[searchTerm, selectedCategory !== 'All', selectedMedium !== 'All', selectedStock !== 'All', artistIdParam].filter(Boolean).length}
                  </span>
                )}
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 mb-8"
          >
            <span className="text-stone-500 text-xs uppercase tracking-widest">Active Filters:</span>

            {searchTerm && (
              <button
                onClick={() => removeFilter('search')}
                className="group flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all"
              >
                <span>Search: "{searchTerm}"</span>
                <X size={12} className="group-hover:rotate-90 transition-transform" />
              </button>
            )}

            {selectedCategory !== 'All' && (
              <button
                onClick={() => removeFilter('category')}
                className="group flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all"
              >
                <span>Category: {selectedCategory}</span>
                <X size={12} className="group-hover:rotate-90 transition-transform" />
              </button>
            )}

            {selectedMedium !== 'All' && (
              <button
                onClick={() => removeFilter('medium')}
                className="group flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all"
              >
                <span>Medium: {selectedMedium}</span>
                <X size={12} className="group-hover:rotate-90 transition-transform" />
              </button>
            )}

            {selectedStock !== 'All' && (
              <button
                onClick={() => removeFilter('stock')}
                className="group flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all"
              >
                <span>Availability: {selectedStock}</span>
                <X size={12} className="group-hover:rotate-90 transition-transform" />
              </button>
            )}

            {artistIdParam && (
              <button
                onClick={() => removeFilter('artistId')}
                className="group flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider hover:bg-amber-500/20 transition-all"
              >
                <span>By Artist</span>
                <X size={12} className="group-hover:rotate-90 transition-transform" />
              </button>
            )}

            {/* Quick Reset Button */}
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-stone-400 hover:text-red-400 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border border-stone-700/50 hover:border-red-500/50 hover:bg-red-500/10 transition-all ml-2"
            >
              <X size={12} />
              <span>Clear All</span>
            </button>
          </motion.div>
        )}

      {/* Main Grid */}
      <div className="min-h-[60vh]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-stone-500 text-xs uppercase tracking-widest">Curating Collection...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4 font-serif text-xl">{error}</p>
            <button onClick={() => fetchArtworks()} className="text-stone-400 hover:text-white underline text-xs uppercase tracking-widest">Try Again</button>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-stone-800">
            <p className="text-white font-serif text-2xl mb-2">No artworks found</p>
            <p className="text-stone-500 text-sm mb-6">Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="text-amber-500 hover:text-amber-400 text-xs uppercase tracking-widest border-b border-amber-500/50 pb-1">Clear All Filters</button>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredArtworks.map((art) => (
              <Link key={art.id} to={`/artwork/${art.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-zinc-900 to-neutral-950 rounded-2xl border border-stone-800/30 shadow-2xl group-hover:shadow-amber-900/20 transition-all duration-500 mb-4">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className={`w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 opacity-90 group-hover:opacity-100 ${!art.inStock ? 'grayscale-[50%] group-hover:grayscale-[20%]' : ''}`}
                  />
                  {!art.inStock && (
                    <div className="absolute inset-0 bg-black/30 pointer-events-none rounded-2xl" />
                  )}
                  {/* Sold Badge */}
                  {!art.inStock && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-red-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg border border-red-400/30 rounded-sm">
                        SOLD
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-b-2xl">
                    <span className="text-amber-500 text-xs uppercase tracking-[0.3em] font-medium">View Details</span>
                  </div>
                </div>

                <div className="space-y-1.5 px-2">
                  <h3 className="font-serif text-lg text-white group-hover:text-amber-500 transition-colors truncate tracking-wide">{art.title}</h3>
                  <p className="text-stone-500 text-xs uppercase tracking-[0.3em] detail-text">{art.artistName}</p>
                  <div className="flex justify-between items-center pt-1.5 border-t border-stone-800/30">
                    <span className="text-white font-mono text-sm font-medium">{convertPrice(art.price)}</span>
                    <span className="text-stone-600 text-[10px] uppercase tracking-wider">{art.year}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-10 pb-6"
            >
              {/* Previous Button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${
                  currentPage === 1
                    ? 'text-stone-600 cursor-not-allowed'
                    : 'text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 border border-stone-800/50 hover:border-amber-500/30'
                }`}
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && goToPage(page)}
                    disabled={page === '...'}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                      page === currentPage
                        ? 'bg-amber-500 text-stone-950'
                        : page === '...'
                        ? 'text-stone-600 cursor-default'
                        : 'text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 border border-stone-800/50 hover:border-amber-500/30'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${
                  currentPage === pagination.totalPages
                    ? 'text-stone-600 cursor-not-allowed'
                    : 'text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 border border-stone-800/50 hover:border-amber-500/30'
                }`}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </motion.div>
          )}

          {/* Pagination Info */}
          {pagination.total > 0 && (
            <div className="text-center text-stone-600 text-xs uppercase tracking-widest pb-8">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total}
            </div>
          )}
        </>
        )}
      </div>
      </div>

      {/* Slide-over Filter Panel */}
      <div className={`fixed inset-0 z-50 pointer-events-none transition-visibility duration-500 ${filterOpen ? 'pointer-events-auto' : ''}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${filterOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setFilterOpen(false)}
        />

        {/* Sidebar */}
        <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-br from-zinc-900 to-neutral-950 border-l border-stone-800/50 shadow-2xl transition-transform duration-500 ${filterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-serif text-3xl text-white tracking-wider">Filters</h2>
              <button onClick={() => setFilterOpen(false)} className="text-stone-500 hover:text-white transition-colors w-10 h-10 rounded-full hover:bg-stone-800/50 flex items-center justify-center">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">

              {/* Categories */}
              <div>
                <h3 className="text-amber-500 text-xs uppercase tracking-[0.3em] mb-4 font-bold">Category</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center justify-between w-full text-left py-3 px-4 rounded-xl transition-all ${selectedCategory === cat ? 'bg-amber-500/10 border border-amber-500/30 text-white' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'}`}
                    >
                      <span className="text-sm tracking-wide">{cat}</span>
                      {selectedCategory === cat && <Check size={14} className="text-amber-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mediums */}
              <div>
                <h3 className="text-amber-500 text-xs uppercase tracking-[0.3em] mb-4 font-bold">Medium</h3>
                <div className="space-y-2">
                  {mediums.map(med => (
                    <button
                      key={med}
                      onClick={() => setSelectedMedium(med)}
                      className={`flex items-center justify-between w-full text-left py-3 px-4 rounded-xl transition-all ${selectedMedium === med ? 'bg-amber-500/10 border border-amber-500/30 text-white' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'}`}
                    >
                      <span className="text-sm truncate pr-4 tracking-wide">{med}</span>
                      {selectedMedium === med && <Check size={14} className="text-amber-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-amber-500 text-xs uppercase tracking-[0.3em] mb-4 font-bold">Availability</h3>
                <div className="space-y-2">
                  {stockOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => setSelectedStock(option)}
                      className={`flex items-center justify-between w-full text-left py-3 px-4 rounded-xl transition-all ${selectedStock === option ? 'bg-amber-500/10 border border-amber-500/30 text-white' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'}`}
                    >
                      <span className="text-sm tracking-wide">{option}</span>
                      {selectedStock === option && <Check size={14} className="text-amber-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-stone-800/50">
              <button
                onClick={clearFilters}
                className="w-full py-4 border border-stone-700/50 rounded-xl text-stone-300 uppercase tracking-[0.3em] text-xs hover:bg-stone-800/50 hover:text-white hover:border-amber-500/30 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
