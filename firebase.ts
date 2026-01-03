import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFfD6ms9mSwl7JMXEG0dvR-BP8CaHfXV8",
  authDomain: "scrum-ai-manager.firebaseapp.com",
  projectId: "scrum-ai-manager",
  storageBucket: "scrum-ai-manager.firebasestorage.app",
  messagingSenderId: "954808690862",
  appId: "1:954808690862:web:62315382705701da57e53f",
  measurementId: "G-1YKPC776V0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);