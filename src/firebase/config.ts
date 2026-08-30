import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Detect and prioritize active Firebase project configuration
let firebaseConfig: any = firebaseConfigJson;

try {
  const envConfig = (import.meta as any).env?.VITE_FIREBASE_CONFIG;
  if (envConfig) {
    firebaseConfig = typeof envConfig === 'string' ? JSON.parse(envConfig) : envConfig;
  }
} catch (e) {
  // Silent catch
}

if (!firebaseConfig || !firebaseConfig.apiKey) {
  try {
    const savedConfig = localStorage.getItem('pgj_custom_firebase_config');
    if (savedConfig) {
      firebaseConfig = JSON.parse(savedConfig);
    }
  } catch (e) {
    // Ignore invalid JSON in localStorage
  }
}

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig && (firebaseConfig.apiKey || firebaseConfig.projectId)
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    // If custom databaseId is specified, connect to that database
    if (firebaseConfig.firestoreDatabaseId) {
      dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(appInstance);
    }
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Live connection validator
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network status.');
    }
    return true;
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  updateProfile,
};
