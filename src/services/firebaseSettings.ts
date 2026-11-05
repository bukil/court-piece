// User's confirmed Firebase configuration
export const firebaseConfig = {
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

