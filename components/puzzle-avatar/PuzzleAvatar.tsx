"use client";

/**
 * PuzzleAvatar — lightweight VRM avatar for the puzzle tutor mode.
 *
 * Purely procedural animation (no .vrma files). Runs an idle sway baseline
 * and overlays spring-damped gesture poses for teaching interactions.
 * Lip sync driven by the audioRef.wordActive signal from the speech player.
 *
 * Must be loaded with `dynamic({ ssr: false })`.
 */

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import { useState } from "react";

export type GestureType =
  | "idle"
  | "thinking"
  | "excited"
  | "pointing"
  | "happy"
  | "concerned"
  | "explaining";

export interface PuzzleAvatarAudioRef {
  wordActive: number;
}

interface PuzzleAvatarProps {
  audioRef: React.RefObject<PuzzleAvatarAudioRef>;
  gesture?: GestureType;
  className?: string;
}

// ── Viseme system ─────────────────────────────────────────────────────────────

const VISEMES = ["aa", "ih", "ou", "ee", "oh"] as const;
type Viseme = (typeof VISEMES)[number];
const VISEME_POOL: Viseme[] = [
  "aa",
  "aa",
  "aa",
  "aa",
  "aa",
  "oh",
  "oh",
  "oh",
  "ih",
  "ih",
];

// ── Spring helper ─────────────────────────────────────────────────────────────

interface Spring1D {
  value: number;
  velocity: number;
}

function springUpdate(
  s: Spring1D,
  target: number,
  dt: number,
  stiffness = 8,
  damping = 0.72,
): number {
  const force = (target - s.value) * stiffness;
  s.velocity += force * dt;
  s.velocity *= Math.pow(1 - damping, dt * 60);
  s.value += s.velocity * dt;
  return s.value;
}

// ── Gesture bone targets (additive offsets from idle baseline) ────────────────

interface GestureOffsets {
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  neckRotZ: number;
  rUpperArmRotX: number;
  rUpperArmRotZ: number;
  rLowerArmRotX: number;
  lUpperArmRotZ: number;
  spineRotZ: number;
  expressionHappy: number;
  expressionRelaxed: number;
  expressionSad: number;
  expressionSurprised: number;
}

const ZERO_OFFSETS: GestureOffsets = {
  headRotX: 0,
  headRotY: 0,
  headRotZ: 0,
  neckRotZ: 0,
  rUpperArmRotX: 0,
  rUpperArmRotZ: 0,
  rLowerArmRotX: 0,
  lUpperArmRotZ: 0,
  spineRotZ: 0,
  expressionHappy: 0.4,
  expressionRelaxed: 0,
  expressionSad: 0,
  expressionSurprised: 0,
};

const GESTURE_TARGETS: Record<GestureType, Partial<GestureOffsets>> = {
  idle: {},
  thinking: {
    headRotZ: 0.07,
    headRotX: -0.03,
    rUpperArmRotX: 0.52,
    rUpperArmRotZ: 0.28,
    rLowerArmRotX: -0.58,
    expressionHappy: 0.16,
    expressionRelaxed: 0.34,
  },
  excited: {
    headRotX: 0.05,
    spineRotZ: 0.02,
    lUpperArmRotZ: -0.3,
    rUpperArmRotZ: 0.3,
    expressionHappy: 0.72,
    expressionSurprised: 0.18,
  },
  pointing: {
    headRotY: 0.1,
    rUpperArmRotX: 0.14,
    rUpperArmRotZ: 0.34,
    rLowerArmRotX: -0.08,
    expressionHappy: 0.36,
  },
  happy: {
    headRotX: -0.05,
    lUpperArmRotZ: -0.26,
    rUpperArmRotZ: 0.26,
    expressionHappy: 0.82,
    expressionSurprised: 0.12,
  },
  concerned: {
    headRotZ: -0.05,
    headRotX: 0.04,
    expressionHappy: 0.05,
    expressionSad: 0.34,
    expressionRelaxed: 0.12,
  },
  explaining: {
    rUpperArmRotX: 0.1,
    rUpperArmRotZ: 0.26,
    rLowerArmRotX: -0.32,
    headRotX: -0.02,
    expressionHappy: 0.34,
  },
};

function resolveTarget(gesture: GestureType): GestureOffsets {
  return { ...ZERO_OFFSETS, ...GESTURE_TARGETS[gesture] };
}

// ── Main avatar mesh ──────────────────────────────────────────────────────────

