/**
 * Custom Events Feature
 * This module handles the creation and display of custom events by backoffice users
 */

const CustomEventsFeature = (function() {
    // Private variables
    let _currentDay = null;
    let _currentMonth = null;
    let _currentYear = null;
    let selectedEventId = null;
    
    // Accessor methods to ensure we always have current values
    function getCurrentYear() {
        if (!_currentYear) {
            _currentYear = window.currentYear || 
                parseInt(document.getElementById('yearSelect')?.value) || 
                new Date().getFullYear();
        }
        return _currentYear;
    }
    
    function getCurrentMonth() {
        if (!_currentMonth) {
            _currentMonth = window.currentMonth || 
                parseInt(document.getElementById('monthSelect')?.value) || 
                new Date().getMonth() + 1;
        }
        return _currentMonth;
    }
    
    function getCurrentDay() {
        return _currentDay || 1;
    }
    
    function setCurrentDate(day, month, year) {
        if (day) _currentDay = parseInt(day);
        if (month) _currentMonth = parseInt(month);
        if (year) _currentYear = parseInt(year);
        console.log(`[DEBUG] Current date set to: ${_currentYear}-${_currentMonth}-${_currentDay}`);
    }
    
    // Initialize static data structure for custom events if it doesn't exist
    function initializeCustomEventsData() {
        if (!staticData.customEvents) {
            staticData.customEvents = {};
        }
    }
    
    // Add styles for custom events
    function addStyles() {
        if (document.getElementById('custom-events-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'custom-events-styles';
        styleEl.innerHTML = `
            /* Custom event button styles */
            .button-custom-event {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background-color: var(--primary-color, #1760ff);
                color: white;
                border: none;
                cursor: pointer;
                transition: background-color 0.2s;
                margin-left: 8px;
            }
            
            .button-custom-event:hover {
                background-color: #0045e6;
            }
            
            /* Custom event indicator styles */
            .custom-event-indicator {
                position: absolute;
                bottom: 0;
                // right: 0;
                width: 90%;
                border-radius: 0 0 4px 4px;
                z-index: 5;
                padding: 0;
            }
            
            .custom-event-item {
                display: flex;
                justfify-content: flex-start;
                background-color: #ffffff;
                align-items: center;
                gap: 4px;
                padding: 3px;
                margin-bottom: 1px;
            }

            @media screen and (max-width: 768px) {

                .custom-event-item {
                overflow: visible;
                }

            }      
            
            .custom-event-dot {
                width: 2px;
                height: 20px;
                /* border-radius: 50%; */
                background-color: var(--primary-color, #1760ff);
                margin-right: 1px;
                flex-shrink: 0;
            }
            
            .custom-event-text {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 1px;
                min-width: 0;
                flex: 1;
            }
            
            .custom-event-name {
                font-weight: bold;
                font-size: 0.6rem;
                color: #333;
                line-height: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            }
            
            .custom-event-time {
                font-size: 0.6rem;
                color: #666;
                line-height: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            }
            
            /* Custom event modal styles */
            #customEventModal {
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
            
            .custom-event-modal-content {
                background-color: #fefefe;
                margin: 10% auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                width: 80%;
                max-width: 500px;
                position: relative;
            }
            
            /* Mobile full-screen modal */
            @media screen and (max-width: 768px) {
                .custom-event-modal-content {
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    border: none !important;
                    max-width: none !important;
                    padding: 80px 20px 20px 20px !important;
                    overflow-y: auto !important;
                }
                
                .custom-event-modal-header {
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
                
                .custom-event-form {
                    margin-top: 20px !important;
                    position: relative !important;
                    z-index: 1 !important;
                }
                
                .custom-event-form-group {
                    margin-bottom: 20px !important;
                }
                
                .custom-event-label {
                    position: static !important;
                    display: block !important;
                    margin-bottom: 8px !important;
                    z-index: auto !important;
                }
            }
            
            .custom-event-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            .custom-event-modal-title {
                font-size: 1.5rem;
                margin: 0;
            }
            
            .custom-event-modal-close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                margin-left: 20px;
            }
            
            .custom-event-modal-close:hover {
                color: black;
            }
            
            .custom-event-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .custom-event-form-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .custom-event-label {
                font-weight: bold;
            }
            
            .custom-event-input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 100%;
            }
            
            .custom-event-actions {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }
            
            .custom-event-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .custom-event-btn-primary {
                background-color: var(--primary-color, #1760ff);
                color: white;
            }
            
            .custom-event-btn-danger {
                background-color: #f44336;
                color: white;
            }
            
            .custom-event-list {
                margin-top: 20px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .custom-event-item {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                padding: 3px;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .custom-event-delete-btn {
                background: none;
                border: none;
                color: #f44336;
                font-size: 18px;
                cursor: pointer;
            }
        `;
        
        document.head.appendChild(styleEl);
        console.log('Custom event styles added');
    }
    
    // Create the custom event modal
    function createModal() {
        // Skip if already exists
        if (document.getElementById('customEventModal')) {
            return;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div id="customEventModal" class="modal">
                <div class="custom-event-modal-content">
                    <div class="custom-event-modal-header">
                        <h2 class="custom-event-modal-title">Neue Sitzung/Veranstaltung</h2>
                        <span class="custom-event-modal-close">&times;</span>
                    </div>
                    
                    <div class="custom-event-form">
                        <div class="custom-event-form-group">
                            <label class="custom-event-label" for="eventTitle">Titel:</label>
                            <input type="text" id="eventTitle" class="custom-event-input" placeholder="Titel einfügen">
                        </div>

                        <div class="custom-event-form-group">
                            <label class="custom-event-label" for="eventDate">Datum:</label>
                            <input type="date" id="eventDate" class="custom-event-input">
                        </div>

                        <div class="custom-event-form-group">
                            <label class="custom-event-label" for="eventTime">Zeit:</label>
                            <input type="time" id="eventTime" class="custom-event-input">
                        </div>
                        
                        <div class="custom-event-actions">
                            <button id="addEventBtn" class="custom-event-btn custom-event-btn-primary">Hinzufügen</button>
                            <button id="deleteEventBtn" class="custom-event-btn custom-event-btn-danger" style="display: none;">Delete Event</button>
                        </div>
                    </div>
                    
                    <div class="custom-event-list" id="customEventList"></div>
                </div>
            </div>
        `;
        
        // Create container and add to body
        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container.firstElementChild);
        
        // Add event listeners
        const modal = document.getElementById('customEventModal');
        const closeBtn = modal.querySelector('.custom-event-modal-close');
        const addBtn = document.getElementById('addEventBtn');
        const deleteBtn = document.getElementById('deleteEventBtn');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        addBtn.addEventListener('click', () => {
            addCustomEvent();
        });
        
        deleteBtn.addEventListener('click', () => {
            deleteCustomEvent();
        });
        
        console.log('Custom event modal created');
    }
    
    // Load custom events from API
    async function loadCustomEvents() {
        try {
            const year = getCurrentYear();
            const month = getCurrentMonth();
            
            console.log(`[DEBUG] Loading custom events for ${year}-${month}`);
            
            // Initialize events structure
            staticData.customEvents = {};
            
            // Make API request with explicit query parameters
            const url = `api/custom_events.php?year=${year}&month=${month}`;
            console.log(`[DEBUG] Fetching from URL: ${url}`);
            
            const response = await fetch(url);
            
            if (response.status === 404) {
                console.warn('[DEBUG] Custom events API endpoint not found (404). The feature may not be fully set up yet.');
                return 0;
            }
            
            if (!response.ok) {
                throw new Error(`Failed to load custom events: ${response.statusText}`);
            }
            
            const events = await response.json();
            console.log(`[DEBUG] Received ${events.length} custom events:`, events);
            
            // Group events by year, month, day
            events.forEach(event => {
                // Extract date components from the event date (YYYY-MM-DD format)
                const dateParts = event.date.split('-');
                const eventYear = parseInt(dateParts[0]);
                const eventMonth = parseInt(dateParts[1]);
                const eventDay = parseInt(dateParts[2]);
                
                // Initialize nested objects if needed
                if (!staticData.customEvents[eventYear]) {
                    staticData.customEvents[eventYear] = {};
                }
                if (!staticData.customEvents[eventYear][eventMonth]) {
                    staticData.customEvents[eventYear][eventMonth] = {};
                }
                if (!staticData.customEvents[eventYear][eventMonth][eventDay]) {
                    staticData.customEvents[eventYear][eventMonth][eventDay] = [];
                }
                
                // Add event to the structure
                staticData.customEvents[eventYear][eventMonth][eventDay].push({
                    id: event.id,
                    title: event.title,
                    time: event.time
                });
            });
            
            console.log(`[DEBUG] Processed ${events.length} custom events into structure:`, staticData.customEvents);
            
            // Update UI to show custom event indicators
            updateCustomEventIndicators();
            
            return events.length;
        } catch (error) {
            console.error('Error loading custom events:', error);
            
            // Initialize empty structure on error
            staticData.customEvents = {};
            
            return 0;
        }
    }
    
    // Update custom event indicators on day cards
    function updateCustomEventIndicators() {
        // Get current values
        const year = getCurrentYear();
        const month = getCurrentMonth();
        
        // Return early if we're not in the right view or data isn't loaded
        if (!staticData.customEvents) {
            console.log('[DEBUG] No custom events data structure');
            return;
        }
        
        console.log(`[DEBUG] Updating indicators for ${year}-${month}`);
        
        // Check if we have events for this year/month
        const hasEventsForMonth = staticData.customEvents[year] && 
                                 staticData.customEvents[year][month];
        
        if (!hasEventsForMonth) {
            console.log(`[DEBUG] No events found for ${year}-${month}`);
        }
        
        // Get all day cards
        const dayCards = document.querySelectorAll('.day-card');
        console.log(`[DEBUG] Found ${dayCards.length} day cards to update`);
        
        // Event counter
        let eventCount = 0;
        
        // Process each day card
        dayCards.forEach(card => {
            // Get day from the card
            const day = parseInt(card.dataset.day);
            if (isNaN(day)) return;
            
            // Check if there are custom events for this day
            const hasCustomEvents = staticData.customEvents[year]?.[month]?.[day]?.length > 0;
            
            // Get or create indicator
            let indicator = card.querySelector('.custom-event-indicator');
            
            // Remove old custom event indicators since we now show events in shifts
            if (indicator) {
                indicator.remove();
            }
        });
        
        console.log(`[DEBUG] Updated indicators: ${eventCount} days with events`);
        
        // Also update day cards to show custom events in shifts
        if (typeof updateDayCard === 'function') {
            dayCards.forEach(card => {
                const day = parseInt(card.dataset.day);
                if (!isNaN(day)) {
                    // Update the day card to refresh custom events in shifts
                    updateDayCard(day);
                }
            });
        }
    }
    
    // Add a custom event
    async function addCustomEvent() {
        const dateInput = document.getElementById('eventDate');
        const titleInput = document.getElementById('eventTitle');
        const timeInput = document.getElementById('eventTime');
        
        if (!dateInput || !titleInput || !timeInput) {
            console.error('Event inputs not found');
            return;
        }
        
        const selectedDate = dateInput.value;
        const title = titleInput.value.trim();
        const time = timeInput.value;
        
        if (!selectedDate) {
            NotificationSystem.warning('Please select a date');
            return;
        }
        
        if (!title) {
            NotificationSystem.warning('Please enter an event title');
            return;
        }
        
        if (!time) {
            NotificationSystem.warning('Please enter an event time');
            return;
        }
        
        try {
            console.log(`[DEBUG] Adding custom event: "${title}" at ${time} on ${selectedDate}`);
            
            // Parse the date components from the selected date (YYYY-MM-DD)
            const [year, month, day] = selectedDate.split('-').map(part => parseInt(part));
            
            // Update current values to match selected date
            setCurrentDate(day, month, year);
            
            // Format the date to YYYY-MM-DD (just in case)
            const formattedDate = selectedDate;
            
            // Check if we're authenticated
            if (!AuthManager.isAuthenticated()) {
                NotificationSystem.error('You need to be logged in to add custom events');
                return;
            }
            
            // Get the auth token
            const token = AuthManager.getToken();
            
            // Send API request
            const response = await fetch('api/custom_events.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: formattedDate,
                    title: title,
                    time: time
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add custom event');
            }
            
            // Get the created event with its ID
            const createdEvent = await response.json();
            
            // Initialize data structure if needed
            if (!staticData.customEvents[year]) {
                staticData.customEvents[year] = {};
            }
            if (!staticData.customEvents[year][month]) {
                staticData.customEvents[year][month] = {};
            }
            if (!staticData.customEvents[year][month][day]) {
                staticData.customEvents[year][month][day] = [];
            }
            
            // Add event to local data
            staticData.customEvents[year][month][day].push({
                id: createdEvent.id,
                title: title,
                time: time
            });
            
            // Update UI
            updateCustomEventList();
            updateCustomEventIndicators();
            
            // Clear inputs (keep the date)
            titleInput.value = '';
            timeInput.value = '';
            
            // Show success notification
            NotificationSystem.success(`Custom event "${title}" added successfully for ${formattedDate}`);
            
            console.log('[DEBUG] Custom event added successfully:', createdEvent);
        } catch (error) {
            console.error('Error adding custom event:', error);
            NotificationSystem.error(`Failed to add custom event: ${error.message}`);
        }
    }
    
    // Delete a custom event
    async function deleteCustomEvent(eventId) {
        if (!eventId && !selectedEventId) {
            NotificationSystem.warning('No event selected for deletion');
            return;
        }
        
        const id = eventId || selectedEventId;
        
        try {
            // Check if we're authenticated
            if (!AuthManager.isAuthenticated()) {
                NotificationSystem.error('You need to be logged in to delete custom events');
                return;
            }
            
            // Get the auth token
            const token = AuthManager.getToken();
            
            // Send API request
            const response = await fetch(`api/custom_events.php?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete custom event');
            }
            
            // Get current values
            const year = getCurrentYear();
            const month = getCurrentMonth();
            const day = getCurrentDay();
            
            // Remove event from local data
            if (staticData.customEvents[year]?.[month]?.[day]) {
                const events = staticData.customEvents[year][month][day];
                const index = events.findIndex(event => event.id === id);
                
                if (index !== -1) {
                    const deletedEvent = events[index];
                    events.splice(index, 1);
                    
                    // Show success notification
                    NotificationSystem.success(`Custom event "${deletedEvent.title}" deleted successfully`);
                }
            }
            
            // Update UI
            updateCustomEventList();
            updateCustomEventIndicators();
            
            // Reset selected event
            selectedEventId = null;
            
            console.log('[DEBUG] Custom event deleted successfully:', id);
        } catch (error) {
            console.error('Error deleting custom event:', error);
            NotificationSystem.error(`Failed to delete custom event: ${error.message}`);
        }
    }
    
    // Update the custom event list in the modal
    // Update the custom event list in the modal
function updateCustomEventList() {
    const listEl = document.getElementById('customEventList');
    if (!listEl) return;
    
    // Get current values
    const year = getCurrentYear();
    const month = getCurrentMonth();
    
    console.log(`[DEBUG] Updating custom event list for ${year}-${month}`);
    
    // Clear list
    listEl.innerHTML = '';
    
    // Get ALL events for the current month (not just current day)
    let allMonthEvents = [];
    
    // Check if we have events for this month
    if (staticData.customEvents[year]?.[month]) {
        // Collect all events from all days in this month
        Object.keys(staticData.customEvents[year][month]).forEach(day => {
            const dayEvents = staticData.customEvents[year][month][day];
            if (dayEvents && dayEvents.length) {
                // Add day information to each event
                dayEvents.forEach(event => {
                    allMonthEvents.push({
                        ...event,
                        day: parseInt(day),
                        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    });
                });
            }
        });
    }
    
    console.log(`[DEBUG] Found ${allMonthEvents.length} total events for month`);
    
    if (allMonthEvents.length === 0) {
        listEl.innerHTML = '<p>No custom events scheduled for this month</p>';
        return;
    }
    
    // Sort events chronologically - first by date, then by time
    const sortedEvents = [...allMonthEvents].sort((a, b) => {
        // First compare by date
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        
        // If same date, compare by time
        return a.time.localeCompare(b.time);
    });
    
    // Add each event to the list
    sortedEvents.forEach(event => {
        const item = document.createElement('div');
        item.className = 'custom-event-item';
        
        // Format date for display
        let displayDate = event.date;
        try {
            const dateParts = event.date.split('-');
            const dateObj = new Date(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2])
            );
            
            // Format date as DD.MM.
            displayDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.`;
        } catch (error) {
            console.warn('Error formatting date:', error);
        }
        
        // Format time for display (convert from 24h to 12h format if needed)
        let displayTime = event.time;
        try {
            const timeParts = event.time.split(':');
            const hour = parseInt(timeParts[0]);
            const minute = timeParts[1];
            // Keep 24h format as it's standard in many countries
            displayTime = `${hour.toString().padStart(2, '0')}:${minute}`;
        } catch (error) {
            console.warn('Error formatting time:', error);
        }
        
        item.innerHTML = `
            <div>
                <div class="event-date-time">
                    <span class="event-date">${displayDate}</span>
                    <span class="event-time">${displayTime}</span>
                </div>
                <strong class="event-title">${event.title}</strong>
            </div>
            <button class="custom-event-delete-btn" data-id="${event.id}" data-day="${event.day}">&times;</button>
        `;
        
        // Add delete handler
        const deleteBtn = item.querySelector('.custom-event-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Update current day before deleting, so we delete from the right day
                setCurrentDate(parseInt(e.target.dataset.day), month, year);
                deleteCustomEvent(event.id);
            });
        }
        
        listEl.appendChild(item);
    });
}
    
    // Open custom event modal for a specific day
    function openCustomEventModal(day, month, year) {
        console.log(`[DEBUG] Opening custom event modal for ${year}-${month}-${day}`);
        
        // Check if user is authorized
        if (!AuthManager.isAuthenticated() || AuthManager.getCurrentUser().role !== 'Backoffice') {
            NotificationSystem.warning('Only backoffice users can manage custom events');
            return;
        }
        
        // Validate input parameters
        if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
            console.log(`[DEBUG] Invalid date parameters: day=${day}, month=${month}, year=${year}`);
            
            // Fallback to current selections from UI
            year = parseInt(document.getElementById('yearSelect').value) || new Date().getFullYear();
            month = parseInt(document.getElementById('monthSelect').value) || new Date().getMonth() + 1;
            day = 1; // Default to first day of month
            
            console.log(`[DEBUG] Using fallback values: ${year}-${month}-${day}`);
        }
        
        // Store current date
        setCurrentDate(day, month, year);
        
        // Format date for initial values
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Update date input
        const dateInput = document.getElementById('eventDate');
        if (dateInput) {
            dateInput.value = formattedDate;
        }
        
        // Clear other form fields
        const titleInput = document.getElementById('eventTitle');
        const timeInput = document.getElementById('eventTime');
        if (titleInput) titleInput.value = '';
        if (timeInput) timeInput.value = '';
        
        // Update event list
        updateCustomEventList();
        
        // Show modal
        const modal = document.getElementById('customEventModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    // Add the custom event button to the top navbar
    function addCustomEventButton() {
        // Check if button already exists
        if (document.getElementById('customEventBtn')) {
            return;
        }
        
        // Get the navbar controls container
        const navbarControls = document.querySelector('.navbar-controls');
        if (!navbarControls) {
            console.error('Navbar controls not found');
            return;
        }
        
        // Create custom event button
        const eventBtn = document.createElement('button');
        eventBtn.id = 'customEventBtn';
        eventBtn.className = 'button-custom-event';
        eventBtn.innerHTML = '<span class="button-icon">📅</span>';
        eventBtn.title = 'Add Custom Event';
        
        // Add click handler
        eventBtn.addEventListener('click', () => {
            // Get current year and month from global variables or fallback to UI elements
            const year = window.currentYear || parseInt(document.getElementById('yearSelect').value);
            const month = window.currentMonth || parseInt(document.getElementById('monthSelect').value);
            // Default to day 1 if no specific day is selected
            const day = 1;
            
            console.log(`[DEBUG] Button click with year=${year}, month=${month}, day=${day}`);
            openCustomEventModal(day, month, year);
        });
        
        // Check if we should add this button (only for backoffice users)
        if (isBackofficeUser()) {
            // Add to navbar - insert before the manage users button if it exists
            const manageUsersBtn = document.getElementById('manageUsers');
            if (manageUsersBtn) {
                navbarControls.insertBefore(eventBtn, manageUsersBtn);
            } else {
                navbarControls.appendChild(eventBtn);
            }
            
            console.log('[DEBUG] Custom event button added to navbar');
        } else {
            console.log('[DEBUG] Not adding custom event button - user is not backoffice');
        }
        
        // Also set up the mobile button
        setupMobileCustomEventButton();
    }
    
    // Set up mobile custom event button
    function setupMobileCustomEventButton() {
        const mobileBtn = document.getElementById('mobileCustomEventBtn');
        if (!mobileBtn) {
            console.log('[DEBUG] Mobile custom event button not found');
            return;
        }
        
        // Add click handler if not already added
        if (!mobileBtn.hasAttribute('data-handler-added')) {
            mobileBtn.addEventListener('click', () => {
                // Get current year and month from global variables or fallback to UI elements
                const year = window.currentYear || parseInt(document.getElementById('yearSelect').value);
                const month = window.currentMonth || parseInt(document.getElementById('monthSelect').value);
                const day = 1;
                
                console.log(`[DEBUG] Mobile button click with year=${year}, month=${month}, day=${day}`);
                openCustomEventModal(day, month, year);
            });
            mobileBtn.setAttribute('data-handler-added', 'true');
        }
        
        // Show/hide based on user role
        if (isBackofficeUser()) {
            mobileBtn.style.display = 'flex';
        } else {
            mobileBtn.style.display = 'none';
        }
    }
    
    // Update button visibility based on user role
    function updateButtonVisibility() {
        const eventBtn = document.getElementById('customEventBtn');
        if (!eventBtn) {
            // Try to add the button if it doesn't exist
            addCustomEventButton();
            return;
        }
        
        // Only show for backoffice users
        if (isBackofficeUser()) {
            eventBtn.style.display = 'flex';
        } else {
            eventBtn.style.display = 'none';
        }
        
        // Also update mobile button
        setupMobileCustomEventButton();
    }
    
    // Check if current user is a backoffice user
    function isBackofficeUser() {
        const currentUser = AuthManager.getCurrentUser();
        return currentUser && currentUser.role === 'Backoffice';
    }
    
    // Set up event handlers for day cards
    function setupDayCardHandlers() {
        // Use event delegation for better performance
        const calendar = document.getElementById('calendar');
        if (!calendar) return;
        
        calendar.addEventListener('dblclick', function(e) {
            // Find closest day card
            const dayCard = e.target.closest('.day-card');
            if (!dayCard) return;
            
            // Get day, month, year from card
            const day = parseInt(dayCard.dataset.day);
            const month = parseInt(dayCard.dataset.month);
            const year = parseInt(dayCard.dataset.year);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) return;
            
            // Only allow backoffice users to add custom events
            if (isBackofficeUser()) {
                openCustomEventModal(day, month, year);
            }
        });
        
        // Add context menu for right-click on day cards
        calendar.addEventListener('contextmenu', function(e) {
            // Find closest day card
            const dayCard = e.target.closest('.day-card');
            if (!dayCard) return;
            
            // Only for backoffice users
            if (!isBackofficeUser()) return;
            
            // Prevent default context menu
            e.preventDefault();
            
            // Get day, month, year from card
            const day = parseInt(dayCard.dataset.day);
            const month = parseInt(dayCard.dataset.month);
            const year = parseInt(dayCard.dataset.year);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) return;
            
            // Open custom event modal
            openCustomEventModal(day, month, year);
        });
    }
    
    // Add a mutation observer to watch for changes in the calendar
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
                    updateCustomEventIndicators();
                }, 100);
            }
        });
        
        // Start observing the calendar
        const calendar = document.getElementById('calendar');
        if (calendar) {
            observer.observe(calendar, {
                childList: true,
                subtree: true
            });
            
            console.log('Mutation observer set up for custom events');
        }
    }
    
    // Directly reload events (useful for debugging)
    async function reloadEvents() {
        console.log('[DEBUG] Manually reloading events...');
        const result = await loadCustomEvents();
        updateCustomEventIndicators();
        console.log(`[DEBUG] Reloaded ${result} events`);
        return result;
    }
    
    // Initialize the custom events feature
    async function init() {
        try {
            console.log('[DEBUG] Initializing Custom Events Feature');
            
            // Store current year and month from global variables
            const year = window.currentYear;
            const month = window.currentMonth;
            console.log(`[DEBUG] Global values: year=${year}, month=${month}`);
            
            setCurrentDate(1, month, year);
            
            // Add styles
            addStyles();
            
            // Create modal
            createModal();
            
            // Initialize data structure
            initializeCustomEventsData();
            
            // Add button to navbar for backoffice users
            addCustomEventButton();
            
            // Set up event handlers for day cards
            setupDayCardHandlers();
            
            // Load custom events from API
            await loadCustomEvents();
            
            // Set up mutation observer
            setupMutationObserver();
            
            console.log('[DEBUG] Custom Events Feature initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Error initializing Custom Events Feature:', error);
            return false;
        }
    }
    
    // Public API
    return {
        init: init,
        loadCustomEvents: loadCustomEvents,
        updateCustomEventIndicators: updateCustomEventIndicators,
        openCustomEventModal: openCustomEventModal,
        updateButtonVisibility: updateButtonVisibility,
        addCustomEventButton: addCustomEventButton,
        getCurrentYear: getCurrentYear,
        getCurrentMonth: getCurrentMonth,
        setCurrentDate: setCurrentDate,
        reloadEvents: reloadEvents
    };
})();

// The feature will be initialized in the initializeApp() function in script.js
console.log("CustomEventsFeature script loaded");