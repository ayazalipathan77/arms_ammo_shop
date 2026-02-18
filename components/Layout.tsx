import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './ui/Navbar';
import Footer from './ui/Footer';
import ParticleSystem from './features/ParticleSystem';

const Layout: React.FC = () => {
    return (
        <div className="relative min-h-screen bg-transparent text-pearl selection:bg-sulphur selection:text-void font-body overflow-x-hidden transition-colors duration-500 high-contrast:bg-[#F5F5DC] high-contrast:text-black">
            {/* Background Elements */}
            <ParticleSystem />

            {/* Navigation */}
            <Navbar />

            {/* Page Content */}
            <main>
                <Outlet />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Layout;
