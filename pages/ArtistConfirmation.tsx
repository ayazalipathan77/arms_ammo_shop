import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';

export const ArtistConfirmation: React.FC = () => {
   const [searchParams] = useSearchParams();
   const status = searchParams.get('status');
   const orderRef = searchParams.get('order');

   const isConfirmed = status === 'confirmed';
   const isDeclined = status === 'declined';

   if (!status) {
      return (
         <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/header_bg.jpg')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"></div>

            <div className="relative z-10 text-center">
               <p className="text-stone-400">Invalid confirmation link</p>
               <Link to="/" className="text-amber-500 hover:underline mt-4 inline-block">
                  Return to Home
               </Link>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/header_bg.jpg')] bg-cover bg-center"></div>
         <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"></div>

         {/* Animated Gradient Orbs */}
         <motion.div
            animate={{
               scale: [1, 1.2, 1],
               opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className={`absolute top-1/4 -left-32 w-96 h-96 ${isConfirmed ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full blur-3xl`}
         />

         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md"
         >
            {/* Logo */}
            <div className="text-center mb-10">
               <div className="inline-flex items-center gap-2 mb-4">
                  <Sparkles className="text-amber-500" size={24} />
                  <h1 className="font-serif text-4xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                     MURAQQA
                  </h1>
                  <Sparkles className="text-amber-500" size={24} />
               </div>
            </div>

            {/* Confirmation Card */}
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-stone-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl text-center"
            >
               {isConfirmed ? (
                  <>
                     <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                     </div>

                     <h2 className="text-white font-serif text-2xl mb-4">Availability Confirmed!</h2>

                     <p className="text-stone-400 mb-6">
                        Thank you for confirming the availability of your artwork for Order #{orderRef?.toUpperCase()}.
                     </p>

                     <div className="bg-stone-800/50 rounded-lg p-4 mb-6">
                        <h4 className="text-amber-500 font-semibold mb-2">What Happens Next?</h4>
                        <ul className="text-stone-400 text-sm space-y-2 text-left">
                           <li className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>The gallery admin will finalize the order</span>
                           </li>
                           <li className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>You'll be notified when to prepare for shipping</span>
                           </li>
                           <li className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>Payment will be processed after delivery</span>
                           </li>
                        </ul>
                     </div>
                  </>
               ) : (
                  <>
                     <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-500" />
                     </div>

                     <h2 className="text-white font-serif text-2xl mb-4">Availability Declined</h2>

                     <p className="text-stone-400 mb-6">
                        We've recorded that the artwork for Order #{orderRef?.toUpperCase()} is not available.
                     </p>

                     <div className="bg-stone-800/50 rounded-lg p-4 mb-6">
                        <p className="text-stone-400 text-sm">
                           The collector has been notified and the order has been cancelled.
                           If this was a mistake, please contact our support team immediately.
                        </p>
                     </div>
                  </>
               )}

               <Link
                  to="/artist-dashboard"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-900/30"
               >
                  Go to Dashboard
                  <ArrowRight size={16} />
               </Link>

               <div className="mt-6">
                  <a
                     href="mailto:support@muraqqa.art"
                     className="text-stone-500 hover:text-amber-500 text-sm transition-colors"
                  >
                     Need help? Contact Support
                  </a>
               </div>
            </motion.div>

            {/* Footer */}
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="text-center mt-8"
            >
               <p className="text-stone-600 text-xs">
                  © {new Date().getFullYear()} Muraqqa Art Gallery
               </p>
            </motion.div>
         </motion.div>
      </div>
   );
};
