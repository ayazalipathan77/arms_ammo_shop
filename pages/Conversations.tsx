import React, { useState } from 'react';
import { useGallery } from '../context/GalleryContext';
import { Play, X, Mic, Image, Sparkles, ArrowRight, Quote } from 'lucide-react';
import { Conversation } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type CategoryFilter = 'ALL' | 'INTERVIEWS' | 'CLIENT_STORIES';

export const Conversations: React.FC = () => {
   const { conversations } = useGallery();
   const [activeVideo, setActiveVideo] = useState<Conversation | null>(null);
   const [filter, setFilter] = useState<CategoryFilter>('ALL');

   // Map old categories to new ones for display
   const getDisplayCategory = (cat: string) => {
      if (cat === 'WATCH' || cat === 'LISTEN') return 'INTERVIEWS';
      return 'CLIENT_STORIES';
   };

   const getCategoryIcon = (cat: string) => {
      const displayCat = getDisplayCategory(cat);
      if (displayCat === 'INTERVIEWS') return <Mic size={14} />;
      return <Image size={14} />;
   };

   // Filter conversations based on selected category
   const filteredConversations = conversations.filter(conv => {
      if (filter === 'ALL') return true;
      return getDisplayCategory(conv.category) === filter;
   });

   // Featured Item (First one from filtered)
   const featured = filteredConversations[0];
   const others = filteredConversations.slice(1);

   return (
      <div className="bg-stone-950 min-h-screen relative overflow-hidden">
         {/* Animated Background Gradient Orbs */}
         <motion.div
            animate={{
               scale: [1, 1.3, 1],
               opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
         />
         <motion.div
            animate={{
               scale: [1.3, 1, 1.3],
               opacity: [0.03, 0.1, 0.03]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none"
         />

         {/* Hero / Header */}
         <div className="pt-32 pb-16 px-6 md:px-12 max-w-screen-2xl mx-auto relative z-10">
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6 }}
               className="mb-16"
            >
               <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-stone-800/50 pb-12">
                  <div>
                     <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex items-center gap-3 mb-4"
                     >
                        <Sparkles className="text-amber-500" size={32} />
                        <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">
                           Stories
                        </h1>
                     </motion.div>
                     <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-amber-500/60 uppercase tracking-[0.3em] text-xs"
                     >
                        Voices & Visions from Our Gallery
                     </motion.p>
                  </div>

                  {/* Category Filter Tabs */}
                  <motion.div
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.4, duration: 0.6 }}
                     className="flex gap-2 bg-stone-900/50 backdrop-blur-sm p-1 rounded-lg border border-stone-800"
                  >
                     {[
                        { key: 'ALL', label: 'All Stories' },
                        { key: 'INTERVIEWS', label: 'Interviews', icon: <Mic size={14} /> },
                        { key: 'CLIENT_STORIES', label: 'Client Stories', icon: <Image size={14} /> }
                     ].map((tab) => (
                        <button
                           key={tab.key}
                           onClick={() => setFilter(tab.key as CategoryFilter)}
                           className={`px-4 py-2 text-xs uppercase tracking-widest transition-all duration-300 rounded-md flex items-center gap-2 ${
                              filter === tab.key
                                 ? 'bg-amber-500 text-stone-950 font-bold'
                                 : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                           }`}
                        >
                           {tab.icon} {tab.label}
                        </button>
                     ))}
                  </motion.div>
               </div>
            </motion.div>
         </div>

         <div className="max-w-screen-2xl mx-auto px-6 md:px-12 pb-20 relative z-10">

            {/* Featured Story */}
            <AnimatePresence mode="wait">
               {featured && (
                  <motion.div
                     key={featured.id}
                     initial={{ opacity: 0, y: 40 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -40 }}
                     transition={{ duration: 0.6 }}
                     className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 group cursor-pointer"
                     onClick={() => setActiveVideo(featured)}
                  >
                     <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="relative aspect-video lg:aspect-[4/3] overflow-hidden bg-stone-900/30 backdrop-blur-sm border border-white/5 rounded-2xl"
                     >
                        <img
                           src={featured.thumbnailUrl}
                           alt={featured.title}
                           className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                           <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-20 h-20 rounded-full bg-amber-500/20 backdrop-blur border border-amber-500/30 flex items-center justify-center"
                           >
                              <Play size={32} className="ml-1 text-amber-500 fill-amber-500" />
                           </motion.div>
                        </div>
                        {/* Category Badge */}
                        <div className="absolute top-6 left-6">
                           <span className={`px-4 py-2 backdrop-blur-md border text-xs uppercase tracking-widest font-bold rounded-full flex items-center gap-2 ${
                              getDisplayCategory(featured.category) === 'INTERVIEWS'
                                 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                                 : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                           }`}>
                              {getCategoryIcon(featured.category)}
                              {getDisplayCategory(featured.category).replace('_', ' ')}
                           </span>
                        </div>
                        {/* Decorative Border */}
                        <div className="absolute inset-0 border-2 border-white/5 m-6 rounded-xl pointer-events-none group-hover:border-amber-500/20 transition-colors duration-700"></div>
                     </motion.div>

                     <div className="flex flex-col justify-center space-y-6">
                        <motion.div
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 0.3 }}
                        >
                           <Quote className="text-amber-500/30 mb-4" size={48} />
                        </motion.div>
                        <motion.h2
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.4 }}
                           className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-white leading-tight group-hover:from-amber-200 group-hover:to-amber-400 transition-all duration-500"
                        >
                           {featured.title}
                        </motion.h2>
                        <motion.p
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ delay: 0.5 }}
                           className="text-xl text-stone-400 font-light leading-relaxed"
                        >
                           {featured.description}
                        </motion.p>
                        <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ delay: 0.6 }}
                           className="pt-8"
                        >
                           <motion.span
                              whileHover={{ gap: "16px" }}
                              className="inline-flex items-center gap-3 text-amber-500 hover:text-amber-400 uppercase tracking-widest text-xs font-bold transition-colors cursor-pointer"
                           >
                              {getDisplayCategory(featured.category) === 'INTERVIEWS' ? 'Watch Interview' : 'View Story'}
                              <ArrowRight size={16} />
                           </motion.span>
                        </motion.div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Stories Grid */}
            {others.length > 0 && (
               <>
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.5 }}
                     className="flex items-end justify-between mb-12 border-b border-stone-800/50 pb-4"
                  >
                     <h3 className="font-serif text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white">
                        More Stories
                     </h3>
                     <span className="text-amber-500/60 text-xs uppercase tracking-widest">
                        {others.length} {others.length === 1 ? 'Story' : 'Stories'}
                     </span>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <AnimatePresence mode="wait">
                        {others.map((item, idx) => (
                           <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 40 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -40 }}
                              transition={{
                                 delay: idx * 0.1,
                                 duration: 0.6,
                                 ease: [0.21, 0.47, 0.32, 0.98]
                              }}
                              className="group cursor-pointer"
                              onClick={() => setActiveVideo(item)}
                           >
                              <motion.div
                                 whileHover={{ y: -8 }}
                                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                 className="bg-stone-900/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 hover:bg-stone-900/50 transition-all duration-500"
                              >
                                 <div className="relative aspect-[16/10] overflow-hidden">
                                    <img
                                       src={item.thumbnailUrl}
                                       alt={item.title}
                                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                    />
                                    {/* Play/View overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                       <div className="w-14 h-14 rounded-full bg-amber-500/20 backdrop-blur border border-amber-500/30 flex items-center justify-center">
                                          <Play size={24} className="ml-1 text-amber-500 fill-amber-500" />
                                       </div>
                                    </div>
                                    {/* Category Badge */}
                                    <div className="absolute top-4 left-4">
                                       <span className={`px-3 py-1.5 backdrop-blur-md border text-[10px] uppercase tracking-widest font-bold rounded-full flex items-center gap-1.5 ${
                                          getDisplayCategory(item.category) === 'INTERVIEWS'
                                             ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
                                             : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                                       }`}>
                                          {getCategoryIcon(item.category)}
                                          {getDisplayCategory(item.category).replace('_', ' ')}
                                       </span>
                                    </div>
                                 </div>

                                 <div className="p-6 space-y-3">
                                    <h3 className="font-serif text-xl text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-200 group-hover:to-yellow-400 transition-all duration-300 line-clamp-2">
                                       {item.title}
                                    </h3>
                                    <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed">
                                       {item.description}
                                    </p>
                                    <div className="pt-2 flex items-center gap-2 text-amber-500/70 group-hover:text-amber-500 text-xs uppercase tracking-widest transition-colors">
                                       {getDisplayCategory(item.category) === 'INTERVIEWS' ? 'Watch' : 'View'}
                                       <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                 </div>
                              </motion.div>
                           </motion.div>
                        ))}
                     </AnimatePresence>
                  </div>
               </>
            )}

            {/* Empty State */}
            {filteredConversations.length === 0 && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-32 border border-dashed border-stone-800/50 rounded-2xl bg-stone-900/20"
               >
                  <Sparkles className="text-stone-700 mx-auto mb-4" size={48} />
                  <p className="text-stone-500 font-serif text-2xl mb-2">No stories found</p>
                  <p className="text-stone-600 text-sm">Check back soon for new content.</p>
               </motion.div>
            )}
         </div>

         {/* Video/Image Modal */}
         <AnimatePresence>
            {activeVideo && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
               >
                  <motion.button
                     initial={{ opacity: 0, y: -20 }}
                     animate={{ opacity: 1, y: 0 }}
                     onClick={() => setActiveVideo(null)}
                     className="absolute top-6 right-6 text-stone-400 hover:text-white transition-colors flex items-center gap-2 uppercase text-xs tracking-widest z-50"
                  >
                     Close
                     <div className="p-2 border border-stone-700 hover:border-amber-500/50 rounded-full transition-colors">
                        <X size={20} />
                     </div>
                  </motion.button>

                  <motion.div
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     className="w-full max-w-6xl aspect-video bg-black shadow-2xl border border-stone-800 rounded-2xl overflow-hidden relative"
                  >
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
                        <img
                           src={activeVideo.thumbnailUrl}
                           alt={activeVideo.title}
                           className="w-full h-full object-contain"
                        />
                     )}
                  </motion.div>

                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                     className="max-w-4xl w-full mt-8 text-center space-y-4"
                  >
                     <span className={`text-xs font-bold uppercase tracking-widest border px-3 py-1 rounded-full inline-flex items-center gap-2 ${
                        getDisplayCategory(activeVideo.category) === 'INTERVIEWS'
                           ? 'text-amber-500 border-amber-500/30'
                           : 'text-emerald-500 border-emerald-500/30'
                     }`}>
                        {getCategoryIcon(activeVideo.category)}
                        {getDisplayCategory(activeVideo.category).replace('_', ' ')}
                     </span>
                     <h2 className="font-serif text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white">
                        {activeVideo.title}
                     </h2>
                     <p className="text-stone-400">{activeVideo.subtitle || activeVideo.description}</p>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};
