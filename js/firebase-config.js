// firebase-config.js
import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBEmGfW5lAQI0Dzy1cjlPOAfVYwnfVPSfE",
    authDomain: "jsa-sql.firebaseapp.com",
    projectId: "jsa-sql",
    storageBucket: "jsa-sql.appspot.com",
    messagingSenderId: "627272462079",
    appId: "1:627272462079:web:9f8e5a7ec132c6b672a6ca",
    measurementId: "G-XXXXXXXXXX" // Optional: Add your measurement ID if you're using Google Analytics
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    if (error.code === 'app/duplicate-app') {
        // If the app is already initialized, get the existing instance
        app = getApp();
    } else {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Add auth state observer for debugging
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('User is signed out');
    }
});

// Add error handler for auth
auth.onIdTokenChanged((user) => {
    if (user) {
        user.getIdToken().catch((error) => {
            console.error('Error getting ID token:', error);
        });
    }
});

export { auth, db };
