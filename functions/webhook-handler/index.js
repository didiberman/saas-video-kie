const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();

functions.http('handleWebhook', async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { id, status, video_url } = req.body;

        if (!id || !status) {
            return res.status(400).json({ error: "Invalid Payload" });
        }

        console.log(`Received webhook for Job ${id}: ${status}`);

        // Update Firestore Document (assuming ID is the document key)
        const docRef = firestore.collection('generations').doc(id);

        await docRef.update({
            status: status,
            video_url: video_url || null,
            updated_at: new Date()
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
