import { auth } from "./firebase-config.js";
import { signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    const googleSignInBtn = document.getElementById("google-signin-btn");
    
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener("click", () => {
            signInWithPopup(auth, provider)
                .then((result) => {
                    const user = result.user;
                    console.log('Google sign in successful:', user);
                    // Redirect to main page after successful login
                    window.location.href = '/html/main.html';
                })
                .catch((error) => {
                    let errorMessage = 'Google sign in failed. Please try again.';
                    switch (error.code) {
                        case 'auth/popup-closed-by-user':
                            errorMessage = 'Sign in was cancelled.';
                            break;
                        case 'auth/popup-blocked':
                            errorMessage = 'Sign in popup was blocked by the browser.';
                            break;
                        case 'auth/cancelled-popup-request':
                            errorMessage = 'Another sign in request is in progress.';
                            break;
                        default:
                            errorMessage = error.message;
                    }
                    alert(errorMessage);
                });
        });
    }
});
