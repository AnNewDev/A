import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc as importedDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

console.log('History.js - Starting initialization');

// Function to save analysis results to Firebase
async function saveAnalysisResults(analysisData) {
    // Debug log for imageUrl
    console.log('[saveAnalysisResults] analysisData.imageUrl:', analysisData.imageUrl);
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
function showToast(message, type = 'info', buttonLabel = null, buttonCallback = null) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    if (!toastContainer) {
        alert(message); // fallback
        return;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
                ${buttonLabel ? `<button class="btn btn-light btn-sm ms-3" id="toast-action-btn">${buttonLabel}</button>` : ''}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    toastContainer.appendChild(toast);

    // Button action
    if (buttonLabel && buttonCallback) {
        const btn = toast.querySelector('#toast-action-btn');
        if (btn) btn.onclick = buttonCallback;
    }

    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);

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
const mealTypes = ['all', 'breakfast', 'lunch', 'dinner'];

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
    if (!dateSelector) {
        return;
    }
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
    if (!mealTabs) return;
    mealTabs.innerHTML = '';
    mealTypes.forEach(type => {
        const tab = document.createElement('button');
        tab.className = 'meal-tab' + (selectedMeal === type ? ' active' : '');
        tab.dataset.meal = type;
        tab.textContent = type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1);
        tab.onclick = () => {
            if (selectedMeal !== type) {
                selectedMeal = type;
                renderMealTabs();
                renderFoodCards();
            }
        };
        mealTabs.appendChild(tab);
    });
}
// Ensure meal tab click works on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMealTabs);
} else {
    renderMealTabs();
}


