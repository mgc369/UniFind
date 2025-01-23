class GPACalculator {
    constructor() {
        this.subjects = [];
        this.currentId = 0;
        this.gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0
        };
        this.gradingSystem = 'letter';
        this.init();
    }

    init() {
        this.container = document.getElementById('subjects-container');
        this.resultDiv = document.querySelector('.result');
        this.errorDiv = document.querySelector('.error');
        this.gpaValue = document.querySelector('.gpa-value');

        // Add initial subject
        this.addSubject();

        // Event listeners
        document.querySelector('.add-btn').addEventListener('click', () => this.addSubject());
        document.querySelector('.calculate-btn').addEventListener('click', () => this.calculateGPA());

        // Grading system buttons
        document.querySelectorAll('.grading-system button').forEach(button => {
            button.addEventListener('click', (e) => this.changeGradingSystem(e));
        });
    }

    createSubjectRow() {
        const id = ++this.currentId;
        const row = document.createElement('div');
        row.className = 'subject-row';
        row.dataset.id = id;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'subject-name';
        nameInput.placeholder = 'Subject Name';

        const gradeSelect = document.createElement('select');
        gradeSelect.className = 'grade';
        this.updateGradeOptions(gradeSelect);

        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.className = 'credits';
        creditsInput.placeholder = 'Credits';
        creditsInput.min = '0.5';
        creditsInput.step = '0.5';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.addEventListener('click', () => this.deleteSubject(id));

        row.append(nameInput, gradeSelect, creditsInput, deleteBtn);
        return row;
    }

    addSubject() {
        const row = this.createSubjectRow();
        this.container.appendChild(row);
    }

    deleteSubject(id) {
        const row = this.container.querySelector(`[data-id="${id}"]`);
        if (row && this.container.children.length > 1) {
            row.remove();
        }
    }

    updateGradeOptions(select) {
        select.innerHTML = '';
        const grades = this.gradingSystem === 'letter' 
            ? Object.keys(this.gradePoints)
            : ['5', '4', '3', '2'];

        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            select.appendChild(option);
        });
    }

    changeGradingSystem(e) {
        const buttons = document.querySelectorAll('.grading-system button');
        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        this.gradingSystem = e.target.dataset.system;
        
        // Update all existing grade selects
        document.querySelectorAll('.grade').forEach(select => {
            this.updateGradeOptions(select);
        });
    }

    validateInputs() {
        const subjects = Array.from(this.container.children);
        if (subjects.length === 0) {
            this.showError('Please add at least one subject');
            return false;
        }

        for (const row of subjects) {
            const name = row.querySelector('.subject-name').value.trim();
            const credits = parseFloat(row.querySelector('.credits').value);

            if (!name) {
                this.showError('Please enter all subject names');
                return false;
            }

            if (!credits || credits <= 0) {
                this.showError('Please enter valid credits for all subjects');
                return false;
            }
        }

        return true;
    }

    calculateGPA() {
        this.hideError();
        this.hideResult();

        if (!this.validateInputs()) {
            return;
        }

        try {
            let totalPoints = 0;
            let totalCredits = 0;

            Array.from(this.container.children).forEach(row => {
                const credits = parseFloat(row.querySelector('.credits').value);
                const grade = row.querySelector('.grade').value;
                
                const gradePoint = this.gradingSystem === 'letter' 
                    ? this.gradePoints[grade]
                    : parseFloat(grade);

                totalPoints += credits * gradePoint;
                totalCredits += credits;
            });

            if (totalCredits === 0) {
                throw new Error('Total credits cannot be zero');
            }

            const gpa = totalPoints / totalCredits;
            this.showResult(gpa);
        } catch (err) {
            this.showError('Error calculating GPA');
        }
    }

    showResult(gpa) {
        this.gpaValue.textContent = gpa.toFixed(2);
        this.resultDiv.classList.add('visible');
    }

    hideResult() {
        this.resultDiv.classList.remove('visible');
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.classList.add('visible');
    }

    hideError() {
        this.errorDiv.classList.remove('visible');
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GPACalculator();
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