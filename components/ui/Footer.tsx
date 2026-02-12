import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, ArrowUpRight } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-void text-pearl border-t border-pearl/10 pt-20 pb-10 px-6 md:px-12 relative z-10">
            <div className="max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-24 mb-20">
                {/* Brand */}
                <div className="md:col-span-1">
                    <Link to="/" className="block mb-6">
                        <div className="flex items-center gap-2">
                            <h2 className="font-display text-3xl font-bold tracking-widest text-white">
                                MURAQQA
                            </h2>
                            <span className="text-2xl text-tangerine" style={{ fontFamily: "var(--font-urdu)" }}>مرقع</span>
                        </div>
                    </Link>
                    <p className="font-mono text-xs text-warm-gray leading-relaxed mb-6">
                        Exploring the depths of contemporary Pakistani art through a chromatic lens.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-warm-gray hover:text-tangerine transition-colors"><Instagram size={18} /></a>
                        <a href="#" className="text-warm-gray hover:text-tangerine transition-colors"><Facebook size={18} /></a>
                        <a href="#" className="text-warm-gray hover:text-tangerine transition-colors"><Twitter size={18} /></a>
                    </div>
                </div>

                {/* Links 1 */}
                <div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-6 text-tangerine">Discover</h3>
                    <ul className="space-y-4 font-mono text-xs">
                        <li><Link to="/exhibitions" className="text-warm-gray hover:text-tangerine transition-colors">Exhibitions</Link></li>
                        <li><Link to="/artists" className="text-warm-gray hover:text-tangerine transition-colors">Artists</Link></li>
                        <li><Link to="/stories" className="text-warm-gray hover:text-tangerine transition-colors">Stories</Link></li>
                        <li><Link to="/auth" className="text-warm-gray hover:text-tangerine transition-colors">Login / Register</Link></li>
                    </ul>
                </div>

                {/* Links 2 */}
                <div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-6 text-tangerine">Support</h3>
                    <ul className="space-y-4 font-mono text-xs">
                        <li><Link to="/cart" className="text-warm-gray hover:text-tangerine transition-colors">Cart</Link></li>
                        <li><Link to="/contact" className="text-warm-gray hover:text-tangerine transition-colors">Shipping Policy</Link></li>
                        <li><Link to="/terms-of-service" className="text-warm-gray hover:text-tangerine transition-colors">Terms of Service</Link></li>
                        <li><Link to="/privacy-policy" className="text-warm-gray hover:text-tangerine transition-colors">Privacy Policy</Link></li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-6 text-tangerine">Newsletter</h3>
                    <p className="font-mono text-xs text-warm-gray mb-4">Subscribe for exhibition updates and exclusive drops.</p>
                    <div className="flex border-b border-pearl/20 pb-2">
                        <input
                            type="email"
                            placeholder="EMAIL ADDRESS"
                            className="bg-transparent border-none outline-none text-xs font-mono text-pearl w-full placeholder:text-warm-gray/50"
                        />
                        <button className="text-tangerine hover:text-amber transition-colors">
                            <ArrowUpRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-pearl/10 pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono uppercase tracking-widest text-warm-gray/50">
                <p>&copy; {new Date().getFullYear()} Muraqqa <span className="text-sm" style={{ fontFamily: "var(--font-urdu)" }}>مرقع</span>. All Rights Reserved.</p>
                <p className="mt-4 md:mt-0">Developed by Ayaz Ali • 03453662534</p>
            </div>
        </footer>
    );
};

export default Footer;
