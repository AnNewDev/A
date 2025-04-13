// Initialize Firebase
const db = firebase.firestore();
const storage = firebase.storage();

// Function to save analysis results to Firebase
async function saveAnalysisResults(analysisData) {
    try {
        const userId = firebase.auth().currentUser.uid;
        const timestamp = new Date().toISOString();
        
        // Save to Firestore
        await db.collection('analysis_history').add({
            userId: userId,
            timestamp: timestamp,
            data: analysisData
        });

        // If there's an image, save it to Storage
        if (analysisData.imageUrl) {
            const imageRef = storage.ref().child(`analysis_images/${userId}/${timestamp}`);
            await imageRef.putString(analysisData.imageUrl, 'data_url');
        }

        console.log('Analysis results saved successfully');
    } catch (error) {
        console.error('Error saving analysis results:', error);
    }
}

// Function to load and display analysis history
async function loadAnalysisHistory() {
    try {
        const userId = firebase.auth().currentUser.uid;
        const historyContainer = document.getElementById('history-container');
        
        // Clear existing content
        historyContainer.innerHTML = '';
        
        // Get analysis history from Firestore
        const snapshot = await db.collection('analysis_history')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            historyContainer.innerHTML = '<p class="text-center">No analysis history found.</p>';
            return;
        }

        // Create cards for each analysis result
        snapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = new Date(data.timestamp).toLocaleString();
            
            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Analysis from ${timestamp}</h5>
                    <div class="analysis-details">
                        ${formatAnalysisData(data.data)}
                    </div>
                </div>
            `;
            
            historyContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading analysis history:', error);
        document.getElementById('history-container').innerHTML = 
            '<p class="text-center text-danger">Error loading analysis history.</p>';
    }
}

// Helper function to format analysis data
function formatAnalysisData(data) {
    let html = '';
    
    // Format nutrition information
    if (data.nutrition) {
        html += '<div class="nutrition-info">';
        html += '<h6>Nutrition Information:</h6>';
        html += `<p>Calories: ${data.nutrition.calories || 'N/A'}</p>`;
        html += `<p>Protein: ${data.nutrition.protein || 'N/A'}g</p>`;
        html += `<p>Carbs: ${data.nutrition.carbs || 'N/A'}g</p>`;
        html += `<p>Fat: ${data.nutrition.fat || 'N/A'}g</p>`;
        html += '</div>';
    }

    // Format food items
    if (data.foodItems && data.foodItems.length > 0) {
        html += '<div class="food-items">';
        html += '<h6>Identified Food Items:</h6>';
        html += '<ul>';
        data.foodItems.forEach(item => {
            html += `<li>${item.name} (${item.confidence}% confidence)</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // Add image if available
    if (data.imageUrl) {
        html += '<div class="analysis-image mt-3">';
        html += '<h6>Food Image:</h6>';
        html += `<img src="${data.imageUrl}" class="img-fluid" alt="Analyzed food">`;
        html += '</div>';
    }

    return html;
}

// Load history when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadAnalysisHistory();
        } else {
            window.location.href = 'Signin.html';
        }
    });
}); 