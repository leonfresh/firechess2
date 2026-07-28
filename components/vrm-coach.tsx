"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import type { MoveClassification } from "@/lib/move-quality";

const MODEL_URL = "/vrm/cherry_rose.vrm";

type CoachMood = "neutral" | "happy" | "excited" | "concerned" | "disappointed" | "thinking";

function moodFromClassification(c: MoveClassification | null): CoachMood {
  if (!c) return "neutral";
  switch (c) {
    case "brilliant": return "excited";
    case "best": return "happy";
    case "good": return "happy";
    case "inaccuracy": return "concerned";
    case "mistake": return "concerned";
    case "blunder": return "disappointed";
    default: return "neutral";
  }
}

function AvatarMesh({ vrm, mood, speaking }: { vrm: VRM; mood: CoachMood; speaking: boolean }) {
  const tRef = useRef(0);
  const blinkTimerRef = useRef(Math.random() * 3);

  useEffect(() => {
    if (!vrm.expressionManager) return;
    const expr = vrm.expressionManager;

    // Reset all
    expr.setValue("happy", 0);
    expr.setValue("sad", 0);
    expr.setValue("angry", 0);
    expr.setValue("relaxed", 0);
    expr.setValue("surprised", 0);

    switch (mood) {
      case "excited":
        expr.setValue("happy", 0.9);
        expr.setValue("surprised", 0.3);
        break;
      case "happy":
        expr.setValue("happy", 0.6);
        break;
      case "concerned":
        expr.setValue("sad", 0.3);
        expr.setValue("angry", 0.1);
        break;
      case "disappointed":
        expr.setValue("sad", 0.7);
        break;
      case "thinking":
        expr.setValue("relaxed", 0.4);
        break;
      default:
        expr.setValue("relaxed", 0.2);
    }
  }, [vrm, mood]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    tRef.current += dt;
    const t = tRef.current;

    // Idle sway — subtle life so she's not a statue
    const hips = vrm.humanoid.getNormalizedBoneNode("hips");
    if (hips) hips.rotation.z = Math.sin(t * 1.15) * 0.02;

    const spine = vrm.humanoid.getNormalizedBoneNode("spine");
    if (spine) spine.rotation.z = -Math.sin(t * 1.15 + 0.4) * 0.012;

    const head = vrm.humanoid.getNormalizedBoneNode("head");
    if (head) {
      head.rotation.y = Math.sin(t * 0.55) * 0.06;
      head.rotation.x = -Math.abs(Math.sin(t * 1.1)) * 0.015;
    }

    // Arms relaxed at sides (not T-pose)
    const lArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    if (lArm) {
      lArm.rotation.z = -0.85 + Math.sin(t * 1.05) * 0.03;
      lArm.rotation.x = Math.sin(t * 0.85) * 0.02;
    }

    const rArm = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
    if (rArm) {
      rArm.rotation.z = 0.85 - Math.sin(t * 1.05 + Math.PI) * 0.03;
      rArm.rotation.x = Math.sin(t * 0.85 + Math.PI) * 0.02;
    }

    // Blink
    blinkTimerRef.current += dt;
    const bp = blinkTimerRef.current % 3.8;
    vrm.expressionManager?.setValue("blink", bp < 0.1 ? Math.sin((bp / 0.1) * Math.PI) : 0);

    // Lip sync when speaking
    if (speaking) {
      const open = Math.max(0, Math.sin(t * 12) * 0.35 + 0.2);
      vrm.expressionManager?.setValue("aa", open);
    } else {
      vrm.expressionManager?.setValue("aa", 0);
    }

    vrm.update(dt);
  });

  // Render directly — no group wrapper with rotation.
  // VRMUtils.rotateVRM0 in the loader already handles facing direction.
  return <primitive object={vrm.scene} />;
}

export interface VRMCoachProps {
  classification: MoveClassification | null;
  commentary?: string | null;
  bestMoveSan?: string | null;
  cpLoss?: number;
  isVisible: boolean;
}

export function VRMCoach({ classification, commentary, bestMoveSan, cpLoss, isVisible }: VRMCoachProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const mood = moodFromClassification(classification);

  // Load VRM
  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader
      .loadAsync(MODEL_URL)
      .then((gltf) => {
        if (cancelled) return;
        const loaded = (gltf.userData as { vrm?: VRM }).vrm;
        if (!loaded) {
          setError("No VRM data found");
          return;
        }
        const specVersion = (loaded.meta as unknown as Record<string, unknown>).specVersion;
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

    return () => { cancelled = true; };
  }, []);

  // Typewriter effect for commentary
  useEffect(() => {
    if (!commentary) {
      setDisplayText("");
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    let i = 0;
    const text = commentary;
    setDisplayText("");
    const interval = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setSpeaking(false);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [commentary]);

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c0f15] to-[#08090d]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">Coach Cherry</span>
        </div>
        <span className="text-[10px] text-slate-500">VRM Live</span>
      </div>

      {/* 3D Canvas */}
      <div className="relative h-[280px] w-full">
        {!vrm && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-slate-500 text-xs animate-pulse">Loading coach…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 z-10">
            <span className="text-red-400 text-xs text-center break-words">{error}</span>
          </div>
        )}
        <Canvas
          camera={{ position: [0, 1.46, 0.88], fov: 30 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
          onCreated={({ camera }) => camera.lookAt(0, 1.38, 0)}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[1, 3, 2]} intensity={2.2} />
          <directionalLight position={[-1, 0.5, -1]} intensity={0.6} />
          {vrm && <AvatarMesh vrm={vrm} mood={mood} speaking={speaking} />}
        </Canvas>
      </div>

      {/* Speech bubble */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="min-h-[48px]">
          {displayText ? (
            <p className="text-xs leading-relaxed text-slate-300">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              {displayText}
            </p>
          ) : commentary ? (
            <p className="text-xs leading-relaxed text-slate-300">{commentary}</p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {classification === "blunder" || classification === "mistake"
                ? "That was a critical moment. Let's look at what went wrong..."
                : classification === "brilliant"
                ? "Brilliant move! Let's break down why this works..."
                : "Navigate to a move to see my analysis..."}
            </p>
          )}
        </div>
        {bestMoveSan && classification !== "best" && classification !== "book" && (
          <p className="mt-2 text-[10px] text-emerald-400">
            Best was: <span className="font-semibold">{bestMoveSan}</span>
            {cpLoss !== undefined && cpLoss > 0 && (
              <span className="ml-2 text-slate-500">({(cpLoss / 100).toFixed(1)} pawns lost)</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
