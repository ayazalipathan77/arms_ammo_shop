import React, { useState } from 'react';
import { useGallery } from '../context/GalleryContext';
import { Monitor, Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const Exhibitions: React.FC = () => {
   const { exhibitions } = useGallery();
   const [filter, setFilter] = useState<'ALL' | 'CURRENT' | 'UPCOMING' | 'PAST'>('ALL');

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'CURRENT': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
         case 'UPCOMING': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
         default: return 'text-stone-500 border-stone-500/30 bg-stone-500/10';
      }
   };

   const filteredExhibitions = exhibitions.filter(ex =>
      filter === 'ALL' || ex.status === filter
   );

   return (
      <div className="pt-32 pb-20 min-h-screen bg-stone-950 relative overflow-hidden">
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

         <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative z-10">
            {/* Header */}
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
                        <h1 className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">
                           Exhibitions
                        </h1>
                     </motion.div>
                     <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-amber-500/60 uppercase tracking-[0.3em] text-xs"
                     >
                        Curated Art Experiences
                     </motion.p>
                  </div>

                  {/* Filter Tabs */}
                  <motion.div
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.4, duration: 0.6 }}
                     className="flex gap-2 bg-stone-900/50 backdrop-blur-sm p-1 rounded-lg border border-stone-800"
                  >
                     {['ALL', 'CURRENT', 'UPCOMING', 'PAST'].map((status) => (
                        <button
                           key={status}
                           onClick={() => setFilter(status as any)}
                           className={`px-4 py-2 text-xs uppercase tracking-widest transition-all duration-300 rounded-md ${
                              filter === status
                                 ? 'bg-amber-500 text-stone-950 font-bold'
                                 : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                           }`}
                        >
                           {status}
                        </button>
                     ))}
                  </motion.div>
               </div>
            </motion.div>

            {/* Exhibitions Grid */}
            {filteredExhibitions.length === 0 ? (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-32 border border-dashed border-stone-800/50 rounded-2xl bg-stone-900/20"
               >
                  <Sparkles className="text-stone-700 mx-auto mb-4" size={48} />
                  <p className="text-stone-500 font-serif text-2xl mb-2">No exhibitions {filter.toLowerCase()} yet.</p>
                  <p className="text-stone-600 text-sm">Check back soon for new exhibitions.</p>
               </motion.div>
            ) : (
               <div className="space-y-32">
                  <AnimatePresence mode="wait">
                     {filteredExhibitions.map((ex, idx) => (
                        <motion.div
                           key={ex.id}
                           initial={{ opacity: 0, y: 60 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -60 }}
                           transition={{
                              delay: idx * 0.15,
                              duration: 0.8,
                              ease: [0.21, 0.47, 0.32, 0.98]
                           }}
                           className={`flex flex-col ${
                              idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                           } gap-16 items-center group`}
                        >
                           {/* Image Section */}
                           <motion.div
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="flex-1 w-full"
                           >
                              <div className="relative aspect-video bg-stone-900/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
                                 {/* Glow Effect */}
                                 <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                 <img
                                    src={ex.imageUrl}
                                    alt={ex.title}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                                 />

                                 {/* Virtual Tour Overlay */}
                                 {ex.isVirtual && (
                                    <motion.div
                                       initial={{ opacity: 0 }}
                                       whileHover={{ opacity: 1 }}
                                       className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                                    >
                                       <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="bg-white/10 backdrop-blur border border-white/30 px-8 py-4 text-white uppercase tracking-widest text-sm hover:bg-white/20 rounded-lg flex items-center gap-3 shadow-xl"
                                       >
                                          <Monitor size={20} />
                                          Enter 3D Tour
                                          <ArrowRight size={16} />
                                       </motion.button>
                                    </motion.div>
                                 )}

                                 {/* Status Badge */}
                                 <div className="absolute top-6 left-6">
                                    <span className={`px-4 py-2 backdrop-blur-md border text-xs uppercase tracking-widest font-bold rounded-full ${getStatusColor(ex.status)}`}>
                                       {ex.status}
                                    </span>
                                 </div>

                                 {/* Decorative Border */}
                                 <div className="absolute inset-0 border-2 border-white/5 m-6 rounded-xl pointer-events-none group-hover:border-amber-500/20 transition-colors duration-700"></div>
                              </div>
                           </motion.div>

                           {/* Content Section */}
                           <div className="flex-1 space-y-8">
                              {/* Virtual Badge */}
                              {ex.isVirtual && (
                                 <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.15 + 0.3 }}
                                    className="inline-flex items-center gap-2 text-cyan-400 text-xs uppercase tracking-widest border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 rounded-full backdrop-blur-sm"
                                 >
                                    <Monitor size={14} />
                                    Virtual Available
                                 </motion.span>
                              )}

                              {/* Title */}
                              <motion.h2
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.15 + 0.2 }}
                                 className="font-serif text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-white group-hover:from-amber-200 group-hover:to-amber-400 transition-all duration-700"
                              >
                                 {ex.title}
                              </motion.h2>

                              {/* Description */}
                              <motion.p
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: idx * 0.15 + 0.3 }}
                                 className="text-stone-400 text-lg leading-relaxed max-w-xl"
                              >
                                 {ex.description}
                              </motion.p>

                              {/* Meta Info */}
                              <motion.div
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: idx * 0.15 + 0.4 }}
                                 className="flex flex-wrap gap-6 text-stone-500 text-sm pt-4 border-t border-stone-800/50"
                              >
                                 <span className="flex items-center gap-2">
                                    <Calendar size={16} className="text-amber-500/70" />
                                    <span className="text-stone-400">
                                       {format(new Date(ex.startDate), 'MMM d, yyyy')}
                                       {ex.endDate && ` - ${format(new Date(ex.endDate), 'MMM d, yyyy')}`}
                                    </span>
                                 </span>
                                 <span className="flex items-center gap-2">
                                    <MapPin size={16} className="text-amber-500/70" />
                                    <span className="text-stone-400">{ex.location}</span>
                                 </span>
                              </motion.div>

                              {/* CTA */}
                              <motion.div
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: idx * 0.15 + 0.5 }}
                                 className="pt-4"
                              >
                                 <motion.button
                                    whileHover={{ gap: "16px" }}
                                    className="group/btn inline-flex items-center gap-3 text-amber-500 hover:text-amber-400 uppercase tracking-widest text-xs font-bold transition-colors"
                                 >
                                    Learn More
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                 </motion.button>
                              </motion.div>
                           </div>
                        </motion.div>
                     ))}
                  </AnimatePresence>
               </div>
            )}
         </div>
      </div>
   );
};
