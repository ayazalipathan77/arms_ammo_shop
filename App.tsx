import React, { useEffect, useState } from 'react';
import Navbar from './components/ui/Navbar';
import ParticleSystem from './components/features/ParticleSystem';
import ChromaticClock from './components/features/ChromaticClock';
import Hero from './components/features/Hero';
import ArtworkCard from './components/ui/ArtworkCard';
import Button from './components/ui/Button';
import { artworkApi, transformArtwork } from './services/api';
import { Artwork } from './types';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await artworkApi.getAll({ limit: 9 });
        const transformed = response.artworks.map(transformArtwork);
        setArtworks(transformed);
      } catch (error) {
        console.error("Failed to fetch artworks:", error);
        // Fallback or empty state could be handled here
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  return (
    <div className="relative min-h-screen bg-void text-pearl selection:bg-tangerine selection:text-void font-body overflow-x-hidden transition-colors duration-500 high-contrast:bg-[#F5F5DC] high-contrast:text-black">
      {/* Background Elements */}
      <ParticleSystem />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Gallery Section */}
      <section className="py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-[1920px] mx-auto">
          <div className="mb-20 border-b border-white/10 pb-8 flex justify-between items-end high-contrast:border-black/20">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-pearl high-contrast:text-black">
              LATEST <span className="text-tangerine high-contrast:text-[#D35400]">Works</span>
            </h2>
            <div className="hidden md:block">
              <Button variant="outline">VIEW ARCHIVE</Button>
            </div>
          </div>

          {/* Masonry Grid */}
          {loading ? (
            <div className="text-center py-20 text-warm-gray">Loading Gallery...</div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {artworks.map((art) => (
                <div key={art.id} className="break-inside-avoid">
                  <ArtworkCard artwork={art} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 flex justify-center md:hidden">
            <Button variant="primary">VIEW ARCHIVE</Button>
          </div>
        </div>
      </section>

      {/* Footer / Clock */}
      <ChromaticClock />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
