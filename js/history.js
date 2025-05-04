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

// --- New UI State ---
let allHistoryDocs = [];
let selectedDate = null;
let selectedMeal = 'breakfast';

// --- Helper: Format date as YYYY-MM-DD ---
function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// --- Helper: Capitalize first letter ---
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Render Date Selector ---
function renderDateSelector(dates) {
    const dateSelector = document.getElementById('date-selector');
    dateSelector.innerHTML = '';
    dates.forEach(date => {
        const btn = document.createElement('button');
        btn.className = 'date-btn' + (date === selectedDate ? ' active' : '');
        btn.textContent = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        btn.onclick = () => {
            selectedDate = date;
            renderDateSelector(dates);
            renderFoodCards();
        };
        dateSelector.appendChild(btn);
    });
}

// --- Render Meal Tabs ---
function renderMealTabs() {
    const mealTabs = document.getElementById('meal-tabs');
    Array.from(mealTabs.children).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.meal === selectedMeal);
        tab.onclick = () => {
            selectedMeal = tab.dataset.meal;
            renderMealTabs();
            renderFoodCards();
        };
    });
}

// --- Render Food Cards ---
function renderFoodCards() {
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = '';
    // Filter docs by selected date and meal
    const filtered = allHistoryDocs.filter(doc => {
        const data = doc.data();
        const docDate = formatDate(data.timestamp);
        // Try to get meal type, fallback to 'breakfast'
        const meal = (data.data.mealType || 'breakfast').toLowerCase();
        return docDate === selectedDate && meal === selectedMeal;
    });
    if (filtered.length === 0) {
        historyContainer.innerHTML = `<div class="text-center text-muted p-5">No records for this meal and date.</div>`;
        return;
    }
    filtered.forEach(doc => {
        const data = doc.data();
        const food = data.data;
        const imageUrl = food.imageUrl || 'https://img.icons8.com/ios-filled/50/meal.png';
        const foodName = food.foodName || (food.foodItems && food.foodItems[0]?.name) || 'Unknown Food';
        const kcal = food.calories || (food.nutrition && food.nutrition.calories) || (food.foodItems && food.foodItems[0]?.calories) || '--';
        const weight = food.weight || (food.foodItems && food.foodItems[0]?.weight) || '--';
        const protein = (food.nutrition && food.nutrition.protein) || '--';
        const carbs = (food.nutrition && food.nutrition.carbs) || '--';
        const fat = (food.nutrition && food.nutrition.fat) || '--';
        // Card
        const card = document.createElement('div');
        card.className = 'food-card';
        card.innerHTML = `
            <img class="food-img" src="${imageUrl}" alt="Food">
            <div class="food-info">
                <div class="food-title">${foodName}</div>
                <div class="food-meta">
                    <span class="kcal-fire"><i class="fas fa-fire"></i></span>${kcal} kcal
                    <span style="color:#bbb;font-size:0.97em;">${weight !== '--' ? '· ' + weight + ' G' : ''}</span>
                </div>
                <div class="nutrients mt-2">
                    <div class="nutrient protein"><span style="display:inline-block;width:8px;height:8px;background:#2ecc40;border-radius:2px;margin-right:4px;"></span>${protein} <span class="nutrient-label">Protein</span></div>
                    <div class="nutrient carbs"><span style="display:inline-block;width:8px;height:8px;background:#f1c40f;border-radius:2px;margin-right:4px;"></span>${carbs} <span class="nutrient-label">Carbs</span></div>
                    <div class="nutrient fat"><span style="display:inline-block;width:8px;height:8px;background:#a569bd;border-radius:2px;margin-right:4px;"></span>${fat} <span class="nutrient-label">Fat</span></div>
                </div>
            </div>
            <button class="menu-btn" title="More actions"><i class="fas fa-ellipsis-h"></i></button>
        `;
        // Menu button (placeholder for now)
        card.querySelector('.menu-btn').onclick = (e) => {
            e.stopPropagation();
            // You can implement a dropdown or modal for actions here
            alert('More actions coming soon!');
        };
        historyContainer.appendChild(card);
    });
}

// --- Main load function ---
async function loadAnalysisHistory() {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) return;
    historyContainer.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-3">Loading your analysis history...</p></div>`;
    try {
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) { showConnectionError(historyContainer); return; }
        const user = auth.currentUser;
        if (!user) { window.location.href = 'Signin.html'; return; }
        const userId = user.uid;
        const analysisRef = collection(db, 'analysis_history');
        const q = query(analysisRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        allHistoryDocs = snapshot.docs;
        if (allHistoryDocs.length === 0) {
            historyContainer.innerHTML = `<div class="text-center p-5"><div class="empty-state bg-light rounded p-5"><i class="fas fa-history fa-4x text-muted mb-4"></i><h3 class="mb-3">No Analysis History</h3><p class="text-muted mb-4">You haven't analyzed any food items yet. Start by analyzing your first food!</p><div class="d-flex justify-content-center gap-3"><a href="main.html" class="btn btn-primary"><i class="fas fa-camera me-2"></i>Analyze with Image</a></div></div></div>`;
            return;
        }
        // Get all unique dates
        const dates = Array.from(new Set(allHistoryDocs.map(doc => formatDate(doc.data().timestamp)))).sort((a, b) => new Date(b) - new Date(a));
        selectedDate = selectedDate || dates[0];
        renderDateSelector(dates);
        renderMealTabs();
        renderFoodCards();
    } catch (error) {
        showConnectionError(historyContainer, error);
    }
}

// --- Init on page load ---
document.addEventListener('DOMContentLoaded', () => {
    loadAnalysisHistory();
});

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