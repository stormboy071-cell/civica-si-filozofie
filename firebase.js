import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAnh8k1Ee6U9USCzYI0I7Ry_gOXcRC8kUg",
  authDomain: "civica-si-filozofie.firebaseapp.com",
  projectId: "civica-si-filozofie",
  storageBucket: "civica-si-filozofie.firebasestorage.app",
  messagingSenderId: "333853716959",
  appId: "1:333853716959:web:6ea991d05f810f3c54d46a",
  measurementId: "G-00DKXC98B6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
