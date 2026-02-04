import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle, Shield } from 'lucide-react';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '../hooks/useRecaptcha';

const API_URL = 'http://localhost:5000/api';

export const ForgotPassword: React.FC = () => {
   const [email, setEmail] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState(false);
   const { executeRecaptcha, isEnabled: recaptchaEnabled } = useRecaptcha();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         // Get reCAPTCHA token
         const recaptchaToken = await executeRecaptcha(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);

         const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, recaptchaToken }),
         });

         const data = await response.json();

         if (!response.ok) {
            if (data.code === 'RECAPTCHA_LOW_SCORE' || data.code === 'RECAPTCHA_FAILED') {
               setError('Security verification failed. Please try again.');
            } else {
               setError(data.message || 'Failed to send reset email');
            }
            return;
         }

         setSuccess(true);
      } catch (err: any) {
         setError(err.message || 'An error occurred');
      } finally {
         setLoading(false);
      }
   };

   // Success screen
   if (success) {
      return (
         <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/header_bg.jpg')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"></div>

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="relative z-10 w-full max-w-md"
            >
               <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 mb-4">
                     <Sparkles className="text-amber-500" size={24} />
                     <h1 className="font-serif text-4xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                        MURAQQA
                     </h1>
                     <Sparkles className="text-amber-500" size={24} />
                  </div>
               </div>

               <div className="bg-stone-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                     <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>

                  <h2 className="text-white font-serif text-2xl mb-2">Check Your Email</h2>
                  <p className="text-stone-400 mb-4">
                     If an account exists for <span className="text-amber-500">{email}</span>, you'll receive a password reset link shortly.
                  </p>
                  <p className="text-stone-500 text-sm mb-8">
                     The link will expire in 1 hour. Don't forget to check your spam folder.
                  </p>

                  <div className="space-y-4">
                     <Link
                        to="/auth"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-900/30"
                     >
                        Back to Login
                        <ArrowRight size={16} />
                     </Link>

                     <div>
                        <button
                           onClick={() => {
                              setSuccess(false);
                              setEmail('');
                           }}
                           className="text-stone-500 hover:text-amber-500 text-sm transition-colors"
                        >
                           Try a different email
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
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
            className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
         />
         <motion.div
            animate={{
               scale: [1.2, 1, 1.2],
               opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"
         />

         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md"
         >
            {/* Logo */}
            <div className="text-center mb-10">
               <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 mb-4"
               >
                  <Sparkles className="text-amber-500" size={24} />
                  <h1 className="font-serif text-4xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                     MURAQQA
                  </h1>
                  <Sparkles className="text-amber-500" size={24} />
               </motion.div>
               <p className="text-stone-500 text-sm tracking-widest uppercase">Password Recovery</p>
            </div>

            {/* Form Card */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-stone-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl"
            >
               <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                     <Mail className="w-8 h-8 text-amber-500" />
                  </div>
                  <h2 className="text-white font-serif text-2xl">Forgot Password?</h2>
                  <p className="text-stone-500 text-sm mt-2">
                     Enter your email and we'll send you a link to reset your password.
                  </p>
               </div>

               {error && (
                  <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                     <p className="text-red-400 text-sm text-center">{error}</p>
                  </motion.div>
               )}

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                     <div className="relative bg-stone-800/50 rounded-xl border border-stone-700/50 group-focus-within:border-amber-500/50 transition-all">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full bg-transparent text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none text-sm"
                           placeholder="Enter your email address"
                           required
                        />
                     </div>
                  </div>

                  <motion.button
                     type="submit"
                     disabled={loading || !email}
                     whileHover={{ scale: 1.01 }}
                     whileTap={{ scale: 0.99 }}
                     className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 py-4 font-bold uppercase tracking-widest text-xs rounded-xl hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     {loading ? (
                        <>
                           <Loader2 className="animate-spin" size={18} />
                           Sending...
                        </>
                     ) : (
                        <>
                           Send Reset Link
                           <ArrowRight size={18} />
                        </>
                     )}
                  </motion.button>
               </form>

               <div className="mt-8 text-center">
                  <Link
                     to="/auth"
                     className="inline-flex items-center gap-2 text-stone-500 hover:text-amber-500 text-sm transition-colors"
                  >
                     <ArrowLeft size={16} />
                     Back to Login
                  </Link>
               </div>
            </motion.div>

            {/* Footer */}
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="text-center mt-8"
            >
               <p className="text-stone-600 text-xs flex items-center justify-center gap-2">
                  {recaptchaEnabled ? (
                     <>
                        <Shield size={12} className="text-green-500" />
                        <span>Protected by reCAPTCHA</span>
                     </>
                  ) : (
                     <span>Muraqqa Art Gallery</span>
                  )}
               </p>
            </motion.div>
         </motion.div>
      </div>
   );
};
