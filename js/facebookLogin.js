import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, FacebookAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBEmGfW5lAQI0Dzy1cjlPOAfVYwnfVPSfE",
    authDomain: "jsa-sql.firebaseapp.com",
    projectId: "jsa-sql",
    appId: "1:627272462079:web:9f8e5a7ec132c6b672a6ca"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new FacebookAuthProvider();

document.getElementById("facebook-login").addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("User signed in:", result.user);
            alert("Facebook login successful!");
        })
        .catch((error) => {
            console.error("Error:", error);
        });
});