// Show loading spinner during form submission
document.getElementById('searchForm').onsubmit = () => {
    document.querySelector('.loader').style.display = 'block';
};

// Modal functionality
const detailModal = document.getElementById('detailModal');
const chatModal = document.getElementById('chatModal');
const closeBtns = document.querySelectorAll('.close-button');

closeBtns.forEach(btn => {
    btn.onclick = function () {
        detailModal.style.display = 'none';
        chatModal.style.display = 'none';
    }
});

// In your getUniversityDetails function
function getUniversityDetails(universityName, country) {
    const modal = document.getElementById('detailModal');
    const loading = document.getElementById('modalLoading');
    const details = document.getElementById('modalDetails');
    const modalTitle = document.querySelector('#modalContent h2');

    modalTitle.textContent = universityName;
    loading.style.display = 'block';
    details.style.display = 'none';
    modal.style.display = 'block';

    const formData = new FormData();
    formData.append('university_name', universityName);
    formData.append('country', country);

    fetch('/university_details', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            // Update modal content
            document.querySelector('#description').innerHTML =
                `<strong>Description:</strong><br>${data.description}`;
            document.querySelector('#notablePrograms').innerHTML =
                `<strong>Notable Programs:</strong><br>${data.notablePrograms}`;
            document.querySelector('#campusLife').innerHTML =
                `<strong>Campus Life:</strong><br>${data.campusLife}`;
            const admissionReqs = data.admissionRequirements;
            const formattedAdmissionReqs = `
                <strong>Admission Requirements:</strong><br>
                <strong>General:</strong> ${admissionReqs.general}<br><br>
                <strong>GPA Requirement:</strong> ${admissionReqs.gpa}<br><br>
                <strong>English Requirements:</strong><br>
                • IELTS: ${admissionReqs.englishRequirements.ielts}<br>
                • Additional Notes: ${admissionReqs.englishRequirements.notes}<br><br>
                <strong>Required Documents:</strong> ${admissionReqs.documents}
            `;
            document.querySelector('#admissionRequirements').innerHTML = formattedAdmissionReqs;
            document.querySelector('#researchOpportunities').innerHTML =
                `<strong>Research Opportunities:</strong><br>${data.researchOpportunities}`;
            document.querySelector('#ranking').innerHTML =
                `<strong>Ranking:</strong><br>${data.ranking}`;

            // If there's an error, show it at the top of the modal
            if (data.error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded';
                errorDiv.innerHTML = `
<p class="font-bold">Note</p>
<p>Some information may be incomplete or unavailable at this time.</p>
`;
                details.insertBefore(errorDiv, details.firstChild);
            }

            loading.style.display = 'none';
            details.style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            loading.style.display = 'none';
            details.style.display = 'block';
            details.innerHTML = `
<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
<p class="font-bold">Error</p>
<p>Failed to fetch university details. Please try again later.</p>
</div>
`;
        });
}

// Chat functionality
function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
}

function openChat(universityName, country) {
    // Get modal and messages div
    const modal = document.getElementById('chatModal');
    const messages = document.getElementById('chatMessages');

    // Clear previous messages
    messages.innerHTML = '';

    // Set university name in modal title
    document.querySelector('#chatContent h2').textContent = `Chat about ${universityName}`;

    // Add welcome message
    addMessage(`Hi! I can help you learn more about ${universityName}. What would you like to know?`, 'bot');

    // Show modal
    modal.style.display = 'block';

    // Focus on input
    document.getElementById('chatInput').focus();
}

function addMessage(text, sender, isHTML = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');

    // Add base classes without special characters
    messageDiv.className = 'p-3 rounded-lg mb-2';

    // Add styling based on sender
    if (sender === 'user') {
        messageDiv.classList.add('ml-auto');
        messageDiv.style.backgroundColor = '#EBF8FF';  // light blue
        messageDiv.style.maxWidth = '80%';
    } else {
        messageDiv.style.backgroundColor = '#F3F4F6';  // light gray
        messageDiv.style.maxWidth = '80%';
    }

    // Add content
    if (isHTML) {
        messageDiv.innerHTML = text;
    } else {
        messageDiv.textContent = text;
    }

    // Add to chat and scroll
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    return messageDiv;
}

