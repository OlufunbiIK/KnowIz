// import { initializeApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey:
//     process.env.REACT_APP_FIREBASE_API_KEY ||
//     "AIzaSyDNRm3GADGakyVwGLGv4n37ErpvqPIuTVU",
//   authDomain: "quiz-app-af7ad.firebaseapp.com",
//   projectId: "quiz-app-af7ad",
//   storageBucket: "quiz-app-af7ad.firebasestorage.app",
//   messagingSenderId: "769405136775",
//   appId: "1:769405136775:web:604bcd34cc6d2e71e4ed22",
//   measurementId: "G-5CF827GGW4",
// };

// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// const provider = new GoogleAuthProvider();

// export { provider };

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyDNRm3GADGakyVwGLGv4n37ErpvqPIuTVU",
  authDomain: "quiz-app-af7ad.firebaseapp.com",
  projectId: "quiz-app-af7ad",
  storageBucket: "quiz-app-af7ad.firebasestorage.app",
  messagingSenderId: "769405136775",
  appId: "1:769405136775:web:604bcd34cc6d2e71e4ed22",
  measurementId: "G-5CF827GGW4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Optional: Add additional scopes
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Optional: Set custom parameters
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;
