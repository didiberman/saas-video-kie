"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { VideoDrawer } from "@/components/VideoDrawer";
import { VideoGallery } from "@/components/VideoGallery";
import { Sparkles, History, LogOut, Clock, RotateCcw, RectangleHorizontal, RectangleVertical, Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { StreamingText } from "@/components/StreamingText";
import { ProgressRotator } from "@/components/ProgressRotator";

type Phase = "idle" | "scripting" | "generating" | "done" | "error";
type AspectRatio = "9:16" | "16:9";

const SCRIPTING_MESSAGES = [
  "Analyzing your prompt...",
  "Understanding context & tone...",
  "Brainstorming creative angles...",
  "Drafting the perfect script...",
  "Refining dialogue & pacing...",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"6" | "10">("6");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);

  // ... (rest of component logic) ...

  // ... IN THE JSX ...

  {/* Main Content — switches between prompt form and streaming panel */ }
  {
    phase === "idle" ? (
      <>
        <div className="w-full flex flex-col items-center justify-center py-20 min-h-[60vh] relative z-10 transition-all duration-700">
          <GlassCard className="w-full max-w-2xl p-1 shimmer-border" delay={0.2}>
            <div className="relative">
// ...
            </div>
          </GlassCard>
          {/* Scroll hint icon if needed, or just let the gallery peek */}
        </div>

        <VideoGallery userId={user.uid} />
      </>
    ) : (
    /* Streaming / Progress Panel */
    <div className="w-full flex flex-col items-center justify-center min-h-[85vh] relative z-10">
      <GlassCard className="w-full max-w-2xl relative z-10 p-1 shimmer-border" delay={0}>
        <div className="p-6 space-y-4">
          {/* Phase indicator */}
          <div className="flex flex-col gap-2 items-center w-full">
            <div className="flex items-center gap-2">
              {phase === "generating" ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="w-full max-w-md">
                    <ProgressRotator />
                  </div>
                  <span className="text-xs text-white/20">Usually takes 30-60 seconds</span>
                </div>
              ) : phase === "scripting" ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="w-full max-w-md">
                    <ProgressRotator messages={SCRIPTING_MESSAGES} />
                  </div>
                </div>
              ) : (
                <span className="text-sm font-medium text-white/40">
                  {phase === "done" && "Video ready"}
                  {phase === "error" && "Something went wrong"}
                </span>
              )}
            </div>
          </div>

          {/* Streamed script display */}
          {streamedScript && (
            <StreamingText
              text={streamedScript}
              isStreaming={phase === "scripting"}
              className={`max-h-[350px] min-h-[150px] rounded-lg bg-white/5 border p-5 text-sm text-white/80 font-light leading-relaxed transition-all duration-1000 ${phase === "generating"
                ? "border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)] animate-pulse"
                : "border-white/10"
                }`}
            />
          )}

          {/* Video player */}
          {phase === "done" && videoUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full"
              />
            </div>
          )}

          {/* Error message */}
          {phase === "error" && errorMessage && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          {(phase === "done" || phase === "error") && (
            <button
              onClick={handleReset}
              className="h-10 px-6 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 font-medium transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Create another</span>
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  )
  }

  {/* Footer Text */ }
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8 }}
    className="absolute bottom-8 text-white/15 text-xs font-light tracking-[0.2em] uppercase"
  >
    Powered by KIE AI
  </motion.p>

  {/* Video Vault Drawer */ }
  <VideoDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} userId={user.uid} />

    </main >
  );
}
