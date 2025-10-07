'use client';

/**
 * Market Dashboard 3D with Three.js r170+ and WebGPU
 * Phase 1, Week 5, Day 29
 * - 3D city trade flow visualization
 * - Shader particles for hot items
 * - Orbit controls (zoom, pan, rotate)
 * - 60fps performance target
 */

import { useRef, useEffect, useState } from 'react';

import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CityNode {
  name: string;
  position: [number, number, number];
  volume: number;
  color: string;
}

// Reserved for future trade flow visualization
// interface TradeFlow {
//   from: string;
//   to: string;
//   volume: number;
// }

const CITIES: CityNode[] = [
  { name: 'Caerleon', position: [0, 0, 0], volume: 1000, color: '#ff6b6b' },
  { name: 'Bridgewatch', position: [5, 0, 5], volume: 800, color: '#4ecdc4' },
  { name: 'Lymhurst', position: [-5, 0, 5], volume: 750, color: '#45b7d1' },
  { name: 'Martlock', position: [5, 0, -5], volume: 700, color: '#f9ca24' },
  { name: 'Fort Sterling', position: [-5, 0, -5], volume: 650, color: '#a29bfe' },
  { name: 'Thetford', position: [0, 0, -7], volume: 600, color: '#6c5ce7' },
];

/**
 * Animated city node with pulsing effect
 */
function CityNode({ city }: { city: CityNode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing animation based on volume
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const size = Math.log(city.volume) / 3;

  return (
    <group position={city.position}>
      {/* City sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={city.color}
          emissive={city.color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* City label */}
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {city.name}
      </Text>

      {/* Volume indicator */}
      {hovered ? <Text
          position={[0, size + 1, 0]}
          fontSize={0.3}
          color="#00d4ff"
          anchorX="center"
          anchorY="middle"
        >
          Vol: {city.volume.toLocaleString()}
        </Text> : null}
    </group>
  );
}

/**
 * Trade flow connection between cities
 */
function TradeConnection({ from, to, volume }: { from: CityNode; to: CityNode; volume: number }) {
  const lineRef = useRef<THREE.Line>(null);

  useEffect(() => {
    if (lineRef.current) {
      const points = [
        new THREE.Vector3(...from.position),
        new THREE.Vector3(...to.position),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lineRef.current.geometry = geometry;
    }
  }, [from, to]);

  const opacity = Math.min(volume / 1000, 1);

  return (
    <primitive object={new THREE.Line()} ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial
        color="#00d4ff"
        opacity={opacity}
        transparent
        linewidth={2}
      />
    </primitive>
  );
}

/**
 * Particle system for hot items
 */
function HotItemParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1000;

  useEffect(() => {
    if (particlesRef.current) {
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        // Random positions in sphere
        const radius = Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Hot colors (red/orange/yellow)
        colors[i * 3] = 1;
        colors[i * 3 + 1] = Math.random() * 0.5;
        colors[i * 3 + 2] = 0;
      }

      particlesRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      particlesRef.current.geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );
    }
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Main 3D Scene
 */
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={60} />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
      />

      {/* City nodes */}
      {CITIES.map((city) => (
        <CityNode key={city.name} city={city} />
      ))}

      {/* Trade connections */}
      {CITIES.slice(0, -1).map((city, i) => (
        <TradeConnection
          key={`${city.name}-${CITIES[i + 1].name}`}
          from={city}
          to={CITIES[i + 1]}
          volume={Math.random() * 500 + 200}
        />
      ))}

      {/* Hot item particles */}
      <HotItemParticles />

      {/* Grid helper */}
      <gridHelper args={[20, 20, '#3a3a3a', '#1a1a1a']} />
    </>
  );
}

export function MarketDashboard3D() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFps);
    };

    measureFps();
  }, []);

  return (
    <div className="panel-float relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">3D Market Visualization</h2>
          <p className="text-sm text-albion-gray-500">
            Interactive city trade flow analysis
          </p>
        </div>
        
        {/* FPS Counter */}
        <div className="text-right">
          <p className="text-xs text-albion-gray-500">Performance</p>
          <p className={`text-lg font-bold ${fps >= 55 ? 'text-neon-green' : 'text-neon-red'}`}>
            {fps} FPS
          </p>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-[600px] w-full rounded-lg overflow-hidden bg-albion-gray-900">
        <Canvas>
          <Scene />
        </Canvas>
      </div>

      {/* Controls Info */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-albion-gray-500">
        <div>
          <p className="font-medium text-white">Rotate</p>
          <p>Left click + drag</p>
        </div>
        <div>
          <p className="font-medium text-white">Zoom</p>
          <p>Scroll wheel</p>
        </div>
        <div>
          <p className="font-medium text-white">Pan</p>
          <p>Right click + drag</p>
        </div>
      </div>
    </div>
  );
}
