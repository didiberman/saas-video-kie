import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Call the status endpoint on the Cloud Function
        const statusUrl = API_URL?.replace("start-generation", "check-status");
        if (!statusUrl) {
            return NextResponse.json({ error: "API Configuration Missing" }, { status: 500 });
        }

        const response = await fetch(`${statusUrl}?taskId=${taskId}`, {
            headers: {
                "Authorization": authHeader,
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
