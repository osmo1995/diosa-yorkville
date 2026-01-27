import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function useIsLowPowerDevice() {
  if (typeof navigator === 'undefined') return false;
  const cores = (navigator as any).hardwareConcurrency || 4;
  const mem = (navigator as any).deviceMemory || 4;
  return cores <= 4 || mem <= 4;
}

function GoldenParticles({ count = 1400 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // A soft "halo" volume
      const r = Math.pow(Math.random(), 0.35) * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) * 0.7;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = t * 0.07;
    pointsRef.current.rotation.x = t * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        sizeAttenuation
        color={new THREE.Color('#C9A861')}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

function SoftRibbons() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!meshRef.current) return;
    meshRef.current.rotation.z = t * 0.05;
    meshRef.current.rotation.y = t * 0.03;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.1, -0.6]}>
      <torusKnotGeometry args={[0.85, 0.18, 220, 24]} />
      <meshStandardMaterial
        color="#B87954"
        emissive="#B87954"
        emissiveIntensity={0.12}
        metalness={0.7}
        roughness={0.25}
        transparent
        opacity={0.18}
      />
    </mesh>
  );
}

export function HeroScene() {
  const lowPower = useIsLowPowerDevice();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        // Keep lightweight; adjust DPR on low-power devices.
        dpr={lowPower ? [1, 1.25] : [1, 2]}
        camera={{ position: [0, 0, 3.2], fov: 55 }}
        gl={{ alpha: true, antialias: !lowPower, powerPreference: 'high-performance' }}
        // Render continuously (smooth) but keep scene minimal.
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 4, 3]} intensity={0.9} color="#fff2d0" />
        <directionalLight position={[-4, -2, 2]} intensity={0.35} color="#ffffff" />
        <SoftRibbons />
        <GoldenParticles count={lowPower ? 900 : 1600} />
      </Canvas>
    </div>
  );
}
