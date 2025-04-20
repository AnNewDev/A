import { auth } from './firebase-config.js';
import { updateProfile, updateEmail, updatePassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const photoURLInput = document.getElementById('photoURL');
    const uidInput = document.getElementById('uid');
    const profileForm = document.getElementById('profile-settings-form');
    const emailChangeForm = document.getElementById('email-change-form');
    const passwordChangeForm = document.getElementById('password-change-form');
    const newEmailInput = document.getElementById('newEmail');
    const newPasswordInput = document.getElementById('newPassword');
    const profileMessage = document.getElementById('profile-message');
    const signOutBtn = document.getElementById('signOutBtn');

    // Load current user profile
    auth.onAuthStateChanged(user => {
        if (user) {
            displayNameInput.value = user.displayName || '';
            emailInput.value = user.email || '';
            photoURLInput.value = user.photoURL || '';
            uidInput.value = user.uid || '';
        } else {
            window.location.href = 'Signin.html';
        }
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        profileMessage.textContent = '';
        profileMessage.className = '';
        try {
            await updateProfile(user, {
                displayName: displayNameInput.value,
                photoURL: photoURLInput.value
            });
            profileMessage.textContent = 'Profile updated successfully!';
            profileMessage.className = 'alert alert-success';
        } catch (error) {
            profileMessage.textContent = 'Error updating profile: ' + error.message;
            profileMessage.className = 'alert alert-danger';
        }
    });

    emailChangeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        profileMessage.textContent = '';
        profileMessage.className = '';
        try {
            await updateEmail(user, newEmailInput.value);
            emailInput.value = newEmailInput.value;
            newEmailInput.value = '';
            profileMessage.textContent = 'Email updated successfully!';
            profileMessage.className = 'alert alert-success';
        } catch (error) {
            profileMessage.textContent = 'Error updating email: ' + error.message;
            profileMessage.className = 'alert alert-danger';
        }
    });

    passwordChangeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        profileMessage.textContent = '';
        profileMessage.className = '';
        try {
            await updatePassword(user, newPasswordInput.value);
            newPasswordInput.value = '';
            profileMessage.textContent = 'Password updated successfully!';
            profileMessage.className = 'alert alert-success';
        } catch (error) {
            profileMessage.textContent = 'Error updating password: ' + error.message;
            profileMessage.className = 'alert alert-danger';
        }
    });

    signOutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'Signin.html';
        } catch (error) {
            profileMessage.textContent = 'Error signing out: ' + error.message;
            profileMessage.className = 'alert alert-danger';
        }
    });
});
