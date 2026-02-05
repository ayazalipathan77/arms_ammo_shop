import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Dust = (props: any) => {
    const ref = useRef<any>();

    // Create particles
    const [positions, colors] = useMemo(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            // Random positions in a sphere
            const r = Math.cbrt(Math.random()) * 15; // Radius
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Colors - mostly sand/dust/void, occasional ember
            if (Math.random() > 0.95) {
                // Ember
                color.set("#FF6B35"); // Tangerine
            } else {
                // Sand/Dust
                color.set("#9A9A9A").lerp(new THREE.Color("#0A0A0A"), Math.random());
            }
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        return [positions, colors];
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 15;
            ref.current.rotation.y -= delta / 20;

            // Mouse interaction (subtle)
            const mouse = state.mouse;
            ref.current.rotation.x += (mouse.y * 0.05 - ref.current.rotation.x) * 0.05;
            ref.current.rotation.y += (mouse.x * 0.05 - ref.current.rotation.y) * 0.05;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    vertexColors
                    size={0.03}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
};

const ParticleSystem = () => {
    return (
        <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-60">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <Dust />
            </Canvas>
        </div>
    );
};

export default ParticleSystem;
