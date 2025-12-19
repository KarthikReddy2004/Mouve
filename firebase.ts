//import type { getAnalytics } from "firebase/analytics";
import { initializeApp, getApps, getApp, FirebaseError, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
//import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyB0WuKH1MfpZRLkgHHIfKmnkUl2GJFVPjI",
  authDomain: "mouve-a1b2c3.firebaseapp.com",
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

let analytics : undefined;
export { analytics };

let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  if (err instanceof FirebaseError) {
    console.error("initialization failed:", err.code, err.message);
  } else {
    console.error("Unexpected error:", err);
  }
  throw new Error("Failed to initialize.");
}

export const auth = (() => {
  try {
    return getAuth(app);
  } catch (err) {
    console.error("Failed to initialize Auth:", err);
    throw err;
  }
})();

export const db: Firestore = (() => {
  try {
    return getFirestore(app);
  } catch (err) {
    console.error("Failed to initialize Database:", err);
    throw err;
  }
})();

export const functions: Functions = getFunctions(app, "us-central1");

export default app;