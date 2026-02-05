import React from 'react';
import Navbar from '../components/ui/Navbar';
import ParticleSystem from '../components/features/ParticleSystem';
import ChromaticClock from '../components/features/ChromaticClock';
import Hero from '../components/features/Hero';
import ArtworkCard, { Artwork } from '../components/ui/ArtworkCard';
import Button from '../components/ui/Button';

// Mock Data
const MOCK_ARTWORKS: Artwork[] = [
  { id: '1', title: 'The Thari Women', artist: 'Bandah Ali', year: '2023', image: 'https://images.unsplash.com/photo-1549887552-93f954d1d960?q=80&w=800&auto=format&fit=crop' },
  { id: '2', title: 'Desert Rhythms', artist: 'Bandah Ali', year: '2022', image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop' },
  { id: '3', title: 'Colors of Life', artist: 'Bandah Ali', year: '2024', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=800&auto=format&fit=crop' },
  { id: '4', title: 'Eternal Sands', artist: 'Bandah Ali', year: '2021', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop' },
];

function App() {
  return (
    <div className="relative min-h-screen bg-void text-pearl selection:bg-tangerine selection:text-void font-body overflow-x-hidden">
      {/* Background Elements */}
      <ParticleSystem />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Gallery Section */}
      <section className="py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-[1920px] mx-auto">
          <div className="mb-20 border-b border-white/10 pb-8 flex justify-between items-end">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-pearl">
              LATEST <span className="text-tangerine">Works</span>
            </h2>
            <div className="hidden md:block">
              <Button variant="outline">VIEW ARCHIVE</Button>
            </div>
          </div>

          {/* Masonry Grid (Simplified with CSS columns for now) */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {MOCK_ARTWORKS.map((art) => (
              <div key={art.id} className="break-inside-avoid">
                <ArtworkCard artwork={art} />
              </div>
            ))}
          </div>

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

export default App;
