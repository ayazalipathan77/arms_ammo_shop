import React from 'react';
import * as THREE from 'three';

interface GalleryRoomProps {
    length: number; // Z-axis length of the room
    width?: number;
    height?: number;
}

const GalleryRoom: React.FC<GalleryRoomProps> = ({ length, width = 10, height = 5 }) => {
    const wallColor = '#ffffff'; // Marble white
    const ceilingColor = '#f8f8f8'; // Light ceiling
    const floorColor = '#e8e8e8'; // Light polished floor
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
                        {/* Main light panel - recessed rectangular with modern frame */}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[3.5, 0.6]} />
                            <meshStandardMaterial
                                color="#ffffff"
                                emissive="#ffffff"
                                emissiveIntensity={3}
                                toneMapped={false}
                            />
                        </mesh>

                        {/* Modern brushed aluminum frame */}
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
                            <planeGeometry args={[3.7, 0.8]} />
                            <meshStandardMaterial
                                color="#333333"
                                roughness={0.1}
                                metalness={0.9}
                                emissive="#444444"
                                emissiveIntensity={0.1}
                            />
                        </mesh>

                        {/* Actual light source with soft diffusion */}
                        <rectAreaLight
                            width={3.5}
                            height={0.6}
                            intensity={6}
                            color="#ffffff"
                            rotation={[Math.PI / 2, 0, 0]}
                            position={[0, -0.02, 0]}
                        />

                        {/* Secondary accent strip lights on sides - modern LED strips */}
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-width / 2 + 0.5, -0.001, 0]}>
                            <planeGeometry args={[0.15, 0.4]} />
                            <meshStandardMaterial
                                color="#ffffff"
                                emissive="#ffffff"
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[width / 2 - 0.5, -0.001, 0]}>
                            <planeGeometry args={[0.15, 0.4]} />
                            <meshStandardMaterial
                                color="#ffffff"
                                emissive="#ffffff"
                                emissiveIntensity={0.5}
                            />
                        </mesh>

                        {/* Wall washing lights - subtle uplighting on walls */}
                        <spotLight
                            position={[-width / 2 + 0.1, height - 0.5, 0]}
                            angle={Math.PI / 3}
                            penumbra={0.8}
                            intensity={2}
                            color="#ffffff"
                            distance={10}
                            castShadow={false}
                        />
                        <spotLight
                            position={[width / 2 - 0.1, height - 0.5, 0]}
                            angle={Math.PI / 3}
                            penumbra={0.8}
                            intensity={2}
                            color="#ffffff"
                            distance={10}
                            castShadow={false}
                        />
                    </group>
                );
            })}

            {/* Additional ambient lighting for modern gallery feel */}
            <ambientLight intensity={0.5} color="#ffffff" />

            {/* Soft edge lighting along ceiling perimeter */}
            {Array.from({ length: Math.ceil(width / 2) }).map((_, i) => (
                <group key={`edge-light-${i}`}>
                    <rectAreaLight
                        width={1.5}
                        height={0.1}
                        intensity={2}
                        color="#ffffff"
                        rotation={[Math.PI / 2, 0, 0]}
                        position={[-width / 2 + 1 + i * 2, height - 0.1, -length / 2]}
                    />
                    <rectAreaLight
                        width={1.5}
                        height={0.1}
                        intensity={2}
                        color="#ffffff"
                        rotation={[Math.PI / 2, 0, 0]}
                        position={[width / 2 - 1 - i * 2, height - 0.1, -length / 2]}
                    />
                </group>
            ))}

            {/* Ceiling track rail - left (for painting spotlights) - modern white */}
            <mesh position={[-width / 2 + 1.2, height - 0.08, -length / 2]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[length, 0.03, 0.08]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Ceiling track rail - right - modern white */}
            <mesh position={[width / 2 - 1.2, height - 0.08, -length / 2]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[length, 0.03, 0.08]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Modern white ambient lighting */}
            <ambientLight intensity={0.6} color="#ffffff" />

            {/* Soft white hemisphere light for natural feel */}
            <hemisphereLight
                color="#ffffff"
                groundColor="#f0f0f0"
                intensity={0.4}
            />
        </group>
    );
};

export default GalleryRoom;
