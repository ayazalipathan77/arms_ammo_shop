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
            <div className="min-h-screen bg-void flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-10 h-10 text-tangerine animate-spin" />
                    <span className="text-warm-gray uppercase tracking-widest text-xs">Loading Artist...</span>
                </motion.div>
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="min-h-screen bg-void flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <Sparkles className="text-warm-gray mx-auto mb-4" size={48} />
                    <p className="text-stone-400 mb-6">{error || 'Artist not found'}</p>
                    <Link to="/artists" className="text-tangerine hover:text-amber-400 transition-colors flex items-center gap-2 justify-center text-xs uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to Artists
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-void pt-24 pb-20 relative overflow-hidden">
            {/* Ambient Background - Chromatic Brutalism */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tangerine/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-charcoal/50 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-screen-xl mx-auto px-6 md:px-12 relative z-10">
                {/* Back Link */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Link to="/artists" className="inline-flex items-center gap-2 text-warm-gray hover:text-tangerine transition-colors text-xs uppercase tracking-widest">
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
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-white/5 pb-8">
                        {/* Profile Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-tangerine/50 to-amber-500/50">
                                <div className="w-full h-full rounded-full overflow-hidden bg-charcoal">
                                    <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                                </div>
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-tangerine flex items-center justify-center shadow-lg border-4 border-void"
                            >
                                <Sparkles size={16} className="text-void" />
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
                                <h1 className="font-display text-4xl md:text-5xl text-pearl uppercase tracking-tighter">
                                    {artist.name}
                                </h1>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest"
                            >
                                <span className="flex items-center gap-2 text-tangerine font-bold">
                                    <Globe size={14} /> {artist.specialty}
                                </span>
                                <span className="flex items-center gap-2 text-warm-gray">
                                    <MapPin size={14} /> Pakistan
                                </span>
                                <span className="flex items-center gap-2 text-warm-gray">
                                    <Palette size={14} /> {totalArtworksCount} Works
                                </span>
                            </motion.div>
                        </div>

                        {/* Compact Stats */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex gap-6 md:border-l border-white/10 md:pl-8"
                        >
                            <div className="text-center">
                                <p className="text-2xl font-display text-transparent bg-clip-text bg-gradient-to-b from-pearl to-warm-gray">{totalArtworksCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-warm-gray/60">Works</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-display text-transparent bg-clip-text bg-gradient-to-b from-pearl to-warm-gray">{soldCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-warm-gray/60">Sold</p>
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
                        <div className="bg-charcoal border border-white/5 p-6 rounded-sm sticky top-28">
                            <h3 className="font-display text-xl text-pearl mb-3 tracking-wide uppercase">About</h3>
                            <div className="text-warm-gray text-sm leading-relaxed space-y-4">
                                {artist.bio ? (
                                    artist.bio.split('\n').map((paragraph, i) => (
                                        <p key={i}>{paragraph}</p>
                                    ))
                                ) : (
                                    <p className="text-warm-gray/50 italic">No biography available.</p>
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
                            <h3 className="font-display text-2xl text-pearl tracking-wide uppercase">Portfolio</h3>
                            <span className="text-tangerine text-xs uppercase tracking-widest font-bold">
                                {totalArtworksCount - soldCount} Available
                            </span>
                        </div>

                        {isLoadingArtworks ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 text-tangerine animate-spin" />
                                <p className="text-warm-gray text-xs uppercase tracking-widest mt-4">Loading artworks...</p>
                            </div>
                        ) : artworks.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-white/10 rounded-sm bg-charcoal">
                                <Sparkles className="text-warm-gray mx-auto mb-4" size={40} />
                                <p className="text-warm-gray font-mono text-lg">No artworks currently available.</p>
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
                                                    className="bg-charcoal border border-white/5 rounded-sm overflow-hidden hover:border-tangerine/50 transition-all duration-500"
                                                >
                                                    <div className="relative aspect-[3/4] overflow-hidden">
                                                        <img
                                                            src={art.imageUrl}
                                                            alt={art.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                                        />
                                                        {!art.inStock && (
                                                            <div className="absolute inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center">
                                                                <span className="border border-pearl/50 text-pearl px-3 py-1 rounded-full uppercase text-[10px] tracking-widest font-bold">Sold</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                                <span className="text-tangerine text-xs font-bold uppercase tracking-widest">View</span>
                                                                <ArrowRight size={14} className="text-tangerine" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="font-display text-sm text-pearl group-hover:text-tangerine transition-colors truncate uppercase">{art.title}</h4>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <p className="text-warm-gray text-[10px] uppercase tracking-wider">{art.year}</p>
                                                            <p className="text-tangerine text-xs font-bold">{formatCurrency(art.price)}</p>
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
                                                ? 'text-warm-gray/30 cursor-not-allowed'
                                                : 'text-warm-gray hover:text-tangerine hover:bg-tangerine/10 border border-white/10 hover:border-tangerine/30'
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
                                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${page === currentPage
                                                        ? 'bg-tangerine text-void'
                                                        : page === '...'
                                                            ? 'text-warm-gray cursor-default'
                                                            : 'text-warm-gray hover:text-tangerine hover:bg-tangerine/10 border border-white/10 hover:border-tangerine/30'
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
                                                ? 'text-warm-gray/30 cursor-not-allowed'
                                                : 'text-warm-gray hover:text-tangerine hover:bg-tangerine/10 border border-white/10 hover:border-tangerine/30'
                                                }`}
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Pagination Info */}
                                {pagination.total > 0 && (
                                    <div className="text-center text-warm-gray/60 text-xs uppercase tracking-widest mt-4">
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
