import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5oB2bciAwuIo-QWPVmyCfZKN_Q2vuU4k",
  authDomain: "neuropulse-5853d.firebaseapp.com",
  projectId: "neuropulse-5853d",
  storageBucket: "neuropulse-5853d.firebasestorage.app",
  messagingSenderId: "879753852909",
  appId: "1:879753852909:web:5931c434fcab8e504599e4",
  measurementId: "G-CLHH8XTGX6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;