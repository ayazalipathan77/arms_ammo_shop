import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, Sparkles, Award, Search, X } from 'lucide-react';
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
    <div className="min-h-screen pt-32 pb-20 bg-void text-pearl px-6 md:px-12 relative overflow-hidden">
      <ParticleSystem />

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-tangerine/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="max-w-screen-2xl mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20 border-b border-pearl/10 pb-10">
          <div>
            <h1 className="font-display text-5xl md:text-7xl text-pearl leading-none mb-2">The Creators</h1>
            <p className="text-tangerine font-mono text-xs uppercase tracking-[0.3em] flex items-center gap-2">
              <Sparkles size={12} /> {filteredArtists.length} Visionaries
            </p>
          </div>

          <div className="w-full md:w-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray group-focus-within:text-tangerine transition-colors" size={16} />
            <input
              type="text"
              placeholder="SEARCH ARTISTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-charcoal/50 border border-pearl/10 rounded-none py-4 pl-12 pr-4 text-xs font-mono text-pearl focus:border-tangerine outline-none transition-colors placeholder:text-warm-gray/50"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          <AnimatePresence>
            {filteredArtists.map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/artists/${artist.id}`} className="group block">
                  <div className="relative aspect-[4/5] bg-charcoal mb-6 overflow-hidden border border-pearl/5 group-hover:border-tangerine/30 transition-all duration-500">
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent opacity-60"></div>

                    <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="w-12 h-[1px] bg-tangerine mb-4 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                      <span className="inline-block bg-void/80 backdrop-blur text-pearl text-[10px] uppercase tracking-widest px-3 py-1 mb-2 border border-pearl/10">
                        View Profile
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-display text-3xl text-pearl leading-none mb-2 group-hover:text-tangerine transition-colors">{artist.name}</h2>
                    <p className="text-warm-gray text-xs font-mono uppercase tracking-wider">{artist.specialty}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredArtists.length === 0 && (
          <div className="py-20 text-center border border-dashed border-pearl/10">
            <p className="font-display text-2xl text-warm-gray mb-2">No Artists Found</p>
            <button onClick={() => setSearchTerm('')} className="text-tangerine text-xs uppercase tracking-widest hover:underline">Clear Filters</button>
          </div>
        )}

      </div>
    </div>
  );
};
