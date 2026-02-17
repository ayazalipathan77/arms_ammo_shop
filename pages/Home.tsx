import React, { useEffect, useState } from 'react';
import Hero from '../components/features/Hero';
import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';
import { artworkApi, transformArtwork } from '../services/api';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Star, Crown, Calendar, MapPin } from 'lucide-react';

const Home = () => {
  const { landingPageContent, products: allArtworks, collections: exhibitions } = useShop();
  const [latestArtworks, setLatestArtworks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const ITEMS_PER_SLIDE = 3;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtworks = async () => {
      if (allArtworks.length > 0) {
        // Sort by ID descending (proxy for newest) or created date if available
        // Assuming newer items are at the end or have higher IDs/timestamps
        const sorted = [...allArtworks].reverse();
        setLatestArtworks(sorted.slice(0, 9)); // Get top 9 recent
        setLoading(false);
        return;
      }

      try {
        const response = await artworkApi.getAll({ limit: 9 });
        // @ts-ignore - Temporary ignore for type mismatch during refactor if transformArtwork returns Product
        const transformed = response.artworks.map(transformArtwork);
        setLatestArtworks(transformed); // API usually returns newest first? If not we reverse.
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

  // Curator's Pick Logic - Get all artworks from curated collections
  const curatorsConfig = landingPageContent?.curatedCollections;
  const curatedArtworks = curatorsConfig?.enabled
    ? allArtworks.filter(art =>
      curatorsConfig.collections.some(col => col.artworkIds.includes(art.id))
    )
    : [];

  // Carousel Logic
  const totalSlides = Math.ceil(latestArtworks.length / ITEMS_PER_SLIDE);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [totalSlides]);


  return (
    <>
      <Hero />

      {/* 1. LATEST WORKS SECTION - Reordered Step 1 */}
      <section className="py-16 px-6 md:px-12 relative z-10 overflow-hidden bg-gradient-to-br from-void via-charcoal to-void">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-tangerine/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-pearl/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1920px] mx-auto relative z-10">
          <div className="mb-8 border-b border-pearl/10 pb-6 flex justify-between items-end">
            <div>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-pearl">
                LATEST <span className="text-tangerine">Works</span>
              </h2>
            </div>
            <div className="hidden md:flex gap-4 items-center">
              {/* Carousel Controls */}
              <div className="flex gap-2 mr-8">
                <button onClick={prevSlide} className="p-3 border border-pearl/10 text-pearl hover:bg-tangerine hover:text-void rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <button onClick={nextSlide} className="p-3 border border-pearl/10 text-pearl hover:bg-tangerine hover:text-void rounded-full transition-colors">
                  <ArrowRight size={20} />
                </button>
              </div>
              {/* Fixed Redirect Button */}
              <Link to="/collections">
                <Button variant="outline">VIEW ARCHIVE</Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-warm-gray">Loading Gallery...</div>
          ) : (
            <div className="relative overflow-hidden min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  {latestArtworks
                    .slice(currentSlide * ITEMS_PER_SLIDE, (currentSlide + 1) * ITEMS_PER_SLIDE)
                    .map((art) => (
                      <ProductCard key={art.id} product={art} />
                    ))
                  }
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          <div className="mt-12 flex justify-center md:hidden gap-4">
            <button onClick={prevSlide} className="p-3 border border-pearl/10 text-pearl hover:bg-tangerine hover:text-void rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <button onClick={nextSlide} className="p-3 border border-pearl/10 text-pearl hover:bg-tangerine hover:text-void rounded-full transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="mt-8 flex justify-center md:hidden">
            <Link to="/collections">
              <Button variant="primary">VIEW ARCHIVE</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TOP 5 PAINTINGS - Reordered Step 2 */}
      {topPaintingsConfig?.enabled && topPaintings.length > 0 && (
        <section className="py-16 px-6 md:px-12 relative overflow-hidden bg-gradient-to-tr from-charcoal via-void to-charcoal border-t border-pearl/10">
          {/* Multiple Gradient Orbs */}
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-tangerine/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-amber/18 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 w-[450px] h-[450px] bg-pearl/12 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-[1920px] mx-auto relative z-10">
            <div className="mb-10 flex items-center gap-4">
              <Star className="text-tangerine fill-tangerine" />
              <h2 className="text-4xl md:text-5xl font-display font-bold text-pearl uppercase tracking-tighter">
                TRENDING <span className="text-tangerine">PAINTINGS</span>
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
                  className="relative"
                >
                  {/* Rank Indicator */}
                  <div className="absolute -top-3 -left-3 bg-tangerine text-void font-bold font-mono text-lg w-10 h-10 flex items-center justify-center rounded-sm z-30 shadow-lg border border-white/20">
                    {idx + 1}
                  </div>
                  {/* Using Standard ArtworkCard for consistency */}
                  <ProductCard product={artwork} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. CURATOR'S PICK - Reordered Step 3 */}
      {curatorsConfig?.enabled && curatedArtworks.length > 0 && (
        <section className="py-16 px-6 md:px-12 relative overflow-hidden bg-gradient-to-bl from-void via-charcoal to-void border-t border-pearl/10">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 right-0 w-[650px] h-[650px] bg-tangerine/22 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-amber/18 rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-pearl/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="max-w-[1920px] mx-auto relative z-10">
            <div className="mb-10 flex items-center gap-4 justify-center text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="text-tangerine" size={32} />
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-pearl uppercase tracking-tighter">
                    CURATOR'S <span className="text-tangerine">CHOICE</span>
                  </h2>
                </div>
                <p className="text-warm-gray max-w-2xl font-mono text-sm">Hand-selected masterpieces showcasing exceptional narrative, technique, and artistic vision.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {curatedArtworks.map((artwork, idx) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ProductCard product={artwork} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. EXHIBITIONS (NEW) - Reordered Step 4 */}
      <section className="py-16 px-6 md:px-12 relative overflow-hidden bg-gradient-to-tl from-charcoal via-void to-charcoal border-t border-pearl/10">
        {/* Multiple Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-tangerine/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[550px] h-[550px] bg-amber/18 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[450px] h-[450px] bg-pearl/12 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1920px] mx-auto relative z-10">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-pearl uppercase tracking-tighter mb-2">
                CURRENT <span className="text-tangerine">EXHIBITIONS</span>
              </h2>
              <p className="text-warm-gray font-mono uppercase tracking-widest text-xs">Immersive Art Experiences</p>
            </div>
            <Link to="/exhibitions">
              <Button variant="outline">VIEW ALL</Button>
            </Link>
          </div>

          {exhibitions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-pearl/10 rounded-sm">
              <p className="text-warm-gray font-display uppercase tracking-widest">No Active Exhibitions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {exhibitions.slice(0, 2).map((exh) => (
                <Link key={exh.id} to={`/exhibitions`} className="group block relative aspect-[16/9] overflow-hidden rounded-sm border border-pearl/10 cursor-pointer">
                  <img
                    src={exh.imageUrl || "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=2666&auto=format&fit=crop"}
                    alt={exh.title}
                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent p-10 flex flex-col justify-end">
                    <div className="flex gap-4 mb-4">
                      <div className="bg-tangerine text-void px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} /> {exh.date || 'NOW SHOWING'}
                      </div>
                      <div className="bg-black/50 backdrop-blur text-pearl px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-pearl/20">
                        <MapPin size={12} /> {exh.location || 'MAIN GALLERY'}
                      </div>
                    </div>
                    <h3 className="text-4xl font-display font-bold text-pearl uppercase mb-2 group-hover:text-tangerine transition-colors">{exh.title}</h3>
                    <p className="text-warm-gray line-clamp-2 max-w-xl font-mono text-sm">{exh.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </>
  );
};

export default Home;
