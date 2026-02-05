import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { useGallery } from '../context/GalleryContext';
import { Link } from 'react-router-dom';
const convertPrice = (price: number) => `PKR ${price.toLocaleString()}`;

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
    const { artworks, availableCategories } = useGallery();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery('');
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Filter Logic
    const results = query
        ? artworks.filter(a =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.artistName.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
        : [];

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => setIsSearching(false), 300);
        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-xl animate-fade-in flex flex-col">
            <div className="max-w-4xl w-full mx-auto px-6 md:px-12 pt-12 md:pt-32 flex-1">

                {/* Header */}
                <div className="flex justify-end mb-8">
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors p-2 rounded-full border border-stone-800 hover:border-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Input */}
                <div className="relative mb-16">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500" size={32} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search Artists, Artworks, or Collections..."
                        className="w-full bg-transparent border-b-2 border-stone-800 focus:border-amber-500 text-3xl md:text-5xl font-serif text-white py-6 pl-12 focus:outline-none transition-colors placeholder:text-stone-800"
                    />
                </div>

                {/* Results */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 h-[60vh] overflow-y-auto pb-12">

                    {/* Suggestions / Categories (Left) */}
                    <div className="md:col-span-4 space-y-8 border-r border-stone-800 pr-8 hidden md:block">
                        <div>
                            <h3 className="text-stone-500 text-xs uppercase tracking-widest mb-4">Trending Categories</h3>
                            <div className="space-y-3">
                                {availableCategories.slice(0, 5).map(cat => (
                                    <Link
                                        key={cat}
                                        to={`/gallery?category=${cat}`}
                                        onClick={onClose}
                                        className="block text-xl font-serif text-stone-300 hover:text-amber-500 transition-colors"
                                    >
                                        {cat}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Live Results (Right) */}
                    <div className="md:col-span-8">
                        {query ? (
                            isSearching ? (
                                <div className="flex items-center gap-2 text-stone-500 uppercase tracking-widest text-xs">
                                    <Loader2 className="animate-spin" size={14} /> Searching...
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-6">
                                    {results.map(art => (
                                        <Link
                                            key={art.id}
                                            to={`/artwork/${art.id}`}
                                            onClick={onClose}
                                            className="group flex gap-6 items-center border-b border-stone-900 pb-6 hover:border-stone-800 transition-colors"
                                        >
                                            <div className="w-20 h-20 bg-stone-900 flex-shrink-0">
                                                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-serif text-2xl text-white group-hover:text-amber-500 transition-colors">{art.title}</h4>
                                                <p className="text-stone-500 text-sm uppercase tracking-widest">{art.artistName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono text-stone-400 text-sm">{convertPrice(art.price)}</p>
                                                <div className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight size={20} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    <Link to={`/gallery?search=${query}`} onClick={onClose} className="block text-center py-4 bg-stone-900 hover:bg-stone-800 text-white uppercase tracking-widest text-xs transition-colors mt-8">
                                        View All Results
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-stone-500 text-lg">No results found for "{query}".</p>
                            )
                        ) : (
                            <div className="text-stone-600 text-center py-20 flex flex-col items-center">
                                <Search size={48} className="mb-4 opacity-20" />
                                <p>Start typing to discover pieces...</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
