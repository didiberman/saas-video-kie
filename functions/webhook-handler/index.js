const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();

functions.http('handleWebhook', async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const body = req.body;
        console.log('Webhook received:', JSON.stringify(body).substring(0, 500));

        // Detect Suno music callback format:
        // callbackType: "text" = lyrics ready, stream_audio_url available
        // callbackType: "complete" = final audio_url ready
        if (body.data && (body.data.callbackType === 'text' || body.data.callbackType === 'complete') && body.data.task_id) {
            // Suno Music callback
            const taskId = body.data.task_id;
            const callbackType = body.data.callbackType;
            const songsArray = body.data.data;

            if (!Array.isArray(songsArray) || songsArray.length === 0) {
                console.error('Suno callback missing songs array:', JSON.stringify(body));
                return res.status(400).json({ error: "Invalid Suno Payload: missing songs" });
            }

            // Take the first song
            const firstSong = songsArray[0];

            // For 'complete' callback, use audio_url. For 'text' callback, use stream_audio_url
            const audioUrl = callbackType === 'complete'
                ? (firstSong.audio_url || firstSong.source_audio_url || firstSong.stream_audio_url || '')
                : (firstSong.stream_audio_url || firstSong.audio_url || '');
            const imageUrl = firstSong.image_url || '';
            const title = firstSong.title || '';
            const duration = firstSong.duration || null;

            console.log(`Suno ${callbackType} callback for Task ${taskId}: ${audioUrl ? 'success' : 'no audio URL'}`);

            const docRef = firestore.collection('generations').doc(taskId);
            const updateData = {
                status: audioUrl ? 'success' : 'waiting',
                audio_url: audioUrl,
                image_url: imageUrl,
                updated_at: new Date()
            };

            if (title) updateData.song_title = title;
            if (duration) updateData.duration = duration;

            await docRef.update(updateData);

            return res.status(200).json({ success: true });
        }

        // Original KIE Video callback format:
        // { code, msg, data: { taskId, state, resultJson, failMsg, ... } }
        const data = body.data || body;
        const taskId = data.taskId;
        const state = data.state; // "waiting", "success", "fail"

        if (!taskId || !state) {
            console.error('Invalid payload:', JSON.stringify(body));
            return res.status(400).json({ error: "Invalid Payload: missing taskId or state" });
        }

        console.log(`Video webhook for Task ${taskId}: ${state}`);

        // Extract video URL from resultJson if task succeeded
        let mediaUrl = null;
        if (state === 'success' && data.resultJson) {
            try {
                const result = typeof data.resultJson === 'string'
                    ? JSON.parse(data.resultJson)
                    : data.resultJson;
                if (result.resultUrls && result.resultUrls.length > 0) {
                    mediaUrl = result.resultUrls[0];
                }
            } catch (e) {
                console.error('Failed to parse resultJson:', e);
            }
        }

        // Update Firestore document
        const docRef = firestore.collection('generations').doc(taskId);
        const updateData = {
            status: state,
            updated_at: new Date()
        };

        if (mediaUrl) {
            updateData.video_url = mediaUrl;
        }

        if (state === 'fail' && data.failMsg) {
            updateData.fail_message = data.failMsg;
        }

        await docRef.update(updateData);

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

