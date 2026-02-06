import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Facebook, Chrome, ArrowRight, Phone, MapPin, Globe, Eye, EyeOff, Check, X, Loader2, Award, Shield, CheckCircle, Clock } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '../hooks/useRecaptcha';
import { cn } from '../lib/utils';
import ParticleSystem from '../components/features/ParticleSystem';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:5000/api' : '/api';

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
   const { login } = useAuth();
   const { executeRecaptcha, isEnabled: recaptchaEnabled } = useRecaptcha();

   useEffect(() => {
      fetch(`${API_URL}/config`)
         .then(res => res.json())
         .then(data => setSocialConfig({ googleEnabled: data.googleEnabled, facebookEnabled: data.facebookEnabled }))
         .catch(() => { });

      const errorParam = searchParams.get('error');
      if (errorParam) {
         const messages: Record<string, string> = {
            google_failed: 'Google login failed. Please try again.',
            facebook_failed: 'Facebook login failed. Please try again.',
         };
         setError(messages[errorParam] || 'Social login failed. Please try again.');
      }
   }, [searchParams]);

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

   const handleAuthSuccess = (token: string, userRole: string) => {
      login(token);
      if (userRole === 'ADMIN') navigate('/admin');
      else if (userRole === 'ARTIST') navigate('/artist-dashboard');
      else navigate('/profile');
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         const action = isLogin ? RECAPTCHA_ACTIONS.LOGIN : RECAPTCHA_ACTIONS.REGISTER;
         const recaptchaToken = await executeRecaptcha(action);

         if (isLogin) {
            const response = await fetch(`${API_URL}/auth/login`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ email, password, recaptchaToken }),
            });

            const data = await response.json();

            if (!response.ok) {
               if (data.code === 'RECAPTCHA_LOW_SCORE') setError('Security verification failed.');
               else if (data.code === 'EMAIL_NOT_VERIFIED') setRegistrationSuccess({ message: 'Please verify your email.', requiresApproval: false, email: data.email || email });
               else setError(data.message || 'Login failed');
               return;
            }
            handleAuthSuccess(data.token, data.user.role);
         } else {
            const response = await fetch(`${API_URL}/auth/register`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ email, password, fullName, role, phoneNumber, address, city, country, zipCode, recaptchaToken }),
            });

            const data = await response.json();
            if (!response.ok) {
               setError(data.message || 'Registration failed');
               return;
            }

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

   const handleResendVerification = async () => {
      if (!registrationSuccess?.email) return;
      setIsResendingVerification(true);
      try {
         const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registrationSuccess.email })
         });
         if (response.ok) setResendMessage('Verification email sent!');
         else setResendMessage('Failed to resend email');
      } catch {
         setResendMessage('Failed to resend verification email');
      } finally {
         setIsResendingVerification(false);
      }
   };

   if (registrationSuccess) {
      return (
         <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden bg-void">
            <ParticleSystem />
            <div className="absolute inset-0 bg-void/80 backdrop-blur-sm z-0"></div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
               <div className="bg-charcoal/50 backdrop-blur-md border border-pearl/10 p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tangerine to-amber-500"></div>
                  <div className="text-center mb-8">
                     <h2 className="font-display text-3xl text-pearl mb-2">
                        {registrationSuccess.requiresApproval ? 'Registration Complete' : 'Check Your Email'}
                     </h2>
                     <p className="text-warm-gray font-mono text-sm">{registrationSuccess.message}</p>
                  </div>
                  {!registrationSuccess.requiresApproval && (
                     <div className="text-center space-y-4">
                        <button onClick={handleResendVerification} disabled={isResendingVerification} className="text-tangerine hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                           {isResendingVerification ? 'Sending...' : 'Resend Email'}
                        </button>
                        {resendMessage && <p className="text-xs text-pearl">{resendMessage}</p>}
                     </div>
                  )}
                  <div className="mt-8 pt-6 border-t border-pearl/10">
                     <button onClick={() => { setRegistrationSuccess(null); setIsLogin(true); }} className="w-full bg-tangerine text-void font-bold uppercase py-3 hover:bg-white transition-colors">
                        Back to Login
                     </button>
                  </div>
               </div>
            </motion.div>
         </div>
      );
   }

   return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4 relative bg-void overflow-hidden">
         <ParticleSystem />

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
            <div className="text-center mb-8">
               <div className="flex items-center justify-center gap-3 mb-2">
                  <h1 className="font-display text-5xl font-bold text-pearl tracking-tight">MURAQQA</h1>
                  <span className="text-4xl text-tangerine" style={{ fontFamily: "var(--font-urdu)" }}>مرقع</span>
               </div>
               <p className="text-tangerine font-mono text-xs uppercase tracking-[0.3em]">Access Your Collections</p>
            </div>

            <div className="bg-charcoal/50 backdrop-blur-xl border border-pearl/10 p-8 md:p-10 shadow-2xl relative">
               {/* Tabs */}
               <div className="flex mb-8 border-b border-pearl/10">
                  <button onClick={() => { setIsLogin(true); setError(''); }} className={cn("flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative", isLogin ? "text-tangerine" : "text-warm-gray hover:text-pearl")}>
                     Sign In
                     {isLogin && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-tangerine" />}
                  </button>
                  <button onClick={() => { setIsLogin(false); setError(''); }} className={cn("flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative", !isLogin ? "text-tangerine" : "text-warm-gray hover:text-pearl")}>
                     Register
                     {!isLogin && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-tangerine" />}
                  </button>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <AnimatePresence mode="wait">
                     {!isLogin && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                           <div className="grid grid-cols-2 gap-4">
                              <label className={cn("cursor-pointer border p-4 text-center transition-all", role === 'USER' ? "border-tangerine bg-tangerine/10 text-tangerine" : "border-pearl/10 text-warm-gray hover:border-pearl/30")}>
                                 <input type="radio" name="role" checked={role === 'USER'} onChange={() => setRole('USER')} className="hidden" />
                                 <User size={20} className="mx-auto mb-2" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Collector</span>
                              </label>
                              <label className={cn("cursor-pointer border p-4 text-center transition-all", role === 'ARTIST' ? "border-tangerine bg-tangerine/10 text-tangerine" : "border-pearl/10 text-warm-gray hover:border-pearl/30")}>
                                 <input type="radio" name="role" checked={role === 'ARTIST'} onChange={() => setRole('ARTIST')} className="hidden" />
                                 <Award size={20} className="mx-auto mb-2" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Artist</span>
                              </label>
                           </div>
                           <input type="text" placeholder="FULL NAME" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none placeholder:text-warm-gray/50" required />
                           <input type="tel" placeholder="PHONE (OPTIONAL)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none placeholder:text-warm-gray/50" />
                           <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="CITY" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none placeholder:text-warm-gray/50" />
                              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none">
                                 <option value="Pakistan">Pakistan</option>
                                 <option value="UAE">UAE</option>
                                 <option value="UK">UK</option>
                                 <option value="USA">USA</option>
                              </select>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <div className="space-y-4">
                     <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none placeholder:text-warm-gray/50" required />
                     <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} placeholder="PASSWORD" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none placeholder:text-warm-gray/50" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-warm-gray hover:text-tangerine transition-colors">
                           {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                     </div>
                  </div>

                  {/* Password Strength */}
                  {!isLogin && password && (
                     <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map(i => (
                           <div key={i} className={cn("flex-1 transition-colors", i <= passwordStrength ? (passwordStrength > 2 ? "bg-green-500" : "bg-tangerine") : "bg-pearl/10")} />
                        ))}
                     </div>
                  )}

                  {isLogin && (
                     <div className="text-right">
                        <Link to="/forgot-password" className="text-[10px] uppercase tracking-widest text-warm-gray hover:text-tangerine transition-colors">Forgot Password?</Link>
                     </div>
                  )}

                  <AnimatePresence>
                     {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-3">
                           <X size={16} className="text-red-500 mt-0.5" />
                           <p className="text-red-500 text-xs font-mono">{error}</p>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading} className="group relative w-full bg-tangerine text-void font-bold uppercase py-4 tracking-[0.2em] text-xs hover:bg-white transition-colors disabled:opacity-50">
                     {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (isLogin ? 'Enter Gallery' : 'Create Account')}
                  </button>

                  <div className="relative py-4">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-pearl/10"></div></div>
                     <div className="relative flex justify-center"><span className="bg-charcoal px-2 text-[10px] uppercase text-warm-gray tracking-widest">Or Continue With</span></div>
                  </div>

                  <div className="flex gap-4">
                     {socialConfig.googleEnabled && (
                        <button type="button" onClick={() => window.location.href = `${API_URL}/auth/google`} className="flex-1 border border-pearl/10 p-3 flex items-center justify-center gap-2 hover:bg-pearl/5 transition-colors group">
                           <Chrome size={16} className="text-pearl group-hover:text-tangerine transition-colors" />
                           <span className="text-xs uppercase font-bold text-pearl">Google</span>
                        </button>
                     )}
                     {socialConfig.facebookEnabled && (
                        <button type="button" onClick={() => window.location.href = `${API_URL}/auth/facebook`} className="flex-1 border border-pearl/10 p-3 flex items-center justify-center gap-2 hover:bg-pearl/5 transition-colors group">
                           <Facebook size={16} className="text-pearl group-hover:text-tangerine transition-colors" />
                           <span className="text-xs uppercase font-bold text-pearl">Facebook</span>
                        </button>
                     )}
                  </div>
               </form>
               <div className="mt-8 text-center">
                  <p className="text-[10px] text-warm-gray uppercase tracking-widest flex items-center justify-center gap-2">
                     <Shield size={12} /> Secure Authentication
                  </p>
               </div>
            </div>
         </motion.div>
      </div>
   );
};
