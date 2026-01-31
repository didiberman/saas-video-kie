import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

// Firestore lives in the gen-lang-client project, not the auth project
const firestoreConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gen-lang-client-0104807788",
};

const isBrowser = typeof window !== "undefined";

const ensureFirebaseApp = (): FirebaseApp | null => {
    if (!isBrowser) {
        return null;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
        console.warn("Firebase config is missing. Did you set NEXT_PUBLIC_FIREBASE_* env vars?");
        return null;
    }

    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
};

let firestoreApp: FirebaseApp | null = null;

const ensureFirestoreApp = (): FirebaseApp | null => {
    if (!isBrowser) return null;
    if (firestoreApp) return firestoreApp;

    // Check if there's already a "firestore" named app
    const existing = getApps().find(a => a.name === "firestore");
    if (existing) {
        firestoreApp = existing;
        return existing;
    }

    firestoreApp = initializeApp(firestoreConfig, "firestore");
    return firestoreApp;
};

export const getFirebaseAuth = (): Auth | null => {
    const app = ensureFirebaseApp();
    return app ? getAuth(app) : null;
};

export const getFirebaseFirestore = (): Firestore | null => {
    const app = ensureFirestoreApp();
    return app ? getFirestore(app) : null;
};

export const getGoogleProvider = (): GoogleAuthProvider | null => {
    if (!isBrowser) {
        return null;
    }

    return new GoogleAuthProvider();
};
