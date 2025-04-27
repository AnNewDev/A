import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

console.log('History.js - Starting initialization');

// Function to save analysis results to Firebase
async function saveAnalysisResults(analysisData) {
    try {
        const userId = auth.currentUser.uid;
        const timestamp = new Date().toISOString();
        
        // Save everything directly to Firestore, including the image as base64
        const analysisRef = collection(db, 'analysis_history');
        await addDoc(analysisRef, {
            userId: userId,
            timestamp: timestamp,
            data: {
                ...analysisData,
                // Ensure the image is stored as base64
                imageUrl: analysisData.imageUrl || null
            }
        });

        console.log('Analysis results saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving analysis results:', error);
        throw error;
    }
}

// Function to check Firebase connectivity
async function checkFirebaseConnectivity() {
    try {
        // Try to make a simple request to Firestore
        const testRef = collection(db, 'connectivity_test');
        await getDocs(query(testRef, where('test', '==', true)));
        return true;
    } catch (error) {
        console.error('Firebase connectivity test failed:', error);
        return false;
    }
}

// Function to show toast notifications
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastEl = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toastEl.id = toastId;
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);

    // Initialize and show the toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    toast.show();

    // Remove the toast element after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Function to show connection error
function showConnectionError(container, error) {
    container.innerHTML = `
        <div class="text-center p-5 bg-light rounded">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h4 class="mb-3">Connection Error</h4>
            <p class="text-muted mb-4">We're having trouble connecting to our servers. This might be because:</p>
            <ul class="list-unstyled text-start mx-auto" style="max-width: 400px;">
                <li class="mb-2"><i class="fas fa-times-circle text-danger me-2"></i>An ad blocker is preventing the connection</li>
                <li class="mb-2"><i class="fas fa-times-circle text-danger me-2"></i>Your internet connection is unstable</li>
                <li class="mb-2"><i class="fas fa-times-circle text-danger me-2"></i>A browser security setting is blocking the connection</li>
            </ul>
            <div class="mt-4">
                <p class="mb-3">Try these solutions:</p>
                <ol class="text-start mx-auto" style="max-width: 400px;">
                    <li class="mb-2">Disable any ad blockers for this site</li>
                    <li class="mb-2">Check your internet connection</li>
                    <li class="mb-2">Try using a different browser</li>
                </ol>
            </div>
            ${error ? `<p class="text-danger mt-3"><small>Error details: ${error.message}</small></p>` : ''}
            <button onclick="location.reload()" class="btn btn-primary mt-4">
                <i class="fas fa-sync-alt me-2"></i>Try Again
            </button>
        </div>
    `;
}

