// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDYSsjkLfBbjF5PzDFZR1qsiv4tLsxXTvQ",
    authDomain: "univi-41774.firebaseapp.com",
    projectId: "univi-41774",
    storageBucket: "univi-41774.firebasestorage.app",
    messagingSenderId: "495241740015",
    appId: "1:495241740015:web:513e352d9927b23b32e51a",
    measurementId: "G-7C4HKVVS08"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Handle registration form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDisplay = document.getElementById('error-message');

    try {
        // Create user account
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

        // Create user profile in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            targetUniversity: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.location.href = '/user'; // Redirect to user profile page
    } catch (error) {
        errorDisplay.textContent = error.message;
        errorDisplay.classList.remove('hidden');
    }
});

// Check auth state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        window.location.href = '/user';
    }
});
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            // The current browser doesn't support persistence
            console.log('Persistence not supported by browser');
        }
    });

// Add error handling for auth state changes
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in');
    } else {
        console.log('User is signed out');
        // Only redirect if we're on a protected page
        if (window.location.pathname === '/user') {
            window.location.href = '/login';
        }
    }
}, (error) => {
    console.error('Auth state change error:', error);
});