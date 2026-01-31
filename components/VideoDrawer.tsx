"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VideoDrawer({ isOpen, onClose }: VideoDrawerProps) {
    // Mock data for now
    const videos = [
        { id: 1, thumbnail: "", prompt: "A cyberpunk city in rain", date: "2 mins ago" },
        { id: 2, thumbnail: "", prompt: "Golden retriever flying", date: "1 hour ago" },
        { id: 3, thumbnail: "", prompt: "Abstract liquid gold", date: "Yesterday" },
    ];

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
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {videos.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm">
                                    <p>No dreams generated yet.</p>
                                </div>
                            ) : (
                                videos.map((video) => (
                                    <div key={video.id} className="group relative aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                            <PlayCircle className="w-10 h-10 text-white" />
                                        </div>
                                        {/* Placeholder for now */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                            <span className="text-xs text-white/40 truncate w-full text-center">{video.prompt}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5">
                            <div className="text-xs text-center text-white/20">
                                Storage Usage: 5%
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
