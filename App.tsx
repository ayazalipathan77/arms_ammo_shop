
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Gallery } from './pages/Gallery';
import { ArtworkDetail } from './pages/ArtworkDetail';
import { Cart } from './pages/Cart';
import { AdminDashboard } from './pages/AdminDashboard';
import { ArtistDashboard } from './pages/ArtistDashboard';
import { ArtistDetail } from './pages/ArtistDetail';
import { ArtistProfile } from './pages/ArtistProfile';
import { UserProfile } from './pages/UserProfile';
import { Auth } from './pages/Auth';
import { Exhibitions } from './pages/Exhibitions';
import { Artists } from './pages/Artists';
import { Conversations } from './pages/Conversations';
import { InvoiceView } from './pages/InvoiceView';
import { Contact } from './pages/Contact';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ArtistConfirmation } from './pages/ArtistConfirmation';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { AICurator } from './components/AICurator';
import { Currency } from './types';
import { RATES } from './constants';
import { GalleryProvider, useGallery } from './context/GalleryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCartContext } from './context/CartContext';

// Currency Context
interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convertPrice: (pricePKR: number) => string;
  rawConvert: (pricePKR: number) => number;
}
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within App');
  return context;
};

// Cart Hook - wrapper around the new CartContext for backward compatibility
export const useCart = () => {
  const context = useCartContext();
  return {
    cart: context.cart,
    addToCart: context.addToCart,
    removeFromCart: context.removeFromCart,
    clearCart: context.clearCart,
  };
};

