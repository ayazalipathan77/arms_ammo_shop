import React, { useState, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface PaintingProps {
    imageUrl: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    wallSide: 'left' | 'right';
    maxWidth?: number;
    maxHeight?: number;
    title?: string;
    onSelect?: (viewPosition: THREE.Vector3, lookAt: THREE.Vector3) => void;
}

const Painting: React.FC<PaintingProps> = ({
    imageUrl,
    position,
    rotation = [0, 0, 0],
    wallSide,
    maxWidth = 2.4,
    maxHeight = 1.8,
    title,
    onSelect,
}) => {
    const [hovered, setHovered] = useState(false);
    const texture = useTexture(imageUrl);
    const spotlightTarget = useRef<THREE.Object3D>(null!);

    // Calculate painting dimensions maintaining aspect ratio
    const dimensions = useMemo(() => {
        if (!texture.image) return { width: maxWidth, height: maxHeight };

        const img = texture.image as HTMLImageElement;
        const imgAspect = img.width / img.height;
        let w = maxWidth;
        let h = w / imgAspect;

        if (h > maxHeight) {
            h = maxHeight;
            w = h * imgAspect;
        }

        return { width: w, height: h };
    }, [texture, maxWidth, maxHeight]);

    const frameDepth = 0.06;
    const frameBorder = 0.08;
    const frameW = dimensions.width + frameBorder * 2;
    const frameH = dimensions.height + frameBorder * 2;

    // Calculate the viewing position: 2m in front of painting center, at eye height
    const handleClick = (e: any) => {
        e.stopPropagation();
        if (!onSelect) return;

        const viewDist = 2.2;
        const paintingCenter = new THREE.Vector3(...position);
        const lookAtPoint = new THREE.Vector3(paintingCenter.x, 1.7, paintingCenter.z);

        let viewPos: THREE.Vector3;
        if (wallSide === 'left') {
            // Painting on left wall — viewer stands to the right
            viewPos = new THREE.Vector3(paintingCenter.x + viewDist, 1.7, paintingCenter.z);
        } else {
            // Painting on right wall — viewer stands to the left
            viewPos = new THREE.Vector3(paintingCenter.x - viewDist, 1.7, paintingCenter.z);
        }

        onSelect(viewPos, lookAtPoint);
    };

    return (
        <group position={position} rotation={rotation}>
            {/* Frame - dark wood */}
            <mesh
                position={[0, 0, -frameDepth / 2]}
                castShadow
                onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                onClick={handleClick}
            >
                <boxGeometry args={[frameW, frameH, frameDepth]} />
                <meshStandardMaterial
                    color={hovered ? '#d4822a' : '#1a1410'}
                    roughness={0.4}
                    metalness={0.2}
                />
            </mesh>

            {/* Canvas / Image */}
            <mesh position={[0, 0, 0.005]}>
                <planeGeometry args={[dimensions.width, dimensions.height]} />
                <meshStandardMaterial
                    map={texture}
                    roughness={0.4}
                    metalness={0}
                    toneMapped={false}
                />
            </mesh>

            {/* Spotlight target (center of painting) */}
            <object3D ref={spotlightTarget} position={[0, 0, 0]} />

            {/* Primary spotlight — ceiling track light aimed at painting */}
            <spotLight
                position={[0, 2.8, 2]}
                target={spotlightTarget.current || undefined}
                angle={0.45}
                penumbra={0.6}
                intensity={hovered ? 8 : 5}
                distance={8}
                color="#fff5e6"
                castShadow
            />

            {/* Fill light — softer, from slightly different angle */}
            <pointLight
                position={[0, 1.5, 1.2]}
                intensity={hovered ? 1.5 : 0.8}
                distance={4}
                color="#ffeedd"
            />

            {/* Track light fixture (small visible cylinder above painting) */}
            <mesh position={[0, 2.2, 0.4]} rotation={[Math.PI / 6, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.06, 0.15, 8]} />
                <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Light head */}
            <mesh position={[0, 2.15, 0.55]} rotation={[Math.PI / 4, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.03, 0.1, 8]} />
                <meshStandardMaterial
                    color="#333333"
                    roughness={0.3}
                    metalness={0.8}
                    emissive="#fff5e6"
                    emissiveIntensity={hovered ? 0.5 : 0.2}
                />
            </mesh>

            {/* Label plaque */}
            {title && (
                <mesh position={[0, -(dimensions.height / 2 + frameBorder + 0.2), 0.01]}>
                    <planeGeometry args={[Math.min(dimensions.width, 1.2), 0.12]} />
                    <meshStandardMaterial
                        color="#d4822a"
                        roughness={0.3}
                        metalness={0.5}
                    />
                </mesh>
            )}
        </group>
    );
};

export default Painting;