// --- Render Food Cards ---
function renderFoodCards() {
    // Only render if on history.html
    if (!window.location.pathname.includes('history.html')) return;
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) {
        return;
    }
    historyContainer.innerHTML = '';
    // Filter docs by selected date and meal
    const filtered = allHistoryDocs.filter(doc => {
        const data = doc.data();
        const docDate = formatDate(data.timestamp);
        // Try to get meal type, fallback to 'breakfast'
        const mealType = data.data.mealType || 'breakfast';
        const matchMeal = selectedMeal === 'all' || selectedMeal === mealType;
        return (!selectedDate || docDate === selectedDate) && matchMeal;
    });
    if (filtered.length === 0) {
        if (window.location.pathname.includes('history.html')) {
            historyContainer.innerHTML = `<div class="text-center text-muted p-5">No records for this meal and date.</div>`;
        } else {
            historyContainer.innerHTML = '';
        }
        return;
    }
    filtered.forEach(doc => {
        const data = doc.data();
        const food = data.data;
        const imageUrl = food.imageUrl && food.imageUrl.startsWith('data:image') ? food.imageUrl : 'https://img.icons8.com/ios-filled/200/meal.png';
        // Always pull from all possible sources and fallback to 0
        const foodName = food.foodName || (food.foodItems && food.foodItems[0]?.name) || 'Unknown Food';
        // Defensive: always show 0 if value is missing or NaN, check all sources
        let kcal = (food.nutrition && food.nutrition.calories) || (food.foodItems && food.foodItems[0]?.calories) || food.calories;
        let protein = (food.nutrition && food.nutrition.protein) || (food.foodItems && food.foodItems[0]?.protein) || food.protein;
        let carbs = (food.nutrition && food.nutrition.carbs) || (food.foodItems && food.foodItems[0]?.carbs) || food.carbs;
        let fat = (food.nutrition && food.nutrition.fat) || (food.foodItems && food.foodItems[0]?.fat) || food.fat;
        kcal = isNaN(Number(kcal)) || kcal === undefined || kcal === null ? 0 : Number(kcal);
        protein = isNaN(Number(protein)) || protein === undefined || protein === null ? 0 : Number(protein);
        carbs = isNaN(Number(carbs)) || carbs === undefined || carbs === null ? 0 : Number(carbs);
        fat = isNaN(Number(fat)) || fat === undefined || fat === null ? 0 : Number(fat);

        const card = document.createElement('div');
        card.className = 'food-card';
        card.innerHTML = `
            <div class="food-info">
                <div class="food-image mb-2" style="text-align:center;">
                    <img src="${imageUrl}" alt="Food Image" style="max-width: 80px; max-height: 80px; border-radius: 8px; object-fit: cover; background: #f8f8f8;" />
                </div>
                <h5 class="food-name mb-3">
                    <i class="fas fa-utensils me-2 text-primary"></i>${foodName}
                </h5>
                <div class="analysis-time" style="color:#888;font-size:0.93em;margin-bottom:2px;">
                    <i class="far fa-clock me-1"></i>Analyzed at: ${new Date(data.timestamp).toLocaleString()}
                </div>
                <div class="nutrients mt-2">
                    <div class="nutrient protein"><span style="display:inline-block;width:8px;height:8px;background:#2ecc40;border-radius:2px;margin-right:4px;"></span>${protein} <span class="nutrient-label">Protein</span></div>
                    <div class="nutrient carbs"><span style="display:inline-block;width:8px;height:8px;background:#f1c40f;border-radius:2px;margin-right:4px;"></span>${carbs} <span class="nutrient-label">Carbs</span></div>
                    <div class="nutrient fat"><span style="display:inline-block;width:8px;height:8px;background:#a569bd;border-radius:2px;margin-right:4px;"></span>${fat} <span class="nutrient-label">Fat</span></div>
                </div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn menu-btn" aria-label="More actions" title="More actions"><i class="fas fa-ellipsis-h"></i></button>
                <button class="card-action-btn delete delete-btn" aria-label="Delete" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Menu button: show calories chart and add-to-calculator
        card.querySelector('.menu-btn').onclick = (e) => {
            // Re-evaluate nutrition for modal to ensure correct values
            let modalKcal = (food.nutrition && food.nutrition.calories) || (food.foodItems && food.foodItems[0]?.calories) || food.calories;
            let modalProtein = (food.nutrition && food.nutrition.protein) || (food.foodItems && food.foodItems[0]?.protein) || food.protein;
            let modalCarbs = (food.nutrition && food.nutrition.carbs) || (food.foodItems && food.foodItems[0]?.carbs) || food.carbs;
            let modalFat = (food.nutrition && food.nutrition.fat) || (food.foodItems && food.foodItems[0]?.fat) || food.fat;
            modalKcal = isNaN(Number(modalKcal)) || modalKcal === undefined || modalKcal === null ? 0 : Number(modalKcal);
            modalProtein = isNaN(Number(modalProtein)) || modalProtein === undefined || modalProtein === null ? 0 : Number(modalProtein);
            modalCarbs = isNaN(Number(modalCarbs)) || modalCarbs === undefined || modalCarbs === null ? 0 : Number(modalCarbs);
            modalFat = isNaN(Number(modalFat)) || modalFat === undefined || modalFat === null ? 0 : Number(modalFat);
            e.stopPropagation();

            // Remove existing modal if present
            let existingModal = document.getElementById('food-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create new modal
            let modal = document.createElement('div');
            modal.id = 'food-modal';
            modal.innerHTML = `
                <div class="food-modal-overlay">
                    <div class="food-modal food-modal-content food-modal-vertical">
                        <button id="close-food-modal" class="food-modal-close" aria-label="Close">&times;</button>
                        <div class="food-modal-details">
                            <div class="food-modal-title">Food Details</div>
                            <div class="food-modal-foodname">${foodName}</div>
                            <div class="food-modal-kcal">
                                <span id="modal-calories">${modalKcal}</span> kcal
                                <div class="quantity-selector mt-2">
                                    <button class="quantity-btn" id="decrease-quantity">-</button>
                                    <input type="number" id="food-quantity" value="1" min="1" max="100">
                                    <button class="quantity-btn" id="increase-quantity">+</button>
                                </div>
                            </div>
                            <div class="food-modal-chart-wrapper">
                                <canvas id="modal-calories-chart" width="180" height="180" style="margin:0 auto;display:block;"></canvas>
                                <div class="food-modal-legend"></div>
                            </div>
                            <img src="${imageUrl}" alt="Food Image" class="food-modal-img" style="margin: 1.3rem auto 0.7rem auto;">
                            <div class="food-modal-btn-row">
                                <button id="add-to-calculator-btn" class="btn btn-primary food-modal-btn">Add to Calories Calculator</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';

            // Render chart
            const ctx = modal.querySelector('#modal-calories-chart').getContext('2d');
            if (window.modalCaloriesChart) window.modalCaloriesChart.destroy();

            // Calculate total for percentages
            const total = modalProtein + modalCarbs + modalFat;
            const proteinPercentage = Math.round((modalProtein / total) * 100);
            const carbsPercentage = Math.round((modalCarbs / total) * 100);
            const fatPercentage = Math.round((modalFat / total) * 100);

            window.modalCaloriesChart = new window.Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Protein', 'Carbs', 'Fat'],
                    datasets: [{
                        data: [modalProtein, modalCarbs, modalFat],
                        backgroundColor: ['#2ecc40','#f1c40f','#a569bd'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    plugins: {
                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const percentage = context.dataset.data[context.dataIndex] / total * 100;
                                    return `${label}: ${value}g (${Math.round(percentage)}%)`;
                                }
                            }
                        }
                    },
                    cutout: '65%',
                    responsive: false,
                    maintainAspectRatio: false
                }
            });

            // Custom legend with percentages and values
            const legendDiv = modal.querySelector('.food-modal-legend');
            legendDiv.innerHTML = `
                <div class="nutrient-legend">
                    <div class="nutrient-item">
                        <span class="nutrient-dot" style="background:#2ecc40"></span>
                        <span class="nutrient-label">Protein: ${modalProtein}g (${proteinPercentage}%)</span>
                    </div>
                    <div class="nutrient-item">
                        <span class="nutrient-dot" style="background:#f1c40f"></span>
                        <span class="nutrient-label">Carbs: ${modalCarbs}g (${carbsPercentage}%)</span>
                    </div>
                    <div class="nutrient-item">
                        <span class="nutrient-dot" style="background:#a569bd"></span>
                        <span class="nutrient-label">Fat: ${modalFat}g (${fatPercentage}%)</span>
                    </div>
                </div>
            `;

            // Close modal handler
            modal.querySelector('#close-food-modal').onclick = () => {
                modal.style.display = 'none';
            };
            modal.querySelector('.food-modal-overlay').onclick = (ev) => {
                if (ev.target === modal.querySelector('.food-modal-overlay')) modal.style.display = 'none';
            };

            // Add quantity selector event listeners
            const quantityInput = modal.querySelector('#food-quantity');
            const decreaseBtn = modal.querySelector('#decrease-quantity');
            const increaseBtn = modal.querySelector('#increase-quantity');
            const caloriesDisplay = modal.querySelector('#modal-calories');

            function updateCalories() {
                const quantity = parseInt(quantityInput.value);
                const baseCalories = modalKcal;
                const totalCalories = baseCalories * quantity;
                caloriesDisplay.textContent = totalCalories;
            }

            decreaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                    updateCalories();
                }
            });

            increaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue < 100) {
                    quantityInput.value = currentValue + 1;
                    updateCalories();
                }
            });

            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value);
                if (isNaN(value) || value < 1) value = 1;
                if (value > 100) value = 100;
                quantityInput.value = value;
                updateCalories();
            });

            // Update the add to calculator button to include quantity
            modal.querySelector('#add-to-calculator-btn').onclick = () => {
                const quantity = parseInt(quantityInput.value);
                const totalCalories = modalKcal * quantity;
                const totalProtein = modalProtein * quantity;
                const totalCarbs = modalCarbs * quantity;
                const totalFat = modalFat * quantity;

                console.log('[Add to Calculator] name:', foodName, 'calories:', totalCalories, 'protein:', totalProtein, 'fat:', totalFat, 'carbs:', totalCarbs);
                let items = JSON.parse(localStorage.getItem('calculatorItems') || '[]');
                items.push({
                    name: foodName,
                    calories: totalCalories,
                    protein: totalProtein,
                    fat: totalFat,
                    carbs: totalCarbs,
                    quantity: quantity,
                    date: (new Date().toISOString().slice(0,10))
                });
                localStorage.setItem('calculatorItems', JSON.stringify(items));
                console.log('[Add to Calculator] Updated calculatorItems:', JSON.stringify(items));
                showToast('Added to Calories Calculator!', 'success', 'View Calculator', () => {
                    window.location.href = 'calorie_calculator.html';
                });
                // If the calculator page is open in this tab, reload or update it
                if (window.location.pathname.includes('calorie_calculator.html')) {
                    if (typeof updateAll === 'function') {
                        updateAll();
                    } else {
                        window.location.reload();
                    }
                }
                modal.style.display = 'none';
            };
        };

        // Delete button logic (always use the doc id from Firestore)
        card.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            showDeleteModal(doc.id);
        };

        historyContainer.appendChild(card);
    });
}

// --- Main load function ---
async function loadAnalysisHistory() {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) {
        return;
    }
    // Only show loading spinner if on history.html
    if (window.location.pathname.includes('history.html')) {
        historyContainer.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-3">Loading your analysis history...</p></div>`;
    } else {
        historyContainer.innerHTML = '';
    }
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
            if (window.location.pathname.includes('history.html')) {
                historyContainer.innerHTML = `<div class="text-center p-5"><div class="empty-state bg-light rounded p-5"><i class="fas fa-history fa-4x text-muted mb-4"></i><h3 class="mb-3">No Analysis History</h3><p class="text-muted mb-4">You haven't analyzed any food items yet. Start by analyzing your first food!</p><div class="d-flex justify-content-center gap-3"><a href="main.html" class="btn btn-primary"><i class="fas fa-camera me-2"></i>Analyze with Image</a></div></div></div>`;
            } else {
                historyContainer.innerHTML = '';
            }
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
// ---- Custom Delete Confirmation Modal ----
function ensureDeleteModal() {
    if (document.getElementById('delete-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'delete-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-message">Are you sure you want to delete this history item?</div>
        <div class="modal-actions">
          <button id="delete-modal-confirm" class="btn btn-danger">Delete</button>
          <button id="delete-modal-cancel" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `;
    modal.style.display = 'none';
    document.body.appendChild(modal);
}

let pendingDeleteDocId = null;
function showDeleteModal(docId) {
    ensureDeleteModal();
    pendingDeleteDocId = docId;
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'flex';
    // Button handlers
    document.getElementById('delete-modal-confirm').onclick = async () => {
        try {
            await deleteDoc(importedDoc(db, 'analysis_history', pendingDeleteDocId));
            showToast('History item deleted!', 'success');
            loadAnalysisHistory();
        } catch (err) {
            showToast('Failed to delete item', 'error');
        }
        hideDeleteModal();
    };
    document.getElementById('delete-modal-cancel').onclick = hideDeleteModal;
}
function hideDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.style.display = 'none';
    pendingDeleteDocId = null;
}

// Only initialize history logic if on history.html
if (window.location.pathname.includes('history.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        loadAnalysisHistory();
        ensureDeleteModal();
    });
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