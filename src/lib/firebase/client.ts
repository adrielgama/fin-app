import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { publicEnv } from "@/lib/env";

interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let client: FirebaseClient | undefined;

export function getFirebaseClient(): FirebaseClient {
  if (client) return client;

  const apiKey = publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) {
    throw new Error("Variáveis NEXT_PUBLIC_FIREBASE_* não configuradas (.env.local).");
  }

  const isNew = getApps().length === 0;
  const app = isNew
    ? initializeApp({
        apiKey,
        projectId,
        authDomain: publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        storageBucket: publicEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: publicEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
    : getApp();

  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  if (isNew && publicEnv.NEXT_PUBLIC_USE_FIREBASE_EMULATOR) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }

  client = { app, auth, db, storage };
  return client;
}
