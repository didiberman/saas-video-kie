// Runtime Environment Variable (Injected by Cloud Run)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
    try {
        if (!API_URL) {
            return new Response(JSON.stringify({ error: "API Configuration Missing" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const body = await req.json();
        const authHeader = req.headers.get("authorization");

        // Proxy the request to the Cloud Function
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader || "",
            },
            body: JSON.stringify(body),
        });

        // If the response is NDJSON streaming, forward the stream directly
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("ndjson") && response.body) {
            return new Response(response.body, {
                status: response.status,
                headers: {
                    "Content-Type": "application/x-ndjson",
                    "Transfer-Encoding": "chunked",
                    "Cache-Control": "no-cache",
                },
            });
        }

        // Non-streaming response (errors before streaming started)
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
