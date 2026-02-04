import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export const ResetPassword: React.FC = () => {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();

   const token = searchParams.get('token');
   const userId = searchParams.get('id');

   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState(false);

   // Password strength calculator
   const getPasswordStrength = () => {
      if (!password) return 0;
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      return strength;
   };

   const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
   const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
   const passwordStrength = getPasswordStrength();

   // Validate token presence
   useEffect(() => {
      if (!token || !userId) {
         setError('Invalid or missing reset link. Please request a new password reset.');
      }
   }, [token, userId]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      // Validation
      if (password.length < 6) {
         setError('Password must be at least 6 characters');
         return;
      }

      if (password !== confirmPassword) {
         setError('Passwords do not match');
         return;
      }

      setLoading(true);

      try {
         const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               userId,
               token,
               newPassword: password,
            }),
         });

         const data = await response.json();

         if (!response.ok) {
            setError(data.message || 'Failed to reset password');
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

                  <h2 className="text-white font-serif text-2xl mb-2">Password Reset Successful!</h2>
                  <p className="text-stone-400 mb-8">
                     Your password has been updated. You can now log in with your new password.
                  </p>

                  <Link
                     to="/auth"
                     className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-900/30"
                  >
                     Go to Login
                     <ArrowRight size={16} />
                  </Link>
               </div>
            </motion.div>
         </div>
      );
   }

   // Error screen for invalid link
   if (error && (!token || !userId)) {
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
                  <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                     <XCircle className="w-10 h-10 text-red-500" />
                  </div>

                  <h2 className="text-white font-serif text-2xl mb-2">Invalid Reset Link</h2>
                  <p className="text-stone-400 mb-8">{error}</p>

                  <Link
                     to="/auth"
                     className="inline-flex items-center gap-2 border border-amber-500 text-amber-500 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-amber-500/10 transition-all"
                  >
                     Back to Login
                     <ArrowRight size={16} />
                  </Link>
               </div>
            </motion.div>
         </div>
      );
   }

   // Reset password form
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
               <p className="text-stone-500 text-sm tracking-widest uppercase">Reset Your Password</p>
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
                     <KeyRound className="w-8 h-8 text-amber-500" />
                  </div>
                  <h2 className="text-white font-serif text-2xl">Create New Password</h2>
                  <p className="text-stone-500 text-sm mt-2">Enter your new password below</p>
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

               <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div>
                     <label className="block text-stone-400 text-xs uppercase tracking-wider mb-2">New Password</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                        <input
                           type={showPassword ? 'text' : 'password'}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full bg-stone-800/50 border border-stone-700/50 text-white pl-12 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                           placeholder="Enter new password"
                           required
                        />
                        <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                        >
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                     </div>

                     {/* Password Strength */}
                     {password && (
                        <div className="mt-3">
                           <div className="flex gap-1 mb-1">
                              {[0, 1, 2, 3].map((i) => (
                                 <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-all ${
                                       i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-stone-700'
                                    }`}
                                 />
                              ))}
                           </div>
                           <p className="text-xs text-stone-500">
                              Strength: <span className={`${passwordStrength > 2 ? 'text-green-400' : passwordStrength > 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                 {strengthLabels[passwordStrength - 1] || 'Too weak'}
                              </span>
                           </p>
                        </div>
                     )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                     <label className="block text-stone-400 text-xs uppercase tracking-wider mb-2">Confirm Password</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                        <input
                           type={showConfirmPassword ? 'text' : 'password'}
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           className={`w-full bg-stone-800/50 border text-white pl-12 pr-12 py-3.5 rounded-xl focus:outline-none focus:ring-1 transition-all ${
                              confirmPassword && password !== confirmPassword
                                 ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                                 : confirmPassword && password === confirmPassword
                                 ? 'border-green-500/50 focus:border-green-500/50 focus:ring-green-500/20'
                                 : 'border-stone-700/50 focus:border-amber-500/50 focus:ring-amber-500/20'
                           }`}
                           placeholder="Confirm new password"
                           required
                        />
                        <button
                           type="button"
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                        >
                           {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                     </div>
                     {confirmPassword && password !== confirmPassword && (
                        <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                     )}
                     {confirmPassword && password === confirmPassword && (
                        <p className="text-green-400 text-xs mt-1">Passwords match</p>
                     )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                     type="submit"
                     disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                     whileHover={{ scale: 1.01 }}
                     whileTap={{ scale: 0.99 }}
                     className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 py-4 font-bold uppercase tracking-widest text-xs rounded-xl hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     {loading ? (
                        <>
                           <Loader2 className="animate-spin" size={18} />
                           Resetting...
                        </>
                     ) : (
                        <>
                           Reset Password
                           <ArrowRight size={18} />
                        </>
                     )}
                  </motion.button>
               </form>

               <div className="mt-8 text-center">
                  <Link
                     to="/auth"
                     className="text-stone-500 hover:text-amber-500 text-sm transition-colors"
                  >
                     Back to Login
                  </Link>
               </div>
            </motion.div>
         </motion.div>
      </div>
   );
};
