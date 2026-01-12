import React, { useState } from 'react';
import { User, Lock, Mail, Facebook, Chrome, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'USER' | 'ARTIST'>('USER');
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    // Simulation of successful auth redirection
    if (role === 'ARTIST') {
       navigate('/artist-dashboard');
    } else {
       navigate('/profile');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthSuccess();
  };

  const handleSocialLogin = (provider: string) => {
    // Simulate OAuth process
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // In a real app, this would redirect to an OAuth endpoint
    console.log(`Initiating ${provider} login...`);
    
    // Simulate network delay then success
    setTimeout(() => {
        handleAuthSuccess();
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-32 pb-12 flex items-center justify-center px-4 bg-[url('https://picsum.photos/1920/1080?blur=10')] bg-cover bg-fixed">
       <div className="absolute inset-0 bg-stone-950/90"></div>
       
       <div className="relative z-10 w-full max-w-md bg-stone-900 border border-stone-800 p-8 shadow-2xl animate-fade-in">
          <h2 className="font-serif text-3xl text-white text-center mb-2">MURAQQA</h2>
          <p className="text-stone-500 text-center text-xs uppercase tracking-widest mb-8">{isLogin ? 'Sign In to your account' : 'Join the Collective'}</p>

          <div className="flex gap-2 mb-8 p-1 bg-stone-950 rounded border border-stone-800">
             <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-xs uppercase font-bold rounded transition-all ${isLogin ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>Login</button>
             <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-xs uppercase font-bold rounded transition-all ${!isLogin ? 'bg-stone-800 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             {!isLogin && (
                <div className="space-y-4 mb-6 border-b border-stone-800 pb-6 animate-fade-in">
                   <p className="text-stone-400 text-xs uppercase tracking-wider">I am joining as a:</p>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${role === 'USER' ? 'border-amber-500' : 'border-stone-600'}`}>
                            {role === 'USER' && <div className="w-2 h-2 bg-amber-500 rounded-full"></div>}
                         </div>
                         <input type="radio" name="role" checked={role === 'USER'} onChange={() => setRole('USER')} className="hidden" />
                         <span className={`text-sm transition-colors ${role === 'USER' ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'}`}>Collector</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${role === 'ARTIST' ? 'border-amber-500' : 'border-stone-600'}`}>
                            {role === 'ARTIST' && <div className="w-2 h-2 bg-amber-500 rounded-full"></div>}
                         </div>
                         <input type="radio" name="role" checked={role === 'ARTIST'} onChange={() => setRole('ARTIST')} className="hidden" />
                         <span className={`text-sm transition-colors ${role === 'ARTIST' ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'}`}>Artist</span>
                      </label>
                   </div>
                </div>
             )}

             <div className="space-y-4">
                {!isLogin && (
                    <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input type="text" placeholder="Full Name" className="w-full bg-stone-950 border border-stone-700 p-3 pl-10 text-white focus:border-amber-500 outline-none transition-colors" />
                    </div>
                )}
                
                <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input type="email" placeholder="Email Address" className="w-full bg-stone-950 border border-stone-700 p-3 pl-10 text-white focus:border-amber-500 outline-none transition-colors" />
                </div>
                
                <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input type="password" placeholder="Password" className="w-full bg-stone-950 border border-stone-700 p-3 pl-10 text-white focus:border-amber-500 outline-none transition-colors" />
                </div>
             </div>

             <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 mt-2 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 group transition-all">
                {isLogin ? 'Enter Gallery' : 'Create Account'}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </form>

          {/* Social Login Section */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-stone-900 px-4 text-stone-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => handleSocialLogin('Google')} 
                className="flex items-center justify-center gap-2 bg-stone-950 border border-stone-700 text-stone-300 py-3 text-xs font-bold uppercase hover:bg-stone-800 hover:text-white hover:border-stone-600 transition-all"
            >
                <Chrome size={16} />
                Google
            </button>
            <button 
                onClick={() => handleSocialLogin('Facebook')} 
                className="flex items-center justify-center gap-2 bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] py-3 text-xs font-bold uppercase hover:bg-[#1877F2] hover:text-white transition-all"
            >
                <Facebook size={16} />
                Facebook
            </button>
          </div>
          
          <div className="mt-8 text-center pt-6 border-t border-stone-800">
             <Link to="/admin" className="text-stone-600 text-[10px] uppercase tracking-widest hover:text-amber-500 transition-colors">Admin Portal Access</Link>
          </div>
       </div>
    </div>
  );
};
