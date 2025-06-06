import { auth } from './firebase-config.js';
import { updateProfile, updateEmail, updatePassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

export function loadUserProfile({ displayNameInput, emailInput, uidInput, avatarCircle, userNameSpan, photoPreview }) {
    auth.onAuthStateChanged(user => {
        if (user) {
            if (displayNameInput) displayNameInput.value = user.displayName || '';
            if (emailInput) emailInput.value = user.email || '';
            if (uidInput) uidInput.value = user.uid || '';
            if (avatarCircle) avatarCircle.textContent = user.displayName ? user.displayName.split(' ').map(n=>n[0]).join('').toUpperCase() : 'U';
            if (userNameSpan) userNameSpan.textContent = user.displayName || 'User';
            if (photoPreview && user.photoURL) {
                photoPreview.src = user.photoURL;
                photoPreview.style.display = 'block';
            }
        } else {
            // Redirect to sign in if on profile page
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'Signin.html';
            }
        }
    });
}

// Uploads a profile picture to Imgur and returns the public image URL
export async function uploadProfilePicture(file, user, callback) {
    if (!file || !user) return null;
    try {
        const clientId = 'dacff5a5b670c5c'; // User's Imgur Client ID
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: { Authorization: 'Client-ID ' + clientId },
            body: formData
        });
        const data = await res.json();
        if (data.success && data.data && data.data.link) {
            if (callback) callback('Profile picture uploaded!', 'success');
            return data.data.link;
        } else {
            // Debug: log Imgur API response
            console.error('Imgur upload failed:', data);
            if (callback) callback('Imgur upload failed: ' + (data.data && data.data.error ? data.data.error : JSON.stringify(data)), 'danger');
            throw new Error(data.data && data.data.error ? data.data.error : 'Imgur upload failed');
        }
    } catch (error) {
        if (callback) callback('Error uploading profile picture: ' + error.message, 'danger');
        return null;
    }
}

export async function saveProfile(displayName, photoURL, messageCallback) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await updateProfile(user, { displayName, photoURL });
        messageCallback('Profile updated successfully!', 'success');
    } catch (error) {
        messageCallback('Error updating profile: ' + error.message, 'danger');
    }
}

export async function changeEmail(newEmail, messageCallback, emailInput) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await updateEmail(user, newEmail);
        if (emailInput) emailInput.value = newEmail;
        messageCallback('Email updated successfully!', 'success');
    } catch (error) {
        messageCallback('Error updating email: ' + error.message, 'danger');
    }
}

export async function changePassword(newPassword, messageCallback) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await updatePassword(user, newPassword);
        messageCallback('Password updated successfully!', 'success');
    } catch (error) {
        messageCallback('Error updating password: ' + error.message, 'danger');
    }
}

export async function handleSignOut(messageCallback) {
    try {
        await signOut(auth);
        window.location.href = 'Signin.html';
    } catch (error) {
        if (messageCallback) messageCallback('Error signing out: ' + error.message, 'danger');
    }
}
