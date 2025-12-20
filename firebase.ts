import {
  initializeApp,
  getApps,
  getApp,
  FirebaseError,
  type FirebaseApp,
} from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";

import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyB0WuKH1MfpZRLkgHHIfKmnkUl2GJFVPjI",
  authDomain: "mouve.in",
  databaseURL: "https://mouve-a1b2c3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mouve-a1b2c3",
  storageBucket: "mouve-a1b2c3.firebasestorage.app",
  messagingSenderId: "631882980911",
  appId: "1:631882980911:web:42c49cacb9e1638c8e30da",
  measurementId: "G-F561J6HF7E",
};

// let analytics: ReturnType<typeof getAnalytics> | undefined;
// if (typeof window !== 'undefined') {
//   isSupported().then((supported) => {
//     if (supported) {
//       analytics = getAnalytics(app);
//       console.log('Analytics initialized');
//     } else {
//       console.warn('Analytics not supported');
//     }
//   });
// }
// export { analytics };

export const analytics = undefined;

// App
let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  if (err instanceof FirebaseError) {
    console.error("Firebase init failed:", err.code, err.message);
  } else {
    console.error("Unexpected init error:", err);
  }
  throw new Error("Failed to initialize Firebase.");
}

// Auth (with persistence fallback for storage-restricted browsers like iOS Safari) [web:21][web:85]
export const auth: Auth = (() => {
  const authInstance = getAuth(app);

  // Try local → session → in-memory.
  // This avoids hard-failing on Safari environments where storage is blocked/partitioned. [web:21][web:85]
  setPersistence(authInstance, browserLocalPersistence)
    .catch(() => setPersistence(authInstance, browserSessionPersistence))
    .catch(() => setPersistence(authInstance, inMemoryPersistence))
    .catch((err) => console.error("Auth persistence error:", err));

  return authInstance;
})();

// Firestore
export const db: Firestore = (() => {
  try {
    return getFirestore(app);
  } catch (err) {
    console.error("Failed to initialize Firestore:", err);
    throw err;
  }
})();

// Functions
export const functions: Functions = getFunctions(app, "us-central1");

export default app;