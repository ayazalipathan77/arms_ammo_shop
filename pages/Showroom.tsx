import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Filter, Search, Loader2, X, ChevronDown, Check, Box, ChevronLeft, ChevronRight, Target, Crosshair, Shield } from 'lucide-react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '../lib/utils';
import Button from '../components/ui/Button';

const ITEMS_PER_PAGE = 20;

export const Showroom: React.FC = () => {
  const {
    products,
    isLoading,
    error,
    availableCategories,
    availableTypes,
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
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'All');
  const [selectedStock, setSelectedStock] = useState<'All' | 'Available' | 'Sold'>(
    (searchParams.get('stock') as 'All' | 'Available' | 'Sold') || 'All'
  );
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get('page') || '1', 10)
  );

  // Major Division State (Arms vs Ammo vs Gear)
  // This helps guide the user before deep filtering
  const [division, setDivision] = useState<'ALL' | 'ARMS' | 'AMMO' | 'GEAR'>('ALL');

  // Sync state from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'All';
    const urlType = searchParams.get('type') || 'All';
    const urlStock = (searchParams.get('stock') as 'All' | 'Available' | 'Sold') || 'All';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);

    if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
    if (urlType !== selectedType) setSelectedType(urlType);
    if (urlStock !== selectedStock) setSelectedStock(urlStock);
    if (urlPage !== currentPage) setCurrentPage(urlPage);
  }, [searchParams]);

  // Deriving filter options based on Division
  // In a real app, this might query the backend with a 'division' tag
  const filteredProducts = products.filter(prod => {
    // 1. Division Filter
    if (division === 'ARMS' && prod.type !== 'FIREARM') return false;
    if (division === 'AMMO' && prod.type !== 'AMMO') return false;
    if (division === 'GEAR' && prod.type !== 'OPTIC' && prod.type !== 'ACCESSORY') return false;

    // 2. Client-side Stock Filter (if needed, though API handles most)
    if (selectedStock === 'Available' && !prod.inStock) return false;
    if (selectedStock === 'Sold' && prod.inStock) return false;

    return true;
  });

  // Calculate clean categories for the sidebar based on active division could be complex, 
  // keeping simple list for now but filtered by logic if we wanted.

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'All' || selectedType !== 'All' || selectedStock !== 'All';

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
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, selectedType, selectedStock, currentPage, setSearchParams]);

  // Fetch with debouncing
  useEffect(() => {
    const filters: any = {
      page: currentPage,
      limit: ITEMS_PER_PAGE
    };
    if (selectedCategory !== 'All') filters.category = selectedCategory;
    if (selectedType !== 'All') filters.medium = selectedType;
    if (searchTerm) filters.search = searchTerm;

    const timeoutId = setTimeout(() => {
      fetchProducts(filters);
      updateUrlParams(currentPage);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, selectedType, searchTerm, currentPage, fetchProducts, updateUrlParams]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedType('All');
    setSelectedStock('All');
    setCurrentPage(1);
    setSearchParams({});
    setDivision('ALL');
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-void text-stone-300 font-sans relative overflow-x-hidden">

      {/* Background Grid/Camouflage Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'linear-gradient(to right, #2C3025 1px, transparent 1px), linear-gradient(to bottom, #2C3025 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">

        {/* Header Section */}
        <div className="mb-12 border-b border-gunmetal pb-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-pearl uppercase leading-none mb-2">
                Tactical <span className="text-olive">Showroom</span>
              </h1>
              <p className="font-mono text-xs text-camo uppercase tracking-widest flex items-center gap-2">
                <Crosshair size={14} />
                System Status: {isLoading ? 'Scanning...' : `${filteredProducts.length} Units Deployed`}
              </p>
            </div>

            {/* Division Toggles */}
            <div className="flex bg-gunmetal/30 p-1 rounded-sm border border-gunmetal">
              {(['ALL', 'ARMS', 'AMMO', 'GEAR'] as const).map((div) => (
                <button
                  key={div}
                  onClick={() => setDivision(div)}
                  className={cn(
                    "px-6 py-2 text-xs font-display tracking-widest uppercase transition-all clip-diagonal",
                    division === div
                      ? "bg-olive text-white shadow-lg"
                      : "text-stone-500 hover:text-pearl hover:bg-gunmetal/50"
                  )}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            {/* Search */}
            <div className="relative flex-1 md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-safety transition-colors" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH DATABASE // KEYWORD OR ID"
                className="w-full bg-black/20 border border-gunmetal text-pearl text-xs font-mono py-4 pl-12 pr-4 focus:outline-none focus:border-safety transition-all placeholder:text-stone-700 uppercase"
              />
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setFilterOpen(true)}
              className={cn(
                "flex items-center gap-2 px-8 py-3 bg-black/20 border text-xs font-display tracking-widest uppercase transition-all",
                hasActiveFilters ? "border-safety text-safety" : "border-gunmetal text-camo hover:border-olive hover:text-pearl"
              )}
            >
              <Filter size={14} />
              Mission Specs
              {hasActiveFilters && <span className="w-2 h-2 bg-safety rounded-full animate-pulse ml-1"></span>}
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="min-h-[50vh]">
          {isLoading && filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
              <Loader2 className="w-12 h-12 text-olive animate-spin" />
              <p className="font-mono text-xs text-camo uppercase tracking-widest">Accessing Secure Database...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-gunmetal bg-black/10">
              <Target size={48} className="text-gunmetal mb-4" />
              <p className="font-display text-xl text-stone-500 uppercase">No Matches Found</p>
              <button onClick={clearFilters} className="mt-4 text-safety font-mono text-xs hover:underline uppercase">Reset Parameters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <Link key={prod.id} to={`/product/${prod.id}`} className="group block relative bg-gunmetal/10 border border-gunmetal/50 hover:border-olive transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(75,83,32,0.3)]">
                  {/* Card Decoration */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-stone-500/50"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-stone-500/50"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-stone-500/50"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-stone-500/50"></div>

                  {/* Image Area */}
                  <div className="aspect-[4/3] bg-black/40 overflow-hidden relative">
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
                        !prod.inStock && "grayscale opacity-50"
                      )}
                    />
                    {!prod.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                        <span className="border-2 border-alert text-alert px-4 py-2 font-display text-xl uppercase tracking-widest rotate-[-15deg]">Sold Out</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-safety font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                        View Dossier <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-display text-pearl text-lg leading-tight group-hover:text-olive transition-colors">{prod.title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-camo border-t border-gunmetal/50 pt-3">
                      <div>
                        <span className="block text-stone-600">MANUFACTURER</span>
                        <span className="text-stone-400 uppercase">{prod.manufacturerName}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-stone-600">CATEGORY</span>
                        <span className="text-stone-400 uppercase">{prod.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-display text-xl text-brass">{formatCurrency(prod.price)}</span>
                      {prod.type === 'FIREARM' && <Shield size={14} className="text-stone-600" title="FFL Required" />}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-16 gap-2">
              {/* Simple Pagination for Aesthetic */}
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-gunmetal text-stone-500 hover:text-safety disabled:opacity-30"><ChevronLeft size={20} /></button>
              <div className="flex items-center gap-1 font-mono text-sm text-camo px-4">
                PAGE <span className="text-pearl">{currentPage}</span> / {pagination.totalPages}
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pagination.totalPages} className="p-2 border border-gunmetal text-stone-500 hover:text-safety disabled:opacity-30"><ChevronRight size={20} /></button>
            </div>
          )}
        </div>

      </div>

      {/* Filter Sidebar overlay */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-void border-l border-gunmetal z-50 p-8 shadow-2xl overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10 border-b border-gunmetal pb-6">
                <h2 className="font-display text-2xl text-pearl uppercase tracking-wider">Parameters</h2>
                <button onClick={() => setFilterOpen(false)} className="text-stone-500 hover:text-safety"><X size={24} /></button>
              </div>

              <div className="space-y-8 font-mono text-sm">
                {/* Categories */}
                <div>
                  <h3 className="text-olive text-xs uppercase tracking-[0.3em] font-bold mb-4">Category</h3>
                  <div className="space-y-1">
                    {['All', ...availableCategories].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "w-full text-left py-2 px-3 uppercase tracking-wide transition-colors border-l-2",
                          selectedCategory === cat ? "border-safety text-pearl bg-white/5" : "border-transparent text-stone-500 hover:text-camo"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Types */}
                <div>
                  <h3 className="text-olive text-xs uppercase tracking-[0.3em] font-bold mb-4">Type</h3>
                  <div className="space-y-1">
                    {['All', ...availableTypes].map(typ => (
                      <button
                        key={typ}
                        onClick={() => setSelectedType(typ)}
                        className={cn(
                          "w-full text-left py-2 px-3 uppercase tracking-wide transition-colors border-l-2",
                          selectedType === typ ? "border-safety text-pearl bg-white/5" : "border-transparent text-stone-500 hover:text-camo"
                        )}
                      >
                        {typ}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="text-olive text-xs uppercase tracking-[0.3em] font-bold mb-4">Stock Status</h3>
                  <div className="flex gap-2">
                    {(['All', 'Available', 'Sold'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelectedStock(opt)}
                        className={cn(
                          "flex-1 py-2 text-xs uppercase border transition-colors",
                          selectedStock === opt ? "border-safety text-safety bg-safety/10" : "border-gunmetal text-stone-600 hover:border-camo"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 mt-auto">
                  <Button onClick={() => setFilterOpen(false)} variant="primary" className="w-full text-xs font-bold tracking-widest h-12">
                    Apply Configuration
                  </Button>
                  <button onClick={clearFilters} className="w-full mt-4 text-xs text-stone-600 hover:text-alert uppercase tracking-widest">
                    Reset System
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
