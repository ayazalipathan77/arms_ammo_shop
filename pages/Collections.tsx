import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../context/GalleryContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Sparkles, Layers, ArrowLeft } from 'lucide-react';
import ArtworkCard from '../components/ui/ArtworkCard';

export const Collections: React.FC = () => {
    const { artworks } = useGallery();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeCategory = searchParams.get('category');

    // Group artworks by category for "Collections"
    const collections = [
        {
            id: 'paintings',
            title: 'Painting',
            description: 'Contemporary expressions on canvas.',
            image: artworks.find(a => a.category === 'Painting')?.images[0] || 'https://images.unsplash.com/photo-1549887552-93f954d4393e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            count: artworks.filter(a => a.category === 'Painting').length
        },
        {
            id: 'digital',
            title: 'Digital Art',
            description: 'Pixels and code converging into visual narratives.',
            image: artworks.find(a => a.category === 'Digital')?.images[0] || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            count: artworks.filter(a => a.category === 'Digital').length
        },
        {
            id: 'sculpture',
            title: 'Sculpture',
            description: 'Three-dimensional forms defining space.',
            image: artworks.find(a => a.category === 'Sculpture')?.images[0] || 'https://images.unsplash.com/photo-1569031023594-8178a9c27943?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            count: artworks.filter(a => a.category === 'Sculpture').length
        },
        {
            id: 'photography',
            title: 'Photography',
            description: 'Capturing moments, light, and perspective.',
            image: artworks.find(a => a.category === 'Photography')?.images[0] || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            count: artworks.filter(a => a.category === 'Photography').length
        }
    ];

    // Filter artworks if category is selected
    const filteredArtworks = activeCategory
        ? artworks.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase() || (a.category === 'Digital' && activeCategory === 'Digital Art'))
        : [];

    return (
        <div className="min-h-screen bg-void pt-32 pb-20 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tangerine/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-charcoal/50 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <AnimatePresence mode="wait">
                    {!activeCategory ? (
                        /* COLLECTIONS OVERVIEW */
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="mb-20"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <Layers className="text-tangerine" size={32} />
                                    <h1 className="font-display text-5xl md:text-7xl text-pearl tracking-tighter uppercase">
                                        Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-tangerine to-amber">Collections</span>
                                    </h1>
                                </div>
                                <p className="text-warm-gray text-xl max-w-2xl font-light border-l-2 border-tangerine pl-6">
                                    Explore our distinct categories of artistic expression, curated to inspire and provoke thought.
                                </p>
                            </motion.div>

                            {/* Collections Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {collections.map((collection, index) => (
                                    <motion.div
                                        key={collection.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        className="group relative h-[400px] overflow-hidden rounded-sm cursor-pointer border border-pearl/10 bg-charcoal"
                                        onClick={() => navigate(`/collections?category=${encodeURIComponent(collection.title)}`)}
                                    >
                                        {/* Background Image */}
                                        <div className="absolute inset-0">
                                            <img
                                                src={collection.image}
                                                alt={collection.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                            />
                                            <div className="absolute inset-0 bg-void/60 group-hover:bg-void/40 transition-colors duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent opacity-90" />
                                        </div>

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 w-full p-8">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <h3 className="text-3xl font-display text-pearl uppercase mb-2 group-hover:text-tangerine transition-colors">
                                                        {collection.title}
                                                    </h3>
                                                    <p className="text-warm-gray text-sm max-w-xs opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                                        {collection.description}
                                                    </p>
                                                </div>
                                                <span className="text-6xl font-display text-white/5 absolute top-4 right-4 group-hover:text-tangerine/10 transition-colors">
                                                    0{index + 1}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center border-t border-pearl/10 pt-4 mt-4">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={16} className="text-tangerine" />
                                                    <span className="text-pearl font-mono text-sm">{collection.count} Artworks</span>
                                                </div>
                                                <div className="w-10 h-10 rounded-full border border-pearl/30 flex items-center justify-center group-hover:bg-tangerine group-hover:border-tangerine transition-all">
                                                    <ArrowRight size={20} className="text-pearl group-hover:text-void -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        /* CATEGORY VIEW */
                        <motion.div
                            key="category"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <button
                                onClick={() => navigate('/collections')}
                                className="group flex items-center gap-2 text-warm-gray hover:text-tangerine mb-8 uppercase tracking-widest text-xs font-bold transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-tangerine transition-colors">
                                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                                </div>
                                Back to Collections
                            </button>

                            <div className="mb-12 border-b border-pearl/10 pb-8">
                                <h1 className="text-4xl md:text-6xl font-display font-bold text-pearl uppercase tracking-tighter mb-4">
                                    {activeCategory}
                                </h1>
                                <p className="text-warm-gray max-w-2xl">
                                    Browsing our curated selection of {activeCategory.toLowerCase()}.
                                </p>
                            </div>

                            {filteredArtworks.length > 0 ? (
                                <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                                    {filteredArtworks.map((art) => (
                                        <div key={art.id} className="break-inside-avoid">
                                            <ArtworkCard artwork={art} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-warm-gray border border-white/5 rounded-lg bg-charcoal">
                                    <Sparkles className="mx-auto mb-4 text-tangerine/50" />
                                    <p>No artworks found in this collection.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