// Layout wrapper
const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return <>{children}</>;
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'ARTIST' | 'USER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { token, user, isLoading } = useAuth();

  // Wait for authentication check to complete
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="text-amber-500 text-sm uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Footer Component to access context properly
const Footer: React.FC = () => {
  const { siteContent } = useGallery();

  return (
    <footer className="relative bg-stone-950 border-t border-stone-800/50 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/3 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      {/* Main Footer Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Brand Section */}
          <div className="md:col-span-5">
            <div className="mb-8 flex flex-col items-start">
              <h4 className="font-serif text-4xl md:text-5xl tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 mb-2">
                MURAQQA
              </h4>
              <div className="h-px w-40 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed max-w-sm mb-8 detail-text">
              Elevating Pakistani Art to the global stage through curated exhibitions, authentic masterpieces, and a commitment to preserving cultural heritage.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {siteContent.socialLinks.instagram && (
                <a
                  href={siteContent.socialLinks.instagram}
                  className="group w-12 h-12 rounded-full bg-stone-900/50 hover:bg-gradient-to-br hover:from-amber-500/20 hover:to-yellow-500/20 border border-stone-800 hover:border-amber-500/50 flex items-center justify-center transition-all duration-300"
                >
                  <span className="text-stone-500 group-hover:text-amber-400 text-sm font-medium transition-colors">IG</span>
                </a>
              )}
              {siteContent.socialLinks.facebook && (
                <a
                  href={siteContent.socialLinks.facebook}
                  className="group w-12 h-12 rounded-full bg-stone-900/50 hover:bg-gradient-to-br hover:from-amber-500/20 hover:to-yellow-500/20 border border-stone-800 hover:border-amber-500/50 flex items-center justify-center transition-all duration-300"
                >
                  <span className="text-stone-500 group-hover:text-amber-400 text-sm font-medium transition-colors">FB</span>
                </a>
              )}
              <a
                href="mailto:support@muraqqa.art"
                className="group w-12 h-12 rounded-full bg-stone-900/50 hover:bg-gradient-to-br hover:from-amber-500/20 hover:to-yellow-500/20 border border-stone-800 hover:border-amber-500/50 flex items-center justify-center transition-all duration-300"
              >
                <span className="text-stone-500 group-hover:text-amber-400 text-sm font-medium transition-colors">@</span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-2">
            <h5 className="font-serif text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-6 tracking-wider">
              Gallery
            </h5>
            <ul className="space-y-4">
              {[
                { label: 'Collection', path: '/#/gallery' },
                { label: 'Artists', path: '/#/artists' },
                { label: 'Exhibitions', path: '/#/exhibitions' },
                { label: 'Stories', path: '/#/conversations' },
              ].map((link) => (
                <li key={link.path}>
                  <a
                    href={link.path}
                    className="text-stone-500 hover:text-amber-400 text-sm transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-amber-500 transition-all duration-300"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <h5 className="font-serif text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-6 tracking-wider">
              Services
            </h5>
            <ul className="space-y-4">
              {[
                { label: 'Private Viewing', path: '/#/contact' },
                { label: 'Art Consultation', path: '/#/contact' },
                { label: 'Commissions', path: '/#/contact' },
                { label: 'Framing', path: '/#/contact' },
              ].map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.path}
                    className="text-stone-500 hover:text-amber-400 text-sm transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-amber-500 transition-all duration-300"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-3">
            <h5 className="font-serif text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-6 tracking-wider">
              Visit Us
            </h5>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-500 text-xs">📍</span>
                </div>
                <div>
                  <p className="text-stone-300 font-medium">Gallery Location</p>
                  <p className="text-stone-500">DHA Phase 6, Lahore</p>
                  <p className="text-stone-500">Punjab, Pakistan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-500 text-xs">🕐</span>
                </div>
                <div>
                  <p className="text-stone-300 font-medium">Gallery Hours</p>
                  <p className="text-stone-500">Mon - Sat: 10AM - 7PM</p>
                  <p className="text-amber-500/70">Sun: By Appointment</p>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-stone-800/30">
                <a
                  href="/#/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 text-xs uppercase tracking-widest font-bold rounded-full transition-all duration-300 shadow-lg shadow-amber-900/20 hover:shadow-amber-800/30 w-full justify-center"
                >
                  Contact Us
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent"></div>
          <div className="w-2 h-2 rotate-45 bg-amber-500/30 border border-amber-500/50"></div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent"></div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-stone-600 text-xs tracking-wide">
            © 2024 <span className="text-amber-500/70">Muraqqa Gallery</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-stone-600 text-xs">
            <a href="/#/privacy-policy" className="hover:text-amber-400 transition-colors duration-300">Privacy Policy</a>
            <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
            <a href="/#/terms-of-service" className="hover:text-amber-400 transition-colors duration-300">Terms of Service</a>
            <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
            <a href="/#/contact" className="hover:text-amber-400 transition-colors duration-300">Shipping</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  console.log('App component rendering');
  const [lang, setLang] = useState<'EN' | 'UR'>('EN');
  const [currency, setCurrency] = useState<Currency>(Currency.PKR);

  // Currency Helpers
  const convertPrice = (pricePKR: number) => {
    const val = pricePKR * RATES[currency];
    return new Intl.NumberFormat(lang === 'EN' ? 'en-US' : 'ur-PK', {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  const rawConvert = (pricePKR: number) => pricePKR * RATES[currency];

  return (
    <AuthProvider>
      <GalleryProvider>
        <CartProvider>
          <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, rawConvert }}>
            <HashRouter>
              <Layout>
                <div className="bg-stone-950 min-h-screen text-stone-200 selection:bg-amber-900 selection:text-white flex flex-col font-sans">
                  <Navbar lang={lang} setLang={setLang} />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home lang={lang} />} />
                      <Route path="/gallery" element={<Gallery />} />
                      <Route path="/artists" element={<Artists />} />
                      <Route path="/artists/:id" element={<ArtistDetail />} />
                      <Route path="/exhibitions" element={<Exhibitions />} />
                      <Route path="/conversations" element={<Conversations />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/artwork/:id" element={<ArtworkDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/artist-confirmation" element={<ArtistConfirmation />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
                      <Route path="/artist-dashboard" element={<ProtectedRoute requiredRole="ARTIST"><ArtistDashboard /></ProtectedRoute>} />
                      <Route path="/artist/profile" element={<ProtectedRoute requiredRole="ARTIST"><ArtistProfile /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                      <Route path="/invoice/:id" element={<InvoiceView />} />
                    </Routes>
                  </main>
                  <Footer />
                  <AICurator />
                </div>
              </Layout>
            </HashRouter>
          </CurrencyContext.Provider>
        </CartProvider>
      </GalleryProvider>
    </AuthProvider>
  );
};

export default App;
