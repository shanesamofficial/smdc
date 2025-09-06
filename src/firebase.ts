// Firebase initialization
// Ensure you define the following environment variables in a .env file (prefixed with VITE_ for Vite):
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
// Optional: VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

let firebaseAuth: any = null;
let firebaseStorage: any = null;

try {
  const app = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  try {
    firebaseStorage = getStorage(app);
  } catch (e) {
    firebaseStorage = null;
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error);
  // Create a mock auth object to prevent crashes
  firebaseAuth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    signOut: () => Promise.resolve(),
    sendPasswordResetEmail: () => Promise.reject(new Error('Firebase not configured')),
    updateProfile: () => Promise.reject(new Error('Firebase not configured')),
  };
  firebaseStorage = null;
}

export { firebaseAuth, firebaseStorage };
