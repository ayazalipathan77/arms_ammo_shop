import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useParams as useRouteParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Play, Image as ImageIcon } from 'lucide-react';
import { exhibitionApi } from '../services/api';
import { Exhibition } from '../types';
import { ScrambleText } from '../components/ui/ScrambleText';

export const ExhibitionDetail = () => {
    const { id } = useRouteParams<{ id: string }>();
    const [exhibition, setExhibition] = useState<Exhibition | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchExhibition = async () => {
            if (!id) return;
            try {
                const data = await exhibitionApi.getExhibition(id);
                setExhibition(data);
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

    return (
        <div className="min-h-screen bg-void pt-24 pb-20">
            {/* Hero Header */}
            <div className="container mx-auto px-6 mb-16">
                <Link to="/exhibitions" className="text-warm-gray hover:text-pearl flex items-center gap-2 mb-8 group w-fit">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="uppercase tracking-widest text-sm">Back to Exhibitions</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
                    <div>
                        <div className="flex items-center gap-4 text-tangerine uppercase tracking-widest text-sm font-medium mb-4">
                            <span className="flex items-center gap-2">
                                <Calendar size={16} />
                                {new Date(exhibition.startDate).toLocaleDateString()}
                                {exhibition.endDate && ` - ${new Date(exhibition.endDate).toLocaleDateString()}`}
                            </span>
                            {exhibition.status === 'CURRENT' && (
                                <span className="bg-tangerine/20 text-tangerine px-2 py-0.5 rounded text-[10px]">NOW OPEN</span>
                            )}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-display text-pearl mb-6 leading-tight">
                            <ScrambleText text={exhibition.title} />
                        </h1>
                        <div className="flex items-center gap-3 text-warm-gray mb-8">
                            <MapPin size={20} className="text-tangerine" />
                            <span className="text-lg">{exhibition.location}</span>
                        </div>
                        <p className="text-warm-gray leading-relaxed text-lg max-w-xl border-l-2 border-tangerine pl-6">
                            {exhibition.description}
                        </p>
                    </div>

                    <div className="relative aspect-video lg:aspect-[4/3] w-full overflow-hidden group/hero">
                        <img src={exhibition.imageUrl} alt={exhibition.title} className="w-full h-full object-cover grayscale group-hover/hero:grayscale-0 transition-all duration-700 scale-100 group-hover/hero:scale-105" />
                        <div className="absolute inset-0 bg-void/20 group-hover/hero:bg-transparent transition-colors" />
                    </div>
                </div>
            </div>

            {/* Video Section */}
            {videoId && (
                <div className="container mx-auto px-6 mb-20">
                    <h2 className="text-3xl font-display text-pearl mb-8 flex items-center gap-3">
                        <Play size={24} className="text-tangerine" />
                        Exhibition Film
                    </h2>
                    <div className="w-full aspect-video border border-pearl/10 bg-black/50 overflow-hidden relative group">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="Exhibition Video"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {/* Gallery Grid */}
            {exhibition.galleryImages && exhibition.galleryImages.length > 0 && (
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-display text-pearl mb-8 flex items-center gap-3">
                        <ImageIcon size={24} className="text-tangerine" />
                        Gallery View
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exhibition.galleryImages.map((img, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="aspect-square relative group cursor-zoom-in overflow-hidden border border-pearl/10"
                                onClick={() => setSelectedImage(img)}
                            >
                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-tangerine/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-void/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Full view" className="max-w-full max-h-[90vh] object-contain shadow-2xl shadow-tangerine/20" />
                </div>
            )}
        </div>
    );
};
