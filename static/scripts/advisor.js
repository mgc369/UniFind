// Global configuration object
const config = {
    categoryContext: '',
    currentUniversity: 'General University' // Default university context
};

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorSpan = errorDiv.querySelector('span');
    if (errorSpan) {
        errorSpan.textContent = message;
    } else {
        errorDiv.textContent = message;
    }
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function addMessage(text, type) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(type === 'user' ? 'user-message' : 'bot-message');

    // Convert markdown-style formatting to HTML
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/\n/g, '<br>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');

    messageDiv.innerHTML = formattedText;
    container.appendChild(messageDiv);

    // Trigger reflow for animation
    messageDiv.offsetHeight;
    messageDiv.classList.add('show');

    container.scrollTop = container.scrollHeight;
}

function selectCategory(category) {
    // Remove active class from all buttons
    document.querySelectorAll('.category-button').forEach(button => {
        button.classList.remove('active');
    });

    // Add active class to selected button
    const selectedButton = document.querySelector(`button[onclick="selectCategory('${category}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    config.categoryContext = category;
    let message = '';
    switch (category) {
        case 'academic':
            message = "I can help you with study strategies, time management, research skills, and academic planning. What specific aspect would you like to discuss?";
            break;
        case 'moral':
            message = "I'm here to support you with stress management, personal development, and building resilience. What's on your mind?";
            break;
        case 'university':
            message = "Let's talk about campus life, social activities, housing, or any other aspects of university living. What would you like to know?";
            break;
    }
    addMessage(message, 'bot');
}

async function sendMessage(event) {
    if (event) {
        event.preventDefault();
    }

    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;

    // Clear input and add user message
    input.value = '';
    addMessage(message, 'user');

    // Show typing indicator
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'block';

    // Add loading state to send button
    const sendButton = document.querySelector('.send-button');
    sendButton.classList.add('loading');
    sendButton.disabled = true;

    try {
        // Prepare the request data
        const formData = new FormData();
        formData.append('message', message);
        formData.append('university_name', config.currentUniversity);
        formData.append('category', config.categoryContext);

        // Send to backend
        const response = await fetch('/chat', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Hide typing indicator
        typingIndicator.style.display = 'none';

        // Handle the response
        if (data.error) {
            showError("I apologize, but I encountered an error. Please try asking your question again.");
        } else {
            addMessage(data.response, 'bot');
        }
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.style.display = 'none';
        showError("There was an error processing your request. Please try again.");
    } finally {
        // Remove loading state from send button
        sendButton.classList.remove('loading');
        sendButton.disabled = false;
    }
}

function sendQuickQuestion(question) {
    const input = document.getElementById('messageInput');
    input.value = question;
    sendMessage();
}

// Initialize the chat
document.addEventListener('DOMContentLoaded', function () {
    addMessage(`Hello! I'm your AI University Advisor. I can help you with:

1. Academic Support - Study tips, course selection, and academic planning
2. Moral Support - Dealing with stress, anxiety, and personal growth
3. University Life - Campus activities, social life, and practical advice

Please select a category or ask any question!`, 'bot');

    // Add event listener for input field
    const input = document.getElementById('messageInput');
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Add error handling for network issues
    window.addEventListener('online', function () {
        showError("Connection restored! You can continue chatting.");
    });

    window.addEventListener('offline', function () {
        showError("You are currently offline. Please check your internet connection.");
    });

    // Check for scroll on quick links
    const quickLinksContainer = document.querySelector('.quick-links');
    if (quickLinksContainer) {
        const checkScroll = () => {
            if (quickLinksContainer.scrollWidth > quickLinksContainer.clientWidth) {
                quickLinksContainer.classList.add('has-scroll');
            } else {
                quickLinksContainer.classList.remove('has-scroll');
            }
        };
        checkScroll();
        window.addEventListener('resize', checkScroll);
    }
});

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');

    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12'); // X icon
    } else {
        mobileMenu.classList.add('hidden');
        menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16'); // Hamburger icon
    }
}

// Close mobile menu when window is resized to desktop view
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) { // 768px is the md breakpoint in Tailwind
        const mobileMenu = document.getElementById('mobileMenu');
        const menuIcon = document.getElementById('menuIcon');
        mobileMenu.classList.add('hidden');
        menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
    }
});