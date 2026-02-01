sconst admin = require('firebase-admin');
const { Firestore } = require('@google-cloud/firestore');

// Initialize with specific project ID
admin.initializeApp({
    projectId: 'gen-lang-client-0104807788'
});

const db = new Firestore({
    projectId: 'gen-lang-client-0104807788'
});

async function backfill() {
    console.log("🚀 Starting Backfill of Generation Counts...");

    try {
        // 1. Fetch ALL generations (assuming reasonable size for script, otherwise use cursor)
        console.log("Fetching generations...");
        const snapshot = await db.collection('generations').select('user_id').get();
        console.log(`Found ${snapshot.size} total generation records.`);

        // 2. Aggregate counts in memory
        const userCounts = {};
        snapshot.forEach(doc => {
            const uid = doc.data().user_id;
            if (uid) {
                userCounts[uid] = (userCounts[uid] || 0) + 1;
            }
        });

        console.log(`Identified ${Object.keys(userCounts).length} unique users with history.`);

        // 3. Update Credits Documents
        const updatePromises = Object.entries(userCounts).map(async ([uid, count]) => {
            const ref = db.collection('credits').doc(uid);
            // Use set with merge to ensure doc exists or update existing
            try {
                await ref.set({ generation_count: count }, { merge: true });
                // console.log(`✅ Updated ${uid}: ${count}`);
            } catch (e) {
                console.error(`❌ Failed to update ${uid}:`, e.message);
            }
        });

        await Promise.all(updatePromises);

        console.log("🎉 Backfill Complete!");

    } catch (error) {
        console.error("Backfill failed:", error);
    }
}

backfill();
