const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Initialize Clients
const firestore = new Firestore();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const kieApiKey = process.env.KIE_API_KEY;
const webhookUrl = process.env.WEBHOOK_URL;

functions.http('startGeneration', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        // 1. Validate Auth (Supabase JWT)
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1]);

        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        // 2. Parse Body
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        // 3. Check Credits in Firestore
        const creditsRef = firestore.collection('credits').doc(user.id);
        const creditsDoc = await creditsRef.get();

        // Default to 30s if no doc exists yet
        let secondsRemaining = 30;
        if (creditsDoc.exists) {
            secondsRemaining = creditsDoc.data().seconds_remaining;
        } else {
            // Initialize user
            await creditsRef.set({ seconds_remaining: 30, updated_at: new Date() });
        }

        if (secondsRemaining <= 0) {
            return res.status(403).json({ error: 'Insufficient credits' });
        }

        // 4. Call KIE AI
        const kieRes = await fetch('https://api.kie.ai/v1/videos/generate', {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${kieApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                model: "k-2.0",
                callback_url: webhookUrl,
                aspect_ratio: "16:9"
            }),
        });

        if (!kieRes.ok) {
            const errText = await kieRes.text();
            throw new Error(`KIE AI Error: ${errText}`);
        }

        const kieData = await kieRes.json();

        // 5. Store in Firestore ("generations" collection)
        // ID = kieData.id for easy webhook lookup, or auto-id with kie_id field
        await firestore.collection('generations').doc(kieData.id).set({
            user_id: user.id,
            prompt: prompt,
            status: 'pending',
            kie_id: kieData.id,
            created_at: new Date()
        });

        // 6. Deduct Credits
        await creditsRef.update({
            seconds_remaining: secondsRemaining - 5,
            updated_at: new Date()
        });

        return res.status(200).json({ success: true, id: kieData.id });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
