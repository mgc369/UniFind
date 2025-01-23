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

let lastAuthAttempt = 0;
const AUTH_COOLDOWN = 1000; // 1 секунда между попытками

// Check if user is already logged in
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Get the redirect URL from query parameter or default to user profile
        const urlParams = new URLSearchParams(window.location.search);
        const nextUrl = urlParams.get('next') || '/user';
        window.location.href = nextUrl;
    }
});

// Handle login form submission
// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Проверяем время с последней попытки
    const now = Date.now();
    if (now - lastAuthAttempt < AUTH_COOLDOWN) {
        return;
    }
    lastAuthAttempt = now;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDisplay = document.getElementById('error-message');

    try {
        // Sign in with Firebase
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user) {
            // Получаем ID токен
            const idToken = await user.getIdToken();

            // Устанавливаем куки
            document.cookie = `auth_token=${idToken}; path=/; max-age=3600; SameSite=Strict`;

            // Перенаправляем на страницу пользователя
            window.location.href = '/user';
        }
    } catch (error) {
        errorDisplay.textContent = error.message;
        errorDisplay.classList.remove('hidden');
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