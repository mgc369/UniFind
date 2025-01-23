// Auth state observer for navigation
firebase.auth().onAuthStateChanged((user) => {
    const authElements = {
        desktop: {
            profile: document.getElementById('userProfileBtn'),
            login: document.getElementById('loginBtn'),
            register: document.getElementById('registerBtn'),
            logout: document.getElementById('logoutBtn')
        },
        mobile: {
            profile: document.getElementById('mobileUserProfileBtn'),
            login: document.getElementById('mobileLoginBtn'),
            register: document.getElementById('mobileRegisterBtn'),
            logout: document.getElementById('mobileLogoutBtn')
        }
    };

    if (user) {
        // User is signed in
        ['desktop', 'mobile'].forEach(type => {
            authElements[type].profile.classList.remove('hidden');
            authElements[type].logout.classList.remove('hidden');
            authElements[type].login.classList.add('hidden');
            authElements[type].register.classList.add('hidden');
        });

        // Update profile name in navigation
        const navUserName = document.getElementById('navUserName');
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                navUserName.textContent = doc.data().name || 'User';
            }
        });
    } else {
        // User is signed out
        ['desktop', 'mobile'].forEach(type => {
            authElements[type].profile.classList.add('hidden');
            authElements[type].logout.classList.add('hidden');
            authElements[type].login.classList.remove('hidden');
            authElements[type].register.classList.remove('hidden');
        });
    }
});

// Mobile menu toggle
// Get the menu button and mobile menu elements
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuIcon = menuBtn.querySelector('svg path');

// Add click event listener to menu button
if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
        // Toggle the 'hidden' class on mobile menu
        mobileMenu.classList.toggle('hidden');

        // Update the menu icon (optional - if you want to change the icon)
        if (mobileMenu.classList.contains('hidden')) {
            menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16'); // Hamburger icon
        } else {
            menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12'); // X icon
        }
    });
}

// Close mobile menu when window is resized to desktop view
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) { // 768px is the md breakpoint in Tailwind
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            if (menuIcon) {
                menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            }
        }
    }
});

// Handle logout
function handleLogout() {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    firebase.auth().signOut().then(() => {
        window.location.href = '/advisor';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// Add logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
document.getElementById('mobileLogoutBtn')?.addEventListener('click', handleLogout);