import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { showToast, setButtonLoading } from './auth-utils.js';

// Initialize Google sign-in buttons
document.addEventListener('DOMContentLoaded', () => {
    const googleSigninBtn = document.getElementById('googleSignin');
    const googleSignupBtn = document.getElementById('googleSignup');

    const handleGoogleSignIn = async (button) => {
        try {
            // Set loading state
            setButtonLoading(button, true);

            // Initialize Google provider
            const provider = new GoogleAuthProvider();
            
            // Sign in with Google
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Show success message
            showToast('Successfully signed in with Google!', 'success');

            // Redirect to main page
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);

        } catch (error) {
            // Handle specific error cases
            let errorMessage = 'An error occurred during Google sign in';
            
            switch (error.code) {
                case 'auth/popup-blocked':
                    errorMessage = 'Please allow popups for this website';
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign in was cancelled';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = 'Sign in was cancelled';
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'An account already exists with this email';
                    break;
            }

            showToast(errorMessage, 'error');
        } finally {
            // Reset loading state
            setButtonLoading(button, false);
        }
    };

    // Add event listeners
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', () => handleGoogleSignIn(googleSigninBtn));
    }

    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', () => handleGoogleSignIn(googleSignupBtn));
    }
});
