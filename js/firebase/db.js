import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBEmGfW5lAQI0Dzy1cjlPOAfVYwnfVPSfE",
    authDomain: "jsa-sql.firebaseapp.com",
    databaseURL: "https://jsa-sql-default-rtdb.firebaseio.com",
    projectId: "jsa-sql",
    storageBucket: "jsa-sql.firebasestorage.app",
    messagingSenderId: "627272462079",
    appId: "1:627272462079:web:9f8e5a7ec132c6b672a6ca",
    measurementId: "G-DC1WX2H7CR"
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    if (error.code === 'app/duplicate-app') {
        app = getApp();
    } else {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
}

// Initialize Firestore
const db = getFirestore(app);

// Save or update a meal plan for a specific day
export async function saveMealPlan(userId, date, data) {
    // Date should be in 'YYYY-MM-DD' format for the document ID
    const docId = date;
    const mealPlanRef = doc(db, 'users', userId, 'mealPlans', docId);
    
    try {
        await setDoc(mealPlanRef, data, { merge: true }); // Use merge: true to update existing fields without overwriting the whole document
        console.log(`Meal plan for ${date} saved successfully.`);
    } catch (error) {
        console.error(`Error saving meal plan for ${date}:`, error);
        throw error; // Re-throw to be handled by calling function
    }
}

// Get the meal plan for a single day
export async function getMealPlan(userId, date) {
     // Date should be in 'YYYY-MM-DD' format for the document ID
    const docId = date;
    const mealPlanRef = doc(db, 'users', userId, 'mealPlans', docId);
    
    try {
        const docSnap = await getDoc(mealPlanRef);
        
        if (docSnap.exists()) {
            console.log(`Meal plan for ${date} fetched successfully.`);
            return docSnap.data();
        } else {
            console.log(`No meal plan found for ${date}.`);
            return null; // Or an empty object, depending on desired behavior
        }
    } catch (error) {
        console.error(`Error getting meal plan for ${date}:`, error);
        throw error; // Re-throw to be handled by calling function
    }
}

// Get meal plans for a 7-day range (a week)
// startDate should be a Date object representing the start of the week (e.g., Sunday)
export async function getMealPlansForWeek(userId, startDate) {
    if (!userId) {
        console.error('User ID is required to fetch meal plans.');
        return [];
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const mealPlansCollectionRef = collection(db, 'users', userId, 'mealPlans');
    
    try {
        const querySnapshot = await getDocs(mealPlansCollectionRef);
        const weeklyMealPlans = {};
        
        const startYYYYMMDD = startDate.toISOString().split('T')[0];
        const endYYYYMMDD = endDate.toISOString().split('T')[0];

        querySnapshot.forEach(doc => {
            const docDate = doc.id; // Document ID is the date string 'YYYY-MM-DD'
            
            // Client-side filtering by date string
            if (docDate >= startYYYYMMDD && docDate <= endYYYYMMDD) {
                weeklyMealPlans[docDate] = { id: doc.id, ...doc.data() };
            }
        });
        
        console.log(`Meal plans for week starting ${startYYYYMMDD} fetched successfully.`);
        return weeklyMealPlans; // Return an object where keys are 'YYYY-MM-DD' date strings
        
    } catch (error) {
        console.error(`Error getting meal plans for week starting ${startDate.toDateString()}:`, error);
        throw error; // Re-throw to be handled by calling function
    }
}

// You can add optional image handling functions here later if needed
// export async function uploadMealImage(userId, file) { ... } 