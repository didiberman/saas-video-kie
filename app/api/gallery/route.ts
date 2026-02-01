import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// Public endpoint - no auth required
export async function GET() {
    try {
        const db = adminDb;

        // Fetch recent successful generations (both video and music)
        const generationsRef = db.collection("generations");
        const snapshot = await generationsRef
            .where("status", "==", "success")
            .orderBy("created_at", "desc")
            .limit(30)
            .get();

        const items = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type || "video",
                prompt: data.original_prompt || data.prompt || "",
                videoUrl: data.video_url || null,
                audioUrl: data.audio_url || null,
                imageUrl: data.image_url || null,
                createdAt: data.created_at?.toDate?.()?.toISOString() || null,
            };
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Gallery fetch error:", error);
        return NextResponse.json({ items: [] });
    }
}
