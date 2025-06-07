import { auth } from './firebase-config.js'; // Adjust the path based on your project structure
import { saveMealPlan, getMealPlansForWeek } from './firebase/db.js'; // Adjust the path

// DOM Elements
const daysContainer = document.getElementById('days-container');
const weekDisplay = document.getElementById('week-display');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const mealFormModal = new bootstrap.Modal(document.getElementById('mealFormModal'));
const mealPlanForm = document.getElementById('mealPlanForm');
const selectedDateDisplay = document.getElementById('selected-date-display');
const formDateInput = document.getElementById('form-date');
const breakfastInput = document.getElementById('breakfast');
const lunchInput = document.getElementById('lunch');
const dinnerInput = document.getElementById('dinner');
const snacksInput = document.getElementById('snacks');
const notesInput = document.getElementById('notes');
const caloriesInput = document.getElementById('calories');
const proteinInput = document.getElementById('protein');
const carbsInput = document.getElementById('carbs');
const fatInput = document.getElementById('fat');

// Nutrition Summary Elements (Optional Add-on)
const totalCaloriesElement = document.getElementById('total-calories');
const totalProteinElement = document.getElementById('total-protein');
const totalCarbsElement = document.getElementById('total-carbs');
const totalFatElement = document.getElementById('total-fat');

// Global variables
let currentWeekStart = new Date();
currentWeekStart.setHours(0, 0, 0, 0);
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start from Sunday
let currentUserId = null;

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mealTimes = ['breakfast', 'lunch', 'dinner', 'snacks']; // Use lowercase to match schema

// Initialize meal planner
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            console.log('User signed in:', currentUserId);
            updateWeekDisplay();
            loadMealPlan();
        } else {
            // Redirect to login if not authenticated
            window.location.href = './Signin.html'; // Adjust path as needed
        }
    });

    // Add event listeners for week navigation
    prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
    nextWeekBtn.addEventListener('click', () => navigateWeek(1));

    // Add event listener for form submission
    mealPlanForm.addEventListener('submit', handleFormSubmit);
});

// Update the week display
function updateWeekDisplay() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startDate = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weekDisplay.textContent = `${startDate} - ${endDate}`;
}

// Navigate to previous or next week
function navigateWeek(direction) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    updateWeekDisplay();
    loadMealPlan();
}

// Load the meal plan for the current week
async function loadMealPlan() {
    if (!currentUserId) return;

    try {
        daysContainer.innerHTML = ''; // Clear previous days

        const weeklyMealPlans = await getMealPlansForWeek(currentUserId, currentWeekStart);
        console.log('Fetched weekly meal plans:', weeklyMealPlans);

        // Create a card for each day of the week
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(currentWeekStart);
            currentDate.setDate(currentDate.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            const dayOfWeek = daysOfWeek[currentDate.getDay()];

            const dayColumn = document.createElement('div');
            dayColumn.className = 'col-md-6 col-lg-3 mb-4';

            const card = document.createElement('div');
            card.className = 'card h-100'; // h-100 for equal height cards

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body d-flex flex-column';

            const cardTitle = document.createElement('h5');
            cardTitle.className = 'card-title';
            cardTitle.textContent = `${dayOfWeek}, ${currentDate.getDate()}`;
            cardBody.appendChild(cardTitle);

            const mealsToday = weeklyMealPlans[dateString];

            // Display meals for the day
            const mealsContainer = document.createElement('div');
            mealsContainer.className = 'meal-items flex-grow-1'; // flex-grow-1 to push button to bottom
            if (mealsToday) {
                mealsContainer.innerHTML += `<p><strong>Breakfast:</strong> ${mealsToday.breakfast || '-'}</p>`;
                mealsContainer.innerHTML += `<p><strong>Lunch:</strong> ${mealsToday.lunch || '-'}</p>`;
                mealsContainer.innerHTML += `<p><strong>Dinner:</strong> ${mealsToday.dinner || '-'}</p>`;
                mealsContainer.innerHTML += `<p><strong>Snacks:</strong> ${mealsToday.snacks ? mealsToday.snacks.join(', ') : '-'}</p>`;
                if (mealsToday.notes) {
                    mealsContainer.innerHTML += `<p><strong>Notes:</strong> ${mealsToday.notes}</p>`;
                }
                // Display image if available (Optional Add-on)
                if (mealsToday.imageUrls && mealsToday.imageUrls.length > 0) {
                    mealsContainer.innerHTML += `<img src="${mealsToday.imageUrls[0]}" alt="Meal Image" class="img-fluid mt-2">`;
                }
            } else {
                mealsContainer.innerHTML = '<p>No meals planned.</p>';
            }
            cardBody.appendChild(mealsContainer);

            // Button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'd-flex gap-2 mt-auto';

            // Edit/Add button
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-sm btn-outline-primary flex-grow-1';
            editButton.textContent = mealsToday ? 'Edit Plan' : 'Add Plan';
            editButton.addEventListener('click', () => openMealFormModal(dateString, mealsToday));
            buttonContainer.appendChild(editButton);

            // Clear button (only show if there's a meal plan)
            if (mealsToday) {
                const clearButton = document.createElement('button');
                clearButton.className = 'btn btn-sm btn-outline-danger';
                clearButton.innerHTML = '<i class="fas fa-trash"></i>';
                clearButton.title = 'Clear Plan';
                clearButton.addEventListener('click', () => clearMealPlan(dateString));
                buttonContainer.appendChild(clearButton);
            }

            cardBody.appendChild(buttonContainer);
            card.appendChild(cardBody);
            dayColumn.appendChild(card);
            daysContainer.appendChild(dayColumn);
        }

        // Update nutrition summary after loading meals
        updateNutritionSummary(weeklyMealPlans);

    } catch (error) {
        console.error('Error loading meal plan:', error);
        // Optionally display an error message to the user
    }
}

// Open the meal form modal
function openMealFormModal(dateString, mealPlanData = null) {
    selectedDateDisplay.textContent = new Date(dateString).toDateString();
    formDateInput.value = dateString;

    // Populate form if editing an existing meal plan
    if (mealPlanData) {
        breakfastInput.value = mealPlanData.breakfast || '';
        lunchInput.value = mealPlanData.lunch || '';
        dinnerInput.value = mealPlanData.dinner || '';
        snacksInput.value = mealPlanData.snacks ? mealPlanData.snacks.join('\n') : '';
        notesInput.value = mealPlanData.notes || '';
        caloriesInput.value = mealPlanData.calories || '';
        proteinInput.value = mealPlanData.protein || '';
        carbsInput.value = mealPlanData.carbs || '';
        fatInput.value = mealPlanData.fat || '';
        // Handle image preview if needed (Optional Add-on)
        const imagePreview = document.getElementById('image-preview');
        imagePreview.innerHTML = '';
        if (mealPlanData.imageUrls && mealPlanData.imageUrls.length > 0) {
            imagePreview.innerHTML = `<img src="${mealPlanData.imageUrls[0]}" alt="Meal Image" class="img-fluid mt-2">`;
        }
    } else {
        // Clear form for adding a new meal plan
        mealPlanForm.reset();
        const imagePreview = document.getElementById('image-preview');
        imagePreview.innerHTML = '';
    }

    mealFormModal.show();
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!currentUserId) return; // Should not happen if auth check works, but good practice

    const dateString = formDateInput.value;
    const mealPlanData = {
        breakfast: breakfastInput.value.trim(),
        lunch: lunchInput.value.trim(),
        dinner: dinnerInput.value.trim(),
        snacks: snacksInput.value.split('\n').map(s => s.trim()).filter(s => s !== ''),
        notes: notesInput.value.trim(),
        calories: parseInt(caloriesInput.value) || 0,
        protein: parseFloat(proteinInput.value) || 0,
        carbs: parseFloat(carbsInput.value) || 0,
        fat: parseFloat(fatInput.value) || 0
    };

    try {
        await saveMealPlan(currentUserId, dateString, mealPlanData);
        mealFormModal.hide();
        loadMealPlan(); // Reload the meal plan display
    } catch (error) {
        console.error('Error saving meal plan:', error);
        // Optionally display an error message to the user
    }
}

// Update nutrition summary
function updateNutritionSummary(weeklyMealPlans) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Iterate through the meal plans for the week
    for (const dateString in weeklyMealPlans) {
        const mealPlan = weeklyMealPlans[dateString];
        totalCalories += mealPlan.calories || 0;
        totalProtein += mealPlan.protein || 0;
        totalCarbs += mealPlan.carbs || 0;
        totalFat += mealPlan.fat || 0;
    }

    // Update the DOM elements with formatted numbers
    if(totalCaloriesElement) totalCaloriesElement.textContent = `${totalCalories.toLocaleString()} kcal`;
    if(totalProteinElement) totalProteinElement.textContent = `${totalProtein.toFixed(1)}g`;
    if(totalCarbsElement) totalCarbsElement.textContent = `${totalCarbs.toFixed(1)}g`;
    if(totalFatElement) totalFatElement.textContent = `${totalFat.toFixed(1)}g`;
}

// Clear meal plan for a specific day
async function clearMealPlan(dateString) {
    if (!currentUserId) return;

    if (confirm('Are you sure you want to clear this meal plan?')) {
        try {
            await saveMealPlan(currentUserId, dateString, {
                breakfast: '',
                lunch: '',
                dinner: '',
                snacks: [],
                notes: '',
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            });
            loadMealPlan(); // Reload the meal plan display
        } catch (error) {
            console.error('Error clearing meal plan:', error);
            alert('Error clearing meal plan. Please try again.');
        }
    }
}

// Note: Image upload to Firebase Storage is an optional add-on
// You would need to implement the uploadMealImage function in firebase/storage.js
// and integrate it into the handleFormSubmit function. 