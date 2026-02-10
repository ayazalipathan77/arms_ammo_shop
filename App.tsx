import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Exhibitions } from './pages/Exhibitions';
import { ExhibitionDetail } from './pages/ExhibitionDetail';
import { Conversations } from './pages/Conversations';
import { Contact } from './pages/Contact';
import { Auth } from './pages/Auth';
import { ArtworkDetail } from './pages/ArtworkDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { ArtistDashboard } from './pages/ArtistDashboard';
import { ArtistProfile } from './pages/ArtistProfile';
import { Cart } from './pages/Cart';
import { UserProfile } from './pages/UserProfile';
import { Artists } from './pages/Artists';
import { ArtistDetail } from './pages/ArtistDetail';
import { Collections } from './pages/Collections';
import { Gallery } from './pages/Gallery';
import { InvoiceView } from './pages/InvoiceView';
import { SocialAuthCallback } from './pages/SocialAuthCallback';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { ArtistConfirmation } from './pages/ArtistConfirmation';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Wishlist } from './pages/Wishlist';
import { GiftCards } from './pages/GiftCards';
import { ThemeProvider } from './context/ThemeContext';
import { GalleryProvider } from './context/GalleryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'ARTIST' | 'USER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-tangerine text-sm uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <GalleryProvider>
            <ThemeProvider>
              <Routes>
                <Route element={<Layout />}>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/exhibitions" element={<Exhibitions />} />
                  <Route path="/exhibitions/:id" element={<ExhibitionDetail />} />
                  <Route path="/stories" element={<Conversations />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/social-callback" element={<SocialAuthCallback />} />
                  <Route path="/artwork/:id" element={<ArtworkDetail />} />
                  <Route path="/artists" element={<Artists />} />
                  <Route path="/artists/:id" element={<ArtistDetail />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/artist-confirmation" element={<ArtistConfirmation />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/gift-cards" element={<GiftCards />} />

                  {/* Protected routes */}
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/invoice/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/artist-dashboard" element={<ProtectedRoute requiredRole="ARTIST"><ArtistDashboard /></ProtectedRoute>} />
                  <Route path="/artist/profile" element={<ProtectedRoute requiredRole="ARTIST"><ArtistProfile /></ProtectedRoute>} />
                </Route>
              </Routes>
            </ThemeProvider>
          </GalleryProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
