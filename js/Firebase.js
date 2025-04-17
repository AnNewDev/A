import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function validateLoginForm(email, password) {
    if (email === '' || password === '') {
        alert('Please fill in all fields');
        return false;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        alert('Invalid email format');
        return false;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return false;
    }
    return true;
}

function signinFirebase(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('Logged in user:', user);
            // Redirect to main page after successful login
            window.location.href = '/html/main.html';
        })
        .catch((error) => {
            let errorMessage = 'Login failed. Please try again.';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                default:
                    errorMessage = error.message;
            }
            alert(errorMessage);
        });
}

// Add event listener for login button
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.querySelector('#login_btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.querySelector('#email').value;
            const password = document.querySelector('#password').value;
            
            if (validateLoginForm(email, password)) {
                signinFirebase(email, password);
            }
        });
    }
});
