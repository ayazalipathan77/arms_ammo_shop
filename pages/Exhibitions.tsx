import React from 'react';
import { useGallery } from '../context/GalleryContext';
import { Monitor, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const Exhibitions: React.FC = () => {
   const { exhibitions } = useGallery();

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'CURRENT': return 'text-green-500 border-green-500/30';
         case 'UPCOMING': return 'text-amber-500 border-amber-500/30';
         default: return 'text-stone-500 border-stone-500/30';
      }
   };

   return (
      <div className="pt-32 pb-12 max-w-7xl mx-auto px-4">
         <h1 className="font-serif text-5xl text-stone-100 mb-12 text-center">Exhibitions</h1>

         {exhibitions.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-stone-800">
               <p className="text-stone-500 font-serif text-xl">No exhibitions scheduled yet.</p>
            </div>
         ) : (
            <div className="space-y-24">
               {exhibitions.map((ex, idx) => (
                  <div key={ex.id} className={`flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
                     <div className="flex-1 w-full">
                        <div className="relative aspect-video bg-stone-900 border border-stone-800 overflow-hidden group">
                           <img src={ex.imageUrl} alt={ex.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700" />
                           {/* Virtual Tour Overlay */}
                           {ex.isVirtual && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="bg-white/10 backdrop-blur border border-white/50 px-6 py-3 text-white uppercase tracking-widest text-sm hover:bg-white/20">
                                    Enter 3D Tour
                                 </button>
                              </div>
                           )}
                           <div className="absolute top-4 left-4">
                              <span className={`px-3 py-1 bg-black/80 backdrop-blur border text-xs uppercase tracking-widest ${getStatusColor(ex.status)}`}>
                                 {ex.status}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="flex-1 space-y-6">
                        {ex.isVirtual && <span className="inline-flex items-center gap-1 text-cyan-500 text-xs uppercase tracking-widest border border-cyan-500/30 px-2 py-1"><Monitor size={12} /> Virtual Available</span>}
                        <h2 className="font-serif text-4xl text-white">{ex.title}</h2>
                        <p className="text-stone-400 text-lg leading-relaxed">{ex.description}</p>
                        <div className="flex gap-6 text-stone-500 text-sm">
                           <span className="flex items-center gap-2">
                              <Calendar size={14} />
                              {format(new Date(ex.startDate), 'MMM d, yyyy')}
                              {ex.endDate && ` - ${format(new Date(ex.endDate), 'MMM d, yyyy')}`}
                           </span>
                           <span className="flex items-center gap-2"><MapPin size={14} /> {ex.location}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
};