// Replace your existing sendMessage function with this one
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Clear input and add user message
    input.value = '';
    addMessage(message, 'user');

    // Get university name
    const universityName = document.querySelector('#chatContent h2').textContent.replace('Chat about ', '');

    // Show typing indicator
    const typingIndicator = addMessage('Typing...', 'bot');

    // Create form data
    const formData = new FormData();
    formData.append('message', message);
    formData.append('university_name', universityName);

    // Send request
    fetch('/chat', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            typingIndicator.remove();

            if (data.error) {
                addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            } else {
                const formattedResponse = data.response
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                addMessage(formattedResponse, 'bot', true);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            typingIndicator.remove();
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        });
}
// Add event listeners when document loads
document.addEventListener('DOMContentLoaded', function () {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        // Add debug logging for input
        chatInput.addEventListener('input', (e) => {
            console.log('Input value:', e.target.value);
        });

        // Add Enter key handling
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Add button click handling
    const sendButton = document.querySelector('button[onclick="sendMessage()"]');
    if (sendButton) {
        sendButton.addEventListener('click', function (e) {
            e.preventDefault();
            sendMessage();
        });
    }

    // Close modal when clicking outside
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.addEventListener('click', function (event) {
            if (event.target === chatModal) {
                closeChat();
            }
        });
    }
});

// Log form submission helper function
function logFormData(formData) {
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }
}
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


document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('uni_searcher');
    const searchIcon = searchInput.nextElementSibling;

    function performSearch() {
        const universityName = searchInput.value.trim();
        if (!universityName) return;

        const formData = new FormData();
        formData.append('university_name', universityName);
        formData.append('country', 'global');

        fetch('/search_university', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
                alert('Could not find university. Please try another search.');
                return;
            }
            
            const modalHtml = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto" id="searchModal">
                    <div class="bg-white rounded-lg max-w-2xl w-full mt-20 mx-auto relative">
                        <!-- Header - fixed at top -->
                        <div class="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-lg">
                            <div class="flex justify-between items-center">
                                <h2 class="text-2xl font-bold text-gray-900">${data.universityName || 'University Details'}</h2>
                                <button class="text-gray-500 hover:text-gray-700 transition-colors" id="closeSearchModal">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Scrollable content -->
                        <div class="p-6 overflow-y-auto" style="max-height: calc(80vh - 100px);">
                            ${data.imageUrl ? `
                                <div class="mb-6">
                                    <img src="${data.imageUrl}" alt="${data.universityName}" 
                                        class="w-full h-48 object-cover rounded-lg shadow-md">
                                </div>
                            ` : ''}

                            <div class="space-y-6">
                                <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <h3 class="text-lg font-semibold text-blue-600 mb-2">Description</h3>
                                    <p class="text-gray-700 leading-relaxed">${data.description || 'No description available'}</p>
                                </div>

                                <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <h3 class="text-lg font-semibold text-blue-600 mb-2">Notable Programs</h3>
                                    <p class="text-gray-700 leading-relaxed">${data.notablePrograms || 'Information not available'}</p>
                                </div>

                                <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <h3 class="text-lg font-semibold text-blue-600 mb-2">Campus Life</h3>
                                    <p class="text-gray-700 leading-relaxed">${data.campusLife || 'Information not available'}</p>
                                </div>

                                <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <h3 class="text-lg font-semibold text-blue-600 mb-2">Admission Requirements</h3>
                                    <div class="space-y-3">
                                        <div>
                                            <h4 class="font-medium text-gray-800">General Requirements</h4>
                                            <p class="text-gray-700 leading-relaxed">
                                                ${data.admissionRequirements.general || 'Information not available'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 class="font-medium text-gray-800">GPA Requirement</h4>
                                            <p class="text-gray-700">
                                                ${data.admissionRequirements.gpa || 'Information not available'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 class="font-medium text-gray-800">English Language Requirements</h4>
                                            <p class="text-gray-700">
                                                IELTS: ${data.admissionRequirements.englishRequirements.ielts || 'Information not available'}
                                            </p>
                                            <p class="text-gray-700 text-sm mt-1">
                                                ${data.admissionRequirements.englishRequirements.notes || ''}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 class="font-medium text-gray-800">Required Documents</h4>
                                            <p class="text-gray-700">
                                                ${data.admissionRequirements.documents || 'Information not available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                    <h3 class="text-lg font-semibold text-blue-600 mb-2">Research Opportunities</h3>
                                    <p class="text-gray-700 leading-relaxed">${data.researchOpportunities || 'Information not available'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if it exists
            const existingModal = document.getElementById('searchModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add new modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Add scroll styling
            document.body.style.overflow = 'hidden';

            // Add event listeners
            const modal = document.getElementById('searchModal');
            const closeButton = document.getElementById('closeSearchModal');

            function closeModal() {
                modal.remove();
                document.body.style.overflow = '';
            }

            closeButton.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Prevent closing when clicking inside modal content
            modal.querySelector('.bg-white').addEventListener('click', (e) => {
                e.stopPropagation();
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error searching for university. Please try again.');
        });
    }

    // Add event listeners
    searchIcon.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});