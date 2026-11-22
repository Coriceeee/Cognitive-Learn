import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { resolveLocalFirebaseEmulators } from "./localFirebaseEmulators";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Resolve safety before creating any SDK client. If QA was requested but the
// origin/identity is unsafe, throw instead of silently using live Firebase.
const emulator = resolveLocalFirebaseEmulators({
  enabled: import.meta.env.VITE_USE_FIREBASE_EMULATORS,
  mode: import.meta.env.MODE,
  hostname: typeof window === 'undefined' ? '' : window.location.hostname,
  protocol: typeof window === 'undefined' ? '' : window.location.protocol,
  projectId: firebaseConfig.projectId,
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
});

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure both SDKs before any component attaches auth or Firestore listeners.
if (emulator) {
  connectAuthEmulator(auth, `http://${emulator.host}:${emulator.authPort}`, {disableWarnings: true});
  connectFirestoreEmulator(db, emulator.host, emulator.firestorePort);
}