import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// KONFIGURASI FIREBASE WARUNG MADONA
const firebaseConfig = {
  apiKey: "AIzaSyAFCQw6Z6xMKRfJtSyD6HqOFxvLhj26J3w",
  authDomain: "warung-madona.firebaseapp.com",
  projectId: "warung-madona",
  storageBucket: "warung-madona.firebasestorage.app",
  messagingSenderId: "344709595688",
  appId: "1:344709595688:web:7a7bc2e65706a32854ab1d",
  measurementId: "G-SBW637XJZF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// NOMOR WA WARUNG MADONA
const WA_MADONA = "6281412405437"; 

// ... (biarkan sisa kode di bawahnya tetap sama) ...