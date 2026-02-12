import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Play, Image as ImageIcon, Monitor, ChevronLeft, ChevronRight, X, Expand, Eye, Box } from 'lucide-react';
import { exhibitionApi } from '../services/api';
import { Exhibition } from '../types';
import { ScrambleText } from '../components/ui/ScrambleText';

const VirtualTourModal = lazy(() => import('../components/VirtualTour/VirtualTourModal'));

export const ExhibitionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [exhibition, setExhibition] = useState<Exhibition | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
    const [showVirtualTour, setShowVirtualTour] = useState(false);

    useEffect(() => {
        const fetchExhibition = async () => {
            if (!id) return;
            try {
                const res = await exhibitionApi.getById(id);
                setExhibition(res.exhibition);
            } catch (error) {
                console.error('Failed to fetch exhibition', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExhibition();
    }, [id]);

    // Keyboard navigation for lightbox
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (selectedImageIdx === null) return;
        if (e.key === 'Escape') setSelectedImageIdx(null);
        if (e.key === 'ArrowRight') setSelectedImageIdx(prev => prev !== null ? (prev + 1) % allImages.length : null);
        if (e.key === 'ArrowLeft') setSelectedImageIdx(prev => prev !== null ? (prev === 0 ? allImages.length - 1 : prev - 1) : null);
    }, [selectedImageIdx]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (loading) {
        return (
            <div className="min-h-screen bg-void flex items-center justify-center">
                <div className="w-4 h-4 bg-tangerine animate-ping" />
            </div>
        );
    }

    if (!exhibition) {
        return (
            <div className="min-h-screen bg-void flex flex-col items-center justify-center text-pearl">
                <h1 className="text-4xl font-display mb-4">Exhibition Not Found</h1>
                <Link to="/exhibitions" className="text-tangerine hover:underline flex items-center gap-2">
                    <ArrowLeft size={20} /> Back to Exhibitions
                </Link>
            </div>
        );
    }

    // Parse YouTube ID
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = exhibition.videoUrl ? getYoutubeId(exhibition.videoUrl) : null;

    // All viewable images: cover + gallery
    const allImages = [
        exhibition.imageUrl,
        ...(exhibition.galleryImages || [])
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CURRENT': return 'bg-tangerine text-void';
            case 'UPCOMING': return 'bg-amber text-void';
            default: return 'bg-warm-gray/30 text-pearl border border-warm-gray/50';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'CURRENT': return 'Now Open';
            case 'UPCOMING': return 'Upcoming';
            default: return 'Past Exhibition';
        }
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImageIdx !== null) {
            setSelectedImageIdx(selectedImageIdx === 0 ? allImages.length - 1 : selectedImageIdx - 1);
        }
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImageIdx !== null) {
            setSelectedImageIdx(selectedImageIdx === allImages.length - 1 ? 0 : selectedImageIdx + 1);
        }
    };

    return (
        <div className="min-h-screen bg-void">

            {/* ─── CINEMATIC HERO BANNER ─── */}
            <div className="relative h-[70vh] md:h-[80vh] overflow-hidden group cursor-zoom-in" onClick={() => setSelectedImageIdx(0)}>
                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    src={exhibition.imageUrl}
                    alt={exhibition.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-void/40 to-transparent" />

                {/* Back Link - overlaid */}
                <Link to="/exhibitions" className="absolute top-28 left-6 md:left-12 z-20 text-pearl/70 hover:text-tangerine flex items-center gap-2 group/back">
                    <ArrowLeft size={18} className="group-hover/back:-translate-x-1 transition-transform" />
                    <span className="uppercase tracking-widest text-xs font-mono">Back</span>
                </Link>

                {/* Status Badge */}
                <div className="absolute top-28 right-6 md:right-12 z-20">
                    <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${getStatusStyle(exhibition.status)}`}>
                        {getStatusLabel(exhibition.status)}
                    </div>
                </div>

                {/* Expand hint */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="bg-void/60 backdrop-blur-sm p-4 border border-pearl/20">
                        <Expand size={24} className="text-pearl" />
                    </div>
                </div>

                {/* Hero Content - bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-10 px-6 md:px-12 pb-12">
                    <div className="max-w-[1920px] mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-pearl leading-[0.9] mb-6 max-w-4xl">
                                <ScrambleText text={exhibition.title} />
                            </h1>

                            {exhibition.description && (
                                <p className="text-pearl/70 leading-relaxed text-base md:text-lg max-w-2xl border-l-2 border-tangerine pl-6 mb-8">
                                    {exhibition.description}
                                </p>
                            )}

                            {/* Inline meta */}
                            <div className="flex flex-wrap items-center gap-6 text-xs font-mono uppercase tracking-widest text-pearl/50">
                                <span className="flex items-center gap-2">
                                    <Calendar size={14} className="text-tangerine" />
                                    {new Date(exhibition.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {exhibition.endDate && ` — ${new Date(exhibition.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                </span>
                                <span className="flex items-center gap-2">
                                    <MapPin size={14} className="text-tangerine" />
                                    {exhibition.location}
                                </span>
                                {allImages.length > 1 && (
                                    <span className="flex items-center gap-2">
                                        <ImageIcon size={14} className="text-tangerine" />
                                        {allImages.length} photos
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ─── CONTENT AREA ─── */}
            <div className="px-6 md:px-12 py-16">
                <div className="max-w-[1920px] mx-auto">

                    {/* ─── INFO CARDS ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
                    >
                        {/* Date Card */}
                        <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                            <Calendar size={20} className="text-tangerine mb-3" />
                            <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Dates</p>
                            <p className="text-pearl font-mono text-sm">
                                {new Date(exhibition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </p>
                            {exhibition.endDate && (
                                <p className="text-warm-gray/70 text-xs font-mono mt-1">
                                    to {new Date(exhibition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            )}
                        </div>

                        {/* Location Card */}
                        <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                            <MapPin size={20} className="text-tangerine mb-3" />
                            <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Location</p>
                            <p className="text-pearl text-sm">{exhibition.location}</p>
                        </div>

                        {/* Gallery Count Card */}
                        <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                            <ImageIcon size={20} className="text-tangerine mb-3" />
                            <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Gallery</p>
                            <p className="text-pearl text-sm">{allImages.length} {allImages.length === 1 ? 'photograph' : 'photographs'}</p>
                        </div>

                        {/* Virtual / Video Card */}
                        {exhibition.isVirtual ? (
                            <button
                                onClick={() => setShowVirtualTour(true)}
                                className="bg-charcoal/40 backdrop-blur-sm border border-tangerine/30 p-6 hover:border-tangerine hover:bg-tangerine/10 transition-all text-left group cursor-pointer"
                            >
                                <Box size={20} className="text-tangerine mb-3 group-hover:scale-110 transition-transform" />
                                <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Virtual Tour</p>
                                <p className="text-tangerine text-sm font-bold">Enter 3D Gallery →</p>
                            </button>
                        ) : (
                            <div className="bg-charcoal/40 backdrop-blur-sm border border-pearl/10 p-6 hover:border-tangerine/30 transition-colors">
                                {videoId ? (
                                    <>
                                        <Play size={20} className="text-tangerine mb-3" />
                                        <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Exhibition Film</p>
                                        <p className="text-pearl text-sm">Video available</p>
                                    </>
                                ) : (
                                    <>
                                        <Eye size={20} className="text-tangerine mb-3" />
                                        <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-2">Status</p>
                                        <p className="text-pearl text-sm">{getStatusLabel(exhibition.status)}</p>
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* ─── VIRTUAL TOUR CTA ─── */}
                    {exhibition.isVirtual && allImages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mb-20"
                        >
                            <button
                                onClick={() => setShowVirtualTour(true)}
                                className="w-full group relative overflow-hidden border border-pearl/10 hover:border-tangerine transition-all duration-500"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-tangerine/10 via-transparent to-tangerine/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex items-center justify-between px-8 py-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 border-2 border-tangerine flex items-center justify-center group-hover:bg-tangerine transition-colors duration-300">
                                            <Box size={24} className="text-tangerine group-hover:text-void transition-colors duration-300" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-pearl text-lg font-display uppercase tracking-wider group-hover:text-tangerine transition-colors">Enter Virtual Gallery</h3>
                                            <p className="text-warm-gray/60 text-xs font-mono">Walk through a 3D gallery space · {allImages.length} artworks displayed · WASD + mouse controls</p>
                                        </div>
                                    </div>
                                    <div className="text-pearl/30 group-hover:text-tangerine transition-colors text-2xl font-display">→</div>
                                </div>
                            </button>
                        </motion.div>
                    )}

                    {/* ─── VIDEO SECTION ─── */}
                    {videoId && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-20"
                        >
                            <div className="flex items-center gap-3 mb-8 border-b border-pearl/10 pb-4">
                                <Play size={22} className="text-tangerine" />
                                <h2 className="text-2xl font-display text-pearl uppercase tracking-tight">Exhibition Film</h2>
                            </div>
                            <div className="w-full aspect-video border border-pearl/10 bg-black/50 overflow-hidden">
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="Exhibition Video"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ─── GALLERY SECTION ─── */}
                    {exhibition.galleryImages && exhibition.galleryImages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-end justify-between mb-8 border-b border-pearl/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <ImageIcon size={22} className="text-tangerine" />
                                    <h2 className="text-2xl font-display text-pearl uppercase tracking-tight">Gallery View</h2>
                                </div>
                                <span className="text-tangerine font-mono text-xs uppercase tracking-widest">
                                    {exhibition.galleryImages.length} {exhibition.galleryImages.length === 1 ? 'Image' : 'Images'}
                                </span>
                            </div>

                            {/* Masonry-style grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {exhibition.galleryImages.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.04 }}
                                        className={`relative group cursor-zoom-in overflow-hidden border border-pearl/5 hover:border-tangerine transition-colors duration-300 ${
                                            idx === 0 && exhibition.galleryImages!.length > 3 ? 'md:col-span-2 md:row-span-2' : ''
                                        }`}
                                        onClick={() => setSelectedImageIdx(idx + 1)}
                                    >
                                        <div className={`${idx === 0 && exhibition.galleryImages!.length > 3 ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden`}>
                                            <img
                                                src={img}
                                                alt={`${exhibition.title} - Gallery ${idx + 1}`}
                                                className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-void/0 group-hover:bg-void/20 transition-colors duration-300" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Expand size={20} className="text-pearl" />
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-void/70 backdrop-blur-sm text-pearl text-[10px] font-mono px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {idx + 1} / {exhibition.galleryImages!.length}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ─── LIGHTBOX ─── */}
            <AnimatePresence>
                {selectedImageIdx !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-void/95 backdrop-blur-md flex items-center justify-center"
                        onClick={() => setSelectedImageIdx(null)}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setSelectedImageIdx(null)}
                            className="absolute top-6 right-6 text-warm-gray hover:text-tangerine transition-colors z-10 p-2"
                        >
                            <X size={24} />
                        </button>

                        {/* Counter */}
                        <div className="absolute top-6 left-6 text-warm-gray font-mono text-sm z-10">
                            {selectedImageIdx + 1} / {allImages.length}
                        </div>

                        {/* Keyboard hint */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-warm-gray/30 font-mono text-[10px] uppercase tracking-widest z-10">
                            Arrow keys to navigate · Esc to close
                        </div>

                        {/* Prev */}
                        {allImages.length > 1 && (
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-warm-gray hover:text-tangerine transition-colors z-10 bg-void/50 backdrop-blur-sm p-3 border border-pearl/10 hover:border-tangerine"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}

                        {/* Image */}
                        <motion.img
                            key={selectedImageIdx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            src={allImages[selectedImageIdx]}
                            alt={`${exhibition.title} - Image ${selectedImageIdx + 1}`}
                            className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl shadow-tangerine/10"
                            onClick={e => e.stopPropagation()}
                        />

                        {/* Next */}
                        {allImages.length > 1 && (
                            <button
                                onClick={handleNextImage}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-warm-gray hover:text-tangerine transition-colors z-10 bg-void/50 backdrop-blur-sm p-3 border border-pearl/10 hover:border-tangerine"
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}

                        {/* Thumbnail strip */}
                        {allImages.length > 1 && (
                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-10 max-w-[80vw] overflow-x-auto py-2 px-1">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setSelectedImageIdx(idx); }}
                                        className={`w-12 h-12 shrink-0 overflow-hidden border-2 transition-all ${
                                            idx === selectedImageIdx ? 'border-tangerine opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
                                        }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── VIRTUAL TOUR MODAL ─── */}
            {showVirtualTour && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-[100] bg-void flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-6 h-6 bg-tangerine animate-ping mx-auto mb-4" />
                            <p className="text-warm-gray font-mono text-xs uppercase tracking-widest">Loading 3D Gallery...</p>
                        </div>
                    </div>
                }>
                    <VirtualTourModal
                        isOpen={showVirtualTour}
                        onClose={() => setShowVirtualTour(false)}
                        images={allImages}
                        title={exhibition.title}
                    />
                </Suspense>
            )}
        </div>
    );
};
