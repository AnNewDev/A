import { handleImageAnalysis, getLanguageName } from './geminiAPI.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('previewImage');
    const resultContainer = document.getElementById('resultContainer');
    const foodName = document.getElementById('foodName');
    const calories = document.getElementById('calories');
    const cameraContainer = document.querySelector('.camera-container');
    const cameraOverlay = document.getElementById('cameraOverlay');
    const language = document.getElementById('language');

    // Handle file upload button click
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // Handle file selection
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Display preview
            if (previewImage) {
                previewImage.src = URL.createObjectURL(file);
                previewImage.style.display = 'block';
            }
            if (cameraContainer) {
                cameraContainer.classList.add('preview-active');
            }

            try {
                // Get selected language
                const selectedLanguage = language ? language.value : 'en';
                await handleImageAnalysis(file, selectedLanguage);
            } catch (error) {
                console.error('Error analyzing uploaded image:', error);
            }
        });
    }

    // Handle clear button click
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Clear file input
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Hide previews
            if (previewImage) {
                previewImage.style.display = 'none';
                previewImage.src = '';
            }
            if (cameraContainer) {
                cameraContainer.classList.remove('preview-active');
            }
            
            // Clear results
            if (resultContainer) {
                resultContainer.style.display = 'none';
            }
            if (foodName) {
                foodName.innerHTML = '';
            }
            if (calories) {
                calories.innerHTML = '';
            }

            // Remove any loading indicators
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        });
    }
});