import React, { useState } from 'react';
import { useGallery } from '../context/GalleryContext';
import { Monitor, Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';

export const Exhibitions: React.FC = () => {
   const { exhibitions } = useGallery();
   const [filter, setFilter] = useState<'ALL' | 'CURRENT' | 'UPCOMING' | 'PAST'>('ALL');

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'CURRENT': return 'text-tangerine border-tangerine bg-tangerine/10';
         case 'UPCOMING': return 'text-amber border-amber bg-amber/10';
         default: return 'text-warm-gray border-warm-gray bg-warm-gray/10';
      }
   };

   const filteredExhibitions = exhibitions.filter(ex =>
      filter === 'ALL' || ex.status === filter
   );

   return (
      <div className="pt-32 pb-20 min-h-screen relative z-10 px-6 md:px-12">
         <div className="max-w-[1920px] mx-auto">
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
                        EXHIBITIONS
                     </h1>
                     <p className="text-tangerine font-mono text-sm tracking-widest uppercase high-contrast:text-[#D35400]">
                        Curated Art Experiences
                     </p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap gap-2">
                     {['ALL', 'CURRENT', 'UPCOMING', 'PAST'].map((status) => (
                        <button
                           key={status}
                           onClick={() => setFilter(status as any)}
                           className={`px-6 py-2 text-xs font-display font-bold uppercase tracking-widest transition-all duration-300 border ${filter === status
                                 ? 'bg-pearl text-void border-pearl high-contrast:bg-black high-contrast:text-white high-contrast:border-black'
                                 : 'text-warm-gray border-warm-gray/30 hover:border-tangerine hover:text-tangerine bg-transparent high-contrast:text-black high-contrast:border-black/50'
                              }`}
                        >
                           {status}
                        </button>
                     ))}
                  </div>
               </div>
            </motion.div>

            {/* Exhibitions Grid */}
            {filteredExhibitions.length === 0 ? (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-32 border border-dashed border-pearl/10 rounded-2xl"
               >
                  <Sparkles className="text-warm-gray mx-auto mb-4" size={48} />
                  <p className="text-pearl font-display text-2xl mb-2 high-contrast:text-black">No exhibitions {filter.toLowerCase()} yet.</p>
               </motion.div>
            ) : (
               <div className="space-y-24">
                  <AnimatePresence mode="wait">
                     {filteredExhibitions.map((ex, idx) => (
                        <motion.div
                           key={ex.id}
                           initial={{ opacity: 0, y: 60 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -60 }}
                           transition={{
                              delay: idx * 0.1,
                              duration: 0.8,
                              ease: [0.16, 1, 0.3, 1] // ease-dry
                           }}
                           className={`flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                              } gap-12 lg:gap-24 items-center group`}
                        >
                           {/* Image Section - Brutalist Block */}
                           <motion.div
                              className="flex-1 w-full relative"
                              whileHover={{ scale: 0.98 }}
                              transition={{ duration: 0.5 }}
                           >
                              <div className="relative aspect-video overflow-hidden border-2 border-transparent group-hover:border-tangerine transition-colors duration-500">
                                 {/* Image */}
                                 <img
                                    src={ex.imageUrl}
                                    alt={ex.title}
                                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                                 />

                                 {/* Virtual Tour Overlay */}
                                 {ex.isVirtual && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-void/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                       <Button variant="outline">
                                          <Monitor className="mr-2" size={16} /> 3D TOUR available
                                       </Button>
                                    </div>
                                 )}

                                 {/* Status Badge Sticker */}
                                 <div className={`absolute top-4 left-4 border px-3 py-1 text-xs font-bold uppercase tracking-widest bg-void ${getStatusColor(ex.status)}`}>
                                    {ex.status}
                                 </div>
                              </div>

                              {/* Offset Decorative Block */}
                              <div className="absolute -inset-4 border border-pearl/20 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500 hidden lg:block" />
                           </motion.div>

                           {/* Content Section */}
                           <div className="flex-1 space-y-6">
                              <div className="flex items-center gap-4 text-tangerine high-contrast:text-[#D35400]">
                                 <Sparkles size={20} />
                                 <span className="font-mono text-xs tracking-widest uppercase">Featured Exhibition</span>
                              </div>

                              <h2 className="font-display text-4xl md:text-6xl font-bold text-pearl high-contrast:text-black leading-tight group-hover:text-transparent group-hover:text-stroke transition-all duration-500">
                                 {ex.title}
                              </h2>

                              <p className="text-warm-gray text-lg leading-relaxed max-w-xl high-contrast:text-black/80">
                                 {ex.description}
                              </p>

                              {/* Meta Info */}
                              <div className="flex flex-wrap gap-8 text-sm pt-6 border-t border-pearl/10 high-contrast:border-black/20">
                                 <div className="flex items-center gap-2 text-pearl high-contrast:text-black">
                                    <Calendar size={16} className="text-tangerine" />
                                    <span className="font-mono uppercase">
                                       {format(new Date(ex.startDate), 'MMM d, yyyy')}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-2 text-pearl high-contrast:text-black">
                                    <MapPin size={16} className="text-tangerine" />
                                    <span className="font-mono uppercase">{ex.location}</span>
                                 </div>
                              </div>

                              <div className="pt-6">
                                 <Button variant="primary">
                                    Explore Exhibition <ArrowRight className="ml-2" size={16} />
                                 </Button>
                              </div>
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
