import React, { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

interface WalkToTarget {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
}

interface PlayerControlsProps {
    speed?: number;
    roomWidth?: number;
    roomLength?: number;
    onLockChange?: (locked: boolean) => void;
    walkToTarget?: WalkToTarget | null;
    onWalkComplete?: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
    speed = 4,
    roomWidth = 10,
    roomLength = 30,
    onLockChange,
    walkToTarget = null,
    onWalkComplete,
}) => {
    const controlsRef = useRef<any>(null);
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const keys = useRef<Record<string, boolean>>({});
    const { camera } = useThree();

    // Walk-to animation state
    const isAnimating = useRef(false);
    const animProgress = useRef(0);
    const animStartPos = useRef(new THREE.Vector3());
    const animStartLookDir = useRef(new THREE.Vector3());
    const animTargetPos = useRef(new THREE.Vector3());
    const animTargetLookDir = useRef(new THREE.Vector3());

    // Set initial camera position
    useEffect(() => {
        camera.position.set(0, 1.7, -2); // Eye height, near entrance
        camera.lookAt(0, 1.7, -10);
    }, [camera]);

    // Start walk-to animation when target changes
    useEffect(() => {
        if (!walkToTarget) return;

        isAnimating.current = true;
        animProgress.current = 0;

        // Store start position
        animStartPos.current.copy(camera.position);

        // Store current look direction
        const currentLookDir = new THREE.Vector3();
        camera.getWorldDirection(currentLookDir);
        animStartLookDir.current.copy(currentLookDir);

        // Store target position and look direction
        animTargetPos.current.copy(walkToTarget.position);
        const targetLookDir = new THREE.Vector3()
            .subVectors(walkToTarget.lookAt, walkToTarget.position)
            .normalize();
        animTargetLookDir.current.copy(targetLookDir);

        // Kill any current velocity
        velocity.current.set(0, 0, 0);
    }, [walkToTarget, camera]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        keys.current[e.code] = true;
        // Cancel walk animation on any movement key
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            if (isAnimating.current) {
                isAnimating.current = false;
                onWalkComplete?.();
            }
        }
    }, [onWalkComplete]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        keys.current[e.code] = false;
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Notify parent about lock state
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls || !onLockChange) return;

        const handleLock = () => onLockChange(true);
        const handleUnlock = () => onLockChange(false);

        controls.addEventListener('lock', handleLock);
        controls.addEventListener('unlock', handleUnlock);

        return () => {
            controls.removeEventListener('lock', handleLock);
            controls.removeEventListener('unlock', handleUnlock);
        };
    }, [onLockChange]);

    useFrame((_, delta) => {
        if (!controlsRef.current?.isLocked) return;

        // ─── Walk-to animation ───
        if (isAnimating.current) {
            // Smooth easing: ease-in-out cubic
            animProgress.current = Math.min(animProgress.current + delta * 0.8, 1);
            const t = animProgress.current;
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            // Lerp position
            camera.position.lerpVectors(animStartPos.current, animTargetPos.current, ease);
            camera.position.y = 1.7;

            // Slerp look direction using quaternions for smooth rotation
            const startQuat = new THREE.Quaternion();
            const endQuat = new THREE.Quaternion();

            const lookMatrix = new THREE.Matrix4();
            lookMatrix.lookAt(
                new THREE.Vector3(0, 0, 0),
                animStartLookDir.current,
                new THREE.Vector3(0, 1, 0)
            );
            startQuat.setFromRotationMatrix(lookMatrix);

            lookMatrix.lookAt(
                new THREE.Vector3(0, 0, 0),
                animTargetLookDir.current,
                new THREE.Vector3(0, 1, 0)
            );
            endQuat.setFromRotationMatrix(lookMatrix);

            const currentQuat = new THREE.Quaternion();
            currentQuat.slerpQuaternions(startQuat, endQuat, ease);
            camera.quaternion.copy(currentQuat);

            // Animation complete
            if (animProgress.current >= 1) {
                isAnimating.current = false;
                onWalkComplete?.();
            }
            return; // Skip manual movement during animation
        }

        // ─── Manual WASD movement ───
        const k = keys.current;
        const moveForward = (k['KeyW'] || k['ArrowUp']) ? 1 : 0;
        const moveBackward = (k['KeyS'] || k['ArrowDown']) ? 1 : 0;
        const moveLeft = (k['KeyA'] || k['ArrowLeft']) ? 1 : 0;
        const moveRight = (k['KeyD'] || k['ArrowRight']) ? 1 : 0;

        // Deceleration
        velocity.current.x -= velocity.current.x * 10.0 * delta;
        velocity.current.z -= velocity.current.z * 10.0 * delta;

        direction.current.z = moveForward - moveBackward;
        direction.current.x = moveRight - moveLeft;
        direction.current.normalize();

        velocity.current.z -= direction.current.z * speed * delta * 20;
        velocity.current.x += direction.current.x * speed * delta * 20;

        controlsRef.current.moveRight(velocity.current.x * delta);
        controlsRef.current.moveForward(-velocity.current.z * delta);

        // Clamp position within room bounds (with padding)
        const pad = 0.8;
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -roomWidth / 2 + pad, roomWidth / 2 - pad);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -roomLength + pad, -pad);
        camera.position.y = 1.7; // Lock to eye height
    });

    return <PointerLockControls ref={controlsRef} />;
};

export default PlayerControls;
