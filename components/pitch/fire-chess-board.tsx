"use client";

/**
 * Real 3D chessboard for the fire/combustion design pitch hero
 * (see app/newlanding2). One piece burns: emissive material, a
 * flickering point light, a billboard glow sprite, and drei
 * <Sparkles> for rising embers. Board slowly auto-rotates unless
 * the user prefers reduced motion.
 *
 * Must be loaded with `dynamic({ ssr: false })` — WebGL only.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const IVORY = "#f4eedf";
const CHAR_3 = "#1d1510";
const PAPER_DIM = "#cabfa8";
const EMBER = "#ff5c24";
const EMBER_HOT = "#ffb15c";
const WHITE_HOT = "#ffe9c7";

function CameraLookAt() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

function Piece({
  position,
  color,
  tall,
}: {
  position: [number, number, number];
  color: string;
  tall?: boolean;
}) {
  const stemH = tall ? 0.55 : 0.35;
  const headR = tall ? 0.2 : 0.16;
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.26, 0.32, 0.16, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, stemH / 2 + 0.16, 0]}>
        <cylinderGeometry args={[0.12, 0.18, stemH, 14]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, stemH + 0.16 + headR, 0]}>
        <sphereGeometry args={[headR, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
}

function useGlowTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,233,199,0.9)");
    gradient.addColorStop(0.4, "rgba(255,92,36,0.5)");
    gradient.addColorStop(1, "rgba(255,92,36,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

function BurningPiece({ position }: { position: [number, number, number] }) {
  const stemH = 0.55;
  const headR = 0.2;
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: WHITE_HOT,
        emissive: EMBER,
        emissiveIntensity: 1.3,
        roughness: 0.35,
      }),
    [],
  );
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowTexture = useGlowTexture();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flick = 1.1 + Math.sin(t * 3.6) * 0.35 + Math.sin(t * 7.8) * 0.2;
    material.emissiveIntensity = Math.max(0.8, flick);
    if (lightRef.current) lightRef.current.intensity = Math.max(0.6, flick * 1.6);
    if (glowRef.current) glowRef.current.opacity = 0.7 + Math.sin(t * 2.5) * 0.2;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} material={material}>
        <cylinderGeometry args={[0.26, 0.32, 0.16, 16]} />
      </mesh>
      <mesh position={[0, stemH / 2 + 0.16, 0]} material={material}>
        <cylinderGeometry args={[0.12, 0.18, stemH, 14]} />
      </mesh>
      <mesh position={[0, stemH + 0.16 + headR, 0]} material={material}>
        <sphereGeometry args={[headR, 16, 16]} />
      </mesh>
      <pointLight ref={lightRef} color={EMBER} intensity={2} distance={6} position={[0, 1.1, 0]} />
      {glowTexture && (
        <Billboard position={[0, 0.55, 0]}>
          <mesh>
            <planeGeometry args={[1.7, 1.7]} />
            <meshBasicMaterial
              ref={glowRef}
              map={glowTexture}
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      )}
      <Sparkles
        count={40}
        scale={[0.5, 1.6, 0.5]}
        size={3.5}
        speed={0.4}
        noise={0.4}
        color={EMBER_HOT}
        position={[0, 0.6, 0]}
      />
    </group>
  );
}

function Board() {
  const squares = useMemo(() => {
    const arr: { x: number; z: number; light: boolean }[] = [];
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        arr.push({ x, z, light: (x + z) % 2 === 0 });
      }
    }
    return arr;
  }, []);

  return (
    <>
      {squares.map((s, i) => (
        <mesh key={i} position={[s.x - 3.5, 0, s.z - 3.5]}>
          <boxGeometry args={[0.96, 0.12, 0.96]} />
          <meshStandardMaterial color={s.light ? PAPER_DIM : CHAR_3} roughness={0.75} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, -0.24, 0]}>
        <boxGeometry args={[8.6, 0.3, 8.6]} />
        <meshStandardMaterial color="#0a0806" roughness={0.9} />
      </mesh>
      {[
        [0, 4.35],
        [0, -4.35],
      ].map(([x, z], i) => (
        <mesh key={`edge-${i}`} position={[x, -0.08, z]}>
          <boxGeometry args={[8.7, 0.05, 0.08]} />
          <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={0.55} roughness={0.4} />
        </mesh>
      ))}
      {[
        [4.35, 0],
        [-4.35, 0],
      ].map(([x, z], i) => (
        <mesh key={`side-${i}`} position={[x, -0.08, z]}>
          <boxGeometry args={[0.08, 0.05, 8.7]} />
          <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={0.55} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;

  useFrame((_, delta) => {
    if (!reduceMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      <Board />
      <Piece position={[1 - 3.5, 0.06, 1 - 3.5]} color={IVORY} tall />
      <Piece position={[6 - 3.5, 0.06, 1 - 3.5]} color={CHAR_3} tall />
      <Piece position={[2 - 3.5, 0.06, 6 - 3.5]} color={IVORY} />
      <Piece position={[5 - 3.5, 0.06, 6 - 3.5]} color={CHAR_3} />
      <BurningPiece position={[4 - 3.5, 0.06, 4 - 3.5]} />
    </group>
  );
}

export default function FireChessBoard() {
  return (
    <div className="fire-board-canvas h-full w-full">
      <Canvas
        camera={{ position: [3.6, 4.1, 4.6], fov: 36 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        resize={{ scroll: false, debounce: 0 }}
      >
        <CameraLookAt />
        <ambientLight color="#554438" intensity={0.9} />
        <directionalLight color="#fff2df" intensity={0.9} position={[4, 6, 3]} />
        <directionalLight color="#8a8072" intensity={0.35} position={[-4, 2, -4]} />
        <Scene />
      </Canvas>
      <style jsx global>{`
        .fire-board-canvas > div {
          width: 100% !important;
          height: 100% !important;
        }
        .fire-board-canvas canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
        }
      `}</style>
    </div>
  );
}
