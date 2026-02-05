import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Menu, X, User, ShoppingBag, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartContext } from '../../context/CartContext';

const ScrambleText = ({ text }: { text: string }) => {
    const [display, setDisplay] = useState(text);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    const scramble = () => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplay(
                text
                    .split('')
                    .map((letter, index) => {
                        if (index < iterations) {
                            return text[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('')
            );

            if (iterations >= text.length) {
                clearInterval(interval);
            }

            iterations += 1 / 3;
        }, 30);
    };

    return (
        <span
            onMouseEnter={scramble}
            className="font-display tracking-widest uppercase cursor-pointer block"
        >
            {display}
        </span>
    );
};

const Navbar = () => {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const { cart } = useCartContext();
    const navigate = useNavigate();

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        return scrollY.onChange((latest) => {
            setIsScrolled(latest > 50);
        });
    }, [scrollY]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    const navItems = [
        { name: 'COLLECTIONS', path: '/collections' },
        { name: 'ARTIST', path: '/artists' },
        { name: 'STORIES', path: '/stories' },
        { name: 'CONTACT', path: '/contact' },
    ];

    return (
        <>
            <motion.nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 h-[80px] flex items-center px-6 md:px-12 transition-all duration-500",
                    isScrolled ? "bg-void/80 backdrop-blur-md border-b border-white/5" : "bg-transparent"
                )}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="w-full flex justify-between items-center max-w-[1920px] mx-auto">
                    {/* Logo */}
                    <Link to="/" className="relative z-50 group">
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-widest relative">
                            MURAQQA<span className="text-tangerine">ART</span>
                            <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-tangerine transition-all duration-300 group-hover:w-full"></span>
                        </h1>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-12">
                        {navItems.map((item) => (
                            <Link key={item.name} to={item.path} className="text-sm font-medium text-pearl hover:text-white transition-colors relative overflow-hidden">
                                <ScrambleText text={item.name} />
                            </Link>
                        ))}

                        <div className="flex items-center gap-6 border-l border-pearl/10 pl-8 ml-4">
                            {/* Cart Icon */}
                            <Link to="/cart" className="text-pearl hover:text-tangerine transition-colors relative group">
                                <ShoppingBag size={20} />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-tangerine text-void text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Menu */}
                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 text-pearl hover:text-white transition-colors font-mono text-xs uppercase tracking-wider"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-charcoal border border-pearl/10 flex items-center justify-center text-tangerine">
                                            {user.fullName.charAt(0)}
                                        </div>
                                        <ChevronDown size={14} className={cn("transition-transform duration-300", userMenuOpen ? "rotate-180" : "")} />
                                    </button>

                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full right-0 mt-4 w-56 bg-stone-900 border border-stone-800 p-2 shadow-2xl backdrop-blur-xl rounded-lg"
                                                onMouseLeave={() => setUserMenuOpen(false)}
                                            >
                                                <div className="px-4 py-3 border-b border-stone-800 mb-2">
                                                    <p className="text-[10px] text-warm-gray uppercase tracking-widest mb-1">Signed in as</p>
                                                    <p className="text-sm font-display font-bold text-white truncate">{user.fullName}</p>
                                                </div>

                                                <Link
                                                    to="/profile"
                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-500 transition-colors rounded-md"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <User size={16} />
                                                    MY PROFILE
                                                </Link>

                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-md mt-1"
                                                >
                                                    <LogOut size={16} />
                                                    LOGOUT
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link to="/auth" className="text-pearl hover:text-tangerine transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-wider border border-pearl/20 px-4 py-2 hover:border-tangerine">
                                    <User size={14} />
                                    LOGIN
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center gap-6 md:hidden">
                        {/* Mobile Cart */}
                        <Link to="/cart" className="text-pearl hover:text-tangerine transition-colors relative">
                            <ShoppingBag size={24} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-tangerine text-void text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>

                        <button
                            className="text-pearl z-50"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Fullscreen asdsss Menu */}
            <motion.div
                className="fixed inset-0 bg-void z-40 flex flex-col justify-center items-center md:hidden"
                initial={{ opacity: 0, pointerEvents: 'none' }}
                animate={{
                    opacity: mobileMenuOpen ? 1 : 0,
                    pointerEvents: mobileMenuOpen ? 'auto' : 'none'
                }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col gap-8 text-center">
                    {navItems.map((item, i) => (
                        <motion.div
                            key={item.name}
                            initial={{ y: 40, opacity: 0 }}
                            animate={{
                                y: mobileMenuOpen ? 0 : 40,
                                opacity: mobileMenuOpen ? 1 : 0
                            }}
                            transition={{ delay: i * 0.1 + 0.2 }}
                        >
                            <Link
                                to={item.path}
                                className="text-6xl font-display font-bold text-transparent text-stroke hover:text-tangerine transition-colors duration-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        </motion.div>
                    ))}

                    {/* Mobile Auth Link */}
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{
                            y: mobileMenuOpen ? 0 : 40,
                            opacity: mobileMenuOpen ? 1 : 0
                        }}
                        transition={{ delay: 0.6 }}
                    >
                        {user ? (
                            <div className="flex flex-col gap-4">
                                <Link
                                    to="/profile"
                                    className="text-xl font-mono text-tangerine flex items-center gap-2 justify-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <User size={20} />
                                    {user.fullName}
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="text-sm font-mono text-red-400 flex items-center gap-2 justify-center uppercase tracking-widest border border-red-500/30 px-6 py-3"
                                >
                                    <LogOut size={16} />
                                    LOGOUT
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/auth"
                                className="text-2xl font-mono text-pearl hover:text-tangerine transition-colors flex items-center gap-2 justify-center"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <User size={24} />
                                LOGIN
                            </Link>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </>
    );
};

export default Navbar;
