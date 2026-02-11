import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, Search, Menu, X, Heart } from 'lucide-react';
import { SearchOverlay } from './SearchOverlay';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../App';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  lang?: 'EN' | 'UR';
  setLang?: (lang: 'EN' | 'UR') => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { user, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Artists', path: '/artists' },
    { name: 'Exhibitions', path: '/exhibitions' },
    { name: 'Collection', path: '/gallery' },
    { name: 'Stories', path: '/conversations' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || mobileMenuOpen ? 'bg-stone-950/90 backdrop-blur-md py-4 border-b border-stone-800' : 'bg-gradient-to-b from-stone-950/90 to-transparent py-6'
          }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="z-50 relative group">
            <div className="flex flex-col items-center">
              <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 drop-shadow-sm filter">
                MURAQQA
              </h1>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50 mt-1"></div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors hover:text-amber-400 ${isActive ? 'text-amber-500' : 'text-stone-400'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-8 z-50">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-stone-400 hover:text-white transition-colors"
            >
              <Search size={18} />
            </button>

            {user && (
              <Link to="/wishlist" className="text-stone-400 hover:text-white transition-colors" title="Wishlist">
                <Heart size={18} />
              </Link>
            )}

            <Link to="/cart" className="text-stone-400 hover:text-white transition-colors relative">
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                  className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors focus:outline-none group"
                >
                  <User size={18} />
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-white">{user.fullName}</span>
                    {user.role === 'ADMIN' && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">Admin</span>
                    )}
                    {user.role === 'ARTIST' && (
                      <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Artist</span>
                    )}
                    {user.role === 'USER' && (
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Collector</span>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 top-full mt-4 w-48 bg-stone-900 border border-stone-800 rounded-sm shadow-xl transition-all duration-300 origin-top-right ${userMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
                >
                  <div className="py-2">
                    {/* Admin Link */}
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-amber-500 hover:bg-stone-800 transition-colors uppercase tracking-wider"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/wishlist"
                      className="block px-4 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Wishlist
                      </span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-stone-800 transition-colors border-t border-stone-800 mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="hidden md:block text-xs uppercase tracking-widest text-stone-400 hover:text-white">
                Log In
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
      <div className={`fixed inset-0 bg-stone-950 z-40 transition-transform duration-500 flex flex-col items-center justify-center ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex flex-col items-center gap-8">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-serif text-3xl transition-colors hover:text-amber-400 ${isActive ? 'text-amber-500' : 'text-white'}`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="w-12 h-px bg-stone-800 my-4"></div>
          {user ? (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <div className="text-white text-lg mb-1">{user.fullName}</div>
                {user.role === 'ADMIN' && (
                  <div className="text-[10px] uppercase tracking-wider text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full inline-block">Admin</div>
                )}
                {user.role === 'ARTIST' && (
                  <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold bg-purple-400/10 px-3 py-1 rounded-full inline-block">Artist</div>
                )}
                {user.role === 'USER' && (
                  <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold bg-stone-400/10 px-3 py-1 rounded-full inline-block">Collector</div>
                )}
              </div>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="text-sm uppercase tracking-widest text-amber-500 hover:text-amber-400 font-bold">Admin Dashboard</Link>
              )}
              <Link to="/profile" className="text-sm uppercase tracking-widest text-stone-400 hover:text-white">Profile</Link>
              <button onClick={handleLogout} className="text-sm uppercase tracking-widest text-red-500 hover:text-red-400">Sign Out</button>
            </div>
          ) : (
            <Link to="/auth" className="text-xl text-white">Log In</Link>
          )}
        </div>
      </div>
    </>
  );
};
