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