import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Loader2, Award, Palette, ChevronLeft, ChevronRight, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Manufacturer, Product } from '../types';
import { motion } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import { artistApi, artworkApi, transformArtwork, PaginationInfo } from '../services/api';

const ARTWORKS_PER_PAGE = 12;

export const BrandDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [brand, setBrand] = useState<Manufacturer | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
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
    const [totalProductsCount, setTotalProductsCount] = useState(0);
    const [soldCount, setSoldCount] = useState(0);

    // Fetch products with pagination
    const fetchProducts = useCallback(async (page: number) => {
        if (!id) return;
        setIsLoadingArtworks(true);
        try {
            const { artworks: artworksData, pagination: paginationData } = await artworkApi.getByArtist(id, {
                page,
                limit: ARTWORKS_PER_PAGE
            });
            setProducts(artworksData.map(transformArtwork));
            setPagination(paginationData);
            // Store total count from first fetch
            if (page === 1) {
                setTotalProductsCount(paginationData.total);
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
                setBrand({
                    id: artistData.id,
                    name: artistData.user.fullName,
                    description: artistData.bio || '',
                    imageUrl: artistData.imageUrl || `https://picsum.photos/seed/${artistData.id}/400/400`,
                    countryOfOrigin: artistData.originCity || 'Pakistan',
                });

                // Fetch first page of artworks
                const { artworks: artworksData, pagination: paginationData } = await artworkApi.getByArtist(id, {
                    page: 1,
                    limit: ARTWORKS_PER_PAGE
                });
                setProducts(artworksData.map(transformArtwork));
                setPagination(paginationData);
                setTotalProductsCount(paginationData.total);

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
            fetchProducts(page);
            // Scroll to catalog section
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
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
                    <span className="text-warm-gray uppercase tracking-widest text-xs">Loading Brand...</span>
                </motion.div>
            </div>
        );
    }

    if (error || !brand) {
        return (
            <div className="min-h-screen bg-void flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <AlertCircle className="text-warm-gray mx-auto mb-4" size={48} />
                    <p className="text-stone-400 mb-6">{error || 'Brand not found'}</p>
                    <Link to="/brands" className="text-tangerine hover:text-tangerine transition-colors flex items-center gap-2 justify-center text-xs uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to Brands
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-void">
            {/* ─── ARTIST PROFILE HEADER ─── */}
            <div className="pt-28 pb-12 px-6 md:px-12">
                <div className="max-w-[1920px] mx-auto">
                    <Link to="/brands" className="text-pearl/70 hover:text-tangerine flex items-center gap-2 group/back mb-10">
                        <ArrowLeft size={18} className="group-hover/back:-translate-x-1 transition-transform" />
                        <span className="uppercase tracking-widest text-xs font-mono">Back</span>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row items-center md:items-start gap-8"
                    >
                        {/* Brand Image */}
                        <div className="shrink-0">
                            <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-tangerine/30 shadow-xl shadow-tangerine/10">
                                <img
                                    src={brand.imageUrl}
                                    alt={brand.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Brand Info */}
                        <div className="text-center md:text-left min-w-0 flex-1">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-pearl leading-tight mb-4 whitespace-nowrap">
                                {brand.name}
                            </h1>
                            {brand.countryOfOrigin && (
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                                    <MapPin size={14} className="text-tangerine" />
                                    <span className="text-warm-gray text-sm">{brand.countryOfOrigin}</span>
                                </div>
                            )}
                            {brand.description && (
                                <p className="text-pearl/70 text-base md:text-lg border-l-2 border-tangerine pl-6 whitespace-pre-line">
                                    {brand.description}
                                </p>
                            )}
                        </div>
                    </motion.div>

                    {/* ─── INFO CARDS ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
                    >
                        {/* Total Works Card */}
                        <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                            <Palette size={20} className="text-tangerine mb-3" />
                            <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Total Items</p>
                            <p className="text-pearl font-mono text-sm">{totalProductsCount}</p>
                        </div>

                        {/* Sold Works Card */}
                        <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                            <Award size={20} className="text-tangerine mb-3" />
                            <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Sold</p>
                            <p className="text-pearl font-mono text-sm">{soldCount}</p>
                        </div>

                        {/* Available Works Card */}
                        <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                            <ImageIcon size={20} className="text-tangerine mb-3" />
                            <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Available</p>
                            <p className="text-pearl font-mono text-sm">{totalProductsCount - soldCount}</p>
                        </div>

                        {/* Location Card */}
                        <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                            <MapPin size={20} className="text-tangerine mb-3" />
                            <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Origin</p>
                            <p className="text-pearl text-sm">{brand.countryOfOrigin}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ─── CATALOG SECTION ─── */}
            <div className="px-6 md:px-12 pb-16" id="catalog-section">
                <div className="max-w-[1920px] mx-auto">
                    {products.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-end justify-between mb-8 border-b border-pearl/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <ImageIcon size={22} className="text-tangerine" />
                                    <h2 className="text-2xl font-display text-pearl uppercase tracking-tight">Catalog</h2>
                                </div>
                                <span className="text-tangerine font-mono text-xs uppercase tracking-widest">
                                    {totalProductsCount - soldCount} Available
                                </span>
                            </div>

                            {/* Artwork Cards Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {products.map((p, idx) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.04 }}
                                    >
                                        <ProductCard product={p} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-10"
                                >
                                    <div className="flex items-center justify-center gap-2">
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

                                    {/* Pagination Info */}
                                    {pagination.total > 0 && (
                                        <div className="text-center text-warm-gray/60 text-xs uppercase tracking-widest mt-4">
                                            Showing {((currentPage - 1) * ARTWORKS_PER_PAGE) + 1} - {Math.min(currentPage * ARTWORKS_PER_PAGE, pagination.total)} of {pagination.total}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── NO PRODUCTS MESSAGE ─── */}
                    {products.length === 0 && !isLoadingArtworks && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16 border border-dashed border-white/10 rounded-sm bg-charcoal"
                        >
                            <AlertCircle className="text-warm-gray mx-auto mb-4" size={40} />
                            <p className="text-warm-gray font-mono text-lg mb-4">No products currently available.</p>
                            <Link to="/showroom" className="text-tangerine hover:text-tangerine transition-colors flex items-center gap-2 justify-center text-xs uppercase tracking-widest">
                                <ArrowLeft size={14} /> Browse Showroom
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>

        </div>
    );
};
