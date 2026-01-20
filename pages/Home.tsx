import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Instagram, Facebook, Twitter, Monitor, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_EXHIBITIONS } from '../constants';
import { useCurrency } from '../App';
import { useGallery } from '../context/GalleryContext';

interface HomeProps {
  lang: 'EN' | 'UR';
}

export const Home: React.FC<HomeProps> = ({ lang }) => {
  const { convertPrice } = useCurrency();
  const { siteContent, artworks, isLoading } = useGallery();
  const auctionItem = artworks.find(a => a.isAuction);

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-stone-950">
           {/* Moving Graphics Rendition */}
           <motion.div
             animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
             transition={{ duration: 15, repeat: Infinity }}
             className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale')] bg-cover bg-center"
           />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="font-serif text-5xl md:text-7xl lg:text-9xl text-stone-100 mb-8 font-thin tracking-wide"
          >
            {siteContent.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-amber-500 text-sm md:text-xl font-light tracking-[0.3em] uppercase mb-12"
          >
            {siteContent.heroSubtitle}
          </motion.p>
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 1.5 }}
             className="flex justify-center gap-6"
          >
             <Link to="/gallery" className="px-8 py-3 border border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-stone-950 transition-all duration-300 text-sm tracking-widest uppercase">
               Enter Gallery
             </Link>
             <Link to="/exhibitions" className="px-8 py-3 border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white transition-all duration-300 text-sm tracking-widest uppercase">
               Virtual Tours
             </Link>
          </motion.div>
        </div>
      </section>

      {/* Live Auction Section (Drop) */}
      {auctionItem && (
        <section className="py-20 bg-amber-900/10 border-y border-amber-900/30">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 bg-red-900/30 text-red-500 px-3 py-1 text-xs uppercase tracking-widest border border-red-900/50 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Live Auction
              </div>
              <h2 className="font-serif text-4xl md:text-6xl text-white">{auctionItem.title}</h2>
              <p className="text-stone-400 max-w-lg">{auctionItem.description}</p>
              <div className="flex items-center gap-8">
                <div>
                   <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Current Bid</p>
                   <p className="text-2xl font-serif text-amber-500">{convertPrice(auctionItem.price)}</p>
                </div>
                <div>
                   <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Ends In</p>
                   <div className="flex gap-2 text-xl font-mono text-white">
                      <span>02</span>:<span>14</span>:<span>33</span>
                   </div>
                </div>
              </div>
              <Link to={`/artwork/${auctionItem.id}`} className="inline-block bg-white text-stone-950 px-8 py-3 uppercase tracking-widest text-sm hover:bg-stone-200 transition-colors">
                Place Bid
              </Link>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 rounded-full"></div>
              <img src={auctionItem.imageUrl} alt="Auction" className="relative z-10 rounded-sm shadow-2xl border border-stone-800 rotate-2 hover:rotate-0 transition-transform duration-700" />
            </div>
          </div>
        </section>
      )}

      {/* Latest Exhibitions */}
      <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
         <div className="flex justify-between items-end mb-12">
            <div>
               <h2 className="font-serif text-4xl text-stone-200">Latest Exhibitions</h2>
               <p className="text-stone-500 mt-2">Immersive experiences from around the world</p>
            </div>
            <Link to="/exhibitions" className="text-amber-500 text-sm uppercase tracking-wide flex items-center gap-2">View All <ArrowRight size={14} /></Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {MOCK_EXHIBITIONS.map(ex => (
              <div key={ex.id} className="group relative overflow-hidden h-80 bg-stone-900 border border-stone-800">
                 <img src={ex.imageUrl} alt={ex.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-80" />
                 <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black to-transparent">
                    {ex.isVirtual && <div className="inline-flex items-center gap-1 text-xs text-cyan-400 mb-2"><Monitor size={12} /> Virtual Tour Available</div>}
                    <h3 className="font-serif text-2xl text-white group-hover:text-amber-500 transition-colors">{ex.title}</h3>
                    <p className="text-stone-400 text-sm mt-1">{ex.date} • {ex.location}</p>
                 </div>
              </div>
            ))}
         </div>
      </section>

      {/* Featured Art */}
      <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-stone-900">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-serif text-4xl text-stone-200">Curator's Choice</h2>
            <p className="text-stone-500 mt-2">Authentic Masterpieces</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="ml-3 text-stone-400">Loading artworks...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {artworks.slice(0, 3).map((art) => (
              <Link key={art.id} to={`/artwork/${art.id}`} className="group cursor-pointer block">
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-900 mb-4">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur px-3 py-1 text-xs text-white uppercase tracking-wider">
                     {art.category}
                  </div>
                </div>
                <h3 className="font-serif text-xl text-stone-300 group-hover:text-amber-500 transition-colors">{art.title}</h3>
                <p className="text-stone-500 text-sm uppercase tracking-wide mt-1">{art.artistName}</p>
                <p className="text-stone-400 mt-2 font-mono text-xs">{convertPrice(art.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Social Feed Simulation */}
      <section className="py-20 bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl mb-8">Follow Our Journey</h2>
          <div className="flex justify-center gap-8 mb-12 text-stone-500">
            <a href={siteContent.socialLinks.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="hover:text-amber-500 cursor-pointer transition-colors" /></a>
            <a href={siteContent.socialLinks.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="hover:text-amber-500 cursor-pointer transition-colors" /></a>
            <a href={siteContent.socialLinks.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="hover:text-amber-500 cursor-pointer transition-colors" /></a>
            <a href={siteContent.socialLinks.pinterest} target="_blank" rel="noopener noreferrer"><span className="font-serif italic hover:text-amber-500 cursor-pointer">Pinterest</span></a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="aspect-square bg-stone-800 flex items-center justify-center text-stone-700 text-xs overflow-hidden group relative cursor-pointer">
                 <img src={`https://picsum.photos/400/400?random=${i+50}`} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                 <Instagram className="absolute text-white opacity-0 group-hover:opacity-100" />
               </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
};
