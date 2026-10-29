import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

// User's confirmed Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCSNmGg4B2RNLgSyImpQH_uj_qVxltNDxo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "courtpiece-ab2f3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "courtpiece-ab2f3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "courtpiece-ab2f3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "419194815277",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:419194815277:web:015c3f8d70a08bedffc9a4",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);

    // Optional emulator support for local testing
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(db, host, 8080);
      console.info('[Firebase] Connected to local Firebase emulators');
    }
  } catch (err) {
    console.warn('[Firebase] Could not initialize Firebase SDK. Falling back to local multiplayer simulator.', err);
  }
}

export { app, auth, db };
