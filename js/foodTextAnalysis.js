async function analyzeFoodByText(foodDescription, language) {
    try {
        const apiKey = 'AIzaSyAbrWhFv5iihYe1Ay10QPV56T1zHN_7w8Y';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this food description and provide detailed nutritional information in the following JSON format. Respond in ${language}:
{
    "name": "exact name of the food",
    "calories": "estimated calories per serving",
    "ingredients": ["main ingredient 1", "main ingredient 2", ...],
    "nutrition": {
        "protein": "amount in grams",
        "carbs": "amount in grams",
        "fat": "amount in grams",
        "fiber": "amount in grams",
        "sugar": "amount in grams"
    },
    "category": "food category (e.g., dessert, main course, snack)",
    "cuisine": "type of cuisine",
    "healthTips": ["health tip 1", "health tip 2"],
    "alternatives": ["healthier alternative 1", "healthier alternative 2"]
}

Food to analyze: "${foodDescription}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Full API error:', errorData);
            throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('Unexpected API response:', data);
            throw new Error('Invalid API response format');
        }

        let result;
        try {
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('Raw response text:', text);
                throw new Error('No JSON found in response');
            }
            result = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error('Error parsing API response:', data.candidates[0].content.parts[0].text);
            throw new Error('Failed to parse API response');
        }

        return {
            foodName: result.name || 'Unknown food',
            calories: result.calories || 'Not available',
            ingredients: Array.isArray(result.ingredients) ? result.ingredients : ['Not available'],
            nutrition: result.nutrition || {
                protein: 'N/A',
                carbs: 'N/A',
                fat: 'N/A',
                fiber: 'N/A',
                sugar: 'N/A'
            },
            category: result.category || 'Unknown',
            cuisine: result.cuisine || 'Unknown',
            healthTips: Array.isArray(result.healthTips) ? result.healthTips : [],
            alternatives: Array.isArray(result.alternatives) ? result.alternatives : []
        };
    } catch (error) {
        console.error('Error analyzing food:', error);
        throw error;
    }
}

// Function to get language name from code
function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'vi': 'Vietnamese',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'th': 'Thai',
        'hi': 'Hindi',
        'bn': 'Bengali',
        'ur': 'Urdu',
        'fa': 'Persian',
        'ar': 'Arabic',
        'tr': 'Turkish',
        'id': 'Indonesian',
        'ms': 'Malay',
        'tl': 'Filipino',
        'my': 'Burmese',
        'km': 'Khmer',
        'lo': 'Lao',
        'ne': 'Nepali',
        'si': 'Sinhala',
        'ml': 'Malayalam',
        'ta': 'Tamil',
        'te': 'Telugu',
        'kn': 'Kannada',
        'gu': 'Gujarati',
        'pa': 'Punjabi',
        'mr': 'Marathi',
        'sa': 'Sanskrit',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'nl': 'Dutch',
        'pl': 'Polish',
        'uk': 'Ukrainian',
        'cs': 'Czech',
        'sk': 'Slovak',
        'hu': 'Hungarian',
        'ro': 'Romanian',
        'bg': 'Bulgarian',
        'hr': 'Croatian',
        'sr': 'Serbian',
        'sl': 'Slovenian',
        'el': 'Greek',
        'sv': 'Swedish',
        'da': 'Danish',
        'no': 'Norwegian',
        'fi': 'Finnish',
        'et': 'Estonian',
        'lv': 'Latvian',
        'lt': 'Lithuanian'
    };
    return languages[code] || 'English';
}

