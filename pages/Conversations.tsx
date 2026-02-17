import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Play, X, Mic, Image, ArrowRight, Quote } from 'lucide-react';
import { Conversation } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';

type CategoryFilter = 'ALL' | 'INTERVIEWS' | 'CLIENT_STORIES';

export const Conversations: React.FC = () => {
   const { conversations } = useShop();
   const [activeVideo, setActiveVideo] = useState<Conversation | null>(null);
   const [filter, setFilter] = useState<CategoryFilter>('ALL');

   const getDisplayCategory = (cat: string) => {
      if (cat === 'WATCH' || cat === 'LISTEN') return 'INTERVIEWS';
      return 'CLIENT_STORIES';
   };

   // Filtering logic
   const filteredConversations = conversations.filter(conv => {
      if (filter === 'ALL') return true;
      return getDisplayCategory(conv.category) === filter;
   });

   const featured = filteredConversations[0];
   const others = filteredConversations.slice(1);

   return (
      <div className="pt-24 pb-20 min-h-screen relative z-10 px-6 md:px-12 overflow-hidden">
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
                        STORIES
                     </h1>
                     <p className="text-tangerine font-mono text-sm tracking-widest uppercase high-contrast:text-[#D35400]">
                        Voices & Visions from Our Gallery
                     </p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap gap-2">
                     {[
                        { key: 'ALL', label: 'All Stories' },
                        { key: 'INTERVIEWS', label: 'Interviews' },
                        { key: 'CLIENT_STORIES', label: 'Client Stories' }
                     ].map((tab) => (
                        <button
                           key={tab.key}
                           onClick={() => setFilter(tab.key as CategoryFilter)}
                           className={`px-6 py-2 text-xs font-display font-bold uppercase tracking-widest transition-all duration-300 border ${filter === tab.key
                              ? 'bg-pearl text-void border-pearl high-contrast:bg-black high-contrast:text-white high-contrast:border-black'
                              : 'text-warm-gray border-warm-gray/30 hover:border-tangerine hover:text-tangerine bg-transparent high-contrast:text-black high-contrast:border-black/50'
                              }`}
                        >
                           {tab.label}
                        </button>
                     ))}
                  </div>
               </div>
            </motion.div>

            {/* Content Section */}
            {/* Featured Story */}
            <AnimatePresence mode="wait">
               {featured && (
                  <motion.div
                     key={featured.id}
                     initial={{ opacity: 0, y: 40 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -40 }}
                     transition={{ duration: 0.6 }}
                     className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-32"
                  >
                     {/* Video Thumbnail Block */}
                     <motion.div
                        className="relative group cursor-pointer"
                        whileHover={{ scale: 0.99 }}
                        onClick={() => setActiveVideo(featured)}
                     >
                        <div className="relative aspect-video lg:aspect-[4/3] overflow-hidden border-2 border-transparent group-hover:border-tangerine transition-colors duration-500">
                           <img
                              src={featured.thumbnailUrl}
                              alt={featured.title}
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
                           />
                           {/* Play Button */}
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-20 h-20 rounded-full border border-pearl text-pearl flex items-center justify-center group-hover:bg-tangerine group-hover:border-tangerine group-hover:text-void transition-all duration-300">
                                 <Play size={24} fill="currentColor" />
                              </div>
                           </div>

                           {/* Decorative sticker */}
                           <div className="absolute top-4 left-4 bg-void text-pearl border border-pearl px-3 py-1 text-xs font-bold uppercase tracking-widest">
                              FEATURED
                           </div>
                        </div>
                        {/* Offset Block */}
                        <div className="absolute -inset-4 border border-pearl/20 -z-10 hidden lg:block" />
                     </motion.div>

                     {/* Content */}
                     <div className="flex flex-col justify-center space-y-8">
                        <Quote className="text-tangerine mb-4 high-contrast:text-[#D35400]" size={48} />

                        <h2 className="font-display text-4xl md:text-5xl text-pearl high-contrast:text-black leading-tight">
                           {featured.title}
                        </h2>

                        <p className="text-warm-gray text-xl leading-relaxed high-contrast:text-black/80">
                           {featured.description}
                        </p>

                        <div className="pt-4">
                           <Button variant="outline" onClick={() => setActiveVideo(featured)}>
                              {getDisplayCategory(featured.category) === 'INTERVIEWS' ? 'Watch Interview' : 'View Story'}
                           </Button>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Stories Grid */}
            {others.length > 0 && (
               <>
                  <div className="flex items-end justify-between mb-12 border-b border-pearl/10 pb-4 high-contrast:border-black/20">
                     <h3 className="font-display text-3xl text-pearl high-contrast:text-black">
                        MORE STORIES
                     </h3>
                     <span className="text-tangerine font-mono text-xs uppercase tracking-widest high-contrast:text-[#D35400]">
                        {others.length} Available
                     </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {others.map((item, idx) => (
                        <motion.div
                           key={item.id}
                           initial={{ opacity: 0, y: 20 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true }}
                           transition={{ delay: idx * 0.1 }}
                           className="group cursor-pointer"
                           onClick={() => setActiveVideo(item)}
                        >
                           {/* Card */}
                           <div className="relative aspect-[16/10] overflow-hidden border border-pearl/10 group-hover:border-tangerine transition-colors duration-300 mb-4">
                              <img
                                 src={item.thumbnailUrl}
                                 alt={item.title}
                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                              />
                              <div className="absolute bottom-4 right-4 w-10 h-10 bg-void text-pearl border border-pearl flex items-center justify-center group-hover:bg-tangerine group-hover:border-tangerine transition-colors">
                                 <Play size={14} fill="currentColor" />
                              </div>
                           </div>

                           <h3 className="font-display text-xl text-pearl group-hover:text-tangerine transition-colors mb-2 line-clamp-2 high-contrast:text-black high-contrast:group-hover:text-[#D35400]">
                              {item.title}
                           </h3>
                           <p className="text-warm-gray text-sm line-clamp-2 high-contrast:text-black/70">
                              {item.description}
                           </p>
                        </motion.div>
                     ))}
                  </div>
               </>
            )}

            {/* Modal - Simplified for brevity but styled */}
            <AnimatePresence>
               {activeVideo && (
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="fixed inset-0 z-[100] bg-void/95 backdrop-blur-md flex items-center justify-center p-4 lg:p-20"
                  >
                     <button
                        onClick={() => setActiveVideo(null)}
                        className="absolute top-8 right-8 text-pearl hover:text-tangerine transition-colors"
                     >
                        <X size={32} />
                     </button>

                     <div className="w-full max-w-5xl aspect-video bg-black border border-charcoal overflow-hidden shadow-2xl">
                        {activeVideo.videoId ? (
                           <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                              title={activeVideo.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                           />
                        ) : (
                           <img src={activeVideo.thumbnailUrl} className="w-full h-full object-contain" alt="" />
                        )}
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
   );
};

