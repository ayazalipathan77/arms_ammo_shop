import React, { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { X, Move, Mouse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import GalleryRoom from './GalleryRoom';
import Painting from './Painting';
import PlayerControls from './PlayerControls';

interface VirtualTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    title: string;
}

const VirtualTourModal: React.FC<VirtualTourModalProps> = ({ isOpen, onClose, images, title }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [selectedPainting, setSelectedPainting] = useState<number | null>(null);
    const [walkToTarget, setWalkToTarget] = useState<{ position: THREE.Vector3; lookAt: THREE.Vector3 } | null>(null);

    // Calculate room dimensions based on image count
    const layout = useMemo(() => {
        const count = images.length;
        const paintingsPerSide = Math.ceil(count / 2);
        const spacing = 4; // meters between paintings
        const roomLength = Math.max(paintingsPerSide * spacing + 4, 16);
        const roomWidth = 10;
        const roomHeight = 5;
        const paintingY = 2.2; // Center height of paintings

        // Distribute paintings on left and right walls
        const paintings: Array<{
            url: string;
            position: [number, number, number];
            rotation: [number, number, number];
            wallSide: 'left' | 'right';
            index: number;
        }> = [];

        images.forEach((url, idx) => {
            const side = idx % 2 === 0 ? 'left' : 'right';
            const sideIdx = Math.floor(idx / 2);
            const z = -(sideIdx * spacing + spacing); // Start offset from entrance

            if (side === 'left') {
                paintings.push({
                    url,
                    position: [-roomWidth / 2 + 0.05, paintingY, z],
                    rotation: [0, Math.PI / 2, 0],
                    wallSide: 'left',
                    index: idx,
                });
            } else {
                paintings.push({
                    url,
                    position: [roomWidth / 2 - 0.05, paintingY, z],
                    rotation: [0, -Math.PI / 2, 0],
                    wallSide: 'right',
                    index: idx,
                });
            }
        });

        return { roomLength, roomWidth, roomHeight, paintings };
    }, [images]);

    const handlePaintingSelect = (idx: number, viewPosition: THREE.Vector3, lookAt: THREE.Vector3) => {
        setSelectedPainting(idx);
        setWalkToTarget({ position: viewPosition, lookAt });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-void"
            >
                {/* 3D Canvas */}
                <Canvas
                    shadows
                    camera={{ fov: 70, near: 0.1, far: 100 }}
                    style={{ width: '100vw', height: '100vh' }}
                    onPointerMissed={() => { setSelectedPainting(null); setWalkToTarget(null); }}
                >
                    <Suspense fallback={null}>
                        <fog attach="fog" args={['#0a0a0a', 0, layout.roomLength + 5]} />

                        <GalleryRoom
                            length={layout.roomLength}
                            width={layout.roomWidth}
                            height={layout.roomHeight}
                        />

                        {layout.paintings.map((p) => (
                            <Painting
                                key={p.index}
                                imageUrl={p.url}
                                position={p.position}
                                rotation={p.rotation}
                                wallSide={p.wallSide}
                                onSelect={(viewPos, lookAt) => handlePaintingSelect(p.index, viewPos, lookAt)}
                                title={`Artwork ${p.index + 1}`}
                            />
                        ))}

                        <PlayerControls
                            roomWidth={layout.roomWidth}
                            roomLength={layout.roomLength}
                            walkToTarget={walkToTarget}
                            onWalkComplete={() => setWalkToTarget(null)}
                            onLockChange={(locked) => {
                                setIsLocked(locked);
                                if (locked) setShowInstructions(false);
                            }}
                        />
                    </Suspense>
                </Canvas>

                {/* HUD Overlay - always visible */}
                <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="pointer-events-auto">
                            <h2 className="text-pearl font-display text-lg uppercase tracking-widest">{title}</h2>
                            <p className="text-warm-gray/50 text-[10px] font-mono uppercase tracking-widest">Virtual Gallery Tour · {images.length} artworks</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="pointer-events-auto p-2 bg-void/80 backdrop-blur-sm border border-pearl/20 text-pearl hover:text-tangerine hover:border-tangerine transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Crosshair when locked */}
                {isLocked && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <div className="w-6 h-6 relative">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-tangerine/50" />
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-tangerine/50" />
                        </div>
                    </div>
                )}

                {/* Movement hint when locked */}
                {isLocked && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                        <div className="flex items-center gap-4 text-warm-gray/30 text-[10px] font-mono uppercase tracking-widest">
                            <span>WASD to move</span>
                            <span>·</span>
                            <span>Mouse to look</span>
                            <span>·</span>
                            <span>Click paintings to inspect</span>
                            <span>·</span>
                            <span>ESC to unlock</span>
                        </div>
                    </div>
                )}

                {/* Click to start instruction overlay */}
                {!isLocked && showInstructions && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-void/70 backdrop-blur-sm pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center max-w-md px-8"
                        >
                            <div className="mb-8">
                                <div className="w-16 h-16 mx-auto border-2 border-tangerine flex items-center justify-center mb-6">
                                    <Move size={28} className="text-tangerine" />
                                </div>
                                <h3 className="text-pearl text-2xl font-display uppercase tracking-wider mb-3">Virtual Gallery Tour</h3>
                                <p className="text-warm-gray text-sm mb-8">Walk through a 3D gallery space featuring {images.length} artworks from this exhibition.</p>
                            </div>

                            {/* Controls guide */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-charcoal/50 border border-pearl/10 p-4">
                                    <Mouse size={20} className="text-tangerine mx-auto mb-2" />
                                    <p className="text-pearl text-xs font-mono uppercase">Mouse</p>
                                    <p className="text-warm-gray/60 text-[10px]">Look around</p>
                                </div>
                                <div className="bg-charcoal/50 border border-pearl/10 p-4">
                                    <div className="flex justify-center gap-1 mb-2">
                                        <div className="w-6 h-6 bg-charcoal border border-pearl/20 flex items-center justify-center text-[10px] text-pearl font-mono">W</div>
                                        <div className="w-6 h-6 bg-charcoal border border-pearl/20 flex items-center justify-center text-[10px] text-pearl font-mono">A</div>
                                        <div className="w-6 h-6 bg-charcoal border border-pearl/20 flex items-center justify-center text-[10px] text-pearl font-mono">S</div>
                                        <div className="w-6 h-6 bg-charcoal border border-pearl/20 flex items-center justify-center text-[10px] text-pearl font-mono">D</div>
                                    </div>
                                    <p className="text-pearl text-xs font-mono uppercase">WASD</p>
                                    <p className="text-warm-gray/60 text-[10px]">Move around</p>
                                </div>
                            </div>

                            <p className="text-tangerine text-sm font-mono uppercase tracking-widest animate-pulse pointer-events-auto cursor-pointer"
                                onClick={() => {
                                    // Trigger pointer lock by clicking the canvas
                                    const canvas = document.querySelector('canvas');
                                    canvas?.click();
                                }}
                            >
                                Click anywhere to start
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Unlock overlay - shows when user presses ESC */}
                {!isLocked && !showInstructions && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-void/50 backdrop-blur-sm">
                        <div className="text-center">
                            <p className="text-pearl text-lg font-display uppercase tracking-widest mb-2">Paused</p>
                            <p className="text-warm-gray text-sm mb-6">Click to resume walking · Press ESC again or close button to exit</p>
                            <button
                                onClick={onClose}
                                className="border border-tangerine text-tangerine px-6 py-2 text-xs uppercase tracking-widest font-bold hover:bg-tangerine hover:text-void transition-colors"
                            >
                                Exit Tour
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected painting overlay */}
                <AnimatePresence>
                    {selectedPainting !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-void/90 backdrop-blur-md border border-tangerine/30 px-6 py-4 pointer-events-none"
                        >
                            <p className="text-tangerine text-xs font-mono uppercase tracking-widest">Artwork {selectedPainting + 1} of {images.length}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default VirtualTourModal;
