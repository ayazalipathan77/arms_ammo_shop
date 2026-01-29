import React, { useState } from 'react';
import { User, Lock, Mail, Facebook, Chrome, ArrowRight, Phone, MapPin, Globe, Eye, EyeOff, Check, X, Loader2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
   const navigate = useNavigate();
   const { login, register: authRegister } = useAuth();

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
               }),
            });

            const data = await response.json();

            if (!response.ok) {
               setError(data.message || 'Login failed');
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
                  zipCode
               }),
            });

            const data = await response.json();

            if (!response.ok) {
               setError(data.message || 'Registration failed');
               return;
            }

            handleAuthSuccess(data.token, data.user.role);
         }
      } catch (err: any) {
         setError(err.message || 'An error occurred');
      } finally {
         setLoading(false);
      }
   };

   const handleSocialLogin = (provider: string) => {
      // Simulate OAuth process
      console.log(`Initiating ${provider} login...`);
      setError('Social login not yet implemented');
   };

   return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
         {/* Background with Gradient Overlay */}
         <div className="absolute inset-0 bg-[url('/header_bg.jpg')] bg-cover bg-center"></div>
         <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-transparent to-stone-950"></div>

         <div className="relative z-10 w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-10">
               <h1 className="font-serif text-5xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 drop-shadow-sm filter mb-2">
                  MURAQQA
               </h1>
               <p className="text-amber-500/80 text-xs uppercase tracking-[0.3em] font-medium">The Imperial Collection</p>
            </div>

            {/* Glass Container */}
            <div className="bg-stone-950/60 backdrop-blur-xl border border-white/10 p-8 md:p-10 shadow-2xl rounded-sm">

               {/* Toggle Tabs */}
               <div className="flex mb-10 border-b border-white/10 relative">
                  <button
                     onClick={() => setIsLogin(true)}
                     className={`flex-1 py-4 text-xs uppercase tracking-widest transition-colors relative ${isLogin ? 'text-white' : 'text-stone-500 hover:text-stone-300'}`}
                  >
                     Sign In
                     {isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>}
                  </button>
                  <button
                     onClick={() => setIsLogin(false)}
                     className={`flex-1 py-4 text-xs uppercase tracking-widest transition-colors relative ${!isLogin ? 'text-white' : 'text-stone-500 hover:text-stone-300'}`}
                  >
                     Register
                     {!isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>}
                  </button>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                     <div className="animate-fade-in space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <label className={`cursor-pointer border ${role === 'USER' ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 hover:border-stone-700 bg-stone-900/50'} p-3 text-center transition-all duration-300`}>
                              <input type="radio" name="role" checked={role === 'USER'} onChange={() => setRole('USER')} className="hidden" />
                              <span className={`text-xs uppercase tracking-widest ${role === 'USER' ? 'text-amber-500' : 'text-stone-500'}`}>Collector</span>
                           </label>
                           <label className={`cursor-pointer border ${role === 'ARTIST' ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 hover:border-stone-700 bg-stone-900/50'} p-3 text-center transition-all duration-300`}>
                              <input type="radio" name="role" checked={role === 'ARTIST'} onChange={() => setRole('ARTIST')} className="hidden" />
                              <span className={`text-xs uppercase tracking-widest ${role === 'ARTIST' ? 'text-amber-500' : 'text-stone-500'}`}>Artist</span>
                           </label>
                        </div>

                        <div className="space-y-6">
                           <div className="relative group">
                              <input
                                 type="text"
                                 value={fullName}
                                 onChange={(e) => setFullName(e.target.value)}
                                 className="w-full bg-transparent border-b border-stone-800 text-white py-3 pl-8 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-transparent peer"
                                 placeholder="Full Name"
                                 required
                              />
                              <label className="absolute left-8 top-3 text-stone-500 text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500 peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-stone-400">Full Name</label>
                              <User className="absolute left-0 top-3 text-stone-600 peer-focus:text-amber-500 transition-colors" size={18} />
                           </div>

                           <div className="relative group">
                              <input
                                 type="tel"
                                 value={phoneNumber}
                                 onChange={(e) => setPhoneNumber(e.target.value)}
                                 className="w-full bg-transparent border-b border-stone-800 text-white py-3 pl-8 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-transparent peer"
                                 placeholder="Phone"
                              />
                              <label className="absolute left-8 top-3 text-stone-500 text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500 peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-stone-400">Phone</label>
                              <Phone className="absolute left-0 top-3 text-stone-600 peer-focus:text-amber-500 transition-colors" size={18} />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="relative group">
                                 <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full bg-transparent border-b border-stone-800 text-white py-3 pl-8 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-transparent peer"
                                    placeholder="City"
                                 />
                                 <label className="absolute left-8 top-3 text-stone-500 text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500 peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-stone-400">City</label>
                                 <MapPin className="absolute left-0 top-3 text-stone-600 peer-focus:text-amber-500 transition-colors" size={18} />
                              </div>
                              <div className="relative group">
                                 <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full bg-transparent border-b border-stone-800 text-white py-3 pl-8 focus:outline-none focus:border-amber-500 transition-colors appearance-none text-sm"
                                 >
                                    <option value="Pakistan" className="bg-stone-900">Pakistan</option>
                                    <option value="UAE" className="bg-stone-900">UAE</option>
                                    <option value="UK" className="bg-stone-900">UK</option>
                                    <option value="USA" className="bg-stone-900">USA</option>
                                 </select>
                                 <Globe className="absolute left-0 top-3 text-stone-600 peer-focus:text-amber-500 transition-colors" size={18} />
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="space-y-6">
                     <div className="relative group">
                        <input
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full bg-transparent border-b border-stone-800 text-white py-3 pl-8 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-transparent peer"
                           placeholder="Email"
                           required
                        />
                        <label className="absolute left-8 top-3 text-stone-500 text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500 peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-stone-400">Email Address</label>
                        <Mail className="absolute left-0 top-3 text-stone-600 peer-focus:text-amber-500 transition-colors" size={18} />
                     </div>

                     <div className="relative group">
                        <input
                           type="password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full bg-transparent border-b border-stone-800 text-white py-3 pl-8 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-transparent peer"
                           placeholder="Password"
                           required
                        />
                        <label className="absolute left-8 top-3 text-stone-500 text-sm transition-all peer-focus:-top-4 peer-focus:text-xs peer-focus:text-amber-500 peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-stone-400">Password</label>
                        <Lock className="absolute left-0 top-3 text-stone-600 peer-focus:text-amber-500 transition-colors" size={18} />
                     </div>
                  </div>

                  {error && (
                     <div className="bg-red-500/10 border-l-2 border-red-500 text-red-200 p-3 text-xs animate-fade-in">
                        {error}
                     </div>
                  )}

                  <div className="pt-4">
                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 py-4 font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 shadow-lg hover:shadow-amber-900/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                        {loading ? 'Processing...' : (isLogin ? 'Enter Gallery' : 'Create Account')}
                     </button>
                  </div>

                  {/* Social Login */}
                  <div className="pt-6 border-t border-white/10">
                     <p className="text-center text-stone-500 text-[10px] uppercase tracking-widest mb-4">Or continue via</p>
                     <div className="flex gap-4 justify-center">
                        <button type="button" onClick={() => handleSocialLogin('Google')} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 hover:border-white/20">
                           <Chrome size={18} />
                        </button>
                        <button type="button" onClick={() => handleSocialLogin('Facebook')} className="p-3 rounded-full bg-white/5 hover:bg-[#1877F2]/20 text-white hover:text-[#1877F2] transition-colors border border-white/5 hover:border-[#1877F2]/30">
                           <Facebook size={18} />
                        </button>
                     </div>
                  </div>
               </form>
            </div>

            <p className="text-center mt-8 text-stone-600 text-xs">
               Protected by Muraqqa Imperial Security
            </p>
         </div>
      </div>
   );
};
