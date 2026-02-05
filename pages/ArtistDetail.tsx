import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Loader2, Globe, Sparkles, ArrowRight, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { artistApi, artworkApi, transformArtwork, PaginationInfo } from '../services/api';
import { Artist, Artwork } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'framer-motion';

const ARTWORKS_PER_PAGE = 12;

export const ArtistDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [artist, setArtist] = useState<Artist | null>(null);
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: 1,
        limit: ARTWORKS_PER_PAGE,
        totalPages: 0
    });
    const [totalArtworksCount, setTotalArtworksCount] = useState(0);
    const [soldCount, setSoldCount] = useState(0);

    // Fetch artworks with pagination
    const fetchArtworks = useCallback(async (page: number) => {
        if (!id) return;
        setIsLoadingArtworks(true);
        try {
            const { artworks: artworksData, pagination: paginationData } = await artworkApi.getByArtist(id, {
                page,
                limit: ARTWORKS_PER_PAGE
            });
            setArtworks(artworksData.map(transformArtwork));
            setPagination(paginationData);
            // Store total count from first fetch
            if (page === 1) {
                setTotalArtworksCount(paginationData.total);
            }
        } catch (err) {
            console.error('Failed to load artworks:', err);
        } finally {
            setIsLoadingArtworks(false);
        }
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const { artist: artistData } = await artistApi.getById(id);
                setArtist({
                    id: artistData.id,
                    name: artistData.user.fullName,
                    bio: artistData.bio || '',
                    imageUrl: artistData.imageUrl || `https://picsum.photos/seed/${artistData.id}/400/400`,
                    specialty: artistData.originCity || 'Contemporary Art',
                });

                // Fetch first page of artworks
                const { artworks: artworksData, pagination: paginationData } = await artworkApi.getByArtist(id, {
                    page: 1,
                    limit: ARTWORKS_PER_PAGE
                });
                setArtworks(artworksData.map(transformArtwork));
                setPagination(paginationData);
                setTotalArtworksCount(paginationData.total);

                // Count sold artworks (need to fetch all for accurate count or use API)
                const soldArtworks = artworksData.filter(a => !a.inStock).length;
                setSoldCount(soldArtworks);

            } catch (err: any) {
                console.error('Failed to load artist details:', err);
                setError('Failed to load artist information.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [id]);

    // Handle page change
    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setCurrentPage(page);
            fetchArtworks(page);
            // Scroll to portfolio section
            document.getElementById('portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const total = pagination.totalPages;
        const current = currentPage;

        if (total <= 5) {
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                    <span className="text-stone-500 uppercase tracking-widest text-xs">Loading Artist...</span>
                </motion.div>
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <Sparkles className="text-stone-700 mx-auto mb-4" size={48} />
                    <p className="text-stone-400 mb-6">{error || 'Artist not found'}</p>
                    <Link to="/artists" className="text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-2 justify-center text-xs uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to Artists
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 relative overflow-hidden">
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

            <div className="max-w-screen-xl mx-auto px-6 md:px-12 relative z-10">
                {/* Back Link */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Link to="/artists" className="inline-flex items-center gap-2 text-stone-500 hover:text-amber-500 transition-colors text-xs uppercase tracking-widest">
                        <ArrowLeft size={14} /> All Artists
                    </Link>
                </motion.div>

                {/* Compact Artist Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-stone-800/50 pb-8">
                        {/* Profile Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-amber-500/50 to-yellow-500/50">
                                <div className="w-full h-full rounded-full overflow-hidden bg-stone-900">
                                    <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg border-4 border-stone-950"
                            >
                                <Sparkles size={16} className="text-stone-950" />
                            </motion.div>
                        </motion.div>

                        {/* Artist Info */}
                        <div className="flex-1">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-3 mb-2"
                            >
                                <h1 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">
                                    {artist.name}
                                </h1>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest"
                            >
                                <span className="flex items-center gap-2 text-amber-500">
                                    <Globe size={14} /> {artist.specialty}
                                </span>
                                <span className="flex items-center gap-2 text-stone-500">
                                    <MapPin size={14} /> Pakistan
                                </span>
                                <span className="flex items-center gap-2 text-stone-500">
                                    <Palette size={14} /> {totalArtworksCount} Works
                                </span>
                            </motion.div>
                        </div>

                        {/* Compact Stats */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex gap-6 md:border-l border-stone-800/50 md:pl-8"
                        >
                            <div className="text-center">
                                <p className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500">{totalArtworksCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-stone-600">Works</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500">{soldCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-stone-600">Sold</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Content Grid - Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: About - Compact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-4"
                    >
                        <div className="bg-stone-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-amber-500/30 transition-all duration-500 sticky top-28">
                            <h3 className="font-serif text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-3 tracking-wide">About</h3>
                            <div className="text-stone-400 text-sm leading-relaxed space-y-4">
                                {artist.bio ? (
                                    artist.bio.split('\n').map((paragraph, i) => (
                                        <p key={i}>{paragraph}</p>
                                    ))
                                ) : (
                                    <p className="text-stone-500 italic">No biography available.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Portfolio - Compact Grid */}
                    <motion.div
                        id="portfolio-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="lg:col-span-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white tracking-wide">Portfolio</h3>
                            <span className="text-amber-500/60 text-xs uppercase tracking-widest">
                                {totalArtworksCount - soldCount} Available
                            </span>
                        </div>

                        {isLoadingArtworks ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                <p className="text-stone-500 text-xs uppercase tracking-widest mt-4">Loading artworks...</p>
                            </div>
                        ) : artworks.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-stone-800/50 rounded-2xl bg-stone-900/20">
                                <Sparkles className="text-stone-700 mx-auto mb-4" size={40} />
                                <p className="text-stone-500 font-serif text-lg">No artworks currently available.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {artworks.map((art, idx) => (
                                        <motion.div
                                            key={art.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * idx }}
                                        >
                                            <Link to={`/artwork/${art.id}`} className="group block">
                                                <motion.div
                                                    whileHover={{ y: -4 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    className="bg-stone-900/30 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all duration-500"
                                                >
                                                    <div className="relative aspect-[3/4] overflow-hidden">
                                                        <img
                                                            src={art.imageUrl}
                                                            alt={art.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                        {!art.inStock && (
                                                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                                                <span className="border border-white/50 text-white px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">Sold</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                                <span className="text-amber-500 text-xs font-medium">View</span>
                                                                <ArrowRight size={14} className="text-amber-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="font-serif text-sm text-white group-hover:text-amber-400 transition-colors truncate">{art.title}</h4>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <p className="text-stone-600 text-[10px] uppercase tracking-wider">{art.year}</p>
                                                            <p className="text-amber-500/80 text-xs font-medium">{formatCurrency(art.price)}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10">
                                        {/* Previous Button */}
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${currentPage === 1
                                                ? 'text-stone-600 cursor-not-allowed'
                                                : 'text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 border border-stone-800/50 hover:border-amber-500/30'
                                                }`}
                                        >
                                            <ChevronLeft size={14} />
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center gap-1">
                                            {getPageNumbers().map((page, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => typeof page === 'number' && goToPage(page)}
                                                    disabled={page === '...'}
                                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${page === currentPage
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
                                            className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${currentPage === pagination.totalPages
                                                ? 'text-stone-600 cursor-not-allowed'
                                                : 'text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 border border-stone-800/50 hover:border-amber-500/30'
                                                }`}
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Pagination Info */}
                                {pagination.total > 0 && (
                                    <div className="text-center text-stone-600 text-xs uppercase tracking-widest mt-4">
                                        Showing {((currentPage - 1) * ARTWORKS_PER_PAGE) + 1} - {Math.min(currentPage * ARTWORKS_PER_PAGE, pagination.total)} of {pagination.total}
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
