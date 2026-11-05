import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

import { firebaseConfig, isFirebaseConfigured } from './firebaseSettings';
export { isFirebaseConfigured } from './firebaseSettings';

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
