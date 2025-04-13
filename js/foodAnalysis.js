import { handleImageAnalysis, getLanguageName } from './geminiAPI.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const uploadBtn = document.getElementById('uploadBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const fileInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('previewImage');
    const cameraPreview = document.getElementById('camera-preview');
    const resultContainer = document.getElementById('resultContainer');
    const foodName = document.getElementById('foodName');
    const calories = document.getElementById('calories');
    const cameraContainer = document.querySelector('.camera-container');
    const cameraOverlay = document.getElementById('cameraOverlay');
    const language = document.getElementById('language');

    let cameraStream = null;

    // Function to stop camera stream
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        if (cameraPreview) {
            cameraPreview.srcObject = null;
            cameraPreview.style.display = 'none';
        }
        if (captureBtn) {
            captureBtn.style.display = 'none';
        }
        if (cameraContainer) {
            cameraContainer.classList.remove('preview-active');
        }
        if (cameraBtn) {
            cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Open Camera';
            cameraBtn.classList.remove('btn-outline-danger');
            cameraBtn.classList.add('btn-outline-primary');
        }
    }

    // Function to start camera
    async function startCamera() {
        try {
            // First check if we already have a stream
            if (cameraStream) {
                stopCamera();
            }

            // Request camera access with specific constraints
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    aspectRatio: 16/9,
                    facingMode: 'user'
                }
            };

            // Request camera access
            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Update UI elements
            if (cameraPreview) {
                cameraPreview.srcObject = cameraStream;
                cameraPreview.style.display = 'block';
                await cameraPreview.play();
            }
            if (previewImage) {
                previewImage.style.display = 'none';
            }
            if (cameraContainer) {
                cameraContainer.classList.add('preview-active');
            }
            if (captureBtn) {
                captureBtn.style.display = 'block';
            }
            if (cameraBtn) {
                cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i> Close Camera';
                cameraBtn.classList.remove('btn-outline-primary');
                cameraBtn.classList.add('btn-outline-danger');
            }

        } catch (error) {
            console.error('Error accessing camera:', error);
            
            // Handle specific error cases
            let errorMessage = 'Could not access camera. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found on your device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Camera is already in use by another application.';
            } else {
                errorMessage += 'Please try again or use the upload option.';
            }

            // Show error to user
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger mt-3';
            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-circle me-2"></i>
                ${errorMessage}
            `;
            
            // Remove any existing alerts
            const existingAlert = document.querySelector('.alert-danger');
            if (existingAlert) {
                existingAlert.remove();
            }
            
            // Insert alert after the camera container
            if (cameraContainer) {
                cameraContainer.parentNode.insertBefore(alertDiv, cameraContainer.nextSibling);
            }
            
            // Reset camera button state
            if (cameraBtn) {
                cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Open Camera';
                cameraBtn.classList.remove('btn-outline-danger');
                cameraBtn.classList.add('btn-outline-primary');
            }

            // Show overlay on error
            if (cameraOverlay) {
                cameraOverlay.style.display = 'flex';
            }
        }
    }

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

            // Stop camera if running
            stopCamera();

            // Display preview
            if (previewImage) {
                previewImage.src = URL.createObjectURL(file);
                previewImage.style.display = 'block';
            }
            if (cameraPreview) {
                cameraPreview.style.display = 'none';
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
    // Handle camera button click
    if (cameraBtn) {
        cameraBtn.addEventListener('click', async () => {
            if (cameraStream) {
                stopCamera();
            } else {
                await startCamera();
            }
        });
    }

    // Handle capture button click
    if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
            if (!cameraStream) return;

            const canvas = document.createElement('canvas');
            canvas.width = cameraPreview.videoWidth;
            canvas.height = cameraPreview.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(cameraPreview, 0, 0);

            // Convert to blob
            canvas.toBlob(async (blob) => {
                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                
                // Display preview
                if (previewImage) {
                    previewImage.src = URL.createObjectURL(file);
                    previewImage.style.display = 'block';
                }

                // Stop camera and update UI
                stopCamera();
                if (cameraContainer) {
                    cameraContainer.classList.add('preview-active');
                }

                try {
                    // Get selected language
                    const selectedLanguage = language ? language.value : 'en';
                    await handleImageAnalysis(file, selectedLanguage);
                } catch (error) {
                    console.error('Error analyzing captured image:', error);
                }
            }, 'image/jpeg', 0.8);
        });
    }

    // Handle clear button click
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Stop camera if running
            stopCamera();
            
            // Clear file input
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Hide previews
            if (previewImage) {
                previewImage.style.display = 'none';
                previewImage.src = '';
            }
            if (cameraPreview) {
                cameraPreview.style.display = 'none';
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

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        stopCamera();
    });
});