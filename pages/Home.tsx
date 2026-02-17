import React, { useEffect, useState } from 'react';
import Hero from '../components/features/Hero';
import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';
import { artworkApi, transformArtwork } from '../services/api';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Star, Crown, Calendar, MapPin, Target, Shield, Crosshair } from 'lucide-react';
import { cn } from '../lib/utils';

const Home = () => {
  const { landingPageContent, products: allProducts, collections: showcases } = useShop();
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const ITEMS_PER_SLIDE = 3;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatest = async () => {
      if (allProducts.length > 0) {
        // Sort by IDs (newer first)
        const sorted = [...allProducts].reverse();
        setLatestProducts(sorted.slice(0, 9));
        setLoading(false);
        return;
      }

      try {
        const response = await artworkApi.getAll({ limit: 9 });
        // @ts-ignore 
        const transformed = response.artworks.map(transformArtwork);
        setLatestProducts(transformed);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, [allProducts]);

  // Featured Logic
  const topConfig = landingPageContent?.topPaintings; // Reuse existing config keys for now
  const featuredProducts = topConfig?.enabled && topConfig.artworkIds.length > 0
    ? allProducts.filter(a => topConfig.artworkIds.includes(a.id))
    : [];

  // Curator/Staff Pick Logic
  const staffPickConfig = landingPageContent?.curatedCollections;
  const staffPicks = staffPickConfig?.enabled
    ? allProducts.filter(art =>
      staffPickConfig.collections.some(col => col.artworkIds.includes(art.id))
    )
    : [];

  // Carousel Logic
  const totalSlides = Math.ceil(latestProducts.length / ITEMS_PER_SLIDE);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);


  return (
    <div className="bg-void text-pearl selection:bg-safety selection:text-void font-body">
      <Hero />

      {/* 1. LATEST ARRIVALS */}
      <section className="py-20 px-6 md:px-12 relative z-10 overflow-hidden border-b border-gunmetal">
        {/* Background Grids */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
        </div>

        <div className="max-w-[1920px] mx-auto relative z-10">
          <div className="mb-12 border-b border-gunmetal pb-6 flex justify-between items-end">
            <div>
              <p className="text-olive font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                <Target size={14} /> New Acquisitions
              </p>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-pearl uppercase leading-none">
                Latest <span className="text-outline-safety">Arrivals</span>
              </h2>
            </div>
            <div className="hidden md:flex gap-4 items-center">
              {/* Carousel Controls */}
              <div className="flex gap-2 mr-8">
                <button onClick={prevSlide} className="p-3 border border-gunmetal text-stone-400 hover:text-safety hover:border-safety transition-all">
                  <ArrowLeft size={20} />
                </button>
                <button onClick={nextSlide} className="p-3 border border-gunmetal text-stone-400 hover:text-safety hover:border-safety transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>
              <Link to="/shop">
                <Button variant="outline" className="text-xs">VIEW FULL MANIFEST</Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-camo font-mono uppercase animate-pulse">Scanning Inventory...</div>
          ) : (
            <div className="relative overflow-hidden min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  {latestProducts
                    .slice(currentSlide * ITEMS_PER_SLIDE, (currentSlide + 1) * ITEMS_PER_SLIDE)
                    .map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
                    ))
                  }
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Controls */}
          <div className="mt-8 flex justify-center md:hidden gap-4">
            <button onClick={prevSlide} className="p-3 border border-gunmetal text-stone-400"><ArrowLeft size={16} /></button>
            <button onClick={nextSlide} className="p-3 border border-gunmetal text-stone-400"><ArrowRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* 2. FEATURED ITEM / TRENDING */}
      {featuredProducts.length > 0 && (
        <section className="py-20 px-6 md:px-12 relative overflow-hidden bg-gunmetal/10">
          <div className="max-w-[1920px] mx-auto relative z-10">
            <div className="mb-10 flex items-center gap-4">
              <Star className="text-safety fill-safety" />
              <h2 className="text-3xl md:text-5xl font-display font-bold text-pearl uppercase tracking-tighter">
                HIGH DEMAND <span className="text-safety">UNIT</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {featuredProducts.slice(0, 5).map((prod, idx) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute -top-3 -left-3 bg-safety text-void font-bold font-mono text-lg w-8 h-8 flex items-center justify-center z-30 shadow-lg clip-diagonal">
                    {idx + 1}
                  </div>
                  <ProductCard product={prod} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. STAFF PICK / CURATED */}
      {staffPicks.length > 0 && (
        <section className="py-20 px-6 md:px-12 relative overflow-hidden text-center bg-black/20 border-y border-gunmetal">
          <div className="max-w-[1920px] mx-auto relative z-10">
            <div className="mb-12 flex flex-col items-center">
              <div className="w-1 h-16 bg-gradient-to-b from-transparent to-olive mb-4"></div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-pearl uppercase tracking-widest mb-4">
                COMMAND <span className="text-stroke text-void stroke-pearl">SELECTION</span>
              </h2>
              <p className="text-camo max-w-xl font-mono text-sm leading-relaxed">
                Elite tier equipment selected by our armory specialists for superior performance and reliability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              {staffPicks.map((prod, idx) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ProductCard product={prod} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. SHOWCASES / EXHIBITIONS */}
      <section className="py-20 px-6 md:px-12 relative bg-void">
        <div className="max-w-[1920px] mx-auto relative z-10">
          <div className="mb-10 flex justify-between items-end border-b border-gunmetal pb-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-pearl uppercase tracking-tighter mb-1">
                ACTIVE <span className="text-olive">OPERATIONS</span>
              </h2>
              <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.2em]">Live Showcases & Demos</p>
            </div>
            <Link to="/collections">
              <Button variant="outline" className="text-xs">VIEW ALL OPS</Button>
            </Link>
          </div>

          {showcases.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gunmetal bg-black/20">
              <p className="text-stone-500 font-display uppercase tracking-widest text-lg">No Active Operations Deployed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {showcases.slice(0, 2).map((exh) => (
                <Link key={exh.id} to={`/collections`} className="group block relative aspect-[21/9] overflow-hidden border border-gunmetal/50 hover:border-olive transition-all">
                  <img
                    src={exh.imageUrl || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=2670&auto=format&fit=crop"}
                    alt={exh.title}
                    className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:grayscale-0 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent p-8 flex flex-col justify-center">
                    <div className="flex gap-3 mb-4">
                      <div className="bg-olive text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2">
                        <Crosshair size={10} /> Active
                      </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-display font-bold text-pearl uppercase mb-2 group-hover:text-olive transition-colors leading-none">{exh.title}</h3>
                    <p className="text-stone-400 line-clamp-2 max-w-md font-mono text-xs mb-6">{exh.description}</p>
                    <span className="inline-flex items-center gap-2 text-safety text-xs font-bold uppercase tracking-widest">
                      View Briefing <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Home;
