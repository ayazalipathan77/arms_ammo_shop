import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, Sparkles, Award, Search } from 'lucide-react';
import { artistApi, transformArtist } from '../services/api';
import { Artist } from '../types';
import { motion } from 'framer-motion';

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

  // Filter artists based on search term
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
      <div className="pt-32 min-h-screen flex items-center justify-center bg-stone-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <span className="text-stone-500 uppercase tracking-widest text-xs">Discovering Artists...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 min-h-screen flex flex-col items-center justify-center bg-stone-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-red-500 font-serif text-xl mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 text-xs uppercase tracking-widest border border-amber-500/30 rounded-lg transition-all"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-stone-950 relative overflow-hidden">
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

      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-stone-800/50 pb-10">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center gap-3 mb-4"
              >
                <Sparkles className="text-amber-500" size={28} />
                <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">
                  The Artists
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-amber-500/60 uppercase tracking-[0.3em] text-xs flex items-center gap-2"
              >
                <Award size={14} />
                {isLoading ? 'Discovering...' : `${filteredArtists.length} Masters of Contemporary Practice`}
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-full md:w-auto"
            >
              {/* Search Input */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search artists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 bg-stone-900/50 backdrop-blur-sm border border-stone-800/50 rounded-full pl-11 pr-4 py-3 text-xs focus:outline-none text-white placeholder:text-stone-600 focus:border-amber-500 transition-all"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Artists Grid */}
        {filteredArtists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 border border-dashed border-stone-800/50 rounded-2xl bg-stone-900/20"
          >
            <Sparkles className="text-stone-700 mx-auto mb-4" size={48} />
            <p className="text-stone-500 font-serif text-2xl mb-2">
              {searchTerm ? 'No artists match your search' : 'No artists found'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-amber-500 hover:text-amber-400 text-xs uppercase tracking-widest mt-4"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtists.map((artist, idx) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: idx * 0.1,
                  duration: 0.6,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                <Link to={`/artists/${artist.id}`} className="group block">
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-stone-900/30 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-amber-500/30 hover:bg-stone-900/50 transition-all duration-500 relative overflow-hidden"
                  >
                    {/* Card Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Round Avatar with Glow */}
                    <div className="relative mb-6 mx-auto w-48 h-48">
                      {/* Glow Ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />

                      {/* Image Container with Border */}
                      <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-stone-800 to-stone-900 group-hover:from-amber-500/50 group-hover:to-yellow-500/50 transition-all duration-500">
                        <div className="w-full h-full rounded-full overflow-hidden bg-stone-900 relative">
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                          />
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 group-hover:to-black/20 transition-all duration-500"></div>
                        </div>
                      </div>

                      {/* Sparkle Icon Badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                        className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-900/50 border-4 border-stone-900"
                      >
                        <Sparkles size={18} className="text-stone-950" />
                      </motion.div>
                    </div>

                    {/* Artist Info */}
                    <div className="text-center relative z-10">
                      <h2 className="font-serif text-2xl md:text-3xl text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-200 group-hover:to-yellow-400 transition-all duration-300">
                        {artist.name}
                      </h2>
                      <p className="text-amber-500/70 text-xs uppercase tracking-[0.25em] mb-4 font-medium">
                        {artist.specialty}
                      </p>

                      {/* Biography */}
                      <p className="text-stone-400 text-sm leading-relaxed line-clamp-3 mb-6 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                        {artist.bio}
                      </p>

                      {/* View Profile Button */}
                      <motion.div
                        className="flex items-center justify-center gap-2 text-stone-500 group-hover:text-amber-500 transition-colors duration-300"
                        whileHover={{ gap: "12px" }}
                      >
                        <span className="text-xs uppercase tracking-widest font-medium">View Profile</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </motion.div>
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
