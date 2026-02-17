import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, Search, Menu, X, Heart, Crosshair, Target, Shield, Radio, LogOut, Layers, ChevronDown } from 'lucide-react';
import { SearchOverlay } from '../SearchOverlay';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartContext as useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart } = useCart();
    const { user, logout } = useAuth();

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

    const navLinks = [
        { name: 'ARSENAL', path: '/shop' },
        { name: 'BRANDS', path: '/brands' },
        { name: 'SHOWCASES', path: '/collections' },
        { name: 'INTEL', path: '/journal' },
    ];

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                    isScrolled || mobileMenuOpen
                        ? "bg-void/95 backdrop-blur-md py-3 border-gunmetal shadow-lg"
                        : "bg-gradient-to-b from-black/80 to-transparent py-6 border-transparent"
                )}
            >
                <div className="max-w-screen-2xl mx-auto px-6 md:px-12 flex items-center justify-between">

                    {/* Logo */}
                    <Link to="/" className="z-50 relative group flex items-center gap-3">
                        <div className="w-10 h-10 bg-olive text-void flex items-center justify-center clip-diagonal">
                            <Target size={24} />
                        </div>
                        <div className="flex flex-col items-start">
                            <h1 className="font-display text-4xl font-bold tracking-tighter text-pearl uppercase leading-none group-hover:text-olive transition-colors">
                                AAA
                            </h1>
                            <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-camo font-mono">
                                <Radio size={8} className="text-safety animate-pulse" />
                                <span>Systems Online</span>
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => {
                            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "text-xs uppercase tracking-[0.15em] font-bold px-4 py-2 transition-all hover:text-safety hover:bg-white/5 clip-diagonal",
                                        isActive ? "text-safety bg-white/5" : "text-stone-400"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 z-50">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="text-stone-400 hover:text-safety transition-colors p-2"
                        >
                            <Search size={20} />
                        </button>

                        {user && (
                            <Link to="/wishlist" className="text-stone-400 hover:text-safety transition-colors p-2 hidden sm:block" title="Wishlist">
                                <Heart size={20} />
                            </Link>
                        )}

                        <Link to="/cart" className="text-stone-400 hover:text-safety transition-colors relative p-2 group">
                            <ShoppingBag size={20} className="group-hover:fill-current" />
                            {cart.length > 0 && (
                                <span className="absolute top-0 right-0 bg-safety text-void text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-sm">
                                    {cart.length}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                                    className="flex items-center gap-2 text-stone-400 hover:text-safety transition-colors focus:outline-none p-2"
                                >
                                    <User size={20} />
                                </button>

                                {/* Dropdown Menu */}
                                <div
                                    className={cn(
                                        "absolute right-0 top-full mt-4 w-56 bg-void border border-gunmetal shadow-2xl transition-all duration-300 origin-top-right z-50",
                                        userMenuOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                                    )}
                                >
                                    <div className="px-4 py-3 border-b border-gunmetal bg-gunmetal/20">
                                        <p className="text-pearl text-sm font-bold font-display tracking-wider truncate">{user.fullName}</p>
                                        <p className="text-camo text-[10px] uppercase tracking-widest font-mono">{user.role}</p>
                                    </div>

                                    <div className="py-2">
                                        {user.role === 'ADMIN' && (
                                            <Link
                                                to="/admin"
                                                className="block px-4 py-2 text-xs text-olive hover:bg-gunmetal/50 transition-colors uppercase tracking-widest font-bold"
                                            >
                                                Command Center
                                            </Link>
                                        )}

                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-xs text-stone-300 hover:text-safety hover:bg-gunmetal/50 transition-colors uppercase tracking-wider"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            to="/wishlist"
                                            className="block px-4 py-2 text-xs text-stone-300 hover:text-safety hover:bg-gunmetal/50 transition-colors uppercase tracking-wider"
                                        >
                                            Wishlist
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-xs text-alert hover:bg-gunmetal/50 transition-colors border-t border-gunmetal mt-1 uppercase tracking-wider"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link to="/auth" className="hidden md:flex items-center gap-2 px-6 py-2 bg-olive text-white font-bold text-xs uppercase tracking-widest hover:bg-olive/80 transition-colors clip-diagonal">
                                <Shield size={12} /> Access
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-stone-400 hover:text-safety"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Mobile Menu Overlay */}
            <div className={cn(
                "fixed inset-0 bg-void z-40 transition-transform duration-500 flex flex-col items-center justify-center border-l border-gunmetal",
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col items-center gap-8 w-full px-8">
                    {navLinks.map(link => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "font-display text-3xl uppercase tracking-widest transition-colors hover:text-safety w-full text-center border-b border-gunmetal pb-4",
                                    isActive ? "text-safety border-safety" : "text-stone-500"
                                )}
                            >
                                {link.name}
                            </Link>
                        );
                    })}

                    <div className="flex flex-col items-center gap-6 mt-8 w-full">
                        {user ? (
                            <>
                                <div className="text-camo uppercase tracking-widest text-xs font-mono">{user.fullName}</div>
                                {user.role === 'ADMIN' && (
                                    <Link to="/admin" className="text-sm uppercase tracking-widest text-olive hover:text-pearl font-bold">Command Center</Link>
                                )}
                                <button onClick={handleLogout} className="text-sm uppercase tracking-widest text-alert hover:text-red-400">Disconnect</button>
                            </>
                        ) : (
                            <Link to="/auth" className="w-full py-4 bg-olive text-white text-center uppercase tracking-widest font-bold text-sm clip-diagonal">
                                Establish Connection
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
