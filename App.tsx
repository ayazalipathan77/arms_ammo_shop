import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Exhibitions } from './pages/Exhibitions';
import { Conversations } from './pages/Conversations';
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
              </Route>
            </Routes>
          </ThemeProvider>
        </GalleryProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
