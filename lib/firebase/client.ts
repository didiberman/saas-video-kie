import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    type Auth,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const isBrowser = typeof window !== "undefined";

let app: FirebaseApp | null = null;

const ensureFirebaseApp = (): FirebaseApp | null => {
    if (!isBrowser) return null;
    if (app) return app;

    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
        console.warn("Firebase config is missing. Did you set NEXT_PUBLIC_FIREBASE_* env vars?");
        return null;
    }

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    return app;
};

export const getFirebaseAuth = (): Auth | null => {
    const app = ensureFirebaseApp();
    if (!app) return null;

    const auth = getAuth(app);
    // Ensure persistence is set to LOCAL (default, but explicit is safer)
    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Auth persistence error:", error);
    });

    return auth;
};

export const getFirebaseFirestore = (): Firestore | null => {
    const app = ensureFirebaseApp();
    return app ? getFirestore(app) : null;
};

export const getGoogleProvider = (): GoogleAuthProvider | null => {
    if (!isBrowser) return null;
    return new GoogleAuthProvider();
};
