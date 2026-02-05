import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import { useGallery } from '../context/GalleryContext';
import { ARView } from '../components/ARView';
import { ShieldCheck, Truck, Box, CreditCard, Share2, Star, FileText, X, Loader2, ArrowLeft, Heart, Maximize2 } from 'lucide-react';
import { CartItem, Artwork } from '../types';
import { artworkApi, transformArtwork } from '../services/api';
import { formatCurrency, cn } from '../lib/utils';
import Button from '../components/ui/Button';
import ArtworkCard from '../components/ui/ArtworkCard';

export const ArtworkDetail: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const location = useLocation();
   const { addToCart } = useCartContext(); // Updated hook
   const { artworks } = useGallery();

   // Preserve collections URL with filters for "Back" navigation
   const backTo = (location.state as any)?.from?.startsWith('/collections')
      ? (location.state as any).from
      : '/collections';

   const [artwork, setArtwork] = useState<Artwork | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const [showAR, setShowAR] = useState(false);
   const [showProvenance, setShowProvenance] = useState(false);
   const [showZoom, setShowZoom] = useState(false);
   const [isSaved, setIsSaved] = useState(false);

   // Print Logic
   const [purchaseType, setPurchaseType] = useState<'ORIGINAL' | 'PRINT'>('ORIGINAL');
   const [selectedPrintSize, setSelectedPrintSize] = useState<string>('');
   const [printQuantity, setPrintQuantity] = useState(1);

   // Fetch artwork from API
   useEffect(() => {
      const fetchArtwork = async () => {
         if (!id) return;
         setIsLoading(true);
         setError(null);
         try {
            const response = await artworkApi.getById(id);
            const transformedArtwork = transformArtwork(response.artwork);
            setArtwork(transformedArtwork);
         } catch (err) {
            console.error('Error fetching artwork:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch artwork');
         } finally {
            setIsLoading(false);
         }
      };

      fetchArtwork();
      window.scrollTo(0, 0);
   }, [id]);

   // Derive print availability
   const hasPrints = !!(artwork?.printOptions?.enabled && artwork.printOptions.sizes.length > 0);
   const printSizes = artwork?.printOptions?.sizes || [];

   // Auto-select first print size when artwork loads
   useEffect(() => {
      if (hasPrints && printSizes.length > 0 && !selectedPrintSize) {
         setSelectedPrintSize(printSizes[0].name);
      }
   }, [hasPrints, printSizes, selectedPrintSize]);

   // Reset to ORIGINAL if prints not available
   useEffect(() => {
      if (!hasPrints && purchaseType === 'PRINT') {
         setPurchaseType('ORIGINAL');
      }
   }, [hasPrints, purchaseType]);

   if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-void"><Loader2 className="w-8 h-8 text-tangerine animate-spin" /></div>;
   if (error || !artwork) return <div className="min-h-screen flex items-center justify-center bg-void text-pearl">{error || 'Artwork not found'}</div>;

   const relatedArtworks = artworks.filter(art => art.id !== id && art.artistName === artwork.artistName).slice(0, 4);

   // Calculate price based on purchase type
   const selectedSizeOption = printSizes.find(s => s.name === selectedPrintSize);
   const printUnitPrice = selectedSizeOption?.price || 0;
   const finalPricePKR = purchaseType === 'ORIGINAL' ? artwork.price : printUnitPrice * printQuantity;

   const handleAddToCart = () => {
      addToCart({
         ...artwork,
         quantity: purchaseType === 'PRINT' ? printQuantity : 1,
         selectedPrintSize: purchaseType === 'PRINT' ? selectedPrintSize : 'ORIGINAL',
         finalPrice: purchaseType === 'PRINT' ? printUnitPrice * printQuantity : artwork.price,
      });
      navigate('/cart');
   };

   return (
      <div className="min-h-screen bg-void pb-12">
         {showAR && <ARView artwork={artwork} onClose={() => setShowAR(false)} />}

         {/* Fullscreen Zoom Lightbox */}
         {showZoom && (
            <div className="fixed inset-0 z-[100] bg-void/90 backdrop-blur-md flex items-center justify-center" onClick={() => setShowZoom(false)}>
               <button
                  onClick={() => setShowZoom(false)}
                  className="absolute top-6 right-6 text-pearl hover:text-white transition-colors z-10"
               >
                  <X size={28} />
               </button>
               <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="max-w-[95vw] max-h-[95vh] object-contain cursor-zoom-out shadow-2xl"
                  onClick={(e) => { e.stopPropagation(); setShowZoom(false); }}
               />
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                  <p className="font-display text-lg text-pearl">{artwork.title}</p>
                  <p className="text-warm-gray text-xs uppercase tracking-widest mt-1 font-mono">{artwork.artistName} • {artwork.year}</p>
               </div>
            </div>
         )}

         {/* Navigation Bar */}
         <div className="fixed top-24 left-0 w-full z-40 px-6 md:px-12 pointer-events-none">
            <Link to={backTo} className="inline-flex items-center gap-2 text-pearl hover:text-tangerine uppercase tracking-widest text-xs pointer-events-auto transition-colors bg-void/50 backdrop-blur-md border border-pearl/10 px-4 py-2 rounded-full font-bold">
               <ArrowLeft size={14} /> Back to Collection
            </Link>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen pt-20 lg:pt-24">

            {/* Left: Immersive Image (Taking majority of screen on desktop) */}
            <div className="lg:col-span-8 lg:h-screen lg:sticky lg:top-0 bg-charcoal/30 flex items-center justify-center p-8 md:p-20 relative group overflow-hidden">
               {/* Ambient Glow */}
               <div className="absolute inset-0 bg-gradient-to-b from-void/0 via-void/0 to-void/50 z-10 pointer-events-none"></div>

               <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center z-20">
                  <img
                     src={artwork.imageUrl}
                     alt={artwork.title}
                     className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-2xl"
                  />
                  {/* Image Controls */}
                  <div className="absolute bottom-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                     <button onClick={() => setShowAR(true)} className="bg-void/80 backdrop-blur text-pearl p-3 hover:text-tangerine transition-colors rounded-full border border-pearl/10" title="View in AR">
                        <Box size={20} />
                     </button>
                     <button onClick={() => setShowZoom(true)} className="bg-void/80 backdrop-blur text-pearl p-3 hover:text-tangerine transition-colors rounded-full border border-pearl/10" title="Zoom">
                        <Maximize2 size={20} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Right: Details Panel */}
            <div className="lg:col-span-4 bg-void px-8 md:px-12 py-10 lg:py-16 space-y-8 overflow-y-auto border-l border-pearl/5 relative z-10">

               {/* Header */}
               <div className="space-y-4">
                  <div className="flex justify-between items-start">
                     <Link to={`/artists/${artwork.artistId}`} className="text-tangerine uppercase tracking-[0.2em] text-xs font-bold hover:text-white transition-colors block mb-2">
                        {artwork.artistName}
                     </Link>
                     <button
                        onClick={() => setIsSaved(!isSaved)}
                        className={`transition-colors ${isSaved ? 'text-red-500' : 'text-warm-gray hover:text-red-500'}`}
                     >
                        <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                     </button>
                  </div>
                  <h1 className="font-display text-4xl md:text-5xl text-pearl leading-tight">{artwork.title}</h1>
                  <p className="text-warm-gray text-xs uppercase tracking-widest font-mono">{artwork.year} • {artwork.medium}</p>
               </div>

               {/* Description */}
               <div className="prose prose-invert prose-stone">
                  <p className="font-light text-pearl/80 leading-relaxed text-lg">{artwork.description}</p>
               </div>

               {/* Commerce Section */}
               <div className="space-y-6 pt-8 border-t border-pearl/10">

                  {/* Type Selection - Only show tabs if prints available */}
                  {hasPrints && (
                     <div className="flex items-center gap-1 bg-charcoal p-1 rounded-sm w-fit border border-pearl/10">
                        <button
                           onClick={() => { setPurchaseType('ORIGINAL'); setPrintQuantity(1); }}
                           className={cn("px-6 py-2 text-xs uppercase tracking-widest transition-all font-bold", purchaseType === 'ORIGINAL' ? "bg-white text-void" : "text-warm-gray hover:text-pearl")}
                        >
                           Original
                        </button>
                        <button
                           onClick={() => setPurchaseType('PRINT')}
                           className={cn("px-6 py-2 text-xs uppercase tracking-widest transition-all font-bold", purchaseType === 'PRINT' ? "bg-white text-void" : "text-warm-gray hover:text-pearl")}
                        >
                           Print
                        </button>
                     </div>
                  )}

                  {purchaseType === 'PRINT' && hasPrints && (
                     <div className="space-y-4 animate-fade-in">
                        {/* Fabric Canvas Notice */}
                        <div className="bg-tangerine/5 border border-tangerine/20 p-4">
                           <p className="text-tangerine text-xs leading-relaxed font-mono">
                              Printed on high-end fabric canvas — the same material used for the original painting. Colors may differ slightly from the original artwork.
                           </p>
                        </div>

                        {/* Size Selection */}
                        <div className="space-y-3">
                           <span className="text-warm-gray text-xs uppercase tracking-widest font-bold">Select Size</span>
                           <div className="flex flex-col gap-2">
                              {printSizes.map(size => (
                                 <button
                                    key={size.name}
                                    onClick={() => setSelectedPrintSize(size.name)}
                                    className={cn("flex items-center justify-between px-4 py-3 border transition-all", selectedPrintSize === size.name ? "border-tangerine bg-tangerine/5 text-pearl" : "border-pearl/10 text-warm-gray hover:border-pearl/30")}
                                 >
                                    <div className="flex flex-col items-start gap-0.5">
                                       <span className="font-bold uppercase tracking-wider text-xs">{size.name}</span>
                                       <span className="text-warm-gray/70 text-[10px] font-mono">{size.dimensions}</span>
                                    </div>
                                    <span className={cn("font-mono text-sm", selectedPrintSize === size.name ? "text-tangerine" : "")}>
                                       {formatCurrency(size.price)}
                                    </span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="space-y-2">
                           <span className="text-warm-gray text-xs uppercase tracking-widest font-bold">Quantity</span>
                           <div className="flex items-center gap-3">
                              <button
                                 onClick={() => setPrintQuantity(Math.max(1, printQuantity - 1))}
                                 className="w-10 h-10 border border-pearl/20 text-pearl hover:border-tangerine hover:text-tangerine flex items-center justify-center transition-colors text-lg"
                              >
                                 −
                              </button>
                              <span className="text-pearl text-lg w-8 text-center font-mono">{printQuantity}</span>
                              <button
                                 onClick={() => setPrintQuantity(printQuantity + 1)}
                                 className="w-10 h-10 border border-pearl/20 text-pearl hover:border-tangerine hover:text-tangerine flex items-center justify-center transition-colors text-lg"
                              >
                                 +
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Price & Add */}
                  <div className="flex flex-col gap-4">
                     <div>
                        <p className="font-display text-4xl text-pearl">{formatCurrency(finalPricePKR)}</p>
                        {purchaseType === 'PRINT' && printQuantity > 1 && selectedSizeOption && (
                           <p className="text-warm-gray text-xs mt-1 font-mono">{formatCurrency(printUnitPrice)} each × {printQuantity}</p>
                        )}
                     </div>
                     {artwork.inStock ? (
                        <Button
                           onClick={handleAddToCart}
                           variant="primary"
                           className="w-full py-4 text-sm"
                        >
                           Add to Collection
                        </Button>
                     ) : (
                        <button disabled className="w-full bg-charcoal text-warm-gray py-4 uppercase tracking-widest text-xs cursor-not-allowed border border-pearl/5">
                           Sold Out
                        </button>
                     )}
                     <p className="text-center text-[10px] text-warm-gray uppercase tracking-widest mt-1">
                        Free insured shipping worldwide
                     </p>
                  </div>
               </div>

               {/* Collapsible Meta */}
               <div className="space-y-3 pt-6 border-t border-pearl/10">
                  <div className="flex items-center gap-3 text-warm-gray text-xs uppercase tracking-widest">
                     <ShieldCheck size={14} className="text-tangerine" /> Certificate of Authenticity Included
                  </div>
                  <button onClick={() => setShowProvenance(true)} className="flex items-center gap-2 text-tangerine hover:text-white text-xs uppercase tracking-widest transition-colors font-bold">
                     <FileText size={14} /> View Provenance Record
                  </button>
               </div>
            </div>
         </div>

         {/* More from this Artist */}
         {relatedArtworks.length > 0 && (
            <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16 border-t border-pearl/10 mt-8 bg-void">
               <div className="flex items-end justify-between mb-8">
                  <div>
                     <p className="text-tangerine text-xs uppercase tracking-[0.3em] mb-2 font-bold">Collection</p>
                     <h3 className="font-display text-3xl text-pearl">More from <span className="italic text-tangerine">{artwork.artistName}</span></h3>
                  </div>
                  <Link to={`/artists/${artwork.artistId}`} className="text-warm-gray hover:text-tangerine text-xs uppercase tracking-[0.2em] transition-colors hidden md:block font-bold">
                     View All Works →
                  </Link>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {relatedArtworks.map((art) => (
                     <ArtworkCard key={art.id} artwork={art} />
                  ))}
               </div>
               <Link to={`/artists/${artwork.artistId}`} className="block text-center text-warm-gray hover:text-tangerine text-xs uppercase tracking-[0.2em] transition-colors mt-8 md:hidden font-bold">
                  View All Works →
               </Link>
            </div>
         )}
      </div>
   );
};
