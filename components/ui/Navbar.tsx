import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Menu, X } from 'lucide-react';

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

    useEffect(() => {
        return scrollY.onChange((latest) => {
            setIsScrolled(latest > 50);
        });
    }, [scrollY]);

    const navItems = [
        { name: 'WORK', path: '/exhibitions' },
        { name: 'ARTIST', path: '/artists' },
        { name: 'STORIES', path: '/stories' },
        // { name: 'CONTACT', path: '/contact' },
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
                            BANDAH<span className="text-tangerine">ALI</span>
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
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-pearl z-50"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Fullscreen Menu */}
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
                </div>
            </motion.div>
        </>
    );
};

export default Navbar;
