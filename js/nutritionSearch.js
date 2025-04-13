import config from './config.js';

// NutritionX API Configuration
const NUTRITIONIX_APP_ID = config.NUTRITIONIX_APP_ID;
const NUTRITIONIX_APP_KEY = config.NUTRITIONIX_APP_KEY;

// Check if credentials are available
if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_APP_KEY) {
    console.error('NutritionX API credentials are missing. Please check your config.js file.');
}

let debounceTimer;
let selectedIndex = -1;
let currentSuggestions = [];

// Function to debounce API calls
function debounce(func, delay) {
    return function (...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to search foods using NutritionX API
async function searchFoods(query) {
    try {
        if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_APP_KEY) {
            throw new Error('API credentials are not configured');
        }

        const response = await fetch(`https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}&detailed=true`, {
            method: 'GET',
            headers: {
                'x-app-id': NUTRITIONIX_APP_ID,
                'x-app-key': NUTRITIONIX_APP_KEY,
                'x-remote-user-id': '0'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error('Failed to fetch food suggestions');
        }

        const data = await response.json();
        if (!data.common && !data.branded) {
            console.error('Unexpected API response:', data);
            return [];
        }

        currentSuggestions = [...(data.common || []), ...(data.branded || [])].slice(0, 8); // Limit to 8 suggestions
        return currentSuggestions;
    } catch (error) {
        console.error('Error fetching food suggestions:', error);
        return [];
    }
}

// Function to display food suggestions
function displaySuggestions(foods) {
    const suggestionsDiv = document.getElementById('foodSuggestions');
    suggestionsDiv.innerHTML = '';

    if (foods.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    foods.forEach((food, index) => {
        const div = document.createElement('div');
        div.className = 'food-suggestion-item';
        div.setAttribute('data-index', index);

        const name = food.food_name || food.brand_name_item_name || food.brand_name;
        const details = food.serving_unit ? `${food.serving_qty} ${food.serving_unit}` : '';
        
        div.innerHTML = `
            <div class="food-info">
                <div class="food-name">${name}</div>
                ${details ? `<div class="food-details">${details}</div>` : ''}
            </div>
        `;

        div.addEventListener('click', () => {
            selectFood(food);
        });

        suggestionsDiv.appendChild(div);
    });

    suggestionsDiv.style.display = 'block';
}

// Function to handle food selection
function selectFood(food) {
    const inputField = document.getElementById('foodInput');
    const suggestionsDiv = document.getElementById('foodSuggestions');
    
    const foodName = food.food_name || food.brand_name_item_name || food.brand_name;
    inputField.value = foodName;
    suggestionsDiv.style.display = 'none';
    selectedIndex = -1;

    // Trigger analysis with the selected food
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.click();
    }
}

// Function to handle keyboard navigation
function handleKeyboardNavigation(e) {
    const suggestionsDiv = document.getElementById('foodSuggestions');
    const items = suggestionsDiv.getElementsByClassName('food-suggestion-item');
    
    if (items.length === 0) return;

    // Remove active class from current selection
    if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].classList.remove('active');
    }

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            break;
        case 'ArrowUp':
            e.preventDefault();
            selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
            break;
        case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0) {
                const selectedItem = items[selectedIndex];
                const index = parseInt(selectedItem.getAttribute('data-index'));
                selectFood(currentSuggestions[index]);
            }
            return;
        default:
            return;
    }

    // Add active class to new selection
    items[selectedIndex].classList.add('active');
    items[selectedIndex].scrollIntoView({ block: 'nearest' });
}

// Initialize food search functionality
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('foodInput');
    const suggestionsDiv = document.getElementById('foodSuggestions');

    // Handle input changes
    inputField.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        // Show loading state
        suggestionsDiv.innerHTML = '<div class="suggestions-loading">Loading suggestions...</div>';
        suggestionsDiv.style.display = 'block';

        // Fetch and display suggestions
        const foods = await searchFoods(query);
        displaySuggestions(foods);
    }, 300));

    // Handle keyboard navigation
    inputField.addEventListener('keydown', handleKeyboardNavigation);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!inputField.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
});

// Export necessary functions
export { searchFoods, displaySuggestions }; 