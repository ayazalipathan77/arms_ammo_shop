import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Facebook, Chrome, ArrowRight, Phone, MapPin, Globe, Eye, EyeOff, Check, X, Loader2, Award, Shield, CheckCircle, Clock, Target, Radio } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '../hooks/useRecaptcha';
import { cn, apiFetch } from '../lib/utils';
import ParticleSystem from '../components/features/ParticleSystem';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:5000/api' : '/api';

export const Auth: React.FC = () => {
   const [isLogin, setIsLogin] = useState(true);
   const [role, setRole] = useState<'USER' | 'ARTIST'>('USER'); // Keeping internal role logic but hiding UI if needed
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
      // Fetch config and ensure CSRF token is set
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
            const response = await apiFetch(`${API_URL}/auth/login`, {
               method: 'POST',
               body: JSON.stringify({ email, password, recaptchaToken }),
            });

            const data = await response.json();

            if (!response.ok) {
               if (data.code === 'RECAPTCHA_LOW_SCORE') setError('Security verification failed.');
               else if (data.code === 'EMAIL_NOT_VERIFIED') setRegistrationSuccess({ message: 'Please verify your email.', requiresApproval: false, email: data.email || email });
               else setError(data.message || 'Access Denied');
               return;
            }
            handleAuthSuccess(data.token, data.user.role);
         } else {
            const response = await apiFetch(`${API_URL}/auth/register`, {
               method: 'POST',
               body: JSON.stringify({ email, password, fullName, role, phoneNumber, address, city, country, zipCode, recaptchaToken, referralCode: searchParams.get('ref') || undefined }),
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
         setError(err.message || 'System Error');
      } finally {
         setLoading(false);
      }
   };

   const handleResendVerification = async () => {
      if (!registrationSuccess?.email) return;
      setIsResendingVerification(true);
      try {
         const response = await apiFetch(`${API_URL}/auth/resend-verification`, {
            method: 'POST',
            body: JSON.stringify({ email: registrationSuccess.email })
         });
         if (response.ok) setResendMessage('Verification uplink established.');
         else setResendMessage('Uplink failed.');
      } catch {
         setResendMessage('Uplink critical failure.');
      } finally {
         setIsResendingVerification(false);
      }
   };

   if (registrationSuccess) {
      return (
         <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden bg-void">
            <ParticleSystem />
            <div className="absolute inset-0 bg-void/90 backdrop-blur-md z-0"></div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md">
               <div className="bg-gunmetal/30 backdrop-blur-xl border border-olive/30 p-10 shadow-2xl relative overflow-hidden clip-diagonal">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-olive to-sulphur"></div>
                  <div className="text-center mb-8">
                     <h2 className="font-display text-3xl text-pearl mb-2 uppercase tracking-wide">
                        {registrationSuccess.requiresApproval ? 'CLEARANCE PENDING' : 'VERIFY COMMS'}
                     </h2>
                     <p className="text-camo font-mono text-sm">{registrationSuccess.message}</p>
                  </div>
                  {!registrationSuccess.requiresApproval && (
                     <div className="text-center space-y-4">
                        <button onClick={handleResendVerification} disabled={isResendingVerification} className="text-sulphur hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
                           <Radio size={14} className={isResendingVerification ? "animate-pulse" : ""} />
                           {isResendingVerification ? 'PINGING...' : 'RE-ESTABLISH UPLINK'}
                        </button>
                        {resendMessage && <p className="text-xs text-pearl font-mono">{resendMessage}</p>}
                     </div>
                  )}
                  <div className="mt-8 pt-6 border-t border-white/5">
                     <button onClick={() => { setRegistrationSuccess(null); setIsLogin(true); }} className="w-full bg-olive text-white font-bold uppercase py-3 hover:bg-olive/80 transition-colors tracking-widest text-xs clip-diagonal">
                        RETURN TO BASE
                     </button>
                  </div>
               </div>
            </motion.div>
         </div>
      );
   }

   return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4 relative bg-void overflow-hidden">
         {/* Background elements */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
         <ParticleSystem />

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
            <div className="text-center mb-8">
               <div className="flex flex-col items-center justify-center gap-2 mb-2">
                  <Target size={48} className="text-olive mb-2" />
                  <h1 className="font-display text-6xl font-bold text-pearl tracking-tighter leading-none">AAA</h1>
                  <div className="flex items-center gap-2 text-sulphur uppercase tracking-[0.5em] text-[10px] font-mono">
                     <Shield size={10} /> Secure Access Terminal
                  </div>
               </div>
            </div>

            <div className="bg-gunmetal/20 backdrop-blur-md border border-white/10 p-8 md:p-10 shadow-2xl relative clip-diagonal">
               {/* Corner accents */}
               <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-olive"></div>
               <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-olive"></div>
               <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-olive"></div>
               <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-olive"></div>

               {/* Tabs */}
               <div className="flex mb-8 border-b border-white/10">
                  <button onClick={() => { setIsLogin(true); setError(''); }} className={cn("flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative", isLogin ? "text-sulphur" : "text-stone-500 hover:text-sulphur")}>
                     Identify
                     {isLogin && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-sulphur" />}
                  </button>
                  <button onClick={() => { setIsLogin(false); setError(''); }} className={cn("flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative", !isLogin ? "text-sulphur" : "text-stone-500 hover:text-sulphur")}>
                     Enlist
                     {!isLogin && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-sulphur" />}
                  </button>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <AnimatePresence mode="wait">
                     {!isLogin && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                           <div className="grid grid-cols-2 gap-4">
                              <label className={cn("cursor-pointer border p-4 text-center transition-all bg-void/50", role === 'USER' ? "border-sulphur text-sulphur" : "border-white/5 text-stone-500 hover:border-white/20")}>
                                 <input type="radio" name="role" checked={role === 'USER'} onChange={() => setRole('USER')} className="hidden" />
                                 <User size={20} className="mx-auto mb-2" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Operator</span>
                              </label>
                              <label className={cn("cursor-pointer border p-4 text-center transition-all bg-void/50", role === 'ARTIST' ? "border-sulphur text-sulphur" : "border-white/5 text-stone-500 hover:border-white/20")}>
                                 <input type="radio" name="role" checked={role === 'ARTIST'} onChange={() => setRole('ARTIST')} className="hidden" />
                                 <Award size={20} className="mx-auto mb-2" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Supplier</span>
                              </label>
                           </div>
                           <div className="relative group">
                              <input type="text" placeholder="FULL DESIGNATION" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-void/50 border border-white/10 p-3 text-pearl font-mono text-sm focus:border-sulphur outline-none placeholder:text-stone-600 transition-colors uppercase" required />
                              <div className="absolute right-3 top-3 text-stone-600 group-focus-within:text-sulphur"><User size={14} /></div>
                           </div>
                           <div className="relative group">
                              <input type="tel" placeholder="COMMS (OPTIONAL)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-void/50 border border-white/10 p-3 text-pearl font-mono text-sm focus:border-sulphur outline-none placeholder:text-stone-600 transition-colors uppercase" />
                              <div className="absolute right-3 top-3 text-stone-600 group-focus-within:text-sulphur"><Phone size={14} /></div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="SECTOR (CITY)" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-void/50 border border-white/10 p-3 text-pearl font-mono text-sm focus:border-sulphur outline-none placeholder:text-stone-600 transition-colors uppercase" />
                              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-void/50 border border-white/10 p-3 text-pearl font-mono text-sm focus:border-sulphur outline-none text-stone-400">
                                 <option value="Pakistan">PAKISTAN</option>
                                 <option value="UAE">UAE</option>
                                 <option value="UK">UK</option>
                                 <option value="USA">USA</option>
                              </select>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <div className="space-y-4">
                     <div className="relative group">
                        <input type="email" placeholder="ACCESS BADGE (EMAIL)" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-void/50 border border-white/10 p-3 text-pearl font-mono text-sm focus:border-sulphur outline-none placeholder:text-stone-600 transition-colors uppercase" required />
                        <div className="absolute right-3 top-3 text-stone-600 group-focus-within:text-sulphur"><Mail size={14} /></div>
                     </div>
                     <div className="relative group">
                        <input type={showPassword ? 'text' : 'password'} placeholder="PASSCODE" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-void/50 border border-white/10 p-3 text-pearl font-mono text-sm focus:border-sulphur outline-none placeholder:text-stone-600 transition-colors uppercase" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-stone-600 hover:text-sulphur transition-colors">
                           {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                     </div>
                  </div>

                  {/* Password Strength */}
                  {!isLogin && password && (
                     <div className="flex gap-1 h-1 bg-void/50">
                        {[1, 2, 3, 4].map(i => (
                           <div key={i} className={cn("flex-1 transition-colors duration-300", i <= passwordStrength ? (passwordStrength > 2 ? "bg-olive" : "bg-sulphur") : "bg-transparent")} />
                        ))}
                     </div>
                  )}

                  {isLogin && (
                     <div className="text-right">
                        <Link to="/forgot-password" className="text-[10px] uppercase tracking-widest text-camo hover:text-sulphur transition-colors">Lost Access?</Link>
                     </div>
                  )}

                  <AnimatePresence>
                     {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-alert/10 border border-alert/30 p-3 flex items-start gap-3">
                           <X size={16} className="text-alert mt-0.5" />
                           <p className="text-alert text-xs font-mono uppercase">{error}</p>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading} className="group relative w-full bg-olive text-white font-bold uppercase py-4 tracking-[0.2em] text-xs border border-transparent hover:bg-olive/80 transition-all disabled:opacity-50 clip-diagonal">
                     {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : <span className="group-hover:tracking-[0.3em] transition-all duration-300">{isLogin ? 'AUTHENTICATE' : 'INITIATE PROTOCOL'}</span>}
                  </button>

                  <div className="relative py-4">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                     <div className="relative flex justify-center"><span className="bg-void px-2 text-[10px] uppercase text-stone-600 tracking-widest">Alternative Channels</span></div>
                  </div>

                  <div className="flex gap-4">
                     {socialConfig.googleEnabled && (
                        <button type="button" onClick={() => window.location.href = `${API_URL}/auth/google`} className="flex-1 border border-white/10 bg-void/30 p-3 flex items-center justify-center gap-2 hover:bg-white/5 hover:border-sulphur transition-colors group">
                           <Chrome size={16} className="text-stone-400 group-hover:text-sulphur transition-colors" />
                           <span className="text-xs uppercase font-bold text-stone-400 group-hover:text-sulphur transition-colors">Google</span>
                        </button>
                     )}
                     {socialConfig.facebookEnabled && (
                        <button type="button" onClick={() => window.location.href = `${API_URL}/auth/facebook`} className="flex-1 border border-white/10 bg-void/30 p-3 flex items-center justify-center gap-2 hover:bg-white/5 hover:border-sulphur transition-colors group">
                           <Facebook size={16} className="text-stone-400 group-hover:text-sulphur transition-colors" />
                           <span className="text-xs uppercase font-bold text-stone-400 group-hover:text-sulphur transition-colors">Facebook</span>
                        </button>
                     )}
                  </div>
               </form>
               <div className="mt-8 text-center pt-4 border-t border-white/5">
                  <p className="text-[8px] text-stone-600 uppercase tracking-widest flex items-center justify-center gap-2">
                     <Shield size={10} /> AAA Security Protocols Active
                  </p>
               </div>
            </div>
         </motion.div>
      </div>
   );
};
