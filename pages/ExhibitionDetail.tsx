import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Play, Image as ImageIcon, Monitor, ChevronLeft, ChevronRight, X, Clock, Eye } from 'lucide-react';
import { exhibitionApi } from '../services/api';
import { Exhibition } from '../types';
import { ScrambleText } from '../components/ui/ScrambleText';

export const ExhibitionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [exhibition, setExhibition] = useState<Exhibition | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);

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
            case 'CURRENT': return 'bg-tangerine/20 text-tangerine border-tangerine';
            case 'UPCOMING': return 'bg-amber/20 text-amber border-amber';
            default: return 'bg-warm-gray/20 text-warm-gray border-warm-gray';
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
        <div className="min-h-screen bg-void pt-24 pb-20 px-6 md:px-12">
            <div className="max-w-[1920px] mx-auto">

                {/* Back Link */}
                <Link to="/exhibitions" className="text-warm-gray hover:text-tangerine flex items-center gap-2 mb-8 group w-fit">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="uppercase tracking-widest text-sm">Back to Exhibitions</span>
                </Link>

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
                    {/* Cover Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative group cursor-zoom-in"
                        onClick={() => setSelectedImageIdx(0)}
                    >
                        <div className="relative aspect-[4/3] overflow-hidden border-2 border-transparent group-hover:border-tangerine transition-colors duration-500">
                            <img
                                src={exhibition.imageUrl}
                                alt={exhibition.title}
                                className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-void/10 group-hover:bg-transparent transition-colors" />

                            {/* Status Badge */}
                            <div className={`absolute top-4 left-4 border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusStyle(exhibition.status)}`}>
                                {getStatusLabel(exhibition.status)}
                            </div>

                            {/* Image count overlay */}
                            {allImages.length > 1 && (
                                <div className="absolute bottom-4 right-4 bg-void/80 backdrop-blur-sm text-pearl px-3 py-1 text-xs font-mono flex items-center gap-2">
                                    <ImageIcon size={14} /> {allImages.length} photos
                                </div>
                            )}
                        </div>
                        {/* Decorative offset */}
                        <div className="absolute -inset-3 border border-pearl/10 -z-10 hidden lg:block" />
                    </motion.div>

                    {/* Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex flex-col justify-center space-y-8"
                    >
                        <h1 className="text-5xl md:text-7xl font-display text-pearl leading-tight">
                            <ScrambleText text={exhibition.title} />
                        </h1>

                        {exhibition.description && (
                            <p className="text-warm-gray leading-relaxed text-lg max-w-xl border-l-2 border-tangerine pl-6">
                                {exhibition.description}
                            </p>
                        )}

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-pearl/10">
                            {/* Date */}
                            <div className="flex items-start gap-3">
                                <Calendar size={20} className="text-tangerine mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-warm-gray uppercase tracking-widest mb-1">Dates</p>
                                    <p className="text-pearl font-mono">
                                        {new Date(exhibition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    {exhibition.endDate && (
                                        <p className="text-warm-gray text-sm font-mono">
                                            to {new Date(exhibition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-3">
                                <MapPin size={20} className="text-tangerine mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-warm-gray uppercase tracking-widest mb-1">Location</p>
                                    <p className="text-pearl">{exhibition.location}</p>
                                </div>
                            </div>

                            {/* Virtual Tour */}
                            {exhibition.isVirtual && (
                                <div className="flex items-start gap-3">
                                    <Monitor size={20} className="text-tangerine mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-warm-gray uppercase tracking-widest mb-1">Virtual Tour</p>
                                        <p className="text-pearl">3D walkthrough available</p>
                                    </div>
                                </div>
                            )}

                            {/* Gallery Count */}
                            {(exhibition.galleryImages?.length || 0) > 0 && (
                                <div className="flex items-start gap-3">
                                    <ImageIcon size={20} className="text-tangerine mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-warm-gray uppercase tracking-widest mb-1">Gallery</p>
                                        <p className="text-pearl">{exhibition.galleryImages!.length} photographs</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Video Section */}
                {videoId && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-20"
                    >
                        <h2 className="text-3xl font-display text-pearl mb-8 flex items-center gap-3">
                            <Play size={24} className="text-tangerine" />
                            Exhibition Film
                        </h2>
                        <div className="w-full max-w-5xl aspect-video border border-pearl/10 bg-black/50 overflow-hidden">
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

                {/* Gallery Section */}
                {exhibition.galleryImages && exhibition.galleryImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-end justify-between mb-8 border-b border-pearl/10 pb-4">
                            <h2 className="text-3xl font-display text-pearl flex items-center gap-3">
                                <ImageIcon size={24} className="text-tangerine" />
                                Gallery View
                            </h2>
                            <span className="text-tangerine font-mono text-xs uppercase tracking-widest">
                                {exhibition.galleryImages.length} {exhibition.galleryImages.length === 1 ? 'Image' : 'Images'}
                            </span>
                        </div>

                        {/* Masonry-inspired grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {exhibition.galleryImages.map((img, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative group cursor-zoom-in overflow-hidden border border-pearl/10 hover:border-tangerine transition-colors duration-300 ${
                                        idx === 0 && exhibition.galleryImages!.length > 2 ? 'md:col-span-2 md:row-span-2' : ''
                                    }`}
                                    onClick={() => setSelectedImageIdx(idx + 1)}
                                >
                                    <div className={`${idx === 0 && exhibition.galleryImages!.length > 2 ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden`}>
                                        <img
                                            src={img}
                                            alt={`${exhibition.title} - Gallery ${idx + 1}`}
                                            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-tangerine/0 group-hover:bg-tangerine/10 transition-colors duration-300" />
                                    <div className="absolute bottom-3 right-3 bg-void/70 backdrop-blur-sm text-pearl text-[10px] font-mono px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye size={12} className="inline mr-1" />{idx + 1} / {exhibition.galleryImages!.length}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Lightbox */}
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
                                className="absolute top-6 right-6 text-warm-gray hover:text-tangerine transition-colors z-10"
                            >
                                <X size={28} />
                            </button>

                            {/* Counter */}
                            <div className="absolute top-6 left-6 text-warm-gray font-mono text-sm z-10">
                                {selectedImageIdx + 1} / {allImages.length}
                            </div>

                            {/* Prev */}
                            {allImages.length > 1 && (
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-warm-gray hover:text-tangerine transition-colors z-10 bg-void/50 backdrop-blur-sm p-2 border border-pearl/10 hover:border-tangerine"
                                >
                                    <ChevronLeft size={24} />
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
                                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-warm-gray hover:text-tangerine transition-colors z-10 bg-void/50 backdrop-blur-sm p-2 border border-pearl/10 hover:border-tangerine"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};
