
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
    <footer className="bg-stone-950 border-t border-stone-900 py-12 px-4 text-center">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-left">
        <div>
          <h4 className="font-serif text-xl text-amber-500 mb-4">MURAQQA</h4>
          <p className="text-stone-500 text-sm">Elevating Pakistani Art to the global stage.</p>
        </div>
        <div>
          <h4 className="font-serif text-white mb-4">Explore</h4>
          <ul className="text-stone-500 text-sm space-y-2">
            <li>Authenticity</li>
            <li>Virtual Tours</li>
            <li>Artists</li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-white mb-4">Contact</h4>
          <p className="text-stone-500 text-sm">Lahore • Karachi • Islamabad • London</p>
          <p className="text-stone-500 text-sm mb-4">support@muraqqa.art</p>
          <div className="flex gap-4">
            {siteContent.socialLinks.instagram && <a href={siteContent.socialLinks.instagram} className="text-stone-600 hover:text-white text-xs uppercase">Instagram</a>}
            {siteContent.socialLinks.facebook && <a href={siteContent.socialLinks.facebook} className="text-stone-600 hover:text-white text-xs uppercase">Facebook</a>}
          </div>
        </div>
      </div>
      <p className="text-stone-700 text-xs mt-8 border-t border-stone-900 pt-8">© 2024 Muraqqa Gallery. All rights reserved.</p>
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
                      <Route path="/artwork/:id" element={<ArtworkDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/auth" element={<Auth />} />
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
