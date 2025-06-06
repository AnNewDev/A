import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function validateSignupForm(email, password, confirmPassword) {
    if (!email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return false;
    }
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        alert("Invalid email format.");
        return false;
    }
    
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return false;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return false;
    }

    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    const signupBtn = document.getElementById("signup-btn");

    if (signupBtn) {
        signupBtn.addEventListener("click", () => {
            const email = document.getElementById("signup-email").value.trim();
            const password = document.getElementById("signup-password").value;
            const confirmPassword = document.getElementById("signup-confirm-password").value;
            
            if (validateSignupForm(email, password, confirmPassword)) {
                createUserWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        console.log('Created user:', user);
                        alert("Signup successful! Redirecting to login page...");
                        // Redirect to login page after successful signup
                        window.location.href = '/html/Signin.html';
                    })
                    .catch((error) => {
                        let errorMessage = 'Signup failed. Please try again.';
                        switch (error.code) {
                            case 'auth/email-already-in-use':
                                errorMessage = 'This email is already registered.';
                                break;
                            case 'auth/invalid-email':
                                errorMessage = 'Invalid email address.';
                                break;
                            case 'auth/operation-not-allowed':
                                errorMessage = 'Email/password accounts are not enabled.';
                                break;
                            case 'auth/weak-password':
                                errorMessage = 'Password is too weak.';
                                break;
                            default:
                                errorMessage = error.message;
                        }
                        alert(errorMessage);
                    });
            }
        });
    }
});
