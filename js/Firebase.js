import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { showToast, setButtonLoading, togglePasswordVisibility, validateForm } from './auth-utils.js';

// Initialize password visibility toggles
document.addEventListener('DOMContentLoaded', () => {
    togglePasswordVisibility('password', 'passwordToggle');
});

// Handle form submission
const signinForm = document.getElementById('signinForm');
const signinButton = document.getElementById('signinButton');

if (signinForm && signinButton) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        const isValid = validateForm([
            {
                id: 'email',
                type: 'email',
                required: true,
                feedbackId: 'emailFeedback'
            },
            {
                id: 'password',
                type: 'password',
                required: true,
                feedbackId: 'passwordFeedback'
            }
        ]);

        if (!isValid) return;

        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            // Set loading state
            setButtonLoading(signinButton, true);

            // Set persistence based on "Remember me" checkbox
            if (rememberMe) {
                await setPersistence(auth, browserLocalPersistence);
            }

            // Sign in user
            console.log('Attempting to sign in with:', email);
            
            // Add debug logging
            console.log('Firebase Auth State:', auth.currentUser ? 'User is signed in' : 'No user signed in');
            console.log('Firebase Config:', {
                apiKey: auth.app.options.apiKey,
                authDomain: auth.app.options.authDomain,
                projectId: auth.app.options.projectId
            });

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Sign in successful:', user.email);

            // Show success message
            showToast('Successfully signed in!', 'success');

            // Redirect to main page
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);

        } catch (error) {
            console.error('Sign in error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            
            // Handle specific error cases
            let errorMessage = 'An error occurred during sign in';
            
            switch (error.code) {
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password. Please try again or sign up if you don\'t have an account.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled. Please contact support.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address. Please check your email.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password sign in is not enabled. Please contact support.';
                    break;
                default:
                    errorMessage = `Authentication error: ${error.message}`;
            }

            showToast(errorMessage, 'error');

            // Clear password field on error
            document.getElementById('password').value = '';
        } finally {
            // Reset loading state
            setButtonLoading(signinButton, false);
        }
    });
}

// Handle forgot password
const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Implement forgot password functionality
        showToast('Password reset functionality coming soon!', 'info');
    });
}
