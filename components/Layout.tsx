import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './ui/Navbar';
import ParticleSystem from './features/ParticleSystem';
import ChromaticClock from './features/ChromaticClock';

const Layout: React.FC = () => {
    return (
        <div className="relative min-h-screen bg-void text-pearl selection:bg-tangerine selection:text-void font-body overflow-x-hidden transition-colors duration-500 high-contrast:bg-[#F5F5DC] high-contrast:text-black">
            {/* Background Elements */}
            <ParticleSystem />

            {/* Navigation */}
            <Navbar />

            {/* Page Content */}
            <main>
                <Outlet />
            </main>

            {/* Footer / Clock */}
            <ChromaticClock />
        </div>
    );
};

export default Layout;
