import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAQxVKVzpnjIOexdz-8Qu3gD-SYS9BUb68",
  authDomain: "incendio-77357.firebaseapp.com",
  projectId: "incendio-77357",
  storageBucket: "incendio-77357.firebasestorage.app",
  messagingSenderId: "630172863236",
  appId: "1:630172863236:web:de8d38678476f48ab65e51",
  measurementId: "G-LL56QGSRHE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

