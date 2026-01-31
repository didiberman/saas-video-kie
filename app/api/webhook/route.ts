import { createClient } from "@supabase/supabase-js"; // use Admin client for webhooks
import { NextResponse } from "next/server";

// We need a Service Role client to update records without user session
// Do NOT expose service role key to client side
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, status, video_url } = body;

        // Basic validation
        if (!id || !status) {
            return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
        }

        // Update the record
        const { error } = await supabaseAdmin
            .from("generations")
            .update({
                status: status, // 'completed' or 'failed'
                video_url: video_url
            })
            .eq("kie_id", id);

        if (error) {
            console.error("Webhook DB Update Failed:", error);
            return NextResponse.json({ error: "DB Error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Webhook Handler Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
