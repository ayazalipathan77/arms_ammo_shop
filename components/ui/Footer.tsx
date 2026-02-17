import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, ArrowUpRight, Crosshair, MapPin, Shield } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-void/90 backdrop-blur-md text-stone-400 border-t border-gunmetal pt-20 pb-10 px-6 md:px-12 relative z-10 font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-24 mb-20 relative z-10">
                {/* Brand */}
                <div className="md:col-span-1">
                    <Link to="/" className="block mb-6 group">
                        <div className="flex items-center gap-2">
                            <Crosshair className="text-olive group-hover:rotate-90 transition-transform duration-500" />
                            <h2 className="font-display text-4xl font-bold tracking-widest text-pearl uppercase">
                                AAA
                            </h2>
                        </div>
                    </Link>
                    <p className="font-mono text-xs text-camo leading-relaxed mb-6 border-l-2 border-gunmetal pl-4">
                        Premium grade firearms, ammunition, and tactical equipment for professional operators and enthusiasts.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 border border-gunmetal flex items-center justify-center hover:bg-olive hover:text-void hover:border-olive transition-all"><Instagram size={18} /></a>
                        <a href="#" className="w-10 h-10 border border-gunmetal flex items-center justify-center hover:bg-olive hover:text-void hover:border-olive transition-all"><Facebook size={18} /></a>
                        <a href="#" className="w-10 h-10 border border-gunmetal flex items-center justify-center hover:bg-olive hover:text-void hover:border-olive transition-all"><Twitter size={18} /></a>
                    </div>
                </div>

                {/* Links 1 */}
                <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] mb-6 text-safety flex items-center gap-2"><MapPin size={12} /> Navigation</h3>
                    <ul className="space-y-3 font-mono text-xs">
                        <li><Link to="/collections" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> Showcases</Link></li>
                        <li><Link to="/brands" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> Manufacturers</Link></li>
                        <li><Link to="/journal" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> Intel / News</Link></li>
                        <li><Link to="/auth" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> Access Portal</Link></li>
                    </ul>
                </div>

                {/* Links 2 */}
                <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] mb-6 text-safety flex items-center gap-2"><Shield size={12} /> Support Operations</h3>
                    <ul className="space-y-3 font-mono text-xs">
                        <li><Link to="/cart" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> Requisition List</Link></li>
                        <li><Link to="/contact" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> Contact Command</Link></li>
                        <li><Link to="/terms-of-service" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> FFL Policies</Link></li>
                        <li><Link to="/privacy-policy" className="hover:text-olive transition-colors uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 duration-300"><span className="w-1 h-1 bg-stone-600"></span> Privacy Protocol</Link></li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] mb-6 text-safety">Secure Comms</h3>
                    <p className="font-mono text-xs text-camo mb-4">Join the mailing list for new gear drops and exclusive tactical intel.</p>
                    <div className="flex border-b border-gunmetal pb-2 items-center">
                        <input
                            type="email"
                            placeholder="ENCRYPTED EMAIL"
                            className="bg-transparent border-none outline-none text-xs font-mono text-pearl w-full placeholder:text-stone-700 uppercase"
                        />
                        <button className="text-olive hover:text-pearl transition-colors">
                            <ArrowUpRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-gunmetal pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono uppercase tracking-widest text-stone-600">
                <p>&copy; {new Date().getFullYear()} AAA. All Rights Reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <span>Ayaz Ali Dev</span>
                    <span>System v2.0</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
