import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const HeroArtwork3D = () => {
    // Placeholder 3D Cube with artwork texture
    // In real implementation, this would be a plane or a more complex model

    return (
        <Canvas className="w-full h-full">
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <mesh rotation={[0, Math.PI / 4, 0]}>
                    <boxGeometry args={[3, 4, 0.2]} />
                    <meshStandardMaterial color="#1a1a1a" />
                    {/* Front face with artwork placeholder color/texture */}
                    <meshStandardMaterial attach="material-4" color="#FF6B35" roughness={0.4} />
                </mesh>
            </Float>
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
    );
};

const Hero = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -100]);

    return (
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-void">
            {/* Massive Typography Background */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                style={{ y: y1, opacity: 0.15 }}
            >
                <h1 className="text-[30vw] font-display font-bold text-transparent text-stroke leading-none whitespace-nowrap">
                    BANDAH ALI
                </h1>
            </motion.div>

            <motion.div
                className="absolute bottom-20 right-10 text-right z-10 hidden md:block"
                style={{ y: y2 }}
            >
                <p className="text-sm font-mono tracking-[0.2em] text-warm-gray">
                    SELF-TAUGHT CHROMATIC<br />ARCHAEOLOGIST
                </p>
            </motion.div>

            {/* 3D Artwork Centerpiece */}
            <div className="relative w-full max-w-md aspect-[3/4] z-10 md:max-w-xl">
                <HeroArtwork3D />
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20">
                <span className="text-xs font-mono tracking-widest text-warm-gray">SCROLL</span>
                <div className="w-[1px] h-20 bg-warm-gray/20 relative overflow-hidden">
                    <motion.div
                        className="absolute top-0 w-full bg-tangerine"
                        style={{ height: '50%' }}
                        animate={{ top: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>
            </div>
        </section>
    );
};

export default Hero;
