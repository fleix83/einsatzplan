// Create a self-contained module for the holiday feature
const HolidayFeature = (function() {
    // Private variables
    let currentUserId = null;
    
    // Private methods and variables
    function addStyles() {
        if (document.getElementById('holiday-feature-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'holiday-feature-styles';
        styleEl.innerHTML = `
            /* Holiday icon styles */
            .holiday-btn {
                background: #f0f0f0;
                border: none;
                cursor: pointer;
                font-size: 16px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                transition: background-color 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: auto;
            }
            
            .holiday-btn:hover {
                background-color: #e0e0e0;
            }
            
            /* Holiday stripe styles */
            .holiday-stripe {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 5px;
                border-radius: 4px 4px 0 0;
                z-index: 5;
            }
            
            .holiday-stripe.level-1 {
                background-color: #FFD700; /* Yellow for 1-2 users */
            }
            
            .holiday-stripe.level-2 {
                background-color: #FFA500; /* Orange for 3-4 users */
            }
            
            .holiday-stripe.level-3 {
                background-color: #FF4500; /* Red for 5+ users */
            }
            
            /* Backoffice holiday stripe styles */
            .backoffice-holiday-stripe {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 20px;
                border-radius: 0 0 4px 4px;
                z-index: 6;
                background-color: #ffffff;
                background-size: 10px 10px;
                background-image: repeating-linear-gradient(-45deg, #386aff 0, #386aff 1px, #ffffff 0, #ffffff 50%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                overflow: hidden;
                white-space: nowrap;
            }
            
            /* White background for the text inside backoffice holiday stripes */
            .backoffice-holiday-text {
             background-color: #2d9dff;
            color: white;
            padding: 4px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            text-shadow: none;
            width: 100%;
            }
            
            /* Holiday modal styles */
            #holiday-modal {
                display: none;
                position: fixed;
                z-index: 2000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                overflow: auto;
            }
            
            .holiday-modal-content {
                background-color: #fefefe;
                margin: 10% auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                width: 80%;
                max-width: 500px;
                position: relative;
            }
            
            .holiday-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            .holiday-modal-title {
                font-size: 1.5rem;
                margin: 0;
            }
            
            .holiday-modal-close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                margin-left: 20px;
            }
            
            .holiday-modal-close:hover {
                color: black;
            }
            
            .holiday-form {
                margin-bottom: 20px;
            }
            
            .holiday-date-row {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .holiday-date-group {
                flex: 1;
            }
            
            .holiday-date-label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .holiday-date-input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .holiday-add-btn {
                padding: 8px 16px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .holiday-add-btn:hover {
                background-color: #388E3C;
            }
            
            .holiday-list {
                margin-top: 20px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .holiday-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .holiday-delete-btn {
                background: none;
                border: none;
                color: #f44336;
                font-size: 18px;
                cursor: pointer;
            }
        `;
        
        document.head.appendChild(styleEl);
        console.log('Holiday styles added');
    }
    
    // Initialize holiday data structure
    function initializeHolidayData() {
        if (!staticData.holidays) {
            staticData.holidays = {};
        }
        
        staticData.users.forEach(user => {
            if (!staticData.holidays[user.id]) {
                staticData.holidays[user.id] = [];
            }
        });
        
        console.log('Holiday data structure initialized');
    }
    
// Load holidays from the API
async function loadHolidays() {
    try {
        console.log('Loading holiday data from API');
        
        // Initialize or RESET holidays object
        staticData.holidays = {}; // Reset completely to avoid duplicates
        
        // Make direct fetch request without authorization
        const response = await fetch('api/holidays.php');
        
        if (!response.ok) {
            throw new Error(`Failed to load holidays: ${response.statusText}`);
        }
        
        const holidays = await response.json();
        console.log('Received holiday data:', holidays);
        
        // Group holidays by user ID
        holidays.forEach(holiday => {
            if (!staticData.holidays[holiday.user_id]) {
                staticData.holidays[holiday.user_id] = [];
            }
            
            staticData.holidays[holiday.user_id].push({
                id: holiday.id,
                start: holiday.start_date,
                end: holiday.end_date,
                approved: !!holiday.approved
            });
        });
        
        console.log(`Loaded ${holidays.length} holidays`);
        
        return holidays.length;
    } catch (error) {
        console.error('Error loading holidays:', error);
        
        // Initialize empty holiday data for all users
        staticData.users.forEach(user => {
            if (!staticData.holidays[user.id]) {
                staticData.holidays[user.id] = [];
            }
        });
        
        return 0;
    }
}
    
    // Update holiday stripes on day cards
    function updateHolidayStripes() {
        const dayCards = document.querySelectorAll('.day-card');
        
        dayCards.forEach(card => {
            // Get day, month, year from card
            const day = parseInt(card.dataset.day);
            const month = parseInt(card.dataset.month);
            const year = parseInt(card.dataset.year);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                return;
            }
            
            // Count Freiwillige holidays for this day (top stripes)
            const freiwilligeCount = countHolidaysOnDay(year, month, day);
            
            // Get backoffice holidays for this day (bottom stripes)
            const backofficeHolidays = countBackofficeHolidaysOnDay(year, month, day);
            
            // Get shift elements for this day
            const shiftLeft = card.querySelector('.shift-left');
            const shiftRight = card.querySelector('.shift-right');
            
            // Remove existing stripes from shifts
            const existingStripes = card.querySelectorAll('.holiday-stripe, .backoffice-holiday-stripe');
            existingStripes.forEach(stripe => stripe.remove());
            
            // Add Freiwillige stripes to top if needed
            if (freiwilligeCount > 0) {
                // Determine level based on count
                let levelClass = 'level-1'; // Yellow
                if (freiwilligeCount > 4) {
                    levelClass = 'level-3'; // Red
                } else if (freiwilligeCount > 2) {
                    levelClass = 'level-2'; // Orange
                }
                
                // Add stripe to left shift
                if (shiftLeft) {
                    const stripeLeft = document.createElement('div');
                    stripeLeft.className = `holiday-stripe ${levelClass} left-stripe`;
                    shiftLeft.appendChild(stripeLeft);
                }
                
                // Add stripe to right shift
                if (shiftRight) {
                    const stripeRight = document.createElement('div');
                    stripeRight.className = `holiday-stripe ${levelClass} right-stripe`;
                    shiftRight.appendChild(stripeRight);
                }
            }
            
            // Add backoffice stripes to bottom if needed
            if (backofficeHolidays.length > 0) {
                // Create text for all backoffice users on holiday
                const holidayText = backofficeHolidays.map(bh => `Ferien ${bh.userName}`).join(', ');
                
                // Add stripe to left shift
                if (shiftLeft) {
                    const backofficeStripeLeft = document.createElement('div');
                    backofficeStripeLeft.className = 'backoffice-holiday-stripe left-backoffice-stripe';
                    backofficeStripeLeft.title = holidayText; // Tooltip for overflow
                    
                    // Create span with white background for the text
                    const textSpan = document.createElement('span');
                    textSpan.className = 'backoffice-holiday-text';
                    textSpan.textContent = holidayText;
                    backofficeStripeLeft.appendChild(textSpan);
                    
                    shiftLeft.appendChild(backofficeStripeLeft);
                }
                
                // Add stripe to right shift
                if (shiftRight) {
                    const backofficeStripeRight = document.createElement('div');
                    backofficeStripeRight.className = 'backoffice-holiday-stripe right-backoffice-stripe';
                    backofficeStripeRight.title = holidayText; // Tooltip for overflow
                    
                    // Create span with white background for the text
                    const textSpan = document.createElement('span');
                    textSpan.className = 'backoffice-holiday-text';
                    textSpan.textContent = holidayText;
                    backofficeStripeRight.appendChild(textSpan);
                    
                    shiftRight.appendChild(backofficeStripeRight);
                }
            }
        });
        
        console.log('Holiday stripes updated on shifts');
    }
    
    // Count holidays for a specific day (Freiwillige users only)
    function countHolidaysOnDay(year, month, day) {
        if (!staticData || !staticData.holidays || !staticData.users) {
            return 0;
        }
        
        // Format the target date as YYYY-MM-DD for string comparison
        const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let count = 0;
        
        Object.keys(staticData.holidays).forEach(userId => {
            if (!staticData.holidays[userId]) return;
            
            // Find the user to check their role
            const user = staticData.users.find(u => u.id === parseInt(userId));
            if (!user) {
                return;
            }
            
            // Skip backoffice users for top stripe count
            if (user.role === 'Backoffice') {
                return;
            }
            
            for (const holiday of staticData.holidays[userId]) {
                // Compare as strings in YYYY-MM-DD format for exact matching
                if (targetDateStr >= holiday.start && targetDateStr <= holiday.end) {
                    count++;
                    break; // Count each user only once
                }
            }
        });
        
        return count;
    }
    
    // Count backoffice holidays for a specific day
    function countBackofficeHolidaysOnDay(year, month, day) {
        if (!staticData || !staticData.holidays || !staticData.users) {
            return [];
        }
        
        // Format the target date as YYYY-MM-DD for string comparison
        const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const backofficeHolidays = [];
        
        Object.keys(staticData.holidays).forEach(userId => {
            if (!staticData.holidays[userId]) return;
            
            // Find the user to check their role
            const user = staticData.users.find(u => u.id === parseInt(userId));
            if (!user) {
                return;
            }
            
            // Only process backoffice users
            if (user.role !== 'Backoffice') {
                return;
            }
            
            for (const holiday of staticData.holidays[userId]) {
                // Compare as strings in YYYY-MM-DD format for exact matching
                if (targetDateStr >= holiday.start && targetDateStr <= holiday.end) {
                    backofficeHolidays.push({
                        userId: userId,
                        userName: user.name,
                        holiday: holiday
                    });
                    break; // Count each user only once
                }
            }
        });
        
        return backofficeHolidays;
    }
    
    // Create the holiday modal
    function createModal() {
        // Skip if already exists
        if (document.getElementById('holiday-modal')) {
            return;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div id="holiday-modal">
                <div class="holiday-modal-content">
                    <div class="holiday-modal-header">
                        <h2 class="holiday-modal-title">Ferien <span id="holiday-user-name"></span></h2>
                        <span class="holiday-modal-close">&times;</span>
                    </div>
                    
                    <div class="holiday-form">
                        <div class="holiday-date-row">
                            <div class="holiday-date-group">
                                <label class="holiday-date-label" for="holiday-start">Startdatum</label>
                                <input type="date" id="holiday-start" class="holiday-date-input">
                            </div>
                            <div class="holiday-date-group">
                                <label class="holiday-date-label" for="holiday-end">Enddatum</label>
                                <input type="date" id="holiday-end" class="holiday-date-input">
                            </div>
                        </div>
                        <button class="holiday-add-btn">Ferien hinzufügen</button>
                    </div>
                    
                    <div class="holiday-list" id="holiday-list"></div>
                </div>
            </div>
        `;
        
        // Create container and add to body
        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container.firstElementChild);
        
        // Add event listeners
        const modal = document.getElementById('holiday-modal');
        const closeBtn = modal.querySelector('.holiday-modal-close');
        const addBtn = modal.querySelector('.holiday-add-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        addBtn.addEventListener('click', () => {
            addHoliday();
        });
        
        console.log('Holiday modal created');
    }
    
    // Update the holiday list in the modal
    function updateHolidayList() {
        const listEl = document.getElementById('holiday-list');
        if (!listEl || !currentUserId) return;
        
        // Clear list completely
        listEl.innerHTML = '';
        
        // Get user's holidays
        const holidays = staticData.holidays[currentUserId] || [];
        
        if (holidays.length === 0) {
            listEl.innerHTML = '<p>Keine Ferien geplant</p>';
            return;
        }
        
        // Sort holidays by start date (most recent first)
        const sortedHolidays = [...holidays].sort((a, b) => {
            return new Date(b.start) - new Date(a.start);
        });
        
        // Add each holiday to the list
        sortedHolidays.forEach((holiday, sortedIndex) => {
            // Create date objects carefully for display only
            const startParts = holiday.start.split('-');
            const endParts = holiday.end.split('-');
            
            // Create dates using year, month (0-based), day parameters to avoid timezone issues
            const startDate = new Date(
                parseInt(startParts[0]), 
                parseInt(startParts[1]) - 1, 
                parseInt(startParts[2])
            );
            
            const endDate = new Date(
                parseInt(endParts[0]), 
                parseInt(endParts[1]) - 1, 
                parseInt(endParts[2])
            );
            
            // Format for display using the built-in formatter
            const formattedStart = startDate.toLocaleDateString();
            const formattedEnd = endDate.toLocaleDateString();
            
            // Log dates for debugging
            console.log(`Holiday ${holiday.id} - Raw: ${holiday.start} to ${holiday.end}, Display: ${formattedStart} to ${formattedEnd}`);
            
            // Find the original index of this holiday in the unsorted array
            const originalIndex = holidays.findIndex(h => h.id === holiday.id);
            
            const item = document.createElement('div');
            item.className = 'holiday-item';
            item.innerHTML = `
                <div>${formattedStart} - ${formattedEnd}</div>
                <button class="holiday-delete-btn" data-id="${holiday.id}">&times;</button>
            `;
            
            // Add delete handler
            const deleteBtn = item.querySelector('.holiday-delete-btn');
            deleteBtn.addEventListener('click', () => {
                deleteHoliday(originalIndex, holiday.id);
            });
            
            listEl.appendChild(item);
        });
    }
    
    // Add a new holiday
    async function addHoliday() {
        if (!currentUserId) return;
        
        const startInput = document.getElementById('holiday-start');
        const endInput = document.getElementById('holiday-end');
        
        if (!startInput || !endInput) return;
        
        // Get the raw input values (YYYY-MM-DD format)
        const start = startInput.value;
        const end = endInput.value;
        
        if (!start || !end) {
            alert('Bitte wählen Sie Start- und Enddatum aus.');
            return;
        }
        
        // Simple date string comparison is fine for YYYY-MM-DD format
        if (start > end) {
            alert('Das Enddatum muss nach dem Startdatum liegen.');
            return;
        }
        
        try {
            console.log(`Adding holiday: ${start} to ${end}`);
            
            // Use AuthManager.fetchWithAuth with token in URL for server compatibility
            const url = AuthManager.addTokenToUrl('api/holidays.php');
            const response = await AuthManager.fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUserId,
                    start_date: start,  // Send raw YYYY-MM-DD string
                    end_date: end,      // Send raw YYYY-MM-DD string
                    approved: true      // Default to approved
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Hinzufügen der Ferien');
            }
            
            // Get the created holiday with its ID
            const createdHoliday = await response.json();
            
            // Add holiday to local data
            if (!staticData.holidays[currentUserId]) {
                staticData.holidays[currentUserId] = [];
            }
            
            // Store the exact date strings from the input
            staticData.holidays[currentUserId].push({
                id: createdHoliday.id,
                start: start,  // Use exactly what the user entered
                end: end,      // Use exactly what the user entered
                approved: true
            });
            
            // Update UI
            updateHolidayList();
            updateHolidayStripes();
            
            // Clear inputs
            startInput.value = '';
            endInput.value = '';
            
            console.log('Holiday added successfully:', createdHoliday);
        } catch (error) {
            console.error('Error adding holiday:', error);
            alert(`Fehler beim Hinzufügen der Ferien: ${error.message}`);
        }
    }
    
    // Delete a holiday
    async function deleteHoliday(index, holidayId) {
        if (!currentUserId || !staticData.holidays[currentUserId]) return;
        
        // Get the holiday to delete - first try by index for backward compatibility
        const holiday = staticData.holidays[currentUserId][index];
        
        // Extra validation to make sure we're deleting the right holiday
        if (!holiday || (holidayId && holiday.id !== holidayId)) {
            console.error('Holiday not found or ID mismatch');
            return;
        }
        
        try {
            // Use AuthManager.fetchWithAuth with token in URL for server compatibility
            const url = AuthManager.addTokenToUrl(`api/holidays.php?id=${holiday.id}`);
            const response = await AuthManager.fetchWithAuth(url, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Löschen der Ferien');
            }
            
            // Remove holiday from local data
            staticData.holidays[currentUserId].splice(index, 1);
            
            // Update UI
            updateHolidayList();
            updateHolidayStripes();
            
            console.log('Holiday deleted successfully:', holiday.id);
        } catch (error) {
            console.error('Error deleting holiday:', error);
            alert(`Fehler beim Löschen der Ferien: ${error.message}`);
        }
    }
    
    // Open holiday modal for a user
    function openHolidayModal(userId) {
        console.log('Opening holiday modal for user ID:', userId);
        currentUserId = userId;
        
        // Find user
        const user = staticData.users.find(u => u.id === userId);
        if (!user) {
            console.error('User not found:', userId);
            return;
        }
        
        // Update modal title
        const userNameEl = document.getElementById('holiday-user-name');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
        
        // Clear form
        const startInput = document.getElementById('holiday-start');
        const endInput = document.getElementById('holiday-end');
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        
        // Set default dates (today to a week from now)
        if (startInput && endInput) {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            
            startInput.value = today.toISOString().split('T')[0];
            endInput.value = nextWeek.toISOString().split('T')[0];
        }
        
        // Update holiday list
        updateHolidayList();
        
        // Show modal
        const modal = document.getElementById('holiday-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    // Set up mutation observer to handle dynamic DOM updates
    function setupMutationObserver() {
        // Create an observer instance
        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && 
                    (mutation.target.id === 'calendar' ||
                     mutation.target.classList?.contains('day-card'))) {
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                // Wait a bit for DOM to stabilize
                setTimeout(() => {
                    updateHolidayStripes();
                }, 100);
            }
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Mutation observer set up for holiday feature');
    }
    
    // Public interface
    return {
        // Initialize the holiday feature
        init: async function() {
            console.log('Initializing Holiday Feature Module');
            
            // Add styles
            addStyles();
            
            // Initialize data structure
            initializeHolidayData();
            
            // Load holiday data from API
            await loadHolidays();
            
            // Add stripes to day cards
            updateHolidayStripes();
            
            // Create modal if it doesn't exist
            createModal();
            
            // Set up mutation observer to handle dynamic DOM updates
            setupMutationObserver();
            
            console.log('Holiday Feature Module initialized');
            
            return true;
        },
        
        // Expose needed public methods
        addHoliday: addHoliday,
        deleteHoliday: deleteHoliday,
        updateHolidayList: updateHolidayList,
        updateHolidayStripes: updateHolidayStripes,
        loadHolidays: loadHolidays,
        openHolidayModal: openHolidayModal,
        
        // Get the current user ID
        getCurrentUserId: function() {
            return currentUserId;
        }
    };
})();

// Initialize the holiday feature after the page loads
window.addEventListener('load', function() {
    // Wait a moment for the app to initialize
    setTimeout(() => {
        // Don't automatically initialize here since we're doing it in script.js
        // HolidayFeature.init();
    }, 500);
});