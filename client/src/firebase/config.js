import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAGcC9kbz2UbHOByD4CPq3vPnTCc9djyIo',
  authDomain: 'expense-tracker-korifcan.firebaseapp.com',
  projectId: 'expense-tracker-korifcan',
  storageBucket: 'expense-tracker-korifcan.firebasestorage.app',
  messagingSenderId: '680777959016',
  appId: '1:680777959016:web:b2656cf97446e5ebb59ddd',
  measurementId: 'G-YVXKN9K4YG',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
