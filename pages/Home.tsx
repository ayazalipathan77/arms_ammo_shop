import React, { useEffect, useState } from 'react';
import Hero from '../components/features/Hero';
import ArtworkCard from '../components/ui/ArtworkCard';
import Button from '../components/ui/Button';
import { artworkApi, transformArtwork } from '../services/api';
import { Artwork } from '../types';
import { useGallery } from '../context/GalleryContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Crown } from 'lucide-react';

const Home = () => {
  const { landingPageContent, artworks: allArtworks } = useGallery();
  const [latestArtworks, setLatestArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      // Fallback if useGallery doesn't have artworks yet (though it should)
      if (allArtworks.length > 0) {
        setLatestArtworks(allArtworks.slice(0, 9));
        setLoading(false);
        return;
      }

      try {
        const response = await artworkApi.getAll({ limit: 9 });
        const transformed = response.artworks.map(transformArtwork);
        setLatestArtworks(transformed);
      } catch (error) {
        console.error("Failed to fetch artworks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [allArtworks]);

  // Top 5 Paintings Logic
  const topPaintingsConfig = landingPageContent?.topPaintings;
  const topPaintings = topPaintingsConfig?.enabled && topPaintingsConfig.artworkIds.length > 0
    ? allArtworks.filter(a => topPaintingsConfig.artworkIds.includes(a.id))
    : [];

  // Curator's Pick Logic
  const curatorsConfig = landingPageContent?.curatedCollections;
  const curatedCollections = curatorsConfig?.enabled ? curatorsConfig.collections : [];


  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Top 5 Paintings Section - Admin Managed */}
      {topPaintingsConfig?.enabled && topPaintings.length > 0 && (
        <section className="py-24 px-6 md:px-12 bg-charcoal relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-tangerine/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1920px] mx-auto relative z-10">
            <div className="mb-16 flex items-center gap-4">
              <Star className="text-tangerine fill-tangerine" />
              <h2 className="text-4xl md:text-5xl font-display font-bold text-pearl uppercase tracking-tighter">
                TOP <span className="text-transparent bg-clip-text bg-gradient-to-r from-tangerine to-amber">PAINTINGS</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {topPaintings.slice(0, 5).map((artwork, idx) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="relative group aspect-[3/4] mb-4 overflow-hidden rounded-sm border border-white/5 bg-void">
                    <div className="absolute top-2 left-2 bg-tangerine text-void font-bold font-mono text-xs w-6 h-6 flex items-center justify-center rounded-full z-20">
                      {idx + 1}
                    </div>
                    <Link to={`/artwork/${artwork.id}`}>
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0 grayscale"
                      />
                    </Link>
                  </div>
                  <h3 className="text-pearl font-display uppercase truncate">{artwork.title}</h3>
                  <p className="text-warm-gray text-xs font-mono">{artwork.artistName}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Curator's Pick Section - Admin Managed */}
      {curatorsConfig?.enabled && curatedCollections.length > 0 && (
        <section className="py-24 px-6 md:px-12 bg-void border-t border-white/5">
          <div className="max-w-[1920px] mx-auto">
            <div className="mb-16 flex items-center gap-4 justify-end text-right">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="text-tangerine" />
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-pearl uppercase tracking-tighter">
                    CURATOR'S <span className="text-white/20">PICK</span>
                  </h2>
                </div>
                <p className="text-warm-gray max-w-md">Collections hand-picked by our chief curator for their exceptional narrative and technique.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {curatedCollections.map((collection: any, idx: number) => (
                <div key={idx} className="group relative aspect-video overflow-hidden rounded-sm border border-white/10 cursor-pointer">
                  <img
                    src={collection.imageUrl || 'https://images.unsplash.com/photo-1549887552-93f954d4393e'}
                    alt={collection.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent p-8 flex flex-col justify-end">
                    <h3 className="text-3xl font-display text-pearl uppercase mb-2">{collection.title}</h3>
                    <p className="text-warm-gray line-clamp-2 mb-4 max-w-lg">{collection.description}</p>
                    <div className="flex items-center gap-2 text-tangerine text-sm font-bold tracking-widest uppercase">
                      Explore Collection <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Latest Works Section (Existing) */}
      <section className="py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-[1920px] mx-auto">
          <div className="mb-20 border-b border-white/10 pb-8 flex justify-between items-end high-contrast:border-black/20">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-pearl high-contrast:text-black">
              LATEST <span className="text-tangerine high-contrast:text-[#D35400]">Works</span>
            </h2>
            <div className="hidden md:block">
              <Button variant="outline">VIEW ARCHIVE</Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-warm-gray">Loading Gallery...</div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {latestArtworks.map((art) => (
                <div key={art.id} className="break-inside-avoid">
                  <ArtworkCard artwork={art} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 flex justify-center md:hidden">
            <Button variant="primary">VIEW ARCHIVE</Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
