import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { showToast, setButtonLoading, togglePasswordVisibility, validateForm, updatePasswordStrength } from './auth-utils.js';

// Initialize password visibility toggles and strength indicator
document.addEventListener('DOMContentLoaded', () => {
    togglePasswordVisibility('password', 'passwordToggle');
    togglePasswordVisibility('confirmPassword', 'confirmPasswordToggle');

    // Add password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordStrength(
                e.target.value,
                'passwordStrengthBar',
                'passwordStrengthText'
            );
        });
    }
});

// Handle form submission
const signupForm = document.getElementById('signupForm');
const signupButton = document.getElementById('signupButton');

if (signupForm && signupButton) {
    signupForm.addEventListener('submit', async (e) => {
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
            },
            {
                id: 'confirmPassword',
                type: 'passwordConfirm',
                required: true,
                feedbackId: 'confirmPasswordFeedback',
                passwordId: 'password'
            }
        ]);

        // Validate terms checkbox
        const termsCheck = document.getElementById('termsCheck');
        const termsFeedback = document.getElementById('termsFeedback');
        
        if (!termsCheck.checked) {
            termsCheck.classList.add('is-invalid');
            termsFeedback.textContent = 'You must agree to the terms and conditions';
            termsFeedback.style.display = 'block';
            return;
        } else {
            termsCheck.classList.remove('is-invalid');
            termsFeedback.style.display = 'none';
        }

        if (!isValid) return;

        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            // Set loading state
            setButtonLoading(signupButton, true);

            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Show success message
            showToast('Account created successfully!', 'success');

            // Redirect to sign in page
            setTimeout(() => {
                window.location.href = 'Signin.html';
            }, 1000);

        } catch (error) {
            // Handle specific error cases
            let errorMessage = 'An error occurred during sign up';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
                    break;
            }

            showToast(errorMessage, 'error');
        } finally {
            // Reset loading state
            setButtonLoading(signupButton, false);
        }
    });
}
