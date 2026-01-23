import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Loader2, Share2, Globe, Heart, Eye } from 'lucide-react';
import { artistApi, artworkApi, transformArtwork } from '../services/api';
import { Artist, Artwork } from '../types';
import { useCurrency } from '../App';

export const ArtistDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { convertPrice } = useCurrency();

    const [artist, setArtist] = useState<Artist | null>(null);
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Fetch Artist Info
                const { artist: artistData } = await artistApi.getById(id);
                // Transform to frontend type or use API type directly if compatible. 
                // Using manual transform since transformArtist helper is available but simple
                setArtist({
                    id: artistData.id,
                    name: artistData.user.fullName,
                    bio: artistData.bio || '',
                    imageUrl: artistData.imageUrl || `https://picsum.photos/seed/${artistData.id}/400/400`,
                    specialty: artistData.originCity || 'Contemporary Art',
                });

                // Fetch Artist Artworks
                const { artworks: artworksData } = await artworkApi.getByArtist(id);
                setArtworks(artworksData.map(transformArtwork));

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-400">
                <p className="mb-4">{error || 'Artist not found'}</p>
                <Link to="/artists" className="text-amber-500 hover:text-white transition-colors flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Artists
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-30"
                    style={{ backgroundImage: `url(${artist.imageUrl})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent"></div>

                <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-12 flex flex-col md:flex-row items-end gap-12">
                    {/* Profile Image */}
                    <div className="w-48 h-48 rounded-full border-4 border-stone-900 shadow-2xl overflow-hidden mb-[-2rem] md:mb-0 z-10 flex-shrink-0 bg-stone-900">
                        <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 mb-4">
                        <h1 className="font-serif text-5xl md:text-7xl text-white mb-4 leading-tight">{artist.name}</h1>
                        <div className="flex flex-wrap gap-6 text-sm uppercase tracking-widest text-stone-400">
                            <span className="flex items-center gap-2 text-amber-500"><Globe size={16} /> {artist.specialty}</span>
                            <span className="flex items-center gap-2"><MapPin size={16} /> Based in Pakistan</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 mb-4 border-l border-stone-800 pl-8">
                        <div>
                            <p className="text-3xl font-serif text-white">{artworks.length}</p>
                            <p className="text-[10px] uppercase tracking-widest text-stone-500">Artworks</p>
                        </div>
                        <div>
                            <p className="text-3xl font-serif text-white">{artworks.filter(a => !a.inStock).length}</p>
                            <p className="text-[10px] uppercase tracking-widest text-stone-500">Collected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-4 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-16">

                {/* Left: Bio */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="prose prose-invert prose-lg">
                        <h3 className="font-serif text-2xl text-white mb-6">About the Artist</h3>
                        <div className="text-stone-400 font-light leading-relaxed space-y-6 text-lg">
                            {artist.bio.split('\n').map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Portfolio */}
                <div className="lg:col-span-8">
                    <div className="flex items-baseline justify-between mb-10 border-b border-stone-800 pb-4">
                        <h3 className="font-serif text-3xl text-white">Portfolio</h3>
                        <span className="text-stone-500 text-sm">{artworks.length} Works Available</span>
                    </div>

                    {artworks.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-stone-800 rounded bg-stone-900/20">
                            <p className="text-stone-500">No artworks currently available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {artworks.map(art => (
                                <Link key={art.id} to={`/artwork/${art.id}`} className="group block mb-8 break-inside-avoid">
                                    <div className="relative overflow-hidden mb-4 bg-stone-900 aspect-[4/5]">
                                        <img
                                            src={art.imageUrl}
                                            alt={art.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        {!art.inStock && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <span className="border border-white text-white px-4 py-1 uppercase text-xs tracking-widest">Sold</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="bg-stone-950/80 text-white px-3 py-1 text-xs uppercase tracking-widest backdrop-blur-md">
                                                View
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-xl text-white group-hover:text-amber-500 transition-colors">{art.title}</h4>
                                        <p className="text-stone-500 text-xs uppercase tracking-widest mt-1 mb-2">
                                            {art.medium} • {art.year}
                                        </p>
                                        <p className="text-stone-300 font-mono text-sm">{convertPrice(art.price)}</p>
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
