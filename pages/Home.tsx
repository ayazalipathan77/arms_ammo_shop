import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useGallery } from '../context/GalleryContext';

interface HomeProps {
  lang: 'EN' | 'UR';
}

export const Home: React.FC<HomeProps> = ({ lang }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const { landingPageContent, artworks, exhibitions, conversations } = useGallery();
  const [isContentLoading, setIsContentLoading] = useState(true);

  // Carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Background slideshow state
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const backgroundImages = landingPageContent?.hero?.backgroundImages || [];
  const hasMultipleBackgrounds = backgroundImages.length > 1;

  useEffect(() => {
    if (landingPageContent !== null) {
      setIsContentLoading(false);
    }
  }, [landingPageContent]);

  // Auto-scroll carousel
  useEffect(() => {
    if (!carouselRef.current || isPaused) return;

    const scrollInterval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;

        // Check if we've reached the middle (where duplicates start)
        if (scrollLeft >= scrollWidth / 2) {
          // Reset to beginning for seamless loop
          carouselRef.current.scrollLeft = 0;
        } else {
          // Smooth scroll by 1px for continuous motion
          carouselRef.current.scrollLeft += 1;
        }
      }
    }, 30); // Adjust speed here (lower = faster)

    return () => clearInterval(scrollInterval);
  }, [isPaused]);

  // Background slideshow auto-advance (zoom in 2s, then fade to next)
  useEffect(() => {
    if (!hasMultipleBackgrounds) return;

    const slideshowInterval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000); // 2s zoom + 2s visible = 4s per slide

    return () => clearInterval(slideshowInterval);
  }, [hasMultipleBackgrounds, backgroundImages.length]);

  // Fallback to defaults if landingPageContent is not available
  const hero = landingPageContent?.hero || {
    enabled: true,
    title: 'Elevation of Perspective',
    subtitle: 'Contemporary Pakistani Art',
    accentWord: 'Perspective',
    backgroundImage: '/header_bg.jpg'
  };

  // Get featured exhibition data
  const getFeaturedExhibition = () => {
    if (landingPageContent?.featuredExhibition?.exhibitionId) {
      const exhibition = exhibitions.find(ex => ex.id === landingPageContent.featuredExhibition.exhibitionId);
      if (exhibition) {
        return {
          title: exhibition.title,
          artist: exhibition.location,
          date: `${new Date(exhibition.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} — ${exhibition.endDate ? new Date(exhibition.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : 'ONGOING'}`,
          image: exhibition.imageUrl,
          description: exhibition.description
        };
      }
    }
    // Use manual override or fallback
    const manual = landingPageContent?.featuredExhibition?.manualOverride;
    return manual || {
      title: "Shadows of the Past",
      artist: "Zara Khan",
      date: "OCT 12 — DEC 24",
      image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop",
      description: "Explore the ethereal boundaries between memory and reality in this groundbreaking collection."
    };
  };

  const featuredExhibition = getFeaturedExhibition();

  // Get curated collections with artwork data
  const curatedCollections = (landingPageContent?.curatedCollections?.collections || []).map(collection => {
    const firstArtwork = collection.artworkIds.length > 0 ? artworks.find(a => a.id === collection.artworkIds[0]) : null;

    // Prioritize actual artwork images over external placeholders
    let imageUrl = firstArtwork?.imageUrl || collection.imageUrl;

    // If no image at all, use a fallback
    if (!imageUrl) {
      imageUrl = '/placeholder-art.jpg';
    }

    return {
      title: collection.title,
      image: imageUrl,
      layout: collection.layout,
      artworkIds: collection.artworkIds
    };
  });

  // Get featured conversations
  const featuredConversations = (landingPageContent?.muraqQaJournal?.featuredConversationIds || [])
    .map(id => conversations.find(c => c.id === id))
    .filter(Boolean);

  // Get top paintings
  const topPaintings = (landingPageContent?.topPaintings?.artworkIds || [])
    .map(id => artworks.find(a => a.id === id))
    .filter(Boolean)
    .map(artwork => ({
      ...artwork,
      artistName: artwork.artistName || 'Artist Name Not Available'
    }));

  return (
    <div className="bg-stone-950 min-h-screen">

      {/* Immersive Hero */}
      {hero.enabled && (
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
          <motion.div
            style={{ y: y1 }}
            className="absolute inset-0 z-0"
          >
            {/* Dark grey overlay filter */}
            <div className="absolute inset-0 bg-stone-900/70 z-10" />

            {/* Animated Background Slideshow */}
            {hasMultipleBackgrounds ? (
              <AnimatePresence mode="sync">
                {backgroundImages.map((bgImage: string, index: number) => (
                  index === currentBgIndex && (
                    <motion.div
                      key={`bg-${index}`}
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: 1, scale: 1.15 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        opacity: { duration: 1, ease: "easeInOut" },
                        scale: { duration: 4, ease: "easeOut" }
                      }}
                      className="absolute inset-0"
                    >
                      <img
                        src={bgImage}
                        alt={`Background ${index + 1}`}
                        className="w-full h-full object-cover grayscale brightness-50"
                      />
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            ) : (
              <img
                src={hero.backgroundImage}
                alt="Hero Art"
                className="w-full h-full object-cover grayscale brightness-50"
              />
            )}
          </motion.div>

          <motion.div
            style={{ opacity }}
            className="relative z-20 text-center px-4 max-w-4xl mx-auto"
          >
            <p className="text-stone-300 uppercase tracking-[0.3em] text-xs md:text-sm mb-6 animate-fade-in">
              {hero.subtitle}
            </p>
            <h1 className="font-serif text-5xl md:text-8xl text-white mb-8 leading-[1.1] animate-enter">
              {hero.title.split(hero.accentWord)[0]}
              {hero.accentWord && (
                <>
                  <br /> <span className="italic text-amber-500">{hero.accentWord}</span>
                  {hero.title.split(hero.accentWord)[1]}
                </>
              )}
              {!hero.accentWord && hero.title}
            </h1>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link
                to="/gallery"
                className="px-8 py-4 border border-white text-white uppercase tracking-widest text-xs hover:bg-white hover:text-stone-950 transition-all duration-300"
              >
                View Collection
              </Link>
              <Link
                to="/exhibitions"
                className="px-8 py-4 bg-amber-600 text-white uppercase tracking-widest text-xs hover:bg-amber-500 transition-all duration-300 border border-transparent"
              >
                Current Exhibitions
              </Link>
            </div>
          </motion.div>

          <motion.div
            style={{ opacity }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/50 animate-bounce"
          >
            <ArrowDown size={24} />
          </motion.div>
        </section>
      )}

      {/* Featured Exhibition (Editorial Layout) */}
      {landingPageContent?.featuredExhibition?.enabled && (
        <section className="py-20 px-6 md:px-12 max-w-screen-2xl mx-auto relative bg-gradient-to-b from-stone-950 via-zinc-950 to-stone-950">
          {/* Subtle Background Accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 1.5 }}
            viewport={{ once: true }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-3xl pointer-events-none"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative z-10">
            {/* Content Section */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: true }}
              className="order-2 md:order-1 space-y-5"
            >
              {/* Decorative Line */}
              <motion.span
                initial={{ width: 0 }}
                whileInView={{ width: "48px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-block h-px bg-gradient-to-r from-amber-500 to-transparent mb-2"
              />

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 text-amber-500/80 text-xs uppercase tracking-[0.3em] border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 rounded-full backdrop-blur-sm"
              >
                Featured Exhibition
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-white leading-tight"
              >
                {featuredExhibition.title}
              </motion.h2>

              {/* Artist */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                viewport={{ once: true }}
                className="text-xl text-stone-400"
              >
                A solo exhibition by{' '}
                <span className="text-white font-medium">
                  {featuredExhibition.artist || featuredExhibition.artistName}
                </span>
              </motion.p>

              {/* Date */}
              {featuredExhibition.date && (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  viewport={{ once: true }}
                  className="text-amber-500/70 text-sm uppercase tracking-widest font-medium"
                >
                  {featuredExhibition.date}
                </motion.p>
              )}

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                viewport={{ once: true }}
                className="text-stone-500 max-w-md leading-relaxed"
              >
                {featuredExhibition.description ||
                  'Explore the ethereal boundaries between memory and reality in this groundbreaking collection.'}
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                viewport={{ once: true }}
                className="pt-4"
              >
                <Link
                  to="/exhibitions"
                  className="group inline-flex items-center gap-4 text-white hover:text-amber-500 uppercase tracking-widest text-xs font-bold transition-colors"
                >
                  Explore Exhibition
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </Link>
              </motion.div>
            </motion.div>

            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: true }}
              className="order-1 md:order-2 relative aspect-[3/4] md:aspect-square overflow-hidden group rounded-2xl"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"></div>

              {/* Image */}
              <img
                src={featuredExhibition.image}
                alt={featuredExhibition.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Decorative Borders */}
              <div className="absolute inset-0 border-2 border-white/5 m-6 pointer-events-none rounded-xl group-hover:border-amber-500/30 transition-colors duration-700"></div>
              <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-2xl"></div>

              {/* Corner Accents */}
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-bl-2xl"></div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Curated Collections (Asymmetric Grid) */}
      {landingPageContent?.curatedCollections?.enabled && curatedCollections.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-zinc-900 via-stone-900 to-neutral-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/3 via-transparent to-transparent"></div>
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
              <div>
                <h3 className="font-serif text-3xl text-white mb-2">Curated Collections</h3>
                <p className="text-stone-500">Handpicked selections by our curators.</p>
              </div>
              <Link to="/gallery" className="text-amber-500 hover:text-white uppercase tracking-widest text-xs transition-colors">
                View All Collections
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {curatedCollections.map((collection, idx) => (
                <Link
                  key={idx}
                  to="/gallery"
                  className={`group relative overflow-hidden rounded-2xl border border-stone-800/50 shadow-2xl hover:shadow-amber-900/20 transition-shadow duration-500 ${
                    collection.layout === 'large' ? 'md:col-span-2 aspect-[16/9]' :
                    collection.layout === 'tall' ? 'aspect-[3/4]' :
                    'aspect-[4/3]'
                  }`}
                >
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                      collection.layout === 'large' ? 'grayscale group-hover:grayscale-0' : ''
                    }`}
                  />
                  <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <h4 className="font-serif text-2xl text-white group-hover:text-amber-500 transition-colors">{collection.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Curator's Picks - Horizontal Carousel */}
      {landingPageContent?.topPaintings?.enabled && topPaintings.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-stone-950 via-stone-900/50 to-stone-950 border-t border-stone-800/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/5 via-transparent to-transparent"></div>

          <div className="relative z-10 px-6 md:px-12 max-w-screen-2xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-1">Curator's Picks</h2>
                <p className="text-stone-500 uppercase tracking-widest text-xs">Handpicked Masterpieces</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (carouselRef.current) {
                      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                    }
                  }}
                  className="bg-stone-900/80 hover:bg-stone-800 border border-stone-700/50 p-3 rounded-full transition-all hover:scale-110 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-amber-500" />
                </button>
                <button
                  onClick={() => {
                    if (carouselRef.current) {
                      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                    }
                  }}
                  className="bg-stone-900/80 hover:bg-stone-800 border border-stone-700/50 p-3 rounded-full transition-all hover:scale-110 backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5 text-amber-500" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-8"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Duplicate items for seamless loop */}
              {[...topPaintings, ...topPaintings].map((artwork, index) => (
                <Link
                  key={`${artwork.id}-${index}`}
                  to={`/artwork/${artwork.id}`}
                  className="group flex-shrink-0 w-80"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-900 rounded-2xl mb-3 border border-stone-800/50 shadow-2xl">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-500 text-sm font-medium">View Details</span>
                          <ArrowRight className="w-4 h-4 text-amber-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-2">
                    <h3 className="font-serif text-xl text-white mb-1 group-hover:text-amber-500 transition-colors line-clamp-1">
                      {artwork.title}
                    </h3>
                    <p className="text-stone-500 text-sm mb-1">{artwork.artistName}</p>
                    <p className="text-amber-500 text-sm font-medium">PKR {artwork.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial / Latest Essays */}
      {landingPageContent?.muraqQaJournal?.enabled && featuredConversations.length > 0 && (
        <section className="py-20 px-6 md:px-12 max-w-screen-2xl mx-auto bg-gradient-to-b from-stone-950 via-neutral-900 to-stone-950">
          <div className="text-center mb-10">
            <h2 className="font-serif text-4xl text-white mb-2">Muraqqa Journal</h2>
            <p className="text-stone-500 uppercase tracking-widest text-xs">Stories, Interviews, and Critical Essays</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-stone-800/50 pt-8">
            {featuredConversations.map((conv) => (
              <Link key={conv.id} to="/conversations" className="group cursor-pointer">
                <div className="aspect-[3/2] overflow-hidden mb-4 bg-stone-900 rounded-xl border border-stone-800/50 shadow-xl group-hover:shadow-amber-900/20 transition-shadow duration-500">
                  <img
                    src={conv.thumbnailUrl || `https://picsum.photos/seed/${conv.id}/800/600`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    alt={conv.title}
                  />
                </div>
                <p className={`text-xs uppercase tracking-widest mb-2 ${
                  conv.category === 'WATCH' ? 'text-blue-500' :
                  conv.category === 'LISTEN' ? 'text-purple-500' :
                  'text-green-500'
                }`}>
                  {conv.category}
                </p>
                <h3 className="font-serif text-2xl text-white mb-2 group-hover:underline decoration-stone-600 underline-offset-4">
                  {conv.title}
                </h3>
                {conv.subtitle && (
                  <p className="text-stone-500 text-sm leading-relaxed mb-3">
                    {conv.subtitle}
                  </p>
                )}
                <span className="text-white text-xs uppercase tracking-widest border-b border-stone-800 pb-1 group-hover:border-white transition-colors">
                  {conv.category === 'WATCH' ? 'Watch' : conv.category === 'LISTEN' ? 'Listen' : 'Read'} Story
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
