"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type RoastMood =
  | "neutral"
  | "smug"
  | "shocked"
  | "disappointed"
  | "suspicious"
  | "mindblown"
  | "laughing"
  | "thinking"
  | "clown"
  | "crylaugh"
  | "rage"
  | "gigachad"
  | "detective"
  | "king"
  | "copium"
  | "galaxybrain";

/** Map moods to Pepe emoji PNGs in /public/pepe-emojis/ */
const MOOD_IMAGES: Record<RoastMood, string> = {
  neutral:      "/pepe-emojis/3959-hmm.png",
  smug:         "/pepe-emojis/81504-pepeok.png",
  shocked:      "/pepe-emojis/monkaS.png",
  disappointed: "/pepe-emojis/6757_Sadge.png",
  suspicious:   "/pepe-emojis/60250-think.png",
  mindblown:    "/pepe-emojis/2230-poggies-peepo.png",
  laughing:     "/pepe-emojis/9807-pepecringe.png",
  thinking:     "/pepe-emojis/60250-think.png",
  clown:        "/pepe-emojis/4825_PepeClown.png",
  crylaugh:     "/pepe-emojis/2982-pepecry.png",
  rage:         "/pepe-emojis/4178-pepe-rage.png",
  gigachad:     "/pepe-emojis/9088-pepe-gigachad.png",
  detective:    "/pepe-emojis/8557-peepodetective.png",
  king:         "/pepe-emojis/11998-pepe-king.png",
  copium:       "/pepe-emojis/7332-copium.png",
  galaxybrain:  "/pepe-emojis/26578-galaxybrainpepe.png",
};

/**
 * Pepe the Frog avatar using real emoji PNGs.
 * Bounces on mood change for visual feedback.
 */
export function RoastAvatar({ mood, size = 72 }: { mood: RoastMood; size?: number }) {
  const [bounce, setBounce] = useState(false);
  const [prev, setPrev] = useState(mood);

  useEffect(() => {
    if (mood !== prev) {
      setBounce(true);
      setPrev(mood);
      const t = setTimeout(() => setBounce(false), 350);
      return () => clearTimeout(t);
    }
  }, [mood, prev]);

  return (
    <div
      className={`flex-shrink-0 transition-transform duration-200 ${bounce ? "scale-[1.18]" : "scale-100"}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={MOOD_IMAGES[mood]}
        alt={`Pepe ${mood}`}
        width={size}
        height={size}
        className="object-contain drop-shadow-lg"
        unoptimized
        priority
      />
    </div>
  );
}
