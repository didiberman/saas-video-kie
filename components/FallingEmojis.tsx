"use client";

import { useEffect, useState } from "react";

const EMOJIS = ["✨", "🎬", "⭐"];

interface Emoji {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

export function FallingEmojis() {
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  useEffect(() => {
    // Generate initial emojis - just a few
    const initial: Emoji[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[i % EMOJIS.length],
      left: 15 + (i * 18), // Evenly spaced
      delay: i * 2,
      duration: 12 + i * 2,
      size: 20,
    }));
    setEmojis(initial);

    // Add new emoji slowly
    const interval = setInterval(() => {
      setEmojis(prev => {
        const newEmoji: Emoji = {
          id: Date.now(),
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          left: 10 + Math.random() * 80,
          delay: 0,
          duration: 12 + Math.random() * 4,
          size: 18 + Math.random() * 6,
        };
        const updated = [...prev, newEmoji];
        if (updated.length > 8) updated.shift();
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {emojis.map((e) => (
        <div
          key={e.id}
          className="absolute animate-fall opacity-40"
          style={{
            left: `${e.left}%`,
            fontSize: `${e.size}px`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
          }}
        >
          {e.emoji}
        </div>
      ))}
    </div>
  );
}