function AvatarMesh({
  vrm,
  audioRef,
  gesture,
}: {
  vrm: VRM;
  audioRef: React.RefObject<PuzzleAvatarAudioRef>;
  gesture: GestureType;
}) {
  const tRef = useRef(0);
  const smoothMouthRef = useRef(0);
  const activeVisemeRef = useRef<Viseme>("aa");
  const visemeSwitchTimerRef = useRef(0);
  const blinkTimerRef = useRef(Math.random() * 3);

  // Springs for each gesture-driven offset
  const springsRef = useRef<Record<keyof GestureOffsets, Spring1D>>(
    Object.fromEntries(
      Object.entries(ZERO_OFFSETS).map(([k, v]) => [
        k,
        { value: v, velocity: 0 },
      ]),
    ) as Record<keyof GestureOffsets, Spring1D>,
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    tRef.current += dt;
    const t = tRef.current;

    // ── Spring gesture offsets toward current target ──────────────────────
    const target = resolveTarget(gesture);
    const sp = springsRef.current;
    const stiffness = gesture === "idle" ? 4.5 : 7;
    for (const key of Object.keys(sp) as (keyof GestureOffsets)[]) {
      springUpdate(sp[key], target[key], dt, stiffness, 0.74);
    }
    const g = Object.fromEntries(
      Object.entries(sp).map(([k, s]) => [k, s.value]),
    ) as unknown as GestureOffsets;

    // ── Idle baseline sway ────────────────────────────────────────────────
    const hips = vrm.humanoid.getNormalizedBoneNode("hips");
    if (hips) hips.rotation.z = Math.sin(t * 1.15) * 0.03 + g.spineRotZ;

    const spine = vrm.humanoid.getNormalizedBoneNode("spine");
    if (spine) spine.rotation.z = -Math.sin(t * 1.15 + 0.4) * 0.016;

    const head = vrm.humanoid.getNormalizedBoneNode("head");
    if (head) {
      head.rotation.y = Math.sin(t * 0.55) * 0.08 + g.headRotY;
      head.rotation.x = -Math.abs(Math.sin(t * 1.1)) * 0.02 + g.headRotX;
      head.rotation.z = g.headRotZ;
    }

    const neck = vrm.humanoid.getNormalizedBoneNode("neck");
    if (neck) neck.rotation.z = g.neckRotZ;

    // Left arm
    const lArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    if (lArm) {
      lArm.rotation.z = -1.05 + Math.sin(t * 1.05) * 0.04 + g.lUpperArmRotZ;
      lArm.rotation.x = Math.sin(t * 0.85) * 0.03;
    }

    // Right arm — gesture-driven
    const rArm = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
    if (rArm) {
      const baseZ = 1.05 - Math.sin(t * 1.05 + Math.PI) * 0.04;
      rArm.rotation.z = baseZ - g.rUpperArmRotZ;
      rArm.rotation.x = g.rUpperArmRotX;
    }

    const rLower = vrm.humanoid.getNormalizedBoneNode("rightLowerArm");
    if (rLower) rLower.rotation.x = g.rLowerArmRotX;

    // ── Blink ─────────────────────────────────────────────────────────────
    blinkTimerRef.current += dt;
    const bp = blinkTimerRef.current % 3.8;
    vrm.expressionManager?.setValue(
      "blink",
      bp < 0.1 ? Math.sin((bp / 0.1) * Math.PI) : 0,
    );

    // ── Expressions from gesture springs ─────────────────────────────────
    vrm.expressionManager?.setValue("happy", g.expressionHappy);
    vrm.expressionManager?.setValue("relaxed", g.expressionRelaxed);
    vrm.expressionManager?.setValue("sad", g.expressionSad);
    vrm.expressionManager?.setValue("surprised", g.expressionSurprised);

    // ── Lip sync ─────────────────────────────────────────────────────────
    const wordActive = audioRef.current?.wordActive ?? 0;
    const mouthTarget =
      wordActive > 0 ? 0.14 + 0.08 * (0.5 + 0.5 * Math.sin(t * 15)) : 0;
    const isOpening = mouthTarget > smoothMouthRef.current;
    smoothMouthRef.current +=
      (mouthTarget - smoothMouthRef.current) *
      Math.min(1, dt * (isOpening ? 18 : 7));

    visemeSwitchTimerRef.current -= dt;
    if (smoothMouthRef.current > 0.14 && visemeSwitchTimerRef.current <= 0) {
      activeVisemeRef.current =
        VISEME_POOL[Math.floor(Math.random() * VISEME_POOL.length)];
      visemeSwitchTimerRef.current = 0.11 + Math.random() * 0.18;
    }

    for (const v of VISEMES) vrm.expressionManager?.setValue(v, 0);
    if (smoothMouthRef.current > 0.01) {
      vrm.expressionManager?.setValue(
        activeVisemeRef.current,
        Math.min(0.24, smoothMouthRef.current),
      );
    }

    vrm.update(dt);
  });

  return <primitive object={vrm.scene} />;
}

// ── Public component ──────────────────────────────────────────────────────────

export default function PuzzleAvatar({
  audioRef,
  gesture = "idle",
  className,
}: PuzzleAvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader
      .loadAsync("/vrm/cherry_rose.vrm")
      .then((gltf) => {
        if (cancelled) return;
        const loaded = (gltf.userData as { vrm?: VRM }).vrm;
        if (!loaded) {
          setError("No VRM data found");
          return;
        }

        const specVersion = (loaded.meta as unknown as Record<string, unknown>)
          .specVersion;
        if (typeof specVersion !== "string" || specVersion.startsWith("0")) {
          VRMUtils.rotateVRM0(loaded);
        }
        VRMUtils.removeUnnecessaryVertices(loaded.scene);
        VRMUtils.combineSkeletons(loaded.scene);
        loaded.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });
        setVrm(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={className}
      style={{ background: "transparent", position: "relative" }}
    >
      {!vrm && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-zinc-600 text-xs animate-pulse">
            Loading avatar…
          </span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <span className="text-red-500 text-xs text-center break-words">
            {error}
          </span>
        </div>
      )}
      {!error && (
        <Canvas
          camera={{ position: [0, 1.18, 1.65], fov: 32 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
          onCreated={({ camera }) => camera.lookAt(0, 1.08, 0)}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[1, 3, 2]} intensity={2.2} />
          <directionalLight position={[-1, 0.5, -1]} intensity={0.6} />
          {vrm && (
            <AvatarMesh vrm={vrm} audioRef={audioRef} gesture={gesture} />
          )}
        </Canvas>
      )}
    </div>
  );
}
