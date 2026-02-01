const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

admin.initializeApp();
const db = new Firestore();

functions.http('listTransactions', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid Token' });
        }

        const uid = decodedToken.uid;

        // Query transactions for this user, ordered by created_at desc
        const snapshot = await db.collection('transactions')
            .where('uid', '==', uid)
            .orderBy('created_at', 'desc')
            .limit(50)
            .get();

        const transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Format amount from cents to dollars (stripe uses cents)
                amount_display: (data.amount / 100).toFixed(2),
                created_at: data.created_at?.toDate?.()?.toISOString() || null
            };
        });

        return res.status(200).json({ transactions });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
