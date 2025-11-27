import React, { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Sphere, Torus } from '@react-three/drei';
import './HolographicMaterial'; // Register the shader
import Particles from './Particles';

export default function HologramCore() {
    const coreRef = useRef();
    const ring1Ref = useRef();
    const ring2Ref = useRef();
    const ring3Ref = useRef();

    useFrame((state, delta) => {
        if (coreRef.current) {
            coreRef.current.rotation.y += delta * 0.5;
            // Update shader time
            if (coreRef.current.material.uniforms) {
                coreRef.current.material.uniforms.time.value = state.clock.elapsedTime;
            }
        }
        if (ring1Ref.current) {
            ring1Ref.current.rotation.x += delta * 0.2;
            ring1Ref.current.rotation.y += delta * 0.3;
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.x -= delta * 0.3;
            ring2Ref.current.rotation.z += delta * 0.1;
        }
        if (ring3Ref.current) {
            ring3Ref.current.rotation.y -= delta * 0.4;
            ring3Ref.current.rotation.x += delta * 0.2;
        }
    });

    return (
        <group>
            {/* Central Core */}
            <Sphere ref={coreRef} args={[1, 64, 64]}>
                {/* @ts-ignore */}
                <holographicMaterial color="#00f3ff" transparent side={2} />
            </Sphere>

            {/* Particles */}
            <Particles />

            {/* Inner Ring */}
            <Torus ref={ring1Ref} args={[1.5, 0.05, 16, 100]}>
                <meshStandardMaterial color="#001eff" emissive="#001eff" emissiveIntensity={1.5} />
            </Torus>

            {/* Middle Ring */}
            <Torus ref={ring2Ref} args={[2, 0.03, 16, 100]}>
                <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={1} />
            </Torus>

            {/* Outer Ring */}
            <Torus ref={ring3Ref} args={[2.5, 0.08, 16, 100]}>
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} wireframe />
            </Torus>

            {/* Glow Effect (Simulated with point light for now, Bloom will enhance this) */}
            <pointLight color="#00f3ff" intensity={2} distance={10} />
        </group>
    );
}