// Function to load and display analysis history
async function loadAnalysisHistory() {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) {
        console.error('History container not found');
        return;
    }

    try {
        // Show initial loading state
        historyContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Checking connection...</p>
            </div>
        `;

        // Check Firebase connectivity first
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            showConnectionError(historyContainer);
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in, redirecting to signin');
            window.location.href = 'Signin.html';
            return;
        }

        const userId = user.uid;
        
        // Update loading message
        historyContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading your analysis history...</p>
            </div>
        `;
        
        // Get analysis history from Firestore
        const analysisRef = collection(db, 'analysis_history');
        const q = query(analysisRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        // Sort the results
        const sortedDocs = snapshot.docs.sort((a, b) => {
            const timeA = new Date(a.data().timestamp).getTime();
            const timeB = new Date(b.data().timestamp).getTime();
            return timeB - timeA; // descending order
        });

        if (snapshot.empty) {
            historyContainer.innerHTML = `
                <div class="text-center p-5">
                    <div class="empty-state bg-light rounded p-5">
                        <i class="fas fa-history fa-4x text-muted mb-4"></i>
                        <h3 class="mb-3">No Analysis History</h3>
                        <p class="text-muted mb-4">You haven't analyzed any food items yet. Start by analyzing your first food!</p>
                        <div class="d-flex justify-content-center gap-3">
                            <a href="main.html" class="btn btn-primary">
                                <i class="fas fa-camera me-2"></i>Analyze with Image
                            </a>
                            
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Create container for filters and cards
        historyContainer.innerHTML = `
            <div class="mb-4 d-flex justify-content-between align-items-center history-header">
                <h4 class="mb-0">
                    <i class="fas fa-history me-2 text-primary"></i>Your Analysis History
                </h4>
                <div class="d-flex gap-2">
                    <a href="main.html" class="btn btn-primary btn-sm">
                        <i class="fas fa-camera me-2"></i>New Analysis
                    </a>
                    
                </div>
            </div>
            <div class="row g-4" id="history-cards"></div>
        `;

        const historyCards = document.getElementById('history-cards');

        // Create cards for each analysis result
        for (const docSnapshot of sortedDocs) {
            const data = docSnapshot.data();
            const timestamp = new Date(data.timestamp).toLocaleString();
            const imageUrl = data.data.imageUrl || '';
            
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4 mb-4';
            
            // Unique ID for accordion collapse
            const uniqueId = `historyCollapse${data.id || Math.random().toString(36).substr(2, 9)}`;
            const card = document.createElement('div');
            card.className = 'card analysis-card mb-3';
            card.innerHTML = `
                <div class="card-header p-0" id="heading-${uniqueId}" style="cursor:pointer;">
                    <h5 class="mb-0">
                        <button class="btn btn-link d-flex align-items-center w-100 text-start px-4 py-3" type="button" data-bs-toggle="collapse" data-bs-target="#${uniqueId}" aria-expanded="false" aria-controls="${uniqueId}">
                            <i class="fas fa-utensils me-2"></i>
                            <span class="text-truncate flex-grow-1">${data.data.foodItems?.[0]?.name || data.data.foodName || 'Unknown Food'}</span>
                            <i class="fas fa-chevron-down ms-auto"></i>
                        </button>
                    </h5>
                </div>
                <div id="${uniqueId}" class="collapse" aria-labelledby="heading-${uniqueId}">
                    <div class="card-body">
                        <div class="card-actions mb-3">
                            <button class="card-action-btn delete" title="Delete from history">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="card-action-btn add" title="Add to calculator">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <span class="badge bg-light text-dark flex-grow-1 text-center" style="min-width:110px;">
                                <i class="fas fa-clock me-1"></i>${new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span class="badge bg-light text-dark flex-grow-1 text-center" style="min-width:110px;">
                                <i class="fas fa-clock me-1"></i>${new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span class="badge bg-primary flex-grow-1 text-center" style="min-width:110px;">
                                <i class="fas fa-${data.data.imageUrl ? 'camera' : 'keyboard'} me-1"></i>
                                ${data.data.imageUrl ? 'Image' : 'Text'} Analysis
                            </span>
                        </div>
                        <div class="analysis-details">
                            ${formatAnalysisData(data.data, imageUrl)}
                        </div>
                    </div>
                </div>`;

            // Add delete functionality
            const deleteBtn = card.querySelector('.card-action-btn.delete');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this analysis from history?')) {
                    try {
                        const docRef = doc(db, 'analysis_history', docSnapshot.id);
                        await deleteDoc(docRef);
                        col.remove();
                        showToast('Analysis deleted successfully', 'success');
                    } catch (error) {
                        console.error('Error deleting analysis:', error);
                        showToast('Failed to delete analysis', 'error');
                    }
                }
            });

            // Add to calculator functionality
            const addBtn = card.querySelector('.card-action-btn.add');
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Support both nutrition and nutritionInfo fields for compatibility
                const nutrition = data.data.nutrition || data.data.nutritionInfo || {};
                const foodName = data.data.foodName || (data.data.foodItems && data.data.foodItems[0]?.name) || 'Unknown Food';
                // Try to get calories from multiple possible sources
                // Explicitly check for calories inside nutrition property
                let calories = undefined;
                // Extract numeric value from nutrition.calories even if it contains text
                if (data.data.nutrition && data.data.nutrition.calories !== undefined) {
                    let caloRaw = data.data.nutrition.calories;
                    let caloNum = null;
                    if (typeof caloRaw === 'string') {
                        // Match first number (handles range and text)
                        const match = caloRaw.match(/\d+/);
                        if (match) {
                            caloNum = parseFloat(match[0]);
                        }
                    } else if (typeof caloRaw === 'number') {
                        caloNum = caloRaw;
                    }
                    if (caloNum !== null && !isNaN(caloNum)) {
                        calories = caloNum;
                        console.log('DEBUG: Parsed calories from string:', caloRaw, '->', caloNum);
                    }
                }
                if (calories === undefined && data.data.nutritionInfo && data.data.nutritionInfo.calories !== undefined) {
                    let caloRaw = data.data.nutritionInfo.calories;
                    let caloNum = null;
                    if (typeof caloRaw === 'string') {
                        const match = caloRaw.match(/\d+/);
                        if (match) {
                            caloNum = parseFloat(match[0]);
                        }
                    } else if (typeof caloRaw === 'number') {
                        caloNum = caloRaw;
                    }
                    if (caloNum !== null && !isNaN(caloNum)) {
                        calories = caloNum;
                        console.log('DEBUG: Parsed calories from nutritionInfo string:', caloRaw, '->', caloNum);
                    }
                }
                if (calories === undefined && data.data.foodItems && data.data.foodItems[0] && data.data.foodItems[0].calories !== undefined) {
                    let caloRaw = data.data.foodItems[0].calories;
                    let caloNum = null;
                    if (typeof caloRaw === 'string') {
                        const match = caloRaw.match(/\d+/);
                        if (match) {
                            caloNum = parseFloat(match[0]);
                        }
                    } else if (typeof caloRaw === 'number') {
                        caloNum = caloRaw;
                    }
                    if (caloNum !== null && !isNaN(caloNum)) {
                        calories = caloNum;
                        console.log('DEBUG: Parsed calories from foodItems string:', caloRaw, '->', caloNum);
                    }
                }
                if (calories === undefined && data.data.calories !== undefined) {
                    let caloRaw = data.data.calories;
                    let caloNum = null;
                    if (typeof caloRaw === 'string') {
                        const match = caloRaw.match(/\d+/);
                        if (match) {
                            caloNum = parseFloat(match[0]);
                        }
                    } else if (typeof caloRaw === 'number') {
                        caloNum = caloRaw;
                    }
                    if (caloNum !== null && !isNaN(caloNum)) {
                        calories = caloNum;
                        console.log('DEBUG: Parsed calories from data.data.calories string:', caloRaw, '->', caloNum);
                    }
                }
                if (calories === undefined) {
                    // Try to find calories in any nested field
                    function deepFindCalories(obj) {
                        if (!obj || typeof obj !== 'object') return undefined;
                        for (const key in obj) {
                            if (key.toLowerCase().includes('calorie') && !isNaN(Number(obj[key]))) {
                                return obj[key];
                            }
                            if (typeof obj[key] === 'object') {
                                const found = deepFindCalories(obj[key]);
                                if (found !== undefined) return found;
                            }
                        }
                        return undefined;
                    }
                    calories = deepFindCalories(data.data);
                    if (calories !== undefined) {
                        console.log('DEBUG: Found calories via deep search:', calories);
                    }
                }
                if (calories === undefined || calories === null || calories === '' || isNaN(Number(calories))) {
                    calories = 0;
                    console.log('DEBUG: Defaulting calories to 0. Data object:', data.data);
                    if (data.data.nutrition) {
                        console.log('DEBUG: nutrition object:', data.data.nutrition);
                        console.log('DEBUG: nutrition keys:', Object.keys(data.data.nutrition));
                    } else {
                        console.log('DEBUG: No nutrition object found. data.data keys:', Object.keys(data.data));
                    }
                }
                console.log('DEBUG: Final calories value used:', calories);
                // Get existing calculator items from localStorage
                let calculatorItems = JSON.parse(localStorage.getItem('calculatorItems') || '[]');
                // Add new item
                calculatorItems.push({
                    id: docSnapshot.id,
                    name: foodName,
                    calories: parseFloat(calories) || 0,
                    protein: parseFloat(nutrition.protein) || 0,
                    carbs: parseFloat(nutrition.carbs) || 0,
                    fat: parseFloat(nutrition.fat) || 0,
                    timestamp: new Date().toISOString()
                });
                // Save back to localStorage
                localStorage.setItem('calculatorItems', JSON.stringify(calculatorItems));
                showToast(`${foodName} added to calculator. <a href='calorie_calculator.html' class='text-white text-decoration-underline ms-2'>View Calculator</a>`, 'success');
            });
            
            col.appendChild(card);
            historyCards.appendChild(col);
        }
    } catch (error) {
        console.error('Error loading analysis history:', error);
        showConnectionError(historyContainer, error);
    }
}

// Helper function to format analysis data
function formatAnalysisData(data, imageUrl = '') {
    let html = '<div class="analysis-card-content">';

    // Add image if available
    if (imageUrl) {
        html += `
            <div class="analysis-image">
                <img src="${imageUrl}" alt="Food Image" class="img-fluid">
            </div>
        `;
    }

    // Add food name and basic info if available (from text analysis)
    if (data.foodName) {
        html += `
            <div class="food-info mb-4">
                <h5 class="food-name mb-3">
                    <i class="fas fa-utensils me-2 text-primary"></i>${data.foodName}
                </h5>
                <div class="food-meta d-flex flex-wrap gap-3 mb-3">
                    <span class="badge bg-primary">
                        <i class="fas fa-tag me-1"></i>${data.category || 'Unknown Category'}
                    </span>
                    <span class="badge bg-info">
                        <i class="fas fa-globe-asia me-1"></i>${data.cuisine || 'Unknown Cuisine'}
                    </span>
                </div>
            </div>
        `;
    }

    // Add nutritional information if available
    if (data.nutrition || data.calories) {
        html += `
            <div class="nutrition-info mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-chart-pie me-2 text-success"></i>Nutritional Information
                </h6>
                <div class="row g-3">
                    ${data.calories ? `
                        <div class="col-md-6">
                            <div class="nutrition-card p-3">
                                <h6 class="mb-2 text-success">Calories</h6>
                                <p class="mb-0 h5">${data.calories}</p>
                            </div>
                        </div>
                    ` : ''}
                    ${data.nutrition ? Object.entries(data.nutrition).map(([key, value]) => `
                        <div class="col-md-6">
                            <div class="nutrition-card p-3">
                                <h6 class="mb-2 text-success">${key.charAt(0).toUpperCase() + key.slice(1)}</h6>
                                <p class="mb-0 h5">${value}</p>
                            </div>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        `;
    }

    // Add ingredients if available
    if (data.ingredients && data.ingredients.length > 0) {
        html += `
            <div class="ingredients-section mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-mortar-pestle me-2 text-warning"></i>Main Ingredients
                </h6>
                <div class="ingredients-list">
                    ${data.ingredients.map(ingredient => `
                        <span class="badge me-2 mb-2 p-2">
                            <i class="fas fa-check me-1 text-success"></i>${ingredient}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Add image analysis results if available
    if (data.results && data.results.length > 0) {
        html += `
            <div class="image-analysis mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-camera me-2 text-info"></i>Image Analysis
                </h6>
                <ul class="analysis-items list-unstyled">
                    ${data.results.map(item => `
                        <li class="analysis-item p-3 mb-2">
                            <i class="fas fa-check-circle text-success me-2"></i>${item}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Add health tips if available
    if (data.healthTips && data.healthTips.length > 0) {
        html += `
            <div class="health-tips mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-heart me-2 text-danger"></i>Health Tips
                </h6>
                <ul class="tips-list list-unstyled">
                    ${data.healthTips.map(tip => `
                        <li class="tip-item p-3 mb-2">
                            <i class="fas fa-lightbulb text-warning me-2"></i>${tip}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Add alternatives if available
    if (data.alternatives && data.alternatives.length > 0) {
        html += `
            <div class="alternatives-section">
                <h6 class="mb-3">
                    <i class="fas fa-exchange-alt me-2 text-primary"></i>Healthier Alternatives
                </h6>
                <div class="alternatives-list">
                    ${data.alternatives.map(alt => `
                        <span class="badge bg-success text-white me-2 mb-2 p-2">
                            <i class="fas fa-leaf me-1"></i>${alt}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

// Function to ensure container exists
function getHistoryContainer() {
    const container = document.getElementById('history-container');
    if (!container) {
        // Try to create the container if it doesn't exist
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            const newContainer = document.createElement('div');
            newContainer.id = 'history-container';
            mainContainer.appendChild(newContainer);
            return newContainer;
        }
        console.error('Could not find or create history container');
        return null;
    }
    return container;
}

// Function to initialize the page
async function initializePage() {
    console.log('Initializing page...');
    
    const historyContainer = getHistoryContainer();
    if (!historyContainer) {
        console.error('History container not found and could not be created');
        return;
    }

    // Show loading state
    historyContainer.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading your history...</p>
        </div>
    `;

    try {
        // Check auth state
        const user = auth.currentUser;
        console.log('Current user:', user);
        
        if (user) {
            await loadAnalysisHistory();
        } else {
            console.log('User not authenticated, redirecting to signin');
            window.location.href = 'Signin.html';
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        historyContainer.innerHTML = `
            <div class="text-center text-danger p-5">
                <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                <p>Error loading history. Please try again.</p>
                <button onclick="window.location.reload()" class="btn btn-outline-danger mt-3">
                    <i class="fas fa-sync-alt me-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    // Wait for Firebase to be ready
    if (auth) {
        auth.onAuthStateChanged((user) => {
            console.log('Auth State Changed:', user ? 'User logged in' : 'No user');
            initializePage();
        });
    } else {
        console.error('Firebase Auth not initialized');
    }
});

// Export the saveAnalysisResults function
export { saveAnalysisResults };