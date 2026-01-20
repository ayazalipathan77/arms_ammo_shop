import React, { useState, useEffect } from 'react';
import { useGallery } from '../context/GalleryContext';
import { Filter, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../App';

export const Gallery: React.FC = () => {
  const { convertPrice } = useCurrency();
  const {
    artworks,
    isLoading,
    error,
    availableCategories,
    availableMediums,
    fetchArtworks
  } = useGallery();

  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMedium, setSelectedMedium] = useState<string>('All');

  // Fetch artworks when filters change
  useEffect(() => {
    const filters: any = {};

    if (selectedCategory !== 'All') {
      filters.category = selectedCategory;
    }

    if (selectedMedium !== 'All') {
      filters.medium = selectedMedium;
    }

    if (searchTerm) {
      filters.search = searchTerm;
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchArtworks(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, selectedMedium, searchTerm, fetchArtworks]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedMedium('All');
  };

  // Build category list from API + default "All"
  const categories = ['All', ...availableCategories];
  const mediums = ['All', ...availableMediums.map(m => {
    // Extract short name from medium (e.g., "Oil on Canvas" -> "Oil")
    if (m.includes('Oil')) return 'Oil';
    if (m.includes('Acrylic')) return 'Acrylic';
    if (m.includes('Silver')) return 'Silver Leaf';
    if (m.includes('Gouache')) return 'Gouache';
    if (m.includes('Mixed')) return 'Mixed Media';
    return m;
  })].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

  return (
    <div className="pt-32 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
           <h1 className="font-serif text-5xl text-stone-100 mb-2">The Collection</h1>
           <p className="text-stone-500 text-sm tracking-wide uppercase">Authentic works from verified artists.</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-80 border-b border-stone-700 focus-within:border-amber-500 transition-colors">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            <input
              type="text"
              placeholder="SEARCH MASTERPIECES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-8 pr-4 py-3 text-sm focus:outline-none text-white placeholder:text-stone-600 uppercase tracking-widest"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`p-3 border border-stone-700 hover:border-amber-500 transition-colors ${filterOpen ? 'bg-stone-800' : ''}`}
          >
            <Filter size={20} className={filterOpen ? 'text-amber-500' : 'text-stone-400'} />
          </button>
        </div>
      </div>

      <div className="flex gap-12 relative">
        {/* Sidebar Filters */}
        <aside className={`w-64 flex-shrink-0 space-y-10 transition-all duration-300 ${filterOpen ? 'opacity-100 translate-x-0' : 'absolute -translate-x-full opacity-0 pointer-events-none'}`}>
            <div>
              <h3 className="text-stone-200 font-serif text-xl mb-6 italic">Category</h3>
              <div className="space-y-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`block w-full text-left text-xs uppercase tracking-widest transition-colors ${selectedCategory === cat ? 'text-amber-500 font-bold' : 'text-stone-500 hover:text-stone-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-stone-200 font-serif text-xl mb-6 italic">Medium</h3>
              <div className="space-y-3">
                {mediums.map(med => (
                  <button
                    key={med}
                    onClick={() => setSelectedMedium(med)}
                    className={`block w-full text-left text-xs uppercase tracking-widest transition-colors ${selectedMedium === med ? 'text-amber-500 font-bold' : 'text-stone-500 hover:text-stone-300'}`}
                  >
                    {med}
                  </button>
                ))}
              </div>
            </div>

            <div>
               <h3 className="text-stone-200 font-serif text-xl mb-6 italic">Price</h3>
               {/* Simple Range Slider Placeholder */}
               <input type="range" className="w-full h-1 bg-stone-800 appearance-none cursor-pointer" />
            </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <span className="ml-3 text-stone-400">Loading artworks...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 border border-dashed border-red-800">
               <p className="font-serif text-2xl mb-2">Error loading artworks</p>
               <p className="text-sm text-stone-500 mb-4">{error}</p>
               <button onClick={() => fetchArtworks()} className="text-amber-500 text-sm hover:underline">Try Again</button>
            </div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-20 text-stone-500 border border-dashed border-stone-800">
               <p className="font-serif text-2xl mb-2">No artworks found</p>
               <button onClick={clearFilters} className="text-amber-500 text-sm hover:underline">Clear Filters</button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${!filterOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
              {artworks.map((art) => (
                <Link key={art.id} to={`/artwork/${art.id}`} className="group block bg-stone-900/50 hover:bg-stone-900 transition-colors duration-500">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {art.inStock ? null : (
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white border border-white px-4 py-2 uppercase tracking-widest text-xs">Sold Out</span>
                       </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-stone-200 group-hover:text-amber-500 truncate transition-colors">{art.title}</h3>
                    <p className="text-stone-500 text-xs uppercase tracking-widest mt-2 mb-4">{art.artistName}</p>
                    <div className="flex justify-between items-center border-t border-stone-800 pt-4">
                      <span className="text-stone-300 font-mono text-sm">{convertPrice(art.price)}</span>
                      <span className="text-[10px] text-stone-500 uppercase">{art.year}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
