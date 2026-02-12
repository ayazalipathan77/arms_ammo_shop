import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, Award, Search, X } from 'lucide-react';
import { artistApi, transformArtist } from '../services/api';
import { Artist } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ParticleSystem from '../components/features/ParticleSystem';

export const Artists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchArtists = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await artistApi.getAll();
        const transformedArtists = response.artists.map(transformArtist);
        setArtists(transformedArtists);
      } catch (err) {
        console.error('Error fetching artists:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch artists');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const filteredArtists = useMemo(() => {
    if (!searchTerm.trim()) return artists;
    const term = searchTerm.toLowerCase();
    return artists.filter(artist =>
      artist.name.toLowerCase().includes(term) ||
      artist.specialty?.toLowerCase().includes(term) ||
      artist.bio?.toLowerCase().includes(term)
    );
  }, [artists, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <Loader2 className="w-10 h-10 text-tangerine animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-void text-pearl">
        <p className="text-red-500 font-mono mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs uppercase tracking-widest border border-tangerine px-6 py-3 hover:bg-tangerine hover:text-void transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 md:px-12 relative overflow-hidden">
      <ParticleSystem />

      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-tangerine/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1920px] mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-pearl/10 pb-8 high-contrast:border-black/20">
            <div>
              <h1 className="text-4xl md:text-7xl font-display font-bold text-pearl high-contrast:text-black mb-2">
                ARTISTS
              </h1>
              <p className="text-tangerine font-mono text-sm tracking-widest uppercase high-contrast:text-[#D35400]">
                The Creators
              </p>
            </div>

            <div className="relative group w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray group-focus-within:text-tangerine transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-charcoal/50 border border-pearl/10 rounded-full py-3 pl-11 pr-10 text-xs font-mono text-pearl focus:border-tangerine outline-none transition-colors placeholder:text-warm-gray/50"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-tangerine transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="w-full">
          {filteredArtists.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-2 gap-y-4">
              <AnimatePresence>
                {filteredArtists.map((artist, i) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/artists/${artist.id}`} className="group flex flex-col items-center">
                      <div className="relative w-20 h-20 md:w-24 md:h-24 bg-charcoal mb-2 overflow-hidden rounded-full border border-pearl/10 group-hover:border-tangerine transition-all duration-500">
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-radial from-transparent via-void/20 to-void/60 opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="bg-tangerine text-void text-[9px] font-bold uppercase tracking-widest px-2 py-1 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            View
                          </span>
                        </div>
                      </div>

                      <div className="text-center">
                        <h2 className="font-display text-xs text-pearl leading-tight mb-0.5 group-hover:text-tangerine transition-colors truncate max-w-[90px] md:max-w-[100px]">{artist.name}</h2>
                        <p className="text-warm-gray text-[9px] font-mono uppercase tracking-wider">{artist.specialty}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {filteredArtists.length === 0 && (
            <div className="py-20 text-center border border-dashed border-pearl/10">
              <p className="font-display text-2xl text-warm-gray mb-2">No Artists Found</p>
              <button onClick={() => setSearchTerm('')} className="text-tangerine text-xs uppercase tracking-widest hover:underline">Clear Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