// Function to display the analysis results
function displayResults(result, container) {
    container.innerHTML = `
        <h4 class="mb-4">Analysis Results</h4>
        <div class="alert alert-info">
            <h5 class="mb-3">${result.foodName}</h5>
            <p class="mb-2"><strong>Category:</strong> ${result.category}</p>
            <p class="mb-2"><strong>Cuisine:</strong> ${result.cuisine}</p>
            <p class="mb-2"><strong>Calories:</strong> ${result.calories}</p>
        </div>
        <div class="alert alert-success">
            <h5 class="mb-3">Nutritional Information</h5>
            <p class="mb-2"><strong>Protein:</strong> ${result.nutrition.protein}</p>
            <p class="mb-2"><strong>Carbs:</strong> ${result.nutrition.carbs}</p>
            <p class="mb-2"><strong>Fat:</strong> ${result.nutrition.fat}</p>
            <p class="mb-2"><strong>Fiber:</strong> ${result.nutrition.fiber}</p>
            <p class="mb-2"><strong>Sugar:</strong> ${result.nutrition.sugar}</p>
        </div>
        <div class="alert alert-secondary">
            <h5 class="mb-3">Main Ingredients</h5>
            <ul class="mb-0">
                ${result.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
            </ul>
        </div>
        ${result.healthTips.length > 0 ? `
        <div class="alert alert-warning">
            <h5 class="mb-3">Health Tips</h5>
            <ul class="mb-0">
                ${result.healthTips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        ${result.alternatives.length > 0 ? `
        <div class="alert alert-info">
            <h5 class="mb-3">Healthier Alternatives</h5>
            <ul class="mb-0">
                ${result.alternatives.map(alt => `<li>${alt}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    `;
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get all necessary elements
    const analyzeBtn = document.getElementById('analyzeBtn');
    const foodInput = document.getElementById('foodInput');
    const resultContainer = document.getElementById('resultContainer');
    const resultHeader = document.getElementById('resultHeader');
    const foodNameElement = document.getElementById('foodName');
    const caloriesElement = document.getElementById('calories');
    const language = document.getElementById('language');

    // Try to load last used language from localStorage
    const lastLanguage = localStorage.getItem('preferredLanguage');
    if (lastLanguage && language) {
        language.value = lastLanguage;
    }

    // Save language preference when changed
    if (language) {
        language.addEventListener('change', (e) => {
            localStorage.setItem('preferredLanguage', e.target.value);
        });
    }

    // Handle analyze button click
    if (analyzeBtn && foodInput) {
        analyzeBtn.addEventListener('click', async () => {
            // Check if there's any text input
            if (!foodInput.value.trim()) {
                foodNameElement.innerHTML = `<div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> Please enter a food name
                </div>`;
                resultContainer.style.display = 'block';
                caloriesElement.textContent = '';
                return;
            }

            try {
                // Remove any existing loading indicators first
                const existingLoader = document.getElementById('loadingIndicator');
                if (existingLoader) {
                    existingLoader.remove();
                }

                // Disable the button and show loading state
                analyzeBtn.disabled = true;
                const loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loadingIndicator';
                loadingIndicator.className = 'alert alert-info';
                loadingIndicator.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        Analyzing food...
                    </div>
                `;
                foodNameElement.innerHTML = '';
                caloriesElement.innerHTML = '';
                foodNameElement.appendChild(loadingIndicator);
                resultContainer.style.display = 'block';

                // Get selected language
                const selectedLanguage = language ? language.value : 'en';
                const result = await analyzeFoodByText(foodInput.value, getLanguageName(selectedLanguage));

                // Remove loading indicator
                loadingIndicator.remove();

                // Display results
                if (resultHeader) resultHeader.style.display = 'block';
                foodNameElement.innerHTML = `<div class="alert alert-info">
                    <h5 class="mb-2">${result.foodName}</h5>
                    <p class="mb-0"><strong>Category:</strong> ${result.category}</p>
                    <p class="mb-0"><strong>Cuisine:</strong> ${result.cuisine}</p>
                </div>`;

                caloriesElement.innerHTML = `<div class="alert alert-success">
                    <h5 class="mb-2">Nutritional Information</h5>
                    <p class="mb-0"><strong>Calories:</strong> ${result.calories}</p>
                    <p class="mb-0"><strong>Protein:</strong> ${result.nutrition.protein}</p>
                    <p class="mb-0"><strong>Carbs:</strong> ${result.nutrition.carbs}</p>
                    <p class="mb-0"><strong>Fat:</strong> ${result.nutrition.fat}</p>
                    <hr class="my-2">
                    <h6 class="mb-2">Main Ingredients:</h6>
                    <ul class="mb-0">
                        ${result.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>`;

            } catch (error) {
                console.error('Error:', error);
                foodNameElement.innerHTML = `<div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${error.message}
                </div>`;
                caloriesElement.textContent = '';
            } finally {
                // Re-enable the button
                analyzeBtn.disabled = false;
            }
        });

        // Also trigger on Enter key in the input field
        foodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                analyzeBtn.click();
            }
        });
    }
});

// Export necessary functions
export { analyzeFoodByText, getLanguageName }; 