import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase web config is not a secret — it's safe to ship in client code.
// Access control is enforced by Firestore/Storage security rules, not by hiding this.
const firebaseConfig = {
  apiKey: 'AIzaSyClFydujY2kTRvK-QnLLxdViPedjZ0xz6g',
  authDomain: 'studio-7719974604-964a7.firebaseapp.com',
  projectId: 'studio-7719974604-964a7',
  storageBucket: 'studio-7719974604-964a7.firebasestorage.app',
  messagingSenderId: '832705582175',
  appId: '1:832705582175:web:0ad26a20f0e9119591b7ea',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
