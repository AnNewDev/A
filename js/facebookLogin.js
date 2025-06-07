import { auth } from './firebase-config.js';
import { FacebookAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { showToast, setButtonLoading } from './auth-utils.js';

// Initialize Facebook sign-in buttons
document.addEventListener('DOMContentLoaded', () => {
    const facebookSigninBtn = document.getElementById('facebookSignin');
    const facebookSignupBtn = document.getElementById('facebookSignup');

    const handleFacebookSignIn = async (button) => {
        try {
            // Set loading state
            setButtonLoading(button, true);

            // Initialize Facebook provider
            const provider = new FacebookAuthProvider();
            
            // Add scopes
            provider.addScope('email');
            provider.addScope('public_profile');
            
            // Sign in with Facebook
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Show success message
            showToast('Successfully signed in with Facebook!', 'success');

            // Redirect to main page
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);

        } catch (error) {
            // Handle specific error cases
            let errorMessage = 'An error occurred during Facebook sign in';
            
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
                case 'auth/facebook-auth-disabled':
                    errorMessage = 'Facebook authentication is not enabled';
                    break;
            }

            showToast(errorMessage, 'error');
        } finally {
            // Reset loading state
            setButtonLoading(button, false);
        }
    };

    // Add event listeners
    if (facebookSigninBtn) {
        facebookSigninBtn.addEventListener('click', () => handleFacebookSignIn(facebookSigninBtn));
    }

    if (facebookSignupBtn) {
        facebookSignupBtn.addEventListener('click', () => handleFacebookSignIn(facebookSignupBtn));
    }
});