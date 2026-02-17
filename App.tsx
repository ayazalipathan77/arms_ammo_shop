import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Showcases } from './pages/Showcases';
import { ShowcaseDetail } from './pages/ShowcaseDetail';
import { Conversations } from './pages/Conversations';
import { Contact } from './pages/Contact';
import { Auth } from './pages/Auth';
import { ProductDetail } from './pages/ProductDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { BrandDashboard } from './pages/BrandDashboard';
import { BrandProfile } from './pages/BrandProfile';
import { Cart } from './pages/Cart';
import { UserProfile } from './pages/UserProfile';
import { Brands } from './pages/Brands';
import { BrandDetail } from './pages/BrandDetail';
import { Collections } from './pages/Collections';
import { Shop } from './pages/Shop';
import { Showroom } from './pages/Showroom';
import { InvoiceView } from './pages/InvoiceView';
import { SocialAuthCallback } from './pages/SocialAuthCallback';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { BrandConfirmation } from './pages/BrandConfirmation';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Wishlist } from './pages/Wishlist';
import { GiftCards } from './pages/GiftCards';
import { ThemeProvider } from './context/ThemeContext';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'MANUFACTURER' | 'USER';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-safety text-sm uppercase tracking-widest animate-pulse">Loading...</div>
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
          <ShopProvider>
            <ThemeProvider>
              <Routes>
                <Route element={<Layout />}>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/collections/:id" element={<ShowcaseDetail />} />
                  <Route path="/journal" element={<Conversations />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/social-callback" element={<SocialAuthCallback />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/brands/:id" element={<BrandDetail />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/showroom" element={<Showroom />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/brand-confirmation" element={<BrandConfirmation />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/gift-cards" element={<GiftCards />} />

                  {/* Protected routes */}
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/invoice/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/brand-dashboard" element={<ProtectedRoute requiredRole="MANUFACTURER"><BrandDashboard /></ProtectedRoute>} />
                  <Route path="/brand/profile" element={<ProtectedRoute requiredRole="MANUFACTURER"><BrandProfile /></ProtectedRoute>} />
                </Route>
              </Routes>
            </ThemeProvider>
          </ShopProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
