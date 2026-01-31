"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle, Loader2, AlertCircle } from "lucide-react";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

interface Generation {
    id: string;
    original_prompt: string;
    generated_script: string;
    status: "waiting" | "success" | "fail";
    video_url?: string;
    fail_message?: string;
    created_at: any;
}

interface VideoDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export function VideoDrawer({ isOpen, onClose, userId }: VideoDrawerProps) {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !userId) return;

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
    }, [isOpen, userId]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/10 z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-medium text-white tracking-tight">Your Vault</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {generations.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm">
                                    <p>No dreams generated yet.</p>
                                </div>
                            ) : (
                                generations.map((gen) => (
                                    <div key={gen.id} className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.02]">
                                        {/* Video / Status area */}
                                        {gen.status === "success" && gen.video_url ? (
                                            <div
                                                className="relative aspect-video bg-black cursor-pointer group"
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
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                                        <PlayCircle className="w-10 h-10 text-white/50 group-hover:text-white transition-colors" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : gen.status === "waiting" ? (
                                            <div className="aspect-video flex items-center justify-center bg-white/[0.02]">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                                                    <span className="text-xs text-white/30">Generating...</span>
                                                </div>
                                            </div>
                                        ) : gen.status === "fail" ? (
                                            <div className="aspect-video flex items-center justify-center bg-red-500/5">
                                                <div className="flex flex-col items-center gap-2 px-4">
                                                    <AlertCircle className="w-6 h-6 text-red-400/60" />
                                                    <span className="text-xs text-red-300/60 text-center">{gen.fail_message || "Failed"}</span>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Info */}
                                        <div className="p-3 space-y-1">
                                            <p className="text-xs text-white/50 truncate">{gen.original_prompt}</p>
                                            <p className="text-[10px] text-white/20">{formatDate(gen.created_at)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5">
                            <div className="text-xs text-center text-white/20">
                                {generations.length} generation{generations.length !== 1 ? "s" : ""}
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
