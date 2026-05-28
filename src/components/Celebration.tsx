"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  emoji: string;
  x: number;
  angle: number;
  speed: number;
  size: number;
}

const EMOJIS = ["🔥", "🥵", "💅", "⭐", "👑", "🙈", "🥶", "😎", "👨‍🌾"];

interface Props {
  trigger: boolean;
}

export default function Celebration({ trigger }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    // Use a functional update or just the value since we're replacing the whole array
    setParticles(() => 
      Array.from({ length: 30 }, (_, i) => ({
        id: Date.now() + i,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        x: Math.random() * 100, // % from left
        angle: Math.random() * 60 - 30, // tilt
        speed: 1 + Math.random() * 2,
        size: 1.5 + Math.random() * 2,
      }))
    );

    // Clear after animation
    const timeout = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timeout);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 animate-burst"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}rem`,
            transform: `rotate(${p.angle}deg)`,
            animation: `burst ${p.speed}s ease-out forwards`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
