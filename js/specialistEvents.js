/**
 * Specialist Events Feature
 * This module handles the creation and display of specialist events by specialist users
 */

const SpecialistEventsFeature = (function() {
    // Private variables
    let _currentUserId = null;
    let _currentUserName = null;
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
        console.log(`[SPECIALIST] Current date set to: ${_currentYear}-${_currentMonth}-${_currentDay}`);
    }

    // Initialize static data structure for specialist events if it doesn't exist
    function initializeSpecialistEventsData() {
        if (!staticData.specialistEvents) {
            staticData.specialistEvents = {};
        }
    }

    // Add styles for specialist events
    function addStyles() {
        if (document.getElementById('specialist-events-styles')) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'specialist-events-styles';
        styleEl.innerHTML = `
            /* Specialist event indicator styles - circular dot under shift indicator */
            .specialist-event-indicator {
                position: absolute;
                top: 4px;
                right: 46%;
                transform: translateX(-50%);
                width: 13px;
                height: 13px;
                border-radius: 50%;
                background-color: var(--specialist, #984afe);
                z-index: 10;
                cursor: pointer;
            }

            .specialist-event-indicator:hover {
                opacity: 0.8;
                transform: translateX(-50%) scale(1.1);
                transition: all 0.2s ease;
            }

            /* Mobile specific positioning */
            @media screen and (max-width: 768px) {
                .specialist-event-indicator {
                    top: 5px;
                    right: 31%;
                    width: 10px;
                    height: 10px;
                }
            }

            /* Specialist button in user list */
            .specialist-btn {
                background: #f0f0f0;
                border: none;
                cursor: pointer;
                font-size: 14px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                transition: background-color 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 4px;
                margin-right: 4px;
                font-weight: bold;
                color: var(--specialist, #984afe);
            }

            .specialist-btn:hover {
                background-color: #e0e0e0;
            }

            /* Specialist event modal styles */
            #specialistEventModal {
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

            .specialist-event-modal-content {
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
                .specialist-event-modal-content {
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                    border: none !important;
                    max-width: none !important;
                    padding: 80px 20px 20px 20px !important;
                    overflow-y: auto !important;
                }

                .specialist-event-modal-header {
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

                .specialist-event-form {
                    margin-top: 20px !important;
                    position: relative !important;
                    z-index: 1 !important;
                }

                .specialist-event-form-group {
                    margin-bottom: 20px !important;
                }

                .specialist-event-label {
                    position: static !important;
                    display: block !important;
                    margin-bottom: 8px !important;
                    z-index: auto !important;
                }
            }

            .specialist-event-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }

            .specialist-event-modal-title {
                font-size: 1.5rem;
                margin: 0;
            }

            .specialist-event-modal-close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                margin-left: 20px;
            }

            .specialist-event-modal-close:hover {
                color: black;
            }

            .specialist-event-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 20px;
            }

            .specialist-event-form-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .specialist-event-label {
                font-weight: bold;
            }

            .specialist-event-input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 100%;
            }

            .specialist-event-checkbox-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .specialist-event-checkbox {
                width: auto;
                margin: 0;
            }

            .specialist-event-actions {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }

            .specialist-event-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }

            .specialist-event-btn-primary {
                background-color: var(--primary-color, #1760ff);
                color: white;
            }

            .specialist-event-btn-danger {
                background-color: #f44336;
                color: white;
            }

            .specialist-event-list {
                margin-top: 20px;
                max-height: 300px;
                overflow-y: auto;
            }

            .specialist-event-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin-bottom: 10px;
            }

            .specialist-event-delete-btn {
                background: none;
                border: none;
                color: #f44336;
                font-size: 18px;
                cursor: pointer;
            }

            /* Specialist events list in mobile modal */
            .specialist-events-list {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 12px;
            }

            .specialist-event-mobile-item {
                background-color: #ffffff;
                color: var(--specialist, #984afe);
                font-size: 0.9rem;
                font-weight: bold;
                padding: 10px 5px;
                border-radius: 4px;
            }

        `;

        document.head.appendChild(styleEl);
        console.log('[SPECIALIST] Styles added');
    }

    // Create the specialist event modal
    function createModal() {
        // Skip if already exists
        if (document.getElementById('specialistEventModal')) {
            return;
        }

        // Create modal HTML
        const modalHtml = `
            <div id="specialistEventModal" class="modal">
                <div class="specialist-event-modal-content">
                    <div class="specialist-event-modal-header">
                        <h2 class="specialist-event-modal-title">Einsätze</h2>
                        <span class="specialist-event-modal-close">&times;</span>
                    </div>

                    <div class="specialist-event-form">
                        <div class="specialist-event-form-group">
                            <label class="specialist-event-label" for="specialistEventTitle">Titel:</label>
                            <input type="text" id="specialistEventTitle" class="specialist-event-input" placeholder="Ihr Name">
                        </div>

                        <div class="specialist-event-form-group">
                            <label class="specialist-event-label" for="specialistEventDate">Datum:</label>
                            <input type="date" id="specialistEventDate" class="specialist-event-input">
                        </div>

                        <div class="specialist-event-form-group">
                            <label class="specialist-event-label" for="specialistEventTime">Zeit:</label>
                            <input type="time" id="specialistEventTime" class="specialist-event-input">
                        </div>

                        <div class="specialist-event-form-group">
                            <div class="specialist-event-checkbox-group">
                                <input type="checkbox" id="specialistEventWeekly" class="specialist-event-checkbox">
                                <label class="specialist-event-label" for="specialistEventWeekly" style="margin:0;">Wöchentlich wiederholen</label>
                            </div>
                        </div>

                        <div class="specialist-event-form-group" id="specialistEventEndDateGroup" style="display: none;">
                            <label class="specialist-event-label" for="specialistEventEndDate">Enddatum:</label>
                            <input type="date" id="specialistEventEndDate" class="specialist-event-input">
                        </div>

                        <div class="specialist-event-actions">
                            <button id="addSpecialistEventBtn" class="specialist-event-btn specialist-event-btn-primary">Hinzufügen</button>
                        </div>
                    </div>

                    <div class="specialist-event-list" id="specialistEventList"></div>
                </div>
            </div>
        `;

        // Create container and add to body
        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container.firstElementChild);

        // Add event listeners
        const modal = document.getElementById('specialistEventModal');
        const closeBtn = modal.querySelector('.specialist-event-modal-close');
        const addBtn = document.getElementById('addSpecialistEventBtn');
        const weeklyCheckbox = document.getElementById('specialistEventWeekly');
        const endDateGroup = document.getElementById('specialistEventEndDateGroup');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        addBtn.addEventListener('click', () => {
            console.log('[SPECIALIST] Add specialist event button clicked');
            addSpecialistEvent();
        });

        // Toggle end date visibility based on weekly checkbox
        weeklyCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                endDateGroup.style.display = 'flex';
            } else {
                endDateGroup.style.display = 'none';
                document.getElementById('specialistEventEndDate').value = '';
            }
        });

        console.log('[SPECIALIST] Modal created');
    }

    // Load specialist events from API
    async function loadSpecialistEvents() {
        try {
            const year = getCurrentYear();
            const month = getCurrentMonth();

            console.log(`[SPECIALIST] Loading specialist events for ${year}-${month}`);

            // Initialize events structure
            staticData.specialistEvents = {};

            // Make API request with explicit query parameters
            const url = `api/specialist_events.php?year=${year}&month=${month}`;
            console.log(`[SPECIALIST] Fetching from URL: ${url}`);

            const response = await fetch(url);

            if (response.status === 404) {
                console.warn('[SPECIALIST] Specialist events API endpoint not found (404).');
                return 0;
            }

            if (!response.ok) {
                throw new Error(`Failed to load specialist events: ${response.statusText}`);
            }

            const events = await response.json();
            console.log(`[SPECIALIST] Received ${events.length} specialist events:`, events);

            // Group events by year, month, day
            events.forEach(event => {
                // Extract date components from the event date (YYYY-MM-DD format)
                const dateParts = event.date.split('-');
                const eventYear = parseInt(dateParts[0]);
                const eventMonth = parseInt(dateParts[1]);
                const eventDay = parseInt(dateParts[2]);

                // Initialize nested objects if needed
                if (!staticData.specialistEvents[eventYear]) {
                    staticData.specialistEvents[eventYear] = {};
                }
                if (!staticData.specialistEvents[eventYear][eventMonth]) {
                    staticData.specialistEvents[eventYear][eventMonth] = {};
                }
                if (!staticData.specialistEvents[eventYear][eventMonth][eventDay]) {
                    staticData.specialistEvents[eventYear][eventMonth][eventDay] = [];
                }

                // Add event to the structure
                staticData.specialistEvents[eventYear][eventMonth][eventDay].push({
                    id: event.id,
                    userId: event.user_id,
                    userName: event.user_name,
                    title: event.title,
                    time: event.time,
                    isWeekly: event.is_weekly,
                    endDate: event.end_date
                });
            });

            console.log(`[SPECIALIST] Processed ${events.length} specialist events into structure:`, staticData.specialistEvents);

            // Update UI to show specialist event indicators
            updateSpecialistEventIndicators();

            return events.length;
        } catch (error) {
            console.error('[SPECIALIST] Error loading specialist events:', error);

            // Initialize empty structure on error
            staticData.specialistEvents = {};

            return 0;
        }
    }

    // Update specialist event indicators on day cards
    function updateSpecialistEventIndicators() {
        // Get current values
        const year = getCurrentYear();
        const month = getCurrentMonth();

        // Return early if we're not in the right view or data isn't loaded
        if (!staticData.specialistEvents) {
            console.log('[SPECIALIST] No specialist events data structure');
            return;
        }

        console.log(`[SPECIALIST] Updating indicators for ${year}-${month}`);

        // Check if we have events for this year/month
        const hasEventsForMonth = staticData.specialistEvents[year] &&
                                 staticData.specialistEvents[year][month];

        if (!hasEventsForMonth) {
            console.log(`[SPECIALIST] No events found for ${year}-${month}`);
        }

        // Get all day cards
        const dayCards = document.querySelectorAll('.day-card');
        console.log(`[SPECIALIST] Found ${dayCards.length} day cards to update`);

        // Process each day card
        dayCards.forEach(card => {
            // Get day from the card
            const day = parseInt(card.dataset.day);
            if (isNaN(day)) return;

            // Check if there are specialist events for this day
            const hasSpecialistEvents = staticData.specialistEvents[year]?.[month]?.[day]?.length > 0;

            // Get shift containers
            const shiftLeft = card.querySelector('.shift-left');
            const shiftRight = card.querySelector('.shift-right');

            // Clear existing indicators
            card.querySelectorAll('.specialist-event-indicator').forEach(ind => ind.remove());

            if (hasSpecialistEvents && shiftLeft && shiftRight) {
                const events = staticData.specialistEvents[year][month][day];

                // Separate events by shift time (14:00 cutoff)
                const cutoffMinutes = 14 * 60; // 14:00 in minutes
                const e1Events = [];
                const e2Events = [];

                events.forEach(event => {
                    // Parse time and determine shift
                    const timeParts = event.time.split(':');
                    const hour = parseInt(timeParts[0]);
                    const minute = parseInt(timeParts[1]);
                    const totalMinutes = hour * 60 + minute;

                    if (totalMinutes < cutoffMinutes) {
                        e1Events.push(event);
                    } else {
                        e2Events.push(event);
                    }
                });

                // Add indicator to E1 (left shift) if there are events before 14:00
                if (e1Events.length > 0) {
                    const indicatorLeft = document.createElement('div');
                    indicatorLeft.className = 'specialist-event-indicator';
                    indicatorLeft.title = `${e1Events.length} Specialist Einsatz${e1Events.length > 1 ? 'e' : ''}`;
                    shiftLeft.appendChild(indicatorLeft);
                }

                // Add indicator to E2 (right shift) if there are events at/after 14:00
                if (e2Events.length > 0) {
                    const indicatorRight = document.createElement('div');
                    indicatorRight.className = 'specialist-event-indicator';
                    indicatorRight.title = `${e2Events.length} Specialist Einsatz${e2Events.length > 1 ? 'e' : ''}`;
                    shiftRight.appendChild(indicatorRight);
                }
            }
        });

        console.log('[SPECIALIST] Indicators updated');

        // Also update day cards to show specialist events
        if (typeof updateDayCard === 'function') {
            dayCards.forEach(card => {
                const day = parseInt(card.dataset.day);
                if (!isNaN(day)) {
                    updateDayCard(day);
                }
            });
        }
    }

    // Add a specialist event
    async function addSpecialistEvent() {
        console.log('[SPECIALIST] addSpecialistEvent function called');

        const dateInput = document.getElementById('specialistEventDate');
        const titleInput = document.getElementById('specialistEventTitle');
        const timeInput = document.getElementById('specialistEventTime');
        const weeklyCheckbox = document.getElementById('specialistEventWeekly');
        const endDateInput = document.getElementById('specialistEventEndDate');

        if (!dateInput || !titleInput || !timeInput) {
            console.error('[SPECIALIST] Event inputs not found');
            return;
        }

        const selectedDate = dateInput.value;
        const title = titleInput.value.trim();
        const time = timeInput.value;
        const isWeekly = weeklyCheckbox.checked;
        const endDate = isWeekly ? endDateInput.value : null;

        if (!selectedDate) {
            console.log('[SPECIALIST] No date selected');
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.warning('Bitte wählen Sie ein Datum aus');
            } else {
                alert('Bitte wählen Sie ein Datum aus');
            }
            return;
        }

        if (!title) {
            console.log('[SPECIALIST] No title entered');
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.warning('Bitte geben Sie einen Titel ein');
            } else {
                alert('Bitte geben Sie einen Titel ein');
            }
            return;
        }

        if (!time) {
            console.log('[SPECIALIST] No time entered');
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.warning('Bitte geben Sie eine Zeit ein');
            } else {
                alert('Bitte geben Sie eine Zeit ein');
            }
            return;
        }

        if (isWeekly && !endDate) {
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.warning('Bitte geben Sie ein Enddatum für wöchentliche Events ein');
            } else {
                alert('Bitte geben Sie ein Enddatum für wöchentliche Events ein');
            }
            return;
        }

        try {
            console.log(`[SPECIALIST] Adding specialist event: "${title}" at ${time} on ${selectedDate}`);

            // Parse the date components from the selected date (YYYY-MM-DD)
            const [year, month, day] = selectedDate.split('-').map(part => parseInt(part));

            // Update current values to match selected date
            setCurrentDate(day, month, year);

            // Send API request - no authentication required
            const url = 'api/specialist_events.php';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: _currentUserId,
                    date: selectedDate,
                    title: title,
                    time: time,
                    is_weekly: isWeekly ? 1 : 0,
                    end_date: endDate
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add specialist event');
            }

            // Get the created event(s)
            const result = await response.json();

            // Reload events to refresh display
            await loadSpecialistEvents();

            // Update event list
            updateSpecialistEventList();

            // Clear inputs (keep the date)
            titleInput.value = _currentUserName || '';
            timeInput.value = '';
            weeklyCheckbox.checked = false;
            endDateInput.value = '';
            document.getElementById('specialistEventEndDateGroup').style.display = 'none';

            // Show success notification
            if (result.count > 1) {
                NotificationSystem.success(`${result.count} Events "${title}" erfolgreich hinzugefügt`);
            } else {
                NotificationSystem.success(`Event "${title}" erfolgreich hinzugefügt für ${selectedDate}`);
            }

            console.log('[SPECIALIST] Specialist event(s) added successfully:', result);
        } catch (error) {
            console.error('[SPECIALIST] Error adding specialist event:', error);
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.error(`Fehler beim Hinzufügen des Events: ${error.message}`);
            } else {
                alert(`Fehler beim Hinzufügen des Events: ${error.message}`);
            }
        }
    }

    // Delete a specialist event
    async function deleteSpecialistEvent(eventId) {
        if (!eventId) {
            NotificationSystem.warning('No event selected for deletion');
            return;
        }

        try {
            // Send API request - no authentication required
            const url = `api/specialist_events.php?id=${eventId}`;

            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete specialist event');
            }

            // Reload events to refresh display
            await loadSpecialistEvents();

            // Update UI
            updateSpecialistEventList();

            // Show success notification
            NotificationSystem.success('Event erfolgreich gelöscht');

            console.log('[SPECIALIST] Specialist event deleted successfully:', eventId);
        } catch (error) {
            console.error('[SPECIALIST] Error deleting specialist event:', error);
            NotificationSystem.error(`Fehler beim Löschen des Events: ${error.message}`);
        }
    }

    // Update the specialist event list in the modal
    function updateSpecialistEventList() {
        const listEl = document.getElementById('specialistEventList');
        if (!listEl || !_currentUserId) return;

        // Get current values
        const year = getCurrentYear();
        const month = getCurrentMonth();

        console.log(`[SPECIALIST] Updating specialist event list for user ${_currentUserId} in ${year}-${month}`);

        // Clear list
        listEl.innerHTML = '';

        // Get ALL events for the current user for this month
        let allMonthEvents = [];

        // Check if we have events for this month
        if (staticData.specialistEvents[year]?.[month]) {
            // Collect all events from all days in this month for this user
            Object.keys(staticData.specialistEvents[year][month]).forEach(day => {
                const dayEvents = staticData.specialistEvents[year][month][day];
                if (dayEvents && dayEvents.length) {
                    // Filter events for current user and add day information
                    dayEvents.forEach(event => {
                        if (event.userId == _currentUserId) {
                            allMonthEvents.push({
                                ...event,
                                day: parseInt(day),
                                date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            });
                        }
                    });
                }
            });
        }

        console.log(`[SPECIALIST] Found ${allMonthEvents.length} total events for user ${_currentUserId}`);

        if (allMonthEvents.length === 0) {
            listEl.innerHTML = '<p>Keine Specialist Einsätze für diesen Monat</p>';
            return;
        }

        // Sort events chronologically - first by date, then by time
        const sortedEvents = [...allMonthEvents].sort((a, b) => {
            // First compare by date
            const dateComparison = a.date.localeCompare(b.date);
            if (dateComparison !== 0) return dateComparison;

            // If same date, compare by time
            return a.time.localeCompare(b.time);
        });

        // Add each event to the list
        sortedEvents.forEach(event => {
            const item = document.createElement('div');
            item.className = 'specialist-event-item';

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
                console.warn('[SPECIALIST] Error formatting date:', error);
            }

            // Format time for display
            let displayTime = event.time;
            try {
                const timeParts = event.time.split(':');
                const hour = parseInt(timeParts[0]);
                const minute = timeParts[1];
                displayTime = `${hour.toString().padStart(2, '0')}:${minute}`;
            } catch (error) {
                console.warn('[SPECIALIST] Error formatting time:', error);
            }

            const weeklyIndicator = event.isWeekly ? ' (wöchentlich)' : '';

            item.innerHTML = `
                <div>
                    <div class="event-date-time">
                        <span class="event-date">${displayDate}</span>
                        <span class="event-time">${displayTime}</span>
                    </div>
                    <strong class="event-title">${event.title}${weeklyIndicator}</strong>
                </div>
                <button class="specialist-event-delete-btn" data-id="${event.id}">&times;</button>
            `;

            // Add delete handler
            const deleteBtn = item.querySelector('.specialist-event-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSpecialistEvent(event.id);
                });
            }

            listEl.appendChild(item);
        });
    }

    // Open specialist event modal for a user
    function openSpecialistEventModal(userId) {
        console.log('[SPECIALIST] Opening specialist event modal for user ID:', userId);

        // Find user
        const user = staticData.users.find(u => u.id === userId);
        if (!user) {
            console.error('[SPECIALIST] User not found:', userId);
            return;
        }

        // Check if user is specialist
        if (!user.isSpecialist) {
            console.log('[SPECIALIST] User is not a specialist');
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.warning('Dieser Benutzer ist kein Specialist');
            } else {
                alert('Dieser Benutzer ist kein Specialist');
            }
            return;
        }

        // Store current user
        _currentUserId = userId;
        _currentUserName = user.name;

        // Update modal title
        const modal = document.getElementById('specialistEventModal');
        const modalTitle = modal.querySelector('.specialist-event-modal-title');
        if (modalTitle) {
            modalTitle.textContent = `Einsätze ${user.name}`;
        }

        // Format date for initial values
        const year = getCurrentYear();
        const month = getCurrentMonth();
        const day = 1;
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Update form inputs
        const titleInput = document.getElementById('specialistEventTitle');
        const dateInput = document.getElementById('specialistEventDate');
        const timeInput = document.getElementById('specialistEventTime');
        const weeklyCheckbox = document.getElementById('specialistEventWeekly');
        const endDateInput = document.getElementById('specialistEventEndDate');

        if (titleInput) titleInput.value = user.name;
        if (dateInput) dateInput.value = formattedDate;
        if (timeInput) timeInput.value = '';
        if (weeklyCheckbox) weeklyCheckbox.checked = false;
        if (endDateInput) endDateInput.value = '';
        document.getElementById('specialistEventEndDateGroup').style.display = 'none';

        // Update event list
        updateSpecialistEventList();

        // Show modal
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Check if current user is authenticated
    function isAuthenticated() {
        if (typeof AuthManager !== 'undefined') {
            return AuthManager.isAuthenticated();
        }
        return false;
    }

    // Initialize the specialist events feature
    async function init() {
        try {
            console.log('[SPECIALIST] Initializing Specialist Events Feature');

            // Store current year and month from global variables
            const year = window.currentYear;
            const month = window.currentMonth;
            console.log(`[SPECIALIST] Global values: year=${year}, month=${month}`);

            setCurrentDate(1, month, year);

            // Add styles
            addStyles();

            // Create modal
            createModal();

            // Initialize data structure
            initializeSpecialistEventsData();

            // Load specialist events from API
            await loadSpecialistEvents();

            console.log('[SPECIALIST] Specialist Events Feature initialized successfully');

            return true;
        } catch (error) {
            console.error('[SPECIALIST] Error initializing Specialist Events Feature:', error);
            return false;
        }
    }

    // Public API
    return {
        init: init,
        loadSpecialistEvents: loadSpecialistEvents,
        updateSpecialistEventIndicators: updateSpecialistEventIndicators,
        openSpecialistEventModal: openSpecialistEventModal,
        getCurrentYear: getCurrentYear,
        getCurrentMonth: getCurrentMonth,
        setCurrentDate: setCurrentDate
    };
})();

// The feature will be initialized in the initializeApp() function in script.js
console.log("[SPECIALIST] SpecialistEventsFeature script loaded");
