/**
 * Official Holidays Feature
 * This module handles official holiday periods that apply to all users
 * Only backoffice users can create/edit/delete official holidays
 */

const OfficialHolidaysFeature = (function() {
    // Private variables
    let officialHolidays = [];
    let isInitialized = false;
    
    // Private methods
    function addStyles() {
        if (document.getElementById('official-holidays-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'official-holidays-styles';
        styleEl.innerHTML = `
            /* Official Holiday Styles - Maximum specificity to override all backgrounds */
            .day-card .shift-left.official-holiday-shift,
            .day-card .shift-right.official-holiday-shift,
            .day-card .shift-left-red.official-holiday-shift,
            .day-card .shift-right-red.official-holiday-shift,
            .day-card .official-holiday-shift {
               
                background-color: #ffffff !important;
                opacity: 0.8 !important;
                background-size: 10px 10px !important;
                background-image: repeating-linear-gradient(-45deg, #3a6d99 0, #3a6d99 1px, #ffffff 0, #ffffff 50%) !important;
                position: relative;
            }
            
            /* Hide shift labels on official holiday shifts */
            .official-holiday-shift .shift-label {
                opacity: 0 !important;
            }
            
            
            /* Modal styles */
            #officialHolidayModal {
                display: none;
                position: fixed;
                z-index: 2001;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                overflow: auto;
            }
            
            .official-holiday-modal-content {
                background-color: #fefefe;
                margin: 5% auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                position: relative;
            }
            
            /* Mobile full-screen modal */
            @media screen and (max-width: 768px) {
                .official-holiday-modal-content {
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    border: none !important;
                    max-width: none !important;
                    padding: 80px 20px 20px 20px !important;
                    overflow-y: auto !important;
                }
                
                .official-holiday-modal-header {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    padding: 20px !important;
                    margin-bottom: 0 !important;
                    background-color: #fefefe !important;
                    border-bottom: 1px solid #eee !important;
                    z-index: 1000 !important;
                }
                
                .official-holiday-form {
                    margin-top: 20px !important;
                    position: relative !important;
                    z-index: 1 !important;
                }
                
                .official-holiday-form-row {
                    margin-bottom: 20px !important;
                }
                
                .official-holiday-label {
                    position: static !important;
                    display: block !important;
                    margin-bottom: 8px !important;
                    z-index: auto !important;
                    margin-top: 38px !important;
                }
            }
            
            .official-holiday-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            .official-holiday-modal-title {
                font-size: 1.5rem;
                margin: 0;
                color: #333;
            }
            
            .official-holiday-modal-close {
                color: #aaa;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                background: none;
                border: none;
                padding: 0;
            }
            
            .official-holiday-modal-close:hover {
                color: #000;
            }
            
            .official-holiday-form {
                margin: 20px 0 20px 0;
            }
            
            .official-holiday-form-row {
                display: flex;
                gap: 15px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .official-holiday-form-group {
                flex: 1;
                min-width: 200px;
            }
            
            .official-holiday-form-group.full-width {
                flex: 1 1 100%;
            }
            
            .official-holiday-label {
                display: block;
                word-break: break-word;
                overflow-wrap: break-word;
                white-space: normal;
                border-radius: 3px;
                margin-top: 52px;
                font-weight: 600;
                font-size: 12px;
                color: #ffffff;
                background-color: #3a6d99;
                width: 100%;
                padding: 4px 5px;
            }
            
            .official-holiday-input,
            .official-holiday-textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .official-holiday-textarea {
                min-height: 60px;
                resize: vertical;
            }
            
            .official-holiday-add-btn {
                padding: 10px 20px;
                background-color: #d4a017;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.2s;
            }
            
            .official-holiday-add-btn:hover {
                background-color: #b8901a;
            }
            
            .official-holiday-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .official-holiday-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin-bottom: 10px;
                border: 1px solid #eee;
            }
            
            .official-holiday-item-info {
                flex: 1;
            }
            
            .official-holiday-item-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: #333;
            }
            
            .official-holiday-item-dates {
                font-size: 14px;
                color: #666;
            }
            
            .official-holiday-item-description {
                font-size: 13px;
                color: #777;
                margin-top: 4px;
                font-style: italic;
            }
            
            .official-holiday-delete-btn {
                background: none;
                border: none;
                color: #f44336;
                font-size: 20px;
                cursor: pointer;
                padding: 5px;
                transition: color 0.2s;
            }
            
            .official-holiday-delete-btn:hover {
                color: #d32f2f;
            }
            
            .no-holidays-message {
                text-align: center;
                color: #999;
                padding: 40px;
                font-style: italic;
            }
            
            /* Holiday indicator on calendar */
            .day-card.has-official-holiday {
                background-color: #fff6d5;
            }
        `;
        
        document.head.appendChild(styleEl);
        console.log('Official holiday styles added');
    }
    
    // Load official holidays from API
    async function loadOfficialHolidays() {
        try {
            console.log('Loading official holidays from API');
            
            const response = await fetch('api/official_holidays.php');
            
            if (!response.ok) {
                throw new Error(`Failed to load official holidays: ${response.statusText}`);
            }
            
            officialHolidays = await response.json();
            console.log(`Loaded ${officialHolidays.length} official holidays`);
            
            // Update calendar to show holidays
            updateOfficialHolidayIndicators();
            
            return officialHolidays.length;
        } catch (error) {
            console.error('Error loading official holidays:', error);
            officialHolidays = [];
            return 0;
        }
    }
    
    // Check if a specific date is an official holiday
    function isOfficialHoliday(year, month, day) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        return officialHolidays.some(holiday => {
            return dateStr >= holiday.start_date && dateStr <= holiday.end_date;
        });
    }
    
    // Get holiday info for a specific date
    function getHolidayForDate(year, month, day) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        return officialHolidays.find(holiday => {
            return dateStr >= holiday.start_date && dateStr <= holiday.end_date;
        });
    }
    
    // Update official holiday indicators on shifts
    function updateOfficialHolidayIndicators() {
        const dayCards = document.querySelectorAll('.day-card');
        
        dayCards.forEach(card => {
            const day = parseInt(card.dataset.day);
            const month = parseInt(card.dataset.month);
            const year = parseInt(card.dataset.year);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                return;
            }
            
            const isHoliday = isOfficialHoliday(year, month, day);
            const shiftLeft = card.querySelector('.shift-left');
            const shiftRight = card.querySelector('.shift-right');
            
            // Remove existing holiday classes and labels
            if (shiftLeft) {
                shiftLeft.classList.remove('official-holiday-shift');
                const existingLabel = shiftLeft.querySelector('.official-holiday-label');
                if (existingLabel) existingLabel.remove();
            }
            
            if (shiftRight) {
                shiftRight.classList.remove('official-holiday-shift');
                const existingLabel = shiftRight.querySelector('.official-holiday-label');
                if (existingLabel) existingLabel.remove();
            }
            
            // Add holiday styling and lock shifts if needed
            if (isHoliday) {
                // Get the holiday info to display the custom title
                const holidayInfo = getHolidayForDate(year, month, day);
                const holidayTitle = holidayInfo ? holidayInfo.title : 'Ferien';
                
                // Mark card as official holiday for CSS styling
                card.classList.add('official-holiday-day');
                
                if (shiftLeft) {
                    shiftLeft.classList.add('official-holiday-shift');
                    // Disable clicking on holiday shifts
                    shiftLeft.style.pointerEvents = 'none';
                    shiftLeft.style.cursor = 'not-allowed';
                    const label = document.createElement('div');
                    label.className = 'official-holiday-label';
                    label.textContent = holidayTitle;
                    shiftLeft.appendChild(label);
                }
                
                if (shiftRight) {
                    shiftRight.classList.add('official-holiday-shift');
                    // Disable clicking on holiday shifts
                    shiftRight.style.pointerEvents = 'none';
                    shiftRight.style.cursor = 'not-allowed';
                    const label = document.createElement('div');
                    label.className = 'official-holiday-label';
                    label.textContent = holidayTitle;
                    shiftRight.appendChild(label);
                }
            } else {
                // Remove holiday day class and restore interactivity
                card.classList.remove('official-holiday-day');
                
                if (shiftLeft) {
                    shiftLeft.style.pointerEvents = '';
                    shiftLeft.style.cursor = '';
                }
                
                if (shiftRight) {
                    shiftRight.style.pointerEvents = '';
                    shiftRight.style.cursor = '';
                }
            }
        });
        
        console.log('Official holiday indicators updated');
    }
    
    // Create the official holiday modal
    function createModal() {
        if (document.getElementById('officialHolidayModal')) {
            return;
        }
        
        const modalHtml = `
            <div id="officialHolidayModal">
                <div class="official-holiday-modal-content">
                    <div class="official-holiday-modal-header">
                        <h2 class="official-holiday-modal-title">Betriebsferien verwalten</h2>
                        <button class="official-holiday-modal-close">&times;</button>
                    </div>
                    
                    <div class="official-holiday-form">
                        <div class="official-holiday-form-row">
                            <div class="official-holiday-form-group">
                                <label class="official-holiday-label" for="official-holiday-start">Startdatum</label>
                                <input type="date" id="official-holiday-start" class="official-holiday-input">
                            </div>
                            <div class="official-holiday-form-group">
                                <label class="official-holiday-label" for="official-holiday-end">Enddatum</label>
                                <input type="date" id="official-holiday-end" class="official-holiday-input">
                            </div>
                        </div>
                        <div class="official-holiday-form-row">
                            <div class="official-holiday-form-group full-width">
                                <label class="official-holiday-label" for="official-holiday-title">Bezeichnung</label>
                                <input type="text" id="official-holiday-title" class="official-holiday-input" placeholder="z.B. Sommerferien">
                            </div>
                        </div> 
                       <!-- <div class="official-holiday-form-row">
                            <div class="official-holiday-form-group full-width">
                                <label class="official-holiday-label" for="holiday-description">Beschreibung (optional)</label>
                                <textarea id="holiday-description" class="official-holiday-textarea" placeholder="Zusätzliche Informationen..."></textarea>
                            </div>
                        </div> -->
                        <button class="official-holiday-add-btn">Ferien hinzufügen</button>
                    </div>
                    
                    <div class="official-holiday-list" id="official-holiday-list"></div>
                </div>
            </div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container.firstElementChild);
        
        // Add event listeners
        const modal = document.getElementById('officialHolidayModal');
        const closeBtn = modal.querySelector('.official-holiday-modal-close');
        const addBtn = modal.querySelector('.official-holiday-add-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        addBtn.addEventListener('click', () => {
            addOfficialHoliday();
        });
        
        console.log('Official holiday modal created');
    }
    
    // Update the holiday list in the modal
    function updateHolidayList() {
        const listEl = document.getElementById('official-holiday-list');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        
        if (officialHolidays.length === 0) {
            listEl.innerHTML = '<div class="no-holidays-message">Keine offiziellen Ferien definiert</div>';
            return;
        }
        
        // Sort holidays by start date (most recent first)
        const sortedHolidays = [...officialHolidays].sort((a, b) => {
            return new Date(b.start_date) - new Date(a.start_date);
        });
        
        sortedHolidays.forEach(holiday => {
            const startDate = new Date(holiday.start_date);
            const endDate = new Date(holiday.end_date);
            
            const formattedStart = startDate.toLocaleDateString('de-CH');
            const formattedEnd = endDate.toLocaleDateString('de-CH');
            
            const item = document.createElement('div');
            item.className = 'official-holiday-item';
            item.innerHTML = `
                <div class="official-holiday-item-info">
                    <div class="official-holiday-item-title">${holiday.title}</div>
                    <div class="official-holiday-item-dates">${formattedStart} - ${formattedEnd}</div>
                    ${holiday.description ? `<div class="official-holiday-item-description">${holiday.description}</div>` : ''}
                </div>
                <button class="official-holiday-delete-btn" data-id="${holiday.id}">&times;</button>
            `;
            
            const deleteBtn = item.querySelector('.official-holiday-delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Möchten Sie die Ferien "${holiday.title}" wirklich löschen?`)) {
                    deleteOfficialHoliday(holiday.id);
                }
            });
            
            listEl.appendChild(item);
        });
    }
    
    // Add a new official holiday
    async function addOfficialHoliday() {
        const startInput = document.getElementById('official-holiday-start');
        const endInput = document.getElementById('official-holiday-end');
        const titleInput = document.getElementById('official-holiday-title');
        const descriptionInput = document.getElementById('official-holiday-description');
        
        const start = startInput.value;
        const end = endInput.value;
        const title = titleInput.value.trim();
        const description = descriptionInput ? descriptionInput.value.trim() : '';
        
        if (!start || !end || !title) {
            alert('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }
        
        if (start > end) {
            alert('Das Enddatum muss nach dem Startdatum liegen.');
            return;
        }
        
        try {
            console.log(`Adding official holiday: ${title} from ${start} to ${end}`);
            
            // Use AuthManager.fetchWithAuth with token in URL for server compatibility
            const url = AuthManager.addTokenToUrl('api/official_holidays.php');
            const response = await AuthManager.fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    start_date: start,
                    end_date: end,
                    title: title,
                    description: description
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add official holiday');
            }
            
            const createdHoliday = await response.json();
            
            // Add to local data
            officialHolidays.push(createdHoliday);
            
            // Update UI
            updateHolidayList();
            updateOfficialHolidayIndicators();
            
            // Clear inputs
            startInput.value = '';
            endInput.value = '';
            titleInput.value = '';
            if (descriptionInput) descriptionInput.value = '';
            
            // Show success notification
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.success('Offizielle Ferien erfolgreich hinzugefügt');
            }
            
            console.log('Official holiday added successfully:', createdHoliday);
        } catch (error) {
            console.error('Error adding official holiday:', error);
            alert(`Fehler beim Hinzufügen der Ferien: ${error.message}`);
        }
    }
    
    // Delete an official holiday
    async function deleteOfficialHoliday(holidayId) {
        try {
            // Use AuthManager.fetchWithAuth with token in URL for server compatibility
            const url = AuthManager.addTokenToUrl(`api/official_holidays.php?id=${holidayId}`);
            const response = await AuthManager.fetchWithAuth(url, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete official holiday');
            }
            
            // Remove from local data
            officialHolidays = officialHolidays.filter(h => h.id !== holidayId);
            
            // Update UI
            updateHolidayList();
            updateOfficialHolidayIndicators();
            
            // Show success notification
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.success('Offizielle Ferien erfolgreich gelöscht');
            }
            
            console.log('Official holiday deleted successfully:', holidayId);
        } catch (error) {
            console.error('Error deleting official holiday:', error);
            alert(`Fehler beim Löschen der Ferien: ${error.message}`);
        }
    }
    
    // Open official holiday modal
    function openOfficialHolidayModal() {
        console.log('Opening official holiday modal');
        
        const modal = document.getElementById('officialHolidayModal');
        if (!modal) {
            console.error('Official holiday modal not found');
            return;
        }
        
        // Update holiday list
        updateHolidayList();
        
        // Set default dates (today to a week from now)
        const startInput = document.getElementById('official-holiday-start');
        const endInput = document.getElementById('official-holiday-end');
        
        if (startInput && endInput) {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            
            startInput.value = today.toISOString().split('T')[0];
            endInput.value = nextWeek.toISOString().split('T')[0];
        }
        
        // Show modal
        modal.style.display = 'block';
    }
    
    // Add button to navbar for backoffice users
    function addOfficialHolidayButton() {
        // Only for backoffice users
        if (!isBackofficeUser()) return;
        
        // Check if button already exists
        if (document.getElementById('officialHolidayBtn')) return;
        
        const navbarControls = document.querySelector('.navbar-controls');
        if (!navbarControls) return;
        
        // Create button
        const holidayBtn = document.createElement('button');
        holidayBtn.id = 'officialHolidayBtn';
        holidayBtn.className = 'button-nav button-official-holiday';
        holidayBtn.innerHTML = '<span class="button-icon">🏖️</span>';
        holidayBtn.title = 'Betriebsferien';
        holidayBtn.addEventListener('click', openOfficialHolidayModal);
        
        // Insert before the color customize button if it exists
        const colorBtn = document.getElementById('colorCustomizeBtn');
        if (colorBtn) {
            navbarControls.insertBefore(holidayBtn, colorBtn);
        } else {
            // Otherwise insert before the freeze button
            const freezeBtn = document.getElementById('freezeToggleBtn');
            if (freezeBtn) {
                navbarControls.insertBefore(holidayBtn, freezeBtn);
            } else {
                navbarControls.appendChild(holidayBtn);
            }
        }
        
        console.log('Official holiday button added to navbar');
        
        // Also set up the mobile button
        setupMobileOfficialHolidayButton();
    }
    
    // Set up mobile official holiday button
    function setupMobileOfficialHolidayButton() {
        const mobileBtn = document.getElementById('mobileOfficialHolidayBtn');
        if (!mobileBtn) {
            console.log('Mobile official holiday button not found');
            return;
        }
        
        // Add click handler if not already added
        if (!mobileBtn.hasAttribute('data-handler-added')) {
            mobileBtn.addEventListener('click', openOfficialHolidayModal);
            mobileBtn.setAttribute('data-handler-added', 'true');
        }
        
        // Show/hide based on user role
        if (isBackofficeUser()) {
            mobileBtn.style.display = 'flex';
        } else {
            mobileBtn.style.display = 'none';
        }
    }
    
    // Check if current user is a backoffice user
    function isBackofficeUser() {
        const currentUser = AuthManager.getCurrentUser();
        return currentUser && currentUser.role === 'Backoffice';
    }
    
    // Set up mutation observer to handle dynamic DOM updates
    function setupMutationObserver() {
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
                    updateOfficialHolidayIndicators();
                }, 100);
            }
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Mutation observer set up for official holidays');
    }
    
    // Public interface
    return {
        // Initialize the official holidays feature
        init: async function() {
            if (isInitialized) {
                console.log('Official Holidays Feature already initialized');
                return true;
            }
            
            console.log('Initializing Official Holidays Feature');
            
            // Add styles
            addStyles();
            
            // Load official holidays from API
            await loadOfficialHolidays();
            
            // Create modal
            createModal();
            
            // Add button for backoffice users
            if (isBackofficeUser()) {
                addOfficialHolidayButton();
            }
            
            // Set up mutation observer
            setupMutationObserver();
            
            isInitialized = true;
            console.log('Official Holidays Feature initialized');
            
            return true;
        },
        
        // Expose public methods
        loadOfficialHolidays: loadOfficialHolidays,
        updateOfficialHolidayIndicators: updateOfficialHolidayIndicators,
        openOfficialHolidayModal: openOfficialHolidayModal,
        isOfficialHoliday: isOfficialHoliday,
        getHolidayForDate: getHolidayForDate
    };
})();

// Initialize when the page loads
window.addEventListener('load', function() {
    // Wait for the app to initialize
    setTimeout(() => {
        // Initialize will be called from script.js
    }, 500);
});