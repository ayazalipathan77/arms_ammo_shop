import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { artistApi, transformArtist } from '../services/api';
import { Artist } from '../types';

export const Artists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="ml-3 text-stone-400">Loading artists...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-amber-500 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-12 max-w-7xl mx-auto px-4">
      <h1 className="font-serif text-5xl text-stone-100 mb-4 text-center">The Artists</h1>
      <p className="text-stone-500 text-center uppercase tracking-widest text-sm mb-16">Masters of the Craft</p>

      {artists.length === 0 ? (
        <p className="text-center text-stone-500">No artists found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {artists.map(artist => (
            <div key={artist.id} className="group text-center">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-2 border-stone-800 group-hover:border-amber-500 transition-colors">
                <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h2 className="font-serif text-2xl text-white mb-2">{artist.name}</h2>
              <p className="text-amber-500 text-xs uppercase tracking-widest mb-3">{artist.specialty}</p>
              <p className="text-stone-400 text-sm mb-4 max-w-xs mx-auto line-clamp-5 leading-relaxed">{artist.bio}</p>
              <Link to={`/gallery?artistId=${artist.id}`} className="text-amber-500 hover:text-white text-xs uppercase tracking-widest border-b border-transparent hover:border-white pb-1 transition-all">
                Read Full Bio & View Collection
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
