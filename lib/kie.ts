import { getVaultSecret } from "./vault";

interface KieGenerateResponse {
    id: string;
    status: string;
}

export class KieClient {
    private apiKey: string | null = null;
    private baseUrl = "https://api.kie.ai/v1"; // Placeholder URL, replace with actual

    async init() {
        if (this.apiKey) return;

        // Fetch API Key from Vault
        // We assume the secret path is "kie-ai" and key is "api_key"
        try {
            const secrets = await getVaultSecret("kie-ai");
            this.apiKey = secrets.api_key || process.env.KIE_API_KEY || null;
        } catch {
            console.warn("Failed to fetch KIE key from Vault, falling back to ENV");
            this.apiKey = process.env.KIE_API_KEY || null;
        }

        if (!this.apiKey) {
            throw new Error("KIE AI API Key not found in Vault or Env");
        }
    }

    async generateVideo(prompt: string, webhookUrl: string): Promise<KieGenerateResponse> {
        await this.init();

        const res = await fetch(`${this.baseUrl}/videos/generate`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                model: "k-2.0", // Example model
                callback_url: webhookUrl,
                aspect_ratio: "16:9"
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`KIE AI Error: ${err}`);
        }

        return await res.json();
    }
}

export const kieClient = new KieClient();
