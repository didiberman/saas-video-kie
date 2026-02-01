"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Loader2, AlertCircle } from "lucide-react";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

interface Generation {
    id: string;
    original_prompt: string;
    status: "waiting" | "success" | "fail";
    video_url?: string;
    fail_message?: string;
    created_at: Timestamp | Date | null;
}

interface VideoGalleryProps {
    userId: string;
}

export function VideoGallery({ userId }: VideoGalleryProps) {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const db = getFirebaseFirestore();
        if (!db) return;

        const q = query(
            collection(db, "generations"),
            where("user_id", "==", userId),
            orderBy("created_at", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Generation[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Generation[];
            setGenerations(items);
        }, (error) => {
            console.error("Firestore listener error:", error);
        });

        return () => unsubscribe();
    }, [userId]);

    const formatDate = (timestamp: Timestamp | Date | null) => {
        if (!timestamp) return "";
        let date: Date;
        if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else {
            date = timestamp;
        }

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (generations.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mt-12 hidden md:block">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-white/10 flex-1" />
                <h3 className="text-white/40 text-sm font-medium uppercase tracking-widest">Your Collection</h3>
                <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {generations.map((gen) => (
                        <motion.div
                            key={gen.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10"
                        >
                            {/* Video / Status Area */}
                            {gen.status === "success" && gen.video_url ? (
                                <div
                                    className="relative aspect-[9/16] bg-black cursor-pointer"
                                    onClick={() => setPlayingId(playingId === gen.id ? null : gen.id)}
                                >
                                    {playingId === gen.id ? (
                                        <video
                                            src={gen.video_url}
                                            controls
                                            autoPlay
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <video
                                                src={gen.video_url}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                muted
                                                preload="metadata"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors backdrop-blur-[2px] group-hover:backdrop-blur-none">
                                                <PlayCircle className="w-14 h-14 text-white/80 group-hover:text-white group-hover:scale-110 transition-all drop-shadow-lg" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : gen.status === "waiting" ? (
                                <div className="aspect-[9/16] flex items-center justify-center bg-white/[0.02]">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                        <span className="text-xs text-white/40 font-medium tracking-wide">GENERATING</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-[9/16] flex items-center justify-center bg-red-500/5">
                                    <div className="flex flex-col items-center gap-2 px-6 text-center">
                                        <AlertCircle className="w-8 h-8 text-red-400/50" />
                                        <span className="text-xs text-red-300/50">{gen.fail_message || "Generation Failed"}</span>
                                    </div>
                                </div>
                            )}

                            {/* Hover info overlay */}
                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                <p className="text-sm text-white font-medium line-clamp-2">{gen.original_prompt}</p>
                                <p className="text-[10px] text-white/40 mt-1">{formatDate(gen.created_at)}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
