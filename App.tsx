import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Exhibitions } from './pages/Exhibitions';
import { Conversations } from './pages/Conversations';
import { Contact } from './pages/Contact';
import { Auth } from './pages/Auth';
import { ArtworkDetail } from './pages/ArtworkDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { Cart } from './pages/Cart';
import { UserProfile } from './pages/UserProfile';
import { Artists } from './pages/Artists';
import { ArtistDetail } from './pages/ArtistDetail';
import { ThemeProvider } from './context/ThemeContext';
import { GalleryProvider } from './context/GalleryContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <GalleryProvider>
          <ThemeProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/exhibitions" element={<Exhibitions />} />
                <Route path="/stories" element={<Conversations />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/artwork/:id" element={<ArtworkDetail />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/artists/:id" element={<ArtistDetail />} />
              </Route>
            </Routes>
          </ThemeProvider>
        </GalleryProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
