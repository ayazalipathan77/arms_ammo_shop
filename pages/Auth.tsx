import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Facebook, Chrome, ArrowRight, Phone, MapPin, Globe, Eye, EyeOff, Check, X, Loader2, Sparkles, Shield, CheckCircle, Clock } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '../hooks/useRecaptcha';

const API_URL = 'http://localhost:5000/api';

export const Auth: React.FC = () => {
   const [isLogin, setIsLogin] = useState(true);
   const [role, setRole] = useState<'USER' | 'ARTIST'>('USER');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [fullName, setFullName] = useState('');
   const [showPassword, setShowPassword] = useState(false);

   // New Fields
   const [phoneNumber, setPhoneNumber] = useState('');
   const [address, setAddress] = useState('');
   const [city, setCity] = useState('');
   const [country, setCountry] = useState('Pakistan');
   const [zipCode, setZipCode] = useState('');

   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const [registrationSuccess, setRegistrationSuccess] = useState<{
      message: string;
      requiresApproval: boolean;
      email: string;
   } | null>(null);
   const [isResendingVerification, setIsResendingVerification] = useState(false);
   const [resendMessage, setResendMessage] = useState('');
   const [socialConfig, setSocialConfig] = useState<{ googleEnabled: boolean; facebookEnabled: boolean }>({ googleEnabled: false, facebookEnabled: false });
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { login, register: authRegister } = useAuth();
   const { executeRecaptcha, isEnabled: recaptchaEnabled } = useRecaptcha();

   // Fetch social login config and handle OAuth error params
   useEffect(() => {
      fetch(`${API_URL}/config`)
         .then(res => res.json())
         .then(data => setSocialConfig({ googleEnabled: data.googleEnabled, facebookEnabled: data.facebookEnabled }))
         .catch(() => {});

      const errorParam = searchParams.get('error');
      if (errorParam) {
         const messages: Record<string, string> = {
            google_failed: 'Google login failed. Please try again.',
            facebook_failed: 'Facebook login failed. Please try again.',
         };
         setError(messages[errorParam] || 'Social login failed. Please try again.');
      }
   }, [searchParams]);

   // Password strength calculator
   const getPasswordStrength = () => {
      if (!password || isLogin) return 0;
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      return strength;
   };

   const passwordStrength = getPasswordStrength();
   const passwordStrengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
   const passwordStrengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

   const handleAuthSuccess = (token: string, userRole: string) => {
      login(token);

      if (userRole === 'ADMIN') {
         navigate('/admin');
      } else if (userRole === 'ARTIST') {
         navigate('/artist-dashboard');
      } else {
         navigate('/profile');
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         // Get reCAPTCHA token
         const action = isLogin ? RECAPTCHA_ACTIONS.LOGIN : RECAPTCHA_ACTIONS.REGISTER;
         const recaptchaToken = await executeRecaptcha(action);

         if (isLogin) {
            // Login request
            const response = await fetch(`${API_URL}/auth/login`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({
                  email,
                  password,
                  recaptchaToken,
               }),
            });

            const data = await response.json();

            if (!response.ok) {
               // Handle specific error codes
               if (data.code === 'RECAPTCHA_LOW_SCORE') {
                  setError('Security verification failed. Please try again.');
               } else if (data.code === 'RECAPTCHA_FAILED') {
                  setError('Security check failed. Please refresh and try again.');
               } else if (data.code === 'EMAIL_NOT_VERIFIED') {
                  setRegistrationSuccess({
                     message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                     requiresApproval: false,
                     email: data.email || email
                  });
               } else if (data.code === 'ARTIST_NOT_APPROVED') {
                  setRegistrationSuccess({
                     message: data.message,
                     requiresApproval: true,
                     email: email
                  });
               } else if (data.code === 'SOCIAL_ONLY_ACCOUNT') {
                  setError(data.message || 'This account uses social login. Please sign in with Google or Facebook.');
               } else {
                  setError(data.message || 'Login failed');
               }
               return;
            }

            handleAuthSuccess(data.token, data.user.role);
         } else {
            // Register request
            const response = await fetch(`${API_URL}/auth/register`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({
                  email,
                  password,
                  fullName,
                  role,
                  phoneNumber,
                  address,
                  city,
                  country,
                  zipCode,
                  recaptchaToken,
               }),
            });

            const data = await response.json();

            if (!response.ok) {
               // Handle specific reCAPTCHA errors
               if (data.code === 'RECAPTCHA_LOW_SCORE') {
                  setError('Security verification failed. Please try again.');
               } else if (data.code === 'RECAPTCHA_FAILED') {
                  setError('Security check failed. Please refresh and try again.');
               } else {
                  setError(data.message || 'Registration failed');
               }
               return;
            }

            // Show verification required message instead of auto-login
            setRegistrationSuccess({
               message: data.message,
               requiresApproval: data.requiresApproval || false,
               email: email
            });
         }
      } catch (err: any) {
         setError(err.message || 'An error occurred');
      } finally {
         setLoading(false);
      }
   };

   const handleSocialLogin = (provider: string) => {
      window.location.href = `${API_URL}/auth/${provider.toLowerCase()}`;
   };

   const handleResendVerification = async () => {
      if (!registrationSuccess?.email) return;

      setIsResendingVerification(true);
      setResendMessage('');

      try {
         const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registrationSuccess.email }),
         });

         const data = await response.json();

         if (response.ok) {
            setResendMessage('Verification email sent! Check your inbox.');
         } else {
            setResendMessage(data.message || 'Failed to resend email');
         }
      } catch (error) {
         setResendMessage('Failed to resend verification email');
      } finally {
         setIsResendingVerification(false);
      }
   };

   // Show registration success / verification required screen
   if (registrationSuccess) {
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
                  <div className={`w-20 h-20 mx-auto mb-6 ${registrationSuccess.requiresApproval ? 'bg-amber-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center`}>
                     {registrationSuccess.requiresApproval ? (
                        <Clock className="w-10 h-10 text-amber-500" />
                     ) : (
                        <CheckCircle className="w-10 h-10 text-green-500" />
                     )}
                  </div>

                  <h2 className="text-white font-serif text-2xl mb-2">
                     {registrationSuccess.requiresApproval ? 'Registration Complete!' : 'Check Your Email'}
                  </h2>

                  <p className="text-stone-400 mb-6">{registrationSuccess.message}</p>

                  {registrationSuccess.requiresApproval && (
                     <div className="bg-stone-800/50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-stone-300 text-sm">
                           <strong className="text-amber-500">What happens next?</strong>
                        </p>
                        <ul className="text-stone-400 text-sm mt-2 space-y-1">
                           <li>1. Verify your email (check your inbox)</li>
                           <li>2. Our team will review your application</li>
                           <li>3. You'll receive approval notification</li>
                        </ul>
                     </div>
                  )}

                  {!registrationSuccess.requiresApproval && (
                     <div className="space-y-4">
                        <button
                           onClick={handleResendVerification}
                           disabled={isResendingVerification}
                           className="text-amber-500 hover:text-amber-400 text-sm underline disabled:opacity-50 flex items-center gap-2 mx-auto"
                        >
                           {isResendingVerification ? (
                              <>
                                 <Loader2 size={14} className="animate-spin" />
                                 Sending...
                              </>
                           ) : (
                              "Didn't receive email? Resend"
                           )}
                        </button>
                        {resendMessage && (
                           <p className={`text-sm ${resendMessage.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
                              {resendMessage}
                           </p>
                        )}
                     </div>
                  )}

                  <div className="mt-8">
                     <button
                        onClick={() => {
                           setRegistrationSuccess(null);
                           setIsLogin(true);
                        }}
                        className="inline-flex items-center gap-2 border border-amber-500 text-amber-500 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-amber-500/10 transition-all"
                     >
                        Back to Login
                        <ArrowRight size={16} />
                     </button>
                  </div>
               </div>
            </motion.div>
         </div>
      );
   }

   return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
         {/* Animated Background */}
         <div className="absolute inset-0 bg-[url('/header_bg.jpg')] bg-cover bg-center"></div>
         <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"></div>

         {/* Animated Gradient Orbs */}
         <motion.div
            animate={{
               scale: [1, 1.2, 1],
               opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
         />
         <motion.div
            animate={{
               scale: [1.2, 1, 1.2],
               opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"
         />

         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-md"
         >
            {/* Header */}
            <motion.div
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2, duration: 0.6 }}
               className="text-center mb-6"
            >
               <div className="inline-flex items-center gap-2 mb-3">
                  <Sparkles className="text-amber-500" size={24} />
                  <h1 className="font-serif text-5xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                     MURAQQA
                  </h1>
                  <Sparkles className="text-amber-500" size={24} />
               </div>
               <p className="text-amber-500/60 text-xs uppercase tracking-[0.3em] font-medium">Contemporary Pakistani Art</p>
            </motion.div>

            {/* Glass Card with Better Shadow */}
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3, duration: 0.5 }}
               className="bg-stone-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl relative overflow-hidden"
            >
               {/* Subtle inner glow */}
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>

               {/* Modern Tab Switching */}
               <div className="relative mb-6">
                  <div className="flex gap-2 p-1 bg-stone-950/50 rounded-full border border-white/5">
                     <button
                        onClick={() => {
                           setIsLogin(true);
                           setError('');
                        }}
                        className={`flex-1 py-3 text-xs uppercase tracking-widest transition-all duration-300 rounded-full relative overflow-hidden ${
                           isLogin ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                        }`}
                     >
                        {isLogin && (
                           <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                           />
                        )}
                        <span className="relative z-10">Sign In</span>
                     </button>
                     <button
                        onClick={() => {
                           setIsLogin(false);
                           setError('');
                        }}
                        className={`flex-1 py-3 text-xs uppercase tracking-widest transition-all duration-300 rounded-full relative overflow-hidden ${
                           !isLogin ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                        }`}
                     >
                        {!isLogin && (
                           <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                           />
                        )}
                        <span className="relative z-10">Register</span>
                     </button>
                  </div>
               </div>

               <form onSubmit={handleSubmit} className="space-y-4 relative">
                  <AnimatePresence mode="wait">
                     {!isLogin && (
                        <motion.div
                           key="registration"
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           exit={{ opacity: 0, height: 0 }}
                           transition={{ duration: 0.3 }}
                           className="space-y-4"
                        >
                           {/* Role Selection */}
                           <div className="grid grid-cols-2 gap-3">
                              <motion.label
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-300 ${
                                    role === 'USER'
                                       ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 shadow-lg shadow-amber-500/20'
                                       : 'border-white/5 bg-stone-900/30 hover:border-white/10'
                                 }`}
                              >
                                 <input
                                    type="radio"
                                    name="role"
                                    checked={role === 'USER'}
                                    onChange={() => setRole('USER')}
                                    className="hidden"
                                 />
                                 <div className="flex flex-col items-center gap-2">
                                    <User size={20} className={role === 'USER' ? 'text-amber-500' : 'text-stone-500'} />
                                    <span className={`text-xs uppercase tracking-widest font-semibold ${role === 'USER' ? 'text-amber-500' : 'text-stone-500'}`}>
                                       Collector
                                    </span>
                                 </div>
                              </motion.label>
                              <motion.label
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all duration-300 ${
                                    role === 'ARTIST'
                                       ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 shadow-lg shadow-amber-500/20'
                                       : 'border-white/5 bg-stone-900/30 hover:border-white/10'
                                 }`}
                              >
                                 <input
                                    type="radio"
                                    name="role"
                                    checked={role === 'ARTIST'}
                                    onChange={() => setRole('ARTIST')}
                                    className="hidden"
                                 />
                                 <div className="flex flex-col items-center gap-2">
                                    <Sparkles size={20} className={role === 'ARTIST' ? 'text-amber-500' : 'text-stone-500'} />
                                    <span className={`text-xs uppercase tracking-widest font-semibold ${role === 'ARTIST' ? 'text-amber-500' : 'text-stone-500'}`}>
                                       Artist
                                    </span>
                                 </div>
                              </motion.label>
                           </div>

                           {/* Registration Fields */}
                           <div className="space-y-3">
                              <motion.div
                                 initial={{ x: -20, opacity: 0 }}
                                 animate={{ x: 0, opacity: 1 }}
                                 transition={{ delay: 0.1 }}
                                 className="relative group"
                              >
                                 <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                                 <div className="relative bg-stone-900/50 rounded-lg border border-white/5 group-focus-within:border-amber-500/50 transition-all">
                                    <User className="absolute left-4 top-4 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                                    <input
                                       type="text"
                                       value={fullName}
                                       onChange={(e) => setFullName(e.target.value)}
                                       className="w-full bg-transparent text-white py-4 pl-12 pr-4 focus:outline-none text-sm"
                                       placeholder="Full Name"
                                       required
                                    />
                                 </div>
                              </motion.div>

                              <motion.div
                                 initial={{ x: -20, opacity: 0 }}
                                 animate={{ x: 0, opacity: 1 }}
                                 transition={{ delay: 0.15 }}
                                 className="relative group"
                              >
                                 <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                                 <div className="relative bg-stone-900/50 rounded-lg border border-white/5 group-focus-within:border-amber-500/50 transition-all">
                                    <Phone className="absolute left-4 top-4 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                                    <input
                                       type="tel"
                                       value={phoneNumber}
                                       onChange={(e) => setPhoneNumber(e.target.value)}
                                       className="w-full bg-transparent text-white py-4 pl-12 pr-4 focus:outline-none text-sm"
                                       placeholder="Phone Number (Optional)"
                                    />
                                 </div>
                              </motion.div>

                              <motion.div
                                 initial={{ x: -20, opacity: 0 }}
                                 animate={{ x: 0, opacity: 1 }}
                                 transition={{ delay: 0.2 }}
                                 className="grid grid-cols-2 gap-3"
                              >
                                 <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                                    <div className="relative bg-stone-900/50 rounded-lg border border-white/5 group-focus-within:border-amber-500/50 transition-all">
                                       <MapPin className="absolute left-3 top-4 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                                       <input
                                          type="text"
                                          value={city}
                                          onChange={(e) => setCity(e.target.value)}
                                          className="w-full bg-transparent text-white py-4 pl-10 pr-3 focus:outline-none text-sm"
                                          placeholder="City"
                                       />
                                    </div>
                                 </div>
                                 <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                                    <div className="relative bg-stone-900/50 rounded-lg border border-white/5 group-focus-within:border-amber-500/50 transition-all">
                                       <Globe className="absolute left-3 top-4 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                                       <select
                                          value={country}
                                          onChange={(e) => setCountry(e.target.value)}
                                          className="w-full bg-transparent text-white py-4 pl-10 pr-3 focus:outline-none text-sm appearance-none cursor-pointer"
                                       >
                                          <option value="Pakistan" className="bg-stone-900">Pakistan</option>
                                          <option value="UAE" className="bg-stone-900">UAE</option>
                                          <option value="UK" className="bg-stone-900">UK</option>
                                          <option value="USA" className="bg-stone-900">USA</option>
                                       </select>
                                    </div>
                                 </div>
                              </motion.div>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {/* Email & Password Fields */}
                  <div className="space-y-3">
                     <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: isLogin ? 0.1 : 0.25 }}
                        className="relative group"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                        <div className="relative bg-stone-900/50 rounded-lg border border-white/5 group-focus-within:border-amber-500/50 transition-all">
                           <Mail className="absolute left-4 top-4 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                           <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-transparent text-white py-4 pl-12 pr-4 focus:outline-none text-sm"
                              placeholder="Email Address"
                              required
                           />
                        </div>
                     </motion.div>

                     <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: isLogin ? 0.15 : 0.3 }}
                        className="relative"
                     >
                        <div className="relative group">
                           <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur"></div>
                           <div className="relative bg-stone-900/50 rounded-lg border border-white/5 group-focus-within:border-amber-500/50 transition-all">
                              <Lock className="absolute left-4 top-4 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                              <input
                                 type={showPassword ? 'text' : 'password'}
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 className="w-full bg-transparent text-white py-4 pl-12 pr-12 focus:outline-none text-sm"
                                 placeholder="Password"
                                 required
                              />
                              <button
                                 type="button"
                                 onClick={() => setShowPassword(!showPassword)}
                                 className="absolute right-4 top-4 text-stone-500 hover:text-amber-500 transition-colors focus:outline-none"
                              >
                                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                           </div>
                        </div>

                        {/* Password Strength Indicator */}
                        {!isLogin && password && (
                           <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 space-y-2"
                           >
                              <div className="flex gap-1">
                                 {[0, 1, 2, 3].map((index) => (
                                    <div
                                       key={index}
                                       className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                          index < passwordStrength ? passwordStrengthColors[passwordStrength - 1] : 'bg-stone-800'
                                       }`}
                                    />
                                 ))}
                              </div>
                              {passwordStrength > 0 && (
                                 <p className="text-xs text-stone-400 flex items-center gap-1">
                                    {passwordStrength === 4 ? (
                                       <Check size={12} className="text-green-500" />
                                    ) : (
                                       <X size={12} className="text-orange-500" />
                                    )}
                                    Password strength: <span className={passwordStrength >= 3 ? 'text-green-500' : 'text-orange-500'}>
                                       {passwordStrengthLabels[passwordStrength - 1]}
                                    </span>
                                 </p>
                              )}
                           </motion.div>
                        )}
                     </motion.div>

                     {/* Forgot Password Link */}
                     {isLogin && (
                        <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ delay: 0.2 }}
                           className="text-right"
                        >
                           <Link to="/forgot-password" className="text-xs text-stone-500 hover:text-amber-500 transition-colors">
                              Forgot Password?
                           </Link>
                        </motion.div>
                     )}
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                     {error && (
                        <motion.div
                           initial={{ opacity: 0, y: -10, height: 0 }}
                           animate={{ opacity: 1, y: 0, height: "auto" }}
                           exit={{ opacity: 0, y: -10, height: 0 }}
                           className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg p-4 text-red-200 text-xs flex items-start gap-3"
                        >
                           <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                           <p className="flex-1">{error}</p>
                           <button
                              type="button"
                              onClick={() => setError('')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                           >
                              <X size={14} />
                           </button>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: isLogin ? 0.25 : 0.35 }}
                     className="pt-1"
                  >
                     <motion.button
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="relative w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500 text-stone-950 py-4 font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 shadow-lg shadow-amber-900/30 hover:shadow-amber-500/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg overflow-hidden group"
                     >
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        <span className="relative flex items-center justify-center gap-2">
                           {loading ? (
                              <>
                                 <Loader2 size={16} className="animate-spin" />
                                 <span>Processing</span>
                              </>
                           ) : (
                              <>
                                 <span>{isLogin ? 'Enter Gallery' : 'Create Account'}</span>
                                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                              </>
                           )}
                        </span>
                     </motion.button>
                  </motion.div>

                  {/* Social Login */}
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.4 }}
                     className="pt-4 space-y-3"
                  >
                     <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                           <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center">
                           <span className="px-4 text-xs uppercase tracking-widest text-stone-500 bg-stone-900/40">
                              Or continue with
                           </span>
                        </div>
                     </div>

                     <div className="flex gap-3">
                        {socialConfig.googleEnabled && (
                           <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleSocialLogin('Google')}
                              className="flex-1 p-3 rounded-lg bg-stone-900/50 hover:bg-white/10 text-white transition-all border border-white/5 hover:border-white/20 flex items-center justify-center gap-2 group"
                           >
                              <Chrome size={18} className="group-hover:text-amber-500 transition-colors" />
                              <span className="text-xs font-medium">Google</span>
                           </motion.button>
                        )}
                        {socialConfig.facebookEnabled && (
                           <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleSocialLogin('Facebook')}
                              className="flex-1 p-3 rounded-lg bg-stone-900/50 hover:bg-[#1877F2]/20 text-white hover:text-[#1877F2] transition-all border border-white/5 hover:border-[#1877F2]/30 flex items-center justify-center gap-2 group"
                           >
                              <Facebook size={18} className="group-hover:text-[#1877F2] transition-colors" />
                              <span className="text-xs font-medium">Facebook</span>
                           </motion.button>
                        )}
                        {!socialConfig.googleEnabled && !socialConfig.facebookEnabled && (
                           <p className="text-stone-600 text-xs text-center w-full">Social login not configured</p>
                        )}
                     </div>
                  </motion.div>
               </form>
            </motion.div>

            {/* Footer */}
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="text-center mt-6 space-y-2"
            >
               <p className="text-stone-600 text-xs flex items-center justify-center gap-2">
                  {recaptchaEnabled ? (
                     <>
                        <Shield size={12} className="text-green-500" />
                        <span>Protected by reCAPTCHA</span>
                     </>
                  ) : (
                     <>
                        <Lock size={12} />
                        <span>Protected by Muraqqa Security</span>
                     </>
                  )}
               </p>
               {recaptchaEnabled && (
                  <p className="text-stone-700 text-[10px]">
                     This site is protected by reCAPTCHA and the Google{' '}
                     <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                        Privacy Policy
                     </a>{' '}
                     and{' '}
                     <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                        Terms of Service
                     </a>{' '}
                     apply.
                  </p>
               )}
               <p className="text-stone-700 text-[10px] uppercase tracking-widest">
                  Contemporary Pakistani Art Gallery
               </p>
            </motion.div>
         </motion.div>
      </div>
   );
};
