import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, Search, Menu, X, Heart, Shield, Target } from 'lucide-react';
import { SearchOverlay } from './SearchOverlay';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartContext as useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { UI_TEXT } from '../constants';

interface NavbarProps {
  lang?: 'EN' | 'UR';
  setLang?: (lang: 'EN' | 'UR') => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [lang] = useState<'EN' | 'UR'>('EN'); // Default to EN for now

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const t = UI_TEXT[lang];

  const navLinks = [
    { name: t.nav.gallery, path: '/shop' },
    { name: t.nav.artists, path: '/brands' },
    { name: t.nav.exhibitions, path: '/collections' },
    { name: t.nav.conversations, path: '/journal' },
    { name: (t.nav as any).contact || 'Contact', path: '/contact' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || mobileMenuOpen ? 'bg-void/95 backdrop-blur-md py-4 border-b border-stone-800' : 'bg-gradient-to-b from-void to-transparent py-6'
          }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="z-50 relative group">
            <div className="flex flex-col items-start">
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tighter text-pearl group-hover:text-tangerine transition-colors flex items-center gap-2">
                <Target className="text-tangerine" size={28} />
                DEFEND & PROTECT
              </h1>
              <div className="text-[0.6rem] uppercase tracking-[0.3em] text-stone-500 font-mono">
                Premium Arms & Ammunition
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs uppercase tracking-[0.15em] font-bold transition-all hover:text-tangerine ${isActive ? 'text-tangerine' : 'text-stone-400'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 z-50">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-stone-400 hover:text-tangerine transition-colors"
            >
              <Search size={20} />
            </button>

            {user && (
              <Link to="/wishlist" className="text-stone-400 hover:text-tangerine transition-colors" title="Wishlist">
                <Heart size={20} />
              </Link>
            )}

            <Link to="/cart" className="text-stone-400 hover:text-tangerine transition-colors relative">
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-tangerine text-void text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                  className="flex items-center gap-2 text-stone-400 hover:text-tangerine transition-colors focus:outline-none"
                >
                  <User size={20} />
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 top-full mt-4 w-48 bg-charcoal border border-stone-700 shadow-xl transition-all duration-300 origin-top-right ${userMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
                >
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-stone-700/50">
                      <p className="text-white text-sm font-bold truncate">{user.fullName}</p>
                      <p className="text-stone-500 text-xs uppercase tracking-wider">{user.role}</p>
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-tangerine hover:bg-stone-700/50 transition-colors uppercase tracking-wider font-bold"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-stone-300 hover:text-tangerine hover:bg-stone-700/50 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/wishlist"
                      className="block px-4 py-2 text-sm text-stone-300 hover:text-tangerine hover:bg-stone-700/50 transition-colors"
                    >
                      Wishlist
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-stone-700/50 transition-colors border-t border-stone-700/50 mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="hidden md:block px-4 py-2 bg-tangerine text-void font-bold text-xs uppercase tracking-widest hover:bg-amber-500 transition-colors">
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-void z-40 transition-transform duration-500 flex flex-col items-center justify-center ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex flex-col items-center gap-8">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-display text-2xl uppercase tracking-widest transition-colors hover:text-tangerine ${isActive ? 'text-tangerine' : 'text-white'}`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="w-12 h-px bg-stone-800 my-4"></div>
          {user ? (
            <div className="flex flex-col items-center gap-6">
              <div className="text-stone-500 uppercase tracking-widest text-xs">{user.fullName}</div>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="text-sm uppercase tracking-widest text-tangerine hover:text-amber font-bold">Admin Dashboard</Link>
              )}
              <Link to="/profile" className="text-sm uppercase tracking-widest text-stone-400 hover:text-tangerine">Profile</Link>
              <button onClick={handleLogout} className="text-sm uppercase tracking-widest text-red-500 hover:text-red-400">Sign Out</button>
            </div>
          ) : (
            <Link to="/auth" className="text-xl text-white uppercase tracking-widest">Log In</Link>
          )}
        </div>
      </div>
    </>
  );
};
