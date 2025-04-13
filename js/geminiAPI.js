// Function to convert image to base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            let encoded = reader.result.toString();
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
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

async function analyzeImageWithGemini(imageBase64, languageCode = 'en') {
    try {
        const apiKey = 'AIzaSyAbrWhFv5iihYe1Ay10QPV56T1zHN_7w8Y';
        const language = getLanguageName(languageCode);
        
        // First, verify if the image is food-related
        const verificationResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Is this a clear image of food? Please respond with a JSON in this format: {\"isFood\": boolean, \"description\": \"brief description of what you see\"}`
                    }, {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: imageBase64.split(',')[1]
                        }
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!verificationResponse.ok) {
            const errorData = await verificationResponse.json();
            console.error('Verification API error:', errorData);
            throw new Error('Failed to verify image content: ' + (errorData.error?.message || verificationResponse.statusText));
        }

        const verificationData = await verificationResponse.json();
        console.log('Verification response:', verificationData);
        
        const verificationText = verificationData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!verificationText) {
            console.error('Invalid verification response:', verificationData);
            throw new Error('Invalid verification response from API');
        }

        let verificationResult;
        try {
            const jsonMatch = verificationText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('No JSON found in verification response:', verificationText);
                throw new Error('Invalid verification response format');
            }
            verificationResult = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error('Error parsing verification response:', verificationText);
            throw new Error('Failed to parse verification response');
        }

        if (!verificationResult.isFood) {
            throw new Error(`This doesn't appear to be a food image. I see: ${verificationResult.description || 'an unclear or non-food image'}`);
        }

        // If verification passes, proceed with food analysis
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this food image and provide detailed information in the following JSON format. Please provide the response in ${language}:
{
    "name": "exact name of the food",
    "calories": "estimated calories per serving",
    "ingredients": ["main ingredient 1", "main ingredient 2", ...],
    "nutrition": {
        "protein": "amount in grams",
        "carbs": "amount in grams",
        "fat": "amount in grams"
    },
    "category": "food category (e.g., dessert, main course, snack)",
    "cuisine": "type of cuisine"
}`
                    }, {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: imageBase64.split(',')[1]
                        }
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
            console.error('Analysis API error:', errorData);
            throw new Error('Failed to analyze image: ' + (errorData.error?.message || response.statusText));
        }

        const data = await response.json();
        console.log('Analysis response:', data);
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('Unexpected analysis response:', data);
            throw new Error('Invalid analysis response format');
        }

        let result;
        try {
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('No JSON found in analysis response:', text);
                throw new Error('Invalid analysis response format');
            }
            result = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error('Error parsing analysis response:', data.candidates[0].content.parts[0].text);
            throw new Error('Failed to parse analysis response');
        }

        if (!result.name || !result.calories) {
            throw new Error('Could not identify the food in the image. Please try with a clearer image.');
        }

        return {
            foodName: result.name,
            calories: result.calories,
            ingredients: Array.isArray(result.ingredients) ? result.ingredients : ['Not available'],
            nutrition: result.nutrition || {
                protein: 'N/A',
                carbs: 'N/A',
                fat: 'N/A'
            },
            category: result.category || 'Unknown',
            cuisine: result.cuisine || 'Unknown'
        };
    } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
    }
}

async function handleImageAnalysis(imageFile, language = 'en') {
    const resultContainer = document.getElementById('resultContainer');
    const foodName = document.getElementById('foodName');
    const calories = document.getElementById('calories');
    const resultHeader = document.getElementById('resultHeader');

    if (!resultContainer || !foodName || !calories) {
        throw new Error('Required elements not found');
    }

    try {
        // Remove any existing loading indicators first
        const existingLoader = document.getElementById('loadingIndicator');
        if (existingLoader) {
            existingLoader.remove();
        }

        // Show loading state
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.className = 'alert alert-info';
        loadingIndicator.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Analyzing image...
            </div>
        `;
        foodName.innerHTML = '';
        calories.innerHTML = '';
        foodName.appendChild(loadingIndicator);
        resultContainer.style.display = 'block';

        // Convert image to base64
        const base64Image = await getBase64(imageFile);

        // First verify if the image contains food
        const result = await analyzeImageWithGemini(base64Image, language);
        
        // Remove loading indicator
        loadingIndicator.remove();

        // Display results
        if (resultHeader) resultHeader.style.display = 'block';
        foodName.innerHTML = `<div class="alert alert-info">
            <h5 class="mb-2">${result.foodName}</h5>
            <p class="mb-0"><strong>Category:</strong> ${result.category}</p>
            <p class="mb-0"><strong>Cuisine:</strong> ${result.cuisine}</p>
        </div>`;

        calories.innerHTML = `<div class="alert alert-success">
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
        // Remove loading indicator if it exists
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        console.error('Error analyzing image:', error);
        foodName.innerHTML = `<div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i> Error: ${error.message}
        </div>`;
        calories.textContent = '';
        throw error;
    }
}

// Function to clear the analysis
function clearAnalysis() {
    // Clear the image preview
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
        imagePreview.src = '';
    }

    // Clear the file input
    const fileInput = document.getElementById('imageInput');
    if (fileInput) {
        fileInput.value = '';
    }

    // Clear the results
    const resultContainer = document.getElementById('resultContainer');
    const resultHeader = document.getElementById('resultHeader');
    if (resultContainer) {
        resultContainer.style.display = 'none';
        resultContainer.innerHTML = '';
    }
    if (resultHeader) {
        resultHeader.style.display = 'none';
    }

    // Remove any loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Make clearAnalysis available globally
window.clearAnalysis = clearAnalysis;

// Export all functions at the end of the file
export {
    handleImageAnalysis,
    getLanguageName,
    analyzeImageWithGemini,
    getBase64
}; 