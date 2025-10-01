// Create a completely self-contained module for the Schreibdienst feature
const SchreibdienstFeature = (function() {
    // Private variables and methods
    let currentUserId = null; // For storing current user in modal

    function addBootstrapIcons() {
        if (document.getElementById('bootstrap-icons-css')) {
            return;
        }
        
        const linkEl = document.createElement('link');
        linkEl.id = 'bootstrap-icons-css';
        linkEl.rel = 'stylesheet';
        linkEl.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
        
        document.head.appendChild(linkEl);
        console.log('Bootstrap Icons CSS added');
    }
    
    function addStyles() {
        if (document.getElementById('schreibdienst-feature-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'schreibdienst-feature-styles';
        
        // Add styles
        styleEl.innerHTML = `
            /* Schreibdienst event display - matching provided image design */
            .schreibdienst-event {
                position: absolute;
                bottom: 1px;
                left: 0;
                right: 0;
                background-color: #ffffff;
                border: 0px solid #ddd;
                border-radius: 6px;
                z-index: 5;
                padding: 3px;
                margin-bottom: 1px;
                display: flex;
                align-items: center;
                gap: 8px;
                min-height: 32px;
                width: 93%;
                margin: auto;
            }
            
            .schreibdienst-event-icon {
                width: 24px;
                height: 24px;
                border: 0px solid #333;
                border-radius: 50%;
                background-color: #f7f3f3;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-weight: bold;
                font-size: 14px;
            }
            
            .schreibdienst-event-content {
                display: flex;
                flex-direction: column;
                gap: 1px;
                flex-grow: 1;
            }
            
            .schreibdienst-event-title {
                font-weight: 600;
                font-size: 10px;
                line-height: 1.1;
                color: #333;
            }
            
            .schreibdienst-event-time {
                font-size: 10px;
                color: #666;
                line-height: 1.1;
            }

            @media screen and (max-width: 768px) {
                .schreibdienst-event {
                    overflow: visible;
                    background-color: transparent;
                }
                
                /* Mobile calendar view - show only icon, hide text */
                .schreibdienst-event-content {
                    display: none;
                }
                
                /* Mobile shift detail modal styling */
                .shift-events-list {
                    border-top: none !important;
                    margin-top: 15px;
                    padding-top: 0;
                }
                
                .shift-event-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .shift-event-content {
                    background-color: white;
                    border-radius: 6px;
                    padding: 8px;
                    margin-bottom: 8px;
                }
                
                .shift-event-time {
                    font-size: 13px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 4px;
                }
                
                .shift-event-creator {
                    font-size: 14px;
                    color: var(--primary-color);
                    font-style: normal;
                }
            }
            
            /* Override Schreibdienst background colors - remove blue backgrounds */
            .shift-left.schreibdienst-single,
            .shift-right.schreibdienst-single {
                background: transparent !important;
                color: inherit !important;
            }
            
            .shift-left.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="false"],
            .shift-right.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="false"],
            .shift-left.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="true"],
            .shift-right.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="true"],
            .shift-left.schreibdienst-full[data-first-user-schreibdienst="false"][data-second-user-schreibdienst="true"],
            .shift-right.schreibdienst-full[data-first-user-schreibdienst="false"][data-second-user-schreibdienst="true"] {
                background: transparent !important;
                color: inherit !important;
            }
            
            /* Schreibdienst modal styles */
            #schreibdienst-modal {
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
            
            /* Add the rest of your styles here */
            .schreibdienst-modal-content {
                background-color: #fefefe;
                margin: 10% auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                width: 80%;
                max-width: 500px;
                position: relative;
            }
            
            .schreibdienst-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            .schreibdienst-modal-title {
                font-size: 1.5rem;
                margin: 0;
            }
            
            .schreibdienst-modal-close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                margin-left: 20px;
            }
            
            .schreibdienst-modal-close:hover {
                color: black;
            }
            
            .schreibdienst-event-form {
                margin-bottom: 20px;
            }
            
            .schreibdienst-event-row {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .schreibdienst-event-field {
                flex: 1;
                min-width: 160px;
            }
            
            .schreibdienst-event-field label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                font-size: 13px;
            }
            
            .schreibdienst-event-field input,
            .schreibdienst-event-field select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .schreibdienst-add-btn {
                padding: 8px 16px;
                background-color: #6ae09e;
                color: black;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .schreibdienst-add-btn:hover {
                background-color: #4cc77a;
            }
            
            .schreibdienst-event-list {
                margin-top: 20px;
            }
            
            .schreibdienst-event-list-title {
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
            }
            
            .schreibdienst-event-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                background-color: #f9f9f9;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .schreibdienst-event-info {
                flex: 1;
            }
            
            .schreibdienst-event-details {
                font-weight: 500;
                margin-bottom: 3px;
            }
            
            .schreibdienst-event-time {
                font-size: 10px;
                color: #666;
            }
            
            /* Creator name styles */
            .schreibdienst-event-creator {
                font-style: italic;
                color: #1760ff;
                margin-left: 5px;
            }
            
            .schreibdienst-event-shift {
                font-size: 12px;
                padding: 2px 6px;
                background-color: #1760ff;
                color: white;
                border-radius: 4px;
                margin-right: 8px;
            }
            
            .schreibdienst-delete-btn {
                background: #fff;
                border: 1px solid #ddd;
                color: #f44336;
                font-size: 16px;
                cursor: pointer;
                margin-left: 8px;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .schreibdienst-delete-btn:hover {
                background: #f44336;
                color: white;
                border-color: #f44336;
            }
            
            /* Schreibdienst icon button for user list */
            .schreibdienst-btn {
                background: #6ae09e;
                border: none;
                cursor: pointer;
                font-size: 16px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                transition: background-color 0.2s;
                justify-content: end;
                margin-right: 8px;
                padding: 4px;
                vertical-align: middle;
                position: relative;
                top: -1px;
                margin-left: auto;
                display: none; /* Only show for Schreibdienst users */

            }
            
            .schreibdienst-btn:hover {
                background-color: #4cc77a;
            }
            
            /* Hover info panel schreibdienst events - match shift user styling exactly */
            .hover-info-schreibdienst {
                margin: 15px 0;
                padding: 10px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: var(--bg-white);
                box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 37px;
                display: flex;
                align-items: center;
                gap: 8px;
                width: fit-content;
            }
            
            .hover-info-schreibdienst-icon {
                width: 24px;
                height: 24px;
                border: 0px solid #333;
                border-radius: 50%;
                background-color: #f7f3f3;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-weight: bold;
                font-size: 14px;
            }
            
            .hover-info-schreibdienst-text {
                font-size: 14px;
                line-height: 1.2;
                color: #333;
                white-space: nowrap;
            }
        `;
        
        document.head.appendChild(styleEl);
        console.log('Schreibdienst styles added');
    }
    
    function initializeData() {
        if (!staticData.schreibdienstEvents) {
            staticData.schreibdienstEvents = {};
        }
        
        console.log('Schreibdienst data initialized');
    }
    
    function updateEventIcons() {
        // Remove existing Schreibdienst events
        document.querySelectorAll('.schreibdienst-event').forEach(event => {
            event.remove();
        });
        
        // Current year and month from globals
        const year = currentYear;
        const month = currentMonth;
        
        // Check if there are any events for this month
        if (!staticData.schreibdienstEvents[year] || 
            !staticData.schreibdienstEvents[year][month]) {
            return;
        }
        
        // Find all day cards
        const dayCards = document.querySelectorAll('.day-card');
        
        // Add events to day cards
        dayCards.forEach(card => {
            // Get day, month, year from card
            const day = parseInt(card.dataset.day);
            
            if (isNaN(day)) {
                return;
            }
            
            // Check if there are events for this day
            if (!staticData.schreibdienstEvents[year][month][day] || 
                staticData.schreibdienstEvents[year][month][day].length === 0) {
                return;
            }
            
            // Group events by shift
            const eventsByShift = {
                'E1': [],
                'E2': []
            };
            
            // Group events by their shift
            staticData.schreibdienstEvents[year][month][day].forEach(event => {
                if (event.shift === 'E1' || event.shift === 'E2') {
                    eventsByShift[event.shift].push(event);
                }
            });
            
            // Add events to E1 shift if there are E1 events
            if (eventsByShift['E1'].length > 0) {
                const shiftE1 = card.querySelector('.shift-left');
                if (shiftE1) {
                    eventsByShift['E1'].forEach(event => {
                        const eventElement = document.createElement('div');
                        eventElement.className = 'schreibdienst-event';
                        
                        // Format time for display (HH.MM)
                        const timeParts = event.time.split(':');
                        const formattedTime = `${timeParts[0]}.${timeParts[1]}`;
                        
                        eventElement.innerHTML = `
                            <div class="schreibdienst-event-icon">T</div>
                            <div class="schreibdienst-event-content">
                                <div class="schreibdienst-event-title">${event.details}</div>
                                <div class="schreibdienst-event-time">${formattedTime}</div>
                            </div>
                        `;
                        
                        shiftE1.appendChild(eventElement);
                    });
                }
            }
            
            // Add events to E2 shift if there are E2 events  
            if (eventsByShift['E2'].length > 0) {
                const shiftE2 = card.querySelector('.shift-right');
                if (shiftE2) {
                    eventsByShift['E2'].forEach(event => {
                        const eventElement = document.createElement('div');
                        eventElement.className = 'schreibdienst-event';
                        
                        // Format time for display (HH.MM)
                        const timeParts = event.time.split(':');
                        const formattedTime = `${timeParts[0]}.${timeParts[1]}`;
                        
                        eventElement.innerHTML = `
                            <div class="schreibdienst-event-icon">T</div>
                            <div class="schreibdienst-event-content">
                                <div class="schreibdienst-event-title">${event.details}</div>
                                <div class="schreibdienst-event-time">${formattedTime}</div>
                            </div>
                        `;
                        
                        shiftE2.appendChild(eventElement);
                    });
                }
            }
        });
        
        console.log('Schreibdienst events updated');
    }
    
    function createModal() {
        // Skip if already exists
        if (document.getElementById('schreibdienst-modal')) {
            return;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div id="schreibdienst-modal">
                <div class="schreibdienst-modal-content">
                    <div class="schreibdienst-modal-header">
                        <h2 class="schreibdienst-modal-title">Schreibdienst Einsatz für <span id="schreibdienst-user-name"></span></h2>
                        <span class="schreibdienst-modal-close">&times;</span>
                    </div>
                    
                    <div class="schreibdienst-event-form">
                        <div class="schreibdienst-event-row">
                            <div class="schreibdienst-event-field">
                                <label for="schreibdienst-event-title">Titel</label>
                                <input type="text" id="schreibdienst-event-title" value="SID">
                            </div>
                        </div>
                        <div class="schreibdienst-event-row">
                            <div class="schreibdienst-event-field">
                                <label for="schreibdienst-event-user">Einsatz mit...</label>
                                <select id="schreibdienst-event-user">
                                    <!-- Will be populated with users -->
                                </select>
                            </div>
                        </div>
                        <div class="schreibdienst-event-row">
                            <div class="schreibdienst-event-field">
                                <label for="schreibdienst-event-date">Datum</label>
                                <input type="date" id="schreibdienst-event-date">
                            </div>
                            <div class="schreibdienst-event-field">
                                <label for="schreibdienst-event-time">Zeit</label>
                                <input type="time" id="schreibdienst-event-time">
                            </div>
                        </div>
                        <button class="schreibdienst-add-btn">Hinzufügen</button>
                    </div>
                    
                    <div class="schreibdienst-event-list">
                        <div class="schreibdienst-event-list-title">Bestehende Einträge</div>
                        <div id="schreibdienst-event-items"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Create container and add to body
        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container.firstElementChild);
        
        // Add event listeners
        const modal = document.getElementById('schreibdienst-modal');
        const closeBtn = modal.querySelector('.schreibdienst-modal-close');
        const addBtn = modal.querySelector('.schreibdienst-add-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        addBtn.addEventListener('click', () => {
            // We'll use the public method here
            SchreibdienstFeature.addEvent();
        });
        
        console.log('Schreibdienst modal created');
    }
    
    function setupButtonRetry() {
        // Try to add buttons immediately
        addSchreibdienstButtons();
        
        // Set up retry attempts in case the user list isn't fully loaded yet
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = 300; // milliseconds
        
        const retryFunction = () => {
            retryCount++;
            console.log(`Retry attempt ${retryCount} for Schreibdienst buttons`);
            
            // Check if user list has items
            const userList = document.getElementById('userList');
            const userItems = userList ? userList.querySelectorAll('.user-item') : [];
            
            if (userItems.length > 0) {
                // User list has loaded, add buttons
                addSchreibdienstButtons();
                
                // Also add event icons in case they're needed
                updateEventIcons();
                
                console.log(`Successfully added Schreibdienst buttons on retry ${retryCount}`);
            } else if (retryCount < maxRetries) {
                // Try again after interval
                setTimeout(retryFunction, retryInterval);
            } else {
                console.error('Failed to add Schreibdienst buttons after maximum retries');
            }
        };
        
        // Start retry sequence after a short delay
        setTimeout(retryFunction, retryInterval);
    }
    
    function addSchreibdienstButtons() {
        // Skip if no static data yet
        if (!staticData || !staticData.users) {
            console.log('Static data not available yet, skipping Schreibdienst button addition');
            return;
        }
        
        // Find user list and verify it exists
        const userList = document.getElementById('userList');
        if (!userList) {
            console.log('User list not found in DOM, cannot add Schreibdienst buttons');
            return;
        }
        
        const userItems = userList.querySelectorAll('.user-item');
        console.log(`Found ${userItems.length} user items in user list`);
        
        // Counter for buttons added
        let buttonsAdded = 0;
        
        userItems.forEach(item => {
            // Skip if already has Schreibdienst button
            if (item.querySelector('.schreibdienst-btn')) {
                return;
            }
            
            // Get user name
            const nameEl = item.querySelector('.user-name');
            if (!nameEl) return;
            
            // Find the user ID by name
            const userName = nameEl.textContent;
            const user = staticData.users.find(u => u.name === userName);
            if (!user) return;
            
            // Debug the user's Schreibdienst status
            console.log(`User ${userName} (${user.id}) isSchreibdienst: ${user.isSchreibdienst}`);
            
            // Only add button for Schreibdienst users
            if (!user.isSchreibdienst) return;
            
            // Create Schreibdienst button
            const btn = document.createElement('button');
            btn.className = 'schreibdienst-btn';
            btn.innerHTML = '<img src="schreibdienst.svg" alt="Schreibdienst" style="width: 16px; height: 16px;">';
            btn.title = 'Schreibdienst Einsatz erstellen';
            btn.setAttribute('data-user-id', user.id);
            btn.style.display = 'block'; // Make visible for Schreibdienst users
            
            // Add click handler
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent user selection
                openSchreibdienstModal(user.id);
            });
            
            // Add holiday button if it exists
            const holidayBtn = item.querySelector('.holiday-btn');
            if (holidayBtn) {
                holidayBtn.parentNode.insertBefore(btn, holidayBtn);
            } else {
                // Add button after name
                nameEl.parentNode.insertBefore(btn, nameEl.nextSibling);
            }
            
            buttonsAdded++;
        });
        
        console.log(`Added ${buttonsAdded} Schreibdienst buttons to user list items`);
    }
    
    function openSchreibdienstModal(userId) {
        console.log('Opening Schreibdienst modal for user ID:', userId);
        currentUserId = userId;
        
        // Find user
        const user = staticData.users.find(u => u.id === userId);
        if (!user) {
            console.error('User not found:', userId);
            return;
        }
        
        // Update modal title
        const userNameEl = document.getElementById('schreibdienst-user-name');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
        
        // Set form defaults
        const titleInput = document.getElementById('schreibdienst-event-title');
        const dateInput = document.getElementById('schreibdienst-event-date');
        const timeInput = document.getElementById('schreibdienst-event-time');
        const userSelect = document.getElementById('schreibdienst-event-user');
        
        if (titleInput) titleInput.value = 'SID';
        if (timeInput) timeInput.value = '';
        
        // Populate user dropdown
        if (userSelect && staticData.users) {
            userSelect.innerHTML = '';
            staticData.users
                .filter(user => user.active)
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    if (user.id === userId) {
                        option.selected = true;
                    }
                    userSelect.appendChild(option);
                });
        }
        
        // Set today's date
        if (dateInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
        }
        
        // Update event list to show existing entries
        updateEventList();
        
        // Show modal
        const modal = document.getElementById('schreibdienst-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    // Removed addTimeChangeListener function since shift field was removed
    
    function determineShiftFromTime(time) {
        if (!time) return '';
        
        // Parse time (HH:MM format)
        const timeParts = time.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1]) || 0;
        const totalMinutes = hour * 60 + minute;
        const cutoffMinutes = 14 * 60; // 14:00 in minutes
        
        // Before 14:00 → E1, 14:00 and after → E2
        return totalMinutes < cutoffMinutes ? 'E1' : 'E2';
    }

    function updateEventList() {
        const listEl = document.getElementById('schreibdienst-event-items');
        if (!listEl || !currentUserId) return;
        
        // Clear list completely
        listEl.innerHTML = '';
        
        // Find all events
        const events = [];
        
        // Loop through all years, months, days
        for (const year in staticData.schreibdienstEvents) {
            for (const month in staticData.schreibdienstEvents[year]) {
                for (const day in staticData.schreibdienstEvents[year][month]) {
                    // Get events for this day
                    const dayEvents = staticData.schreibdienstEvents[year][month][day];
                    
                    // Add each event with date info
                    dayEvents.forEach((event, index) => {
                        // Find the creator's name - use flexible comparison for ID
                        const creator = staticData.users.find(u => u.id == event.userId);
                        const creatorName = creator ? creator.name : 'Unbekannt';
                        
                        // Debug log to help troubleshoot
                        if (!creator) {
                            console.log('User not found for event:', event.userId, 'Available users:', staticData.users.map(u => ({id: u.id, name: u.name})));
                        }
                        
                        events.push({
                            ...event,
                            year: parseInt(year),
                            month: parseInt(month),
                            day: parseInt(day),
                            index: index,
                            creatorName: creatorName
                        });
                    });
                }
            }
        }
        
        // Sort events by date and time
        events.sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1, a.day, 
                                  parseInt(a.time.split(':')[0]), 
                                  parseInt(a.time.split(':')[1]));
            const dateB = new Date(b.year, b.month - 1, b.day, 
                                  parseInt(b.time.split(':')[0]), 
                                  parseInt(b.time.split(':')[1]));
            return dateA - dateB;
        });
        
        if (events.length === 0) {
            listEl.innerHTML = '<p>Keine Einträge vorhanden</p>';
            return;
        }
        
        // Add each event to the list
        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'schreibdienst-event-item';
            
            // Format date
            const dateObj = new Date(event.year, event.month - 1, event.day);
            const formattedDate = dateObj.toLocaleDateString('de-DE', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            // Create element with creator name
            eventItem.innerHTML = `
                <div class="schreibdienst-event-info">
                    <div class="schreibdienst-event-details">
                        <span class="schreibdienst-event-shift">${event.shift}</span>
                        ${event.details}
                    </div>
                    <div class="schreibdienst-event-time">
                        ${formattedDate} um ${event.time}
                        <span class="schreibdienst-event-creator">mit ${event.creatorName}</span>
                    </div>
                </div>
            `;
            
            // Add delete button for all events (users can manage all Schreibdienst events)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'schreibdienst-delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Eintrag löschen';
            
            // Add delete handler with confirmation
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Möchten Sie den Eintrag "${event.details}" am ${formattedDate} wirklich löschen?`)) {
                    SchreibdienstFeature.deleteEvent(event.year, event.month, event.day, event.index);
                }
            });
            
            eventItem.appendChild(deleteBtn);
            
            listEl.appendChild(eventItem);
        });
    }
    
    function setupMutationObserver() {
        // Create an observer instance
        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && 
                    (mutation.target.id === 'userList' || 
                     mutation.target.id === 'calendar' ||
                     mutation.target.classList?.contains('user-item'))) {
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                // Wait a bit for DOM to stabilize
                setTimeout(() => {
                    addSchreibdienstButtons();
                    updateEventIcons();
                }, 100);
            }
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Mutation observer set up for Schreibdienst feature');
    }
    
    function setupHoverInfoExtension() {
        // Find the original hover handler function
        if (typeof updateHoverInfo !== 'function') {
            console.error('updateHoverInfo function not found. Cannot extend hover panel.');
            return;
        }
        
        // Replace with enhanced version
        const originalUpdateHoverInfo = window.updateHoverInfo;
        
        window.updateHoverInfo = function(day, show) {
            // Call original function first
            originalUpdateHoverInfo(day, show);
            
            // Find hover panel for cleanup
            const hoverPanel = document.getElementById('hoverInfoPanel');
            if (!hoverPanel) return;
            
            // ALWAYS clean up existing Schreibdienst section first (critical fix)
            const existingSection = hoverPanel.querySelector('.hover-info-schreibdienst');
            if (existingSection) {
                existingSection.remove();
            }
            
            // If not showing, we're done (after cleanup)
            if (!show) return;
            
            // Check if there are Schreibdienst events for this day
            const events = staticData.schreibdienstEvents?.[currentYear]?.[currentMonth]?.[day] || [];
            
            // If no events, we're done (after cleanup)
            if (events.length === 0) return;
            
            // Create new schreibdienst section
            const schreibdienstSection = document.createElement('div');
            schreibdienstSection.className = 'hover-info-schreibdienst';
            
            // Insert AFTER the hover-info-content container (completely below all shift info)
            const infoContent = hoverPanel.querySelector('.hover-info-content');
            if (infoContent) {
                // Insert as a sibling AFTER the content container
                infoContent.parentNode.insertBefore(schreibdienstSection, infoContent.nextSibling);
            } else {
                // Fallback: add directly to hover panel
                hoverPanel.appendChild(schreibdienstSection);
            }
            
            // Prepare events with creator names
            const eventsWithCreators = events.map(event => {
                // Find the creator's name - use flexible comparison for ID
                const creator = staticData.users.find(u => u.id == event.userId);
                const creatorName = creator ? creator.name : 'Unbekannt';
                
                // Debug log if user not found
                if (!creator) {
                    console.log('Hover: User not found for event:', event.userId, 'Available users:', staticData.users.map(u => ({id: u.id, name: u.name})));
                }
                
                return {
                    ...event,
                    creatorName: creatorName
                };
            });
            
            // Clear and update content - compact single line design
            const event = eventsWithCreators[0]; // Show first event
            
            // Make sure we have proper user data
            let userName = event.creatorName;
            if (!userName || userName === 'Unbekannt') {
                // Try to find user by ID again
                const user = staticData.users.find(u => u.id == event.userId);
                userName = user ? user.name : 'Unbekannt';
            }
            
            // Format time to shorter format (HH.MM)
            const timeParts = event.time.split(':');
            const shortTime = `${timeParts[0]}.${timeParts[1]}`;
            
            schreibdienstSection.innerHTML = `
                <div class="hover-info-schreibdienst-icon">T</div>
                <div class="hover-info-schreibdienst-text">${shortTime} - ${event.details} mit ${userName}</div>
            `;
        };
    }
    
    // Load events from API
    async function loadEvents(year, month) {
        try {
            console.log(`Loading Schreibdienst events for ${year}-${month}`);
            
            // Reset event data for this year/month to avoid duplicates
            if (!staticData.schreibdienstEvents) {
                staticData.schreibdienstEvents = {};
            }
            if (!staticData.schreibdienstEvents[year]) {
                staticData.schreibdienstEvents[year] = {};
            }
            
            // Reset this month's data specifically
            staticData.schreibdienstEvents[year][month] = {};
            
            // Make direct fetch request without authorization
            const response = await fetch(`api/schreibdienst.php?year=${year}&month=${month}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load Schreibdienst events: ${response.statusText}`);
            }
            
            const events = await response.json();
            
            // Group events by day
            events.forEach(event => {
                // Extract day from date (format: YYYY-MM-DD)
                const day = parseInt(event.date.split('-')[2]);
                
                // Initialize day array if needed
                if (!staticData.schreibdienstEvents[year][month][day]) {
                    staticData.schreibdienstEvents[year][month][day] = [];
                }
                
                // Add event to the day's array
                staticData.schreibdienstEvents[year][month][day].push({
                    id: event.id,
                    details: event.details,
                    time: event.time,
                    shift: event.shift_type,
                    userId: event.user_id
                });
            });
            
            console.log(`Loaded ${events.length} Schreibdienst events for ${year}-${month}`);
            
            return events.length;
        } catch (error) {
            console.error('Error loading Schreibdienst events:', error);
            
            return 0;
        }
    }
    
    // Public interface
    return {
        // Initialize the feature
        init: async function() {
            console.log('Initializing Standalone Schreibdienst Feature');
            
            // Add styles and icons
            addBootstrapIcons();
            addStyles();
            
            // Initialize data structure
            initializeData();
            
            // Load events for current month
            await loadEvents(currentYear, currentMonth);
            
            // Add Schreibdienst event icons to day cards
            updateEventIcons();
            
            // Create modal if it doesn't exist
            createModal();
            
            // Set up retry mechanism for adding buttons
            setupButtonRetry();
            
            // Set up mutation observer to handle dynamic DOM updates
            setupMutationObserver();
            
            // Hook into existing hover info functionality
            setupHoverInfoExtension();
            
            console.log('Standalone Schreibdienst Feature initialized');
            
            return true;
        },
        
        // Add a new event
        addEvent: async function() {
            if (!currentUserId) return;
            
            const titleInput = document.getElementById('schreibdienst-event-title');
            const dateInput = document.getElementById('schreibdienst-event-date');
            const timeInput = document.getElementById('schreibdienst-event-time');
            const userSelect = document.getElementById('schreibdienst-event-user');
            
            if (!titleInput || !dateInput || !timeInput || !userSelect) return;
            
            const title = titleInput.value.trim();
            const date = dateInput.value;
            const time = timeInput.value;
            const selectedUserId = userSelect.value;
            const shift = determineShiftFromTime(time);
            
            if (!title || !date || !time || !selectedUserId) {
                alert('Bitte füllen Sie alle Felder aus.');
                return;
            }
            
            if (new Date(date) > new Date(date)) {
                alert('End date must be after start date.');
                return;
            }
            
            try {
                // Create API request to add event using authenticated fetch
                const response = await AuthManager.fetchWithAuth('api/schreibdienst.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date: date,
                        time: time,
                        shift_type: shift,
                        details: title,
                        user_id: selectedUserId
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add event');
                }
                
                // Get the created event with its ID
                const createdEvent = await response.json();
                
                // Parse date components
                const dateParts = date.split('-');
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);
                
                // Initialize structure if needed
                if (!staticData.schreibdienstEvents[year]) {
                    staticData.schreibdienstEvents[year] = {};
                }
                if (!staticData.schreibdienstEvents[year][month]) {
                    staticData.schreibdienstEvents[year][month] = {};
                }
                if (!staticData.schreibdienstEvents[year][month][day]) {
                    staticData.schreibdienstEvents[year][month][day] = [];
                }
                
                // Add event to local data
                staticData.schreibdienstEvents[year][month][day].push({
                    id: createdEvent.id,
                    details: title,
                    time: time,
                    shift: shift,
                    userId: selectedUserId
                });
                
                // Update UI
                updateEventIcons();
                updateEventList();
                
                // Reset inputs
                titleInput.value = 'SID';
                timeInput.value = '';
                
                // Keep modal open so user can see their event was added
                
                // Show success notification
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.show({
                        type: 'success',
                        message: `Schreibdienst event "${title}" was successfully created.`
                    });
                }
                
                console.log('Schreibdienst event added successfully:', createdEvent);
            } catch (error) {
                console.error('Error adding Schreibdienst event:', error);
                alert(`Failed to add event: ${error.message}`);
            }
        },
        
        // Delete an event
        deleteEvent: async function(year, month, day, index) {
            // Get the event to be deleted
            const events = staticData.schreibdienstEvents[year]?.[month]?.[day];
            if (!events || !events[index]) return;
            
            const eventId = events[index].id;
            
            try {
                // Send API request to delete event using authenticated fetch
                const response = await AuthManager.fetchWithAuth(`api/schreibdienst.php?id=${eventId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete event');
                }
                
                // Remove event from local data
                events.splice(index, 1);
                
                // Clean up empty containers
                if (events.length === 0) {
                    delete staticData.schreibdienstEvents[year][month][day];
                    
                    if (Object.keys(staticData.schreibdienstEvents[year][month]).length === 0) {
                        delete staticData.schreibdienstEvents[year][month];
                        
                        if (Object.keys(staticData.schreibdienstEvents[year]).length === 0) {
                            delete staticData.schreibdienstEvents[year];
                        }
                    }
                }
                
                // Update UI
                updateEventIcons();
                updateEventList();
                
                console.log('Schreibdienst event deleted successfully:', eventId);
            } catch (error) {
                console.error('Error deleting Schreibdienst event:', error);
                alert(`Failed to delete event: ${error.message}`);
            }
        },
        
        // Public method to open the modal
        openSchreibdienstModal: openSchreibdienstModal,
        
        // Expose other methods needed by the application
        loadEvents: loadEvents,
        updateEventIcons: updateEventIcons,
        getCurrentUserId: function() {
            return currentUserId;
        }
    };
})();

// Initialize the Schreibdienst feature after the page loads
window.addEventListener('load', function() {
    // First attempt - early
    setTimeout(() => {
        // Note: We do not auto-initialize here since this is now handled in script.js
        // SchreibdienstFeature.init();
    }, 800);
});