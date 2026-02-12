import React from 'react';
import * as THREE from 'three';

interface GalleryRoomProps {
    length: number; // Z-axis length of the room
    width?: number;
    height?: number;
}

const GalleryRoom: React.FC<GalleryRoomProps> = ({ length, width = 10, height = 5 }) => {
    const wallColor = '#1c1c1c';
    const ceilingColor = '#141414';
    const floorColor = '#2a1f1a';
    const accentColor = '#d4822a'; // tangerine

    // Generate ceiling light panel positions
    const panelSpacing = 3.5;
    const panelCount = Math.ceil(length / panelSpacing);

    return (
        <group>
            {/* Floor - dark polished wood */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -length / 2]} receiveShadow>
                <planeGeometry args={[width, length]} />
                <meshStandardMaterial color={floorColor} roughness={0.35} metalness={0.15} />
            </mesh>

            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, -length / 2]}>
                <planeGeometry args={[width, length]} />
                <meshStandardMaterial color={ceilingColor} roughness={0.9} />
            </mesh>

            {/* Left Wall */}
            <mesh position={[-width / 2, height / 2, -length / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[length, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.7} />
            </mesh>

            {/* Right Wall */}
            <mesh position={[width / 2, height / 2, -length / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[length, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.7} />
            </mesh>

            {/* Back Wall (far end) */}
            <mesh position={[0, height / 2, -length]} receiveShadow>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.7} />
            </mesh>

            {/* Front Wall (behind start) */}
            <mesh position={[0, height / 2, 0]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.7} />
            </mesh>

            {/* Baseboard trim - left */}
            <mesh position={[-width / 2 + 0.01, 0.1, -length / 2]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.2]} />
                <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.4} />
            </mesh>

            {/* Baseboard trim - right */}
            <mesh position={[width / 2 - 0.01, 0.1, -length / 2]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.2]} />
                <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.4} />
            </mesh>

            {/* ─── MODERN CEILING LIGHT PANELS ─── */}
            {Array.from({ length: panelCount }).map((_, i) => {
                const z = -(i * panelSpacing + panelSpacing / 2);
                return (
                    <group key={`panel-${i}`} position={[0, height - 0.01, z]}>
                        {/* Main light panel - recessed rectangular */}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[3.5, 0.6]} />
                            <meshStandardMaterial
                                color="#ffffff"
                                emissive="#ffffff"
                                emissiveIntensity={3}
                                toneMapped={false}
                            />
                        </mesh>

                        {/* Panel border / bezel */}
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
                            <planeGeometry args={[3.7, 0.8]} />
                            <meshStandardMaterial color="#222222" roughness={0.2} metalness={0.8} />
                        </mesh>

                        {/* Actual light source */}
                        <rectAreaLight
                            width={3.5}
                            height={0.6}
                            intensity={4}
                            color="#fff5e6"
                            rotation={[Math.PI / 2, 0, 0]}
                            position={[0, -0.02, 0]}
                        />

                        {/* Secondary accent strip lights on sides */}
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-width / 2 + 0.5, -0.001, 0]}>
                            <planeGeometry args={[0.15, 0.4]} />
                            <meshStandardMaterial
                                color={accentColor}
                                emissive={accentColor}
                                emissiveIntensity={0.8}
                            />
                        </mesh>
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[width / 2 - 0.5, -0.001, 0]}>
                            <planeGeometry args={[0.15, 0.4]} />
                            <meshStandardMaterial
                                color={accentColor}
                                emissive={accentColor}
                                emissiveIntensity={0.8}
                            />
                        </mesh>
                    </group>
                );
            })}

            {/* Ceiling track rail - left (for painting spotlights) */}
            <mesh position={[-width / 2 + 1.2, height - 0.08, -length / 2]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[length, 0.03, 0.08]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.9} />
            </mesh>

            {/* Ceiling track rail - right */}
            <mesh position={[width / 2 - 1.2, height - 0.08, -length / 2]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[length, 0.03, 0.08]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.9} />
            </mesh>

            {/* Ambient fill light - warmer and brighter */}
            <ambientLight intensity={0.35} color="#ffeedd" />

            {/* Hemisphere light for natural feel */}
            <hemisphereLight
                color="#fff5e6"
                groundColor="#1a1410"
                intensity={0.3}
            />
        </group>
    );
};

export default GalleryRoom;
