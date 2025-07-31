// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUt0FAjGWFP1Lr8l4SNNt5rOUFyAeiPcs",
  authDomain: "jmseller.firebaseapp.com",
  projectId: "jmseller",
  storageBucket: "jmseller.firebasestorage.app",
  messagingSenderId: "87948039014",
  appId: "1:87948039014:web:e028f9158ce48d86766ea7",
  measurementId: "G-VX398KHQ20"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, RecaptchaVerifier, signInWithPhoneNumber };
