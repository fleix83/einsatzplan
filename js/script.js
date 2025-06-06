// Global variables (unchanged)
let staticData = null;
let currentYear = (new Date()).getFullYear();
let currentMonth = (new Date()).getMonth() + 1;
let selectedDay = null;
let hoveredUserId = null;
let selectedUserId = null;

// Notification System
const NotificationSystem = {
    container: null,
    init: function() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            console.error('Benachrichtigungscontainer nicht gefunden');
            return;
        }
    },
    
    show: function(options) {
        if (!this.container) {
            this.init();
        }
        
        const defaults = {
            type: 'info', // info, success, warning, error
            title: '',
            message: '',
            duration: 5000, // milliseconds
            closable: true
        };
        
        const settings = {...defaults, ...options};
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${settings.type}`;
        
        // Icon based on type
        let icon = '';
        switch (settings.type) {
            case 'success':
                icon = '✓';
                break;
            case 'warning':
                icon = '⚠️';
                break;
            case 'error':
                icon = '✕';
                break;
            default: // info
                icon = 'ℹ️';
                break;
        }
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                ${settings.title ? `<div class="notification-title">${settings.title}</div>` : ''}
                <div class="notification-message">${settings.message}</div>
            </div>
            ${settings.closable ? '<button class="notification-close">×</button>' : ''}
            <div class="notification-progress"></div>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Handle close button click
        if (settings.closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                this.remove(notification);
            });
        }
        
        // Auto-remove after duration
        const removalTimeout = setTimeout(() => {
            this.remove(notification);
        }, settings.duration);
        
        // Store timeout to clear if closed manually
        notification.dataset.timeout = removalTimeout;
        
        // For chaining
        return this;
    },
    
    remove: function(notification) {
        // Clear the timeout if it exists
        if (notification.dataset.timeout) {
            clearTimeout(notification.dataset.timeout);
        }
        
        // Add the fadeOut class
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(10%)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    },
    
    // Helper methods for common notification types
    success: function(message, title = 'Erfolg') {
        return this.show({
            type: 'success',
            title: title,
            message: message
        });
    },
    
    error: function(message, title = 'Fehler') {
        return this.show({
            type: 'error',
            title: title,
            message: message
        });
    },
    
    warning: function(message, title = 'Warnung') {
        return this.show({
            type: 'warning',
            title: title,
            message: message
        });
    },
    
    info: function(message, title = 'Information') {
        return this.show({
            type: 'info',
            title: title,
            message: message
        });
    }
};


// Function to get URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const year = urlParams.get('year');
    const month = urlParams.get('month');
    
    return {
        year: year ? parseInt(year) : null,
        month: month ? parseInt(month) : null
    };
}

// In script.js
function setupUI() {
    // Get authentication status
    const isAuthenticated = AuthManager.isAuthenticated();
    const currentUser = AuthManager.getCurrentUser();
    const isBackoffice = isAuthenticated && currentUser && currentUser.role === 'Backoffice';
    
    // Check if we're in mobile view
    const isMobileView = window.innerWidth <= 768;
    
    // Get UI elements
    const manageUsersButton = document.getElementById('manageUsers');
    const mobileManageUsersButton = document.getElementById('mobileManageUsers');
    const authButton = document.getElementById('authButton');
    const mobileAuthButton = document.getElementById('mobileAuthButton');
    const userInfoElement = document.getElementById('userInfo');
    const mobileUserInfoElement = document.getElementById('mobileUserInfo');
    const topNavbar = document.querySelector('.top-navbar');
    const userListPanel = document.querySelector('.user-list-panel');
    const exportButton = document.getElementById('exportCalendar');
    const freezeToggleBtn = document.getElementById('freezeToggleBtn');
    const navbarAuth = document.querySelector('.navbar-auth');
    
    // Create auth link container if it doesn't exist (for desktop view)
    let authLinkContainer = document.getElementById('authLinkContainer');
    if (!authLinkContainer) {
        authLinkContainer = document.createElement('div');
        authLinkContainer.id = 'authLinkContainer';
        authLinkContainer.className = 'auth-link-container';
        document.body.appendChild(authLinkContainer);
        
        // Create auth link
        const authLink = document.createElement('a');
        authLink.id = 'authLink';
        authLink.className = 'auth-link';
        authLink.href = 'javascript:void(0);';
        authLinkContainer.appendChild(authLink);
        
        // Add click handler to the auth link
        authLink.addEventListener('click', function() {
            if (AuthManager.isAuthenticated()) {
                AuthManager.logout();
            } else {
                AuthManager.showLoginDialog();
            }
        });
    }
    
    // Update the auth link text and style based on authentication status
    const authLink = document.getElementById('authLink');
    if (authLink) {
        if (isAuthenticated && currentUser) {
            // Show user info and logout option
            authLink.innerHTML = `
                <span class="auth-link-icon">🔒</span>
                <span class="auth-link-text">${currentUser.name} (Logout)</span>
            `;
            authLink.classList.add('logged-in');
            
            // Add role indicator for backoffice users
            if (currentUser.role === 'Backoffice') {
                authLink.innerHTML = `
                    <span class="auth-link-icon">👑</span>
                    <span class="auth-link-text">${currentUser.name} (Logout)</span>
                `;
            }
        } else {
            // Show login option
            authLink.innerHTML = `
                <span class="auth-link-icon">🔑</span>
                <span class="auth-link-text">Login</span>
            `;
            authLink.classList.remove('logged-in');
        }
        
        // Hide auth link in mobile view
        authLink.style.display = isMobileView ? 'none' : 'flex';
    }
    
    // Apply special styling based on user role
    if (topNavbar) {
      if (isBackoffice) {
        topNavbar.classList.add('backoffice-mode');
        if (userListPanel) {
          userListPanel.classList.add('backoffice-mode');
        }
        
        // CUSTOM EVENTS BUTTON - Force create for backoffice users
        if (typeof CustomEventsFeature !== 'undefined' && 
            typeof CustomEventsFeature.addCustomEventButton === 'function') {
            console.log('Calling addCustomEventButton from setupUI');
            CustomEventsFeature.addCustomEventButton();
        } else {
            console.log('CustomEventsFeature not available or missing addCustomEventButton function');
            // Fallback: Add the button directly
            addCustomEventButtonDirectly();
        }
      } else {
        topNavbar.classList.remove('backoffice-mode');
        if (userListPanel) {
          userListPanel.classList.remove('backoffice-mode');
        }
      }
    }
    
    // Show/hide the User Manager button based on authentication and role
    if (manageUsersButton) {
      // Only show to authenticated Backoffice users
      if (isBackoffice) {
        manageUsersButton.style.display = 'block';
      } else {
        manageUsersButton.style.display = 'none';
      }
    }
    
    // Also handle mobile manage users button
    if (mobileManageUsersButton) {
      if (isBackoffice) {
        mobileManageUsersButton.style.display = 'block';
      } else {
        mobileManageUsersButton.style.display = 'none';
      }
    }
    
    // Hide auth container in top navbar (since we're using the new auth link)
    if (navbarAuth) {
      navbarAuth.style.display = 'none';
    }
    
    // In mobile view, adjust buttons in the top navbar
    if (isMobileView) {
      // Show/hide freeze button in navbar for backoffice users in mobile
      if (freezeToggleBtn) {
        if (isBackoffice) {
          freezeToggleBtn.style.display = 'flex';
        } else {
          freezeToggleBtn.style.display = 'none';
        }
      }
      
      // For non-backoffice users, show export button in navbar
      if (exportButton && !isBackoffice) {
        exportButton.style.display = 'flex';
      }
    }
    
    // Update mobile auth button state
    if (mobileAuthButton) {
      if (isAuthenticated && currentUser) {
        // Show user info and logout option
        mobileAuthButton.textContent = 'Abmelden';
        mobileAuthButton.classList.add('logged-in');
        
        // Add user name to info element if available
        if (mobileUserInfoElement && currentUser.name) {
          mobileUserInfoElement.textContent = currentUser.name;
          mobileUserInfoElement.style.display = 'block';
          
          // Add role indicator for backoffice users
          if (currentUser.role === 'Backoffice') {
            mobileUserInfoElement.innerHTML = `<span class="admin-badge">👑</span> ${currentUser.name}`;
          }
        }
      } else {
        // Show login option
        mobileAuthButton.textContent = 'Anmelden';
        mobileAuthButton.classList.remove('logged-in');
        
        // Hide user info
        if (mobileUserInfoElement) {
          mobileUserInfoElement.style.display = 'none';
        }
      }
    }
  
    // You might want to disable edit buttons for unauthenticated users
    const editControls = document.querySelectorAll('.edit-control');
    editControls.forEach(element => {
      element.disabled = !isAuthenticated;
    });
    
    // Direct button creation function
    function addCustomEventButtonDirectly() {
        // Only for backoffice users
        if (!isBackoffice) return;
        
        // Skip if already exists
        if (document.getElementById('customEventBtn')) return;
        
        const navbarControls = document.querySelector('.navbar-controls');
        if (!navbarControls) return;
        
        // Create button
        const eventBtn = document.createElement('button');
        eventBtn.id = 'customEventBtn';
        eventBtn.className = 'button-custom-event';
        eventBtn.innerHTML = '<span class="button-icon">📅</span>';
        eventBtn.title = 'Add Custom Event';
        
        // Click handler
        eventBtn.addEventListener('click', async () => {
            try {
                // If feature exists but hasn't been initialized yet, initialize it
                if (typeof CustomEventsFeature !== 'undefined') {
                    if (typeof CustomEventsFeature.init === 'function' && 
                        typeof CustomEventsFeature.openCustomEventModal !== 'function') {
                        console.log('Initializing CustomEventsFeature on demand');
                        await CustomEventsFeature.init();
                    }
                    
                    if (typeof CustomEventsFeature.openCustomEventModal === 'function') {
                        CustomEventsFeature.openCustomEventModal(1, currentMonth, currentYear);
                    } else {
                        console.error('CustomEventsFeature.openCustomEventModal is not available');
                        NotificationSystem.warning('Loading feature components... Please try again in a moment.');
                    }
                } else {
                    console.error('CustomEventsFeature is undefined');
                    NotificationSystem.error('Custom event feature is not available. Please refresh the page.');
                }
            } catch (error) {
                console.error('Error handling custom event button click:', error);
                NotificationSystem.error('An error occurred. Please try again.');
            }
        });
        
        // Add to navbar - insert before the manage users button
        const manageUsersBtn = document.getElementById('manageUsers');
        if (manageUsersBtn) {
            navbarControls.insertBefore(eventBtn, manageUsersBtn);
        } else {
            navbarControls.appendChild(eventBtn);
        }
        
        console.log('Custom event button added directly in setupUI');
    }
}
   

// Helper function to get the day name
function getDayName(year, month, day) {
    const date = new Date(year, month - 1, day);
    return GermanDateFormatter.getWeekdayName(date);
}

// Function to initialize the year selector dropdown
function initializeYearSelector() {
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.innerHTML = ''; // Clear existing options
    
    // Add options for years from 2025 to 2030 (or adjust as needed)
    for (let year = 2025; year <= 2030; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // Set current year as selected
    yearSelect.value = currentYear;
}

// Function to initialize the month selector dropdown
function initializeMonthSelector() {
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.innerHTML = ''; // Clear existing options
    
    // Use month names from GermanDateFormatter if available
    const monthNames = GermanDateFormatter ? 
        GermanDateFormatter.months : 
        ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
         'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    // Add option for each month
    monthNames.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // Month values are 1-12
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    // Set current month as selected
    monthSelect.value = currentMonth;
}

// Function to update URL parameters based on current year/month
function updateUrlParams() {
    const url = new URL(window.location.href);
    url.searchParams.set('year', currentYear);
    url.searchParams.set('month', currentMonth);
    
    // Update URL without reloading the page
    window.history.pushState({}, '', url);
}

// Initialize data from API instead of localStorage
async function initializeData() {
    try {
        console.log('Daten von API laden');
        
        // Create skeleton data structure
        staticData = {
            metadata: {
                version: "1.0",
                lastUpdated: new Date().toISOString()
            },
            users: [],
            schedules: {},
            settings: {
                shiftsPerDay: 2,
                usersPerShift: 2,
                shiftNames: ["E1", "E2"],
                workingDays: [1, 2, 3, 4, 5]
            }
        };
        
        try {
            // Load users from API
            await loadUsers();
        } catch (error) {
            console.error('Fehler beim Laden der Benutzer, fahre mit leerer Benutzerliste fort:', error);
            // Just continue with empty users array
        }
        
        try {
            // Load current month's schedule data
            await loadScheduleData(currentYear, currentMonth);
        } catch (error) {
            console.error('Fehler beim Laden der Planungsdaten, fahre mit leerem Plan fort:', error);
            // Just continue with empty schedule
        }
        
        console.log('Daten erfolgreich von API geladen');
    } catch (error) {
        console.error('Fehler beim Laden der Daten von API:', error);
        // Create default data if API fails
        createDefaultData();
    }
}

// Function to load users from API
async function loadUsers() {
    try {
        console.log('Benutzer von API laden');
        
        // Make request without requiring auth
        const response = await fetch('api/users.php');
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Fehler beim Laden der Benutzer: ${response.statusText || errorData.error || 'Unbekannter Fehler'}`);
        }
        
        const users = await response.json();
        
        // Ensure we have an array
        if (!Array.isArray(users)) {
            console.warn('Unerwartetes Antwortformat von der Benutzer-API:', users);
            return;
        }
        
        staticData.users = users;
        console.log('Benutzer geladen:', users.length);
    } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
        throw error;
    }
}


// Function to load schedule data for a specific month
async function loadScheduleData(year, month) {
    try {
        console.log(`Planungsdaten für ${year}-${month} laden`);
        
        // Make request without requiring auth
        const response = await fetch(`api/shifts.php?year=${year}&month=${month}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Fehler beim Laden der Planungsdaten: ${response.statusText || errorData.error || 'Unbekannter Fehler'}`);
        }
        
        const data = await response.json();
        
        // Initialize structure if needed
        if (!staticData.schedules[year]) staticData.schedules[year] = {};
        staticData.schedules[year][month] = {};
        
        // Check if we have a valid array
        if (!Array.isArray(data)) {
            console.warn('Unerwartetes Antwortformat von der Schicht-API:', data);
            return;
        }
        
        // Format the data from API to match our expected structure
        data.forEach(shift => {
            // Rest of your existing code
        });
        
        console.log(`${data.length} Schichten für ${year}-${month} geladen`);
    } catch (error) {
        console.error('Fehler beim Laden der Planungsdaten:', error);
        
        // Initialize with empty data on error
        if (!staticData.schedules[year]) staticData.schedules[year] = {};
        staticData.schedules[year][month] = {};
        
        throw error;
    }
}

// Function to load schedule data for a specific month
async function loadScheduleData(year, month) {
    try {
        const response = await AuthManager.fetchWithAuth(`api/shifts.php?year=${year}&month=${month}`, {}, false);
        
        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Planungsdaten: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if we have a valid array
        if (!Array.isArray(data)) {
            console.warn('Unerwartetes Antwortformat von der Schicht-API:', data);
            // Initialize with empty data
            if (!staticData.schedules[year]) staticData.schedules[year] = {};
            staticData.schedules[year][month] = {};
            return;
        }
        
        // Initialize structure if needed
        if (!staticData.schedules[year]) staticData.schedules[year] = {};
        staticData.schedules[year][month] = {};
        
        // Format the data from API to match our expected structure
        data.forEach(shift => {
            const day = new Date(shift.date).getDate();
            
            if (!staticData.schedules[year][month][day]) {
                staticData.schedules[year][month][day] = {
                    E1: ["", ""],
                    E2: ["", ""],
                    notes: {
                        E1: ["", ""],
                        E2: ["", ""]
                    }
                };
            }
            
            if (shift.shift_type === 'E1') {
                staticData.schedules[year][month][day].E1[0] = shift.user1_id || "";
                staticData.schedules[year][month][day].E1[1] = shift.user2_id || "";
                staticData.schedules[year][month][day].notes.E1[0] = shift.note1 || "";
                staticData.schedules[year][month][day].notes.E1[1] = shift.note2 || "";
            } else if (shift.shift_type === 'E2') {
                staticData.schedules[year][month][day].E2[0] = shift.user1_id || "";
                staticData.schedules[year][month][day].E2[1] = shift.user2_id || "";
                staticData.schedules[year][month][day].notes.E2[0] = shift.note1 || "";
                staticData.schedules[year][month][day].notes.E2[1] = shift.note2 || "";
            }
        });
        
        console.log(`Planungsdaten für ${year}-${month} geladen`);
    } catch (error) {
        console.error('Fehler beim Laden der Planungsdaten:', error);
        throw error;
    }
}

// Replace saveData with API-specific save function
// This function is no longer needed as we'll save directly when changes are made
function saveData() {
    console.log('saveData() ist jetzt ein No-op - Daten werden direkt in der Datenbank gespeichert');
    // No longer saving to localStorage
}








// Function to initialize the user form
function initializeUserForm() {
    const roleSelect = document.getElementById('newUserRole');
    const backofficeFields = document.getElementById('backofficeFields');
    
    // Show/hide backoffice fields based on role selection
    if (roleSelect && backofficeFields) {
        roleSelect.addEventListener('change', function() {
            if (this.value === 'Backoffice') {
                backofficeFields.style.display = 'block';
            } else {
                backofficeFields.style.display = 'none';
                // Clear the fields when switching back to Freiwillige
                document.getElementById('newUserEmail').value = '';
                document.getElementById('newUserPassword').value = '';
                document.getElementById('newUserPasswordConfirm').value = '';
            }
        });
    }
    
    // Add validation for the user form (remove any existing listeners first)
    const addUserButton = document.getElementById('addUser');
    if (addUserButton) {
        // Remove any existing event listeners by cloning the element
        const newButton = addUserButton.cloneNode(true);
        addUserButton.parentNode.replaceChild(newButton, addUserButton);
        
        // Add the event listener to the new element
        newButton.addEventListener('click', function() {
            validateAndAddUser();
        });
    }
    
    // Add Enter key handler for the form (remove existing listeners first)
    const formInputs = document.querySelectorAll('#newUserName, #newUserEmail, #newUserPassword, #newUserPasswordConfirm');
    formInputs.forEach(input => {
        // Clone to remove existing event listeners
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                validateAndAddUser();
            }
        });
    });
}




// Function to validate and add a user
function validateAndAddUser() {
    const nameInput = document.getElementById('newUserName');
    const roleSelect = document.getElementById('newUserRole');
    const emailInput = document.getElementById('newUserEmail');
    const passwordInput = document.getElementById('newUserPassword');
    const passwordConfirmInput = document.getElementById('newUserPasswordConfirm');
    
    if (!nameInput.value.trim()) {
        NotificationSystem.warning('Bitte geben Sie einen Namen ein.');
        nameInput.focus();
        return;
    }
    
    // Additional validation for Backoffice users
    if (roleSelect.value === 'Backoffice') {
        if (!emailInput.value.trim()) {
            NotificationSystem.warning('Bitte geben Sie eine E-Mail-Adresse ein.');
            emailInput.focus();
            return;
        }
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            NotificationSystem.warning('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            emailInput.focus();
            return;
        }
        
        if (!passwordInput.value) {
            NotificationSystem.warning('Bitte geben Sie ein Passwort ein.');
            passwordInput.focus();
            return;
        }
        
        if (passwordInput.value.length < 8) {
            NotificationSystem.warning('Das Passwort muss mindestens 8 Zeichen lang sein.');
            passwordInput.focus();
            return;
        }
        
        if (passwordInput.value !== passwordConfirmInput.value) {
            NotificationSystem.warning('Die Passwörter stimmen nicht überein.');
            passwordConfirmInput.focus();
            return;
        }
    }
    
    // If validation passes, add the user
    addUser(
        nameInput.value.trim(),
        roleSelect.value,
        emailInput.value.trim(),
        passwordInput.value
    );
}




// Function to add a user
async function addUser(name, role, email, password) {
    try {
        // Create user data object
        const userData = {
            name: name,
            role: role,
            isStarter: false,
            isSchreibdienst: false
        };
        
        // Add email and password for Backoffice users
        if (role === 'Backoffice' && email && password) {
            userData.email = email;
            userData.password = password;
        }
        
        // Send API request to create user
        const response = await AuthManager.fetchWithAuth('api/users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        }, true); // Set requireAuth to true
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Hinzufügen des Benutzers');
        }
        
        const result = await response.json();
        
        // Add user to local data
        const newUser = {
            id: result.id,
            name: name,
            active: true,
            role: role,
            isStarter: false,
            isSchreibdienst: false,
            maxShiftsPerWeek: 5
        };
        
        staticData.users.push(newUser);
        
        // Clear form
        document.getElementById('newUserName').value = '';
        if (document.getElementById('newUserRole')) {
            document.getElementById('newUserRole').value = 'Freiwillige';
        }
        if (document.getElementById('newUserEmail')) {
            document.getElementById('newUserEmail').value = '';
        }
        if (document.getElementById('newUserPassword')) {
            document.getElementById('newUserPassword').value = '';
        }
        if (document.getElementById('newUserPasswordConfirm')) {
            document.getElementById('newUserPasswordConfirm').value = '';
        }
        
        // Hide Backoffice fields
        if (document.getElementById('backofficeFields')) {
            document.getElementById('backofficeFields').style.display = 'none';
        }
        
        // Update UI
        updateUserTable();
        populateUserDropdowns();
        
        NotificationSystem.success(`Benutzer "${name}" erfolgreich hinzugefügt.`);
        
        return newUser;
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Benutzers:', error);
        NotificationSystem.error(`Fehler beim Hinzufügen des Benutzers: ${error.message}`);
        throw error;
    }
}

// Function to delete a user (after confirmation)
async function performUserDeletion(userId) {
    try {
        console.log(`Benutzer mit ID löschen: ${userId}`);
        
        // First, call the API to delete the user from the database
        const response = await AuthManager.fetchWithAuth(`api/users.php?id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Check if the API call was successful
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Fehler beim Löschen des Benutzers (${response.status})`);
        }
        
        console.log(`API-Löschung erfolgreich für Benutzer ${userId}`);
        
        // Find user index in local data
        const userIndex = staticData.users.findIndex(u => u.id === userId);
        if (userIndex === -1) return;
        
        // Get the row for animation
        const row = document.querySelector(`#userTableBody tr:nth-child(${userIndex + 1})`);
        if (row) {
            // Fade out animation
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }
        
        // Remove user from local data after animation
        setTimeout(() => {
            // Remove user from data
            staticData.users.splice(userIndex, 1);
            
            // Remove user from any shifts
            Object.keys(staticData.schedules).forEach(year => {
                Object.keys(staticData.schedules[year]).forEach(month => {
                    Object.keys(staticData.schedules[year][month]).forEach(day => {
                        const dayData = staticData.schedules[year][month][day];
                        if (dayData.E1) {
                            dayData.E1 = dayData.E1.map(id => id === userId ? "" : id);
                        }
                        if (dayData.E2) {
                            dayData.E2 = dayData.E2.map(id => id === userId ? "" : id);
                        }
                    });
                });
            });
            
            // Update UI
            updateUserTable();
            populateUserDropdowns();
            updateCalendar();
            
            // Reset selection if the deleted user was selected
            if (selectedUserId === userId) {
                selectedUserId = null;
                updateUserList();
                updateCalendarHighlights();
            }
        }, 300);
        
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        NotificationSystem.error(`Fehler beim Löschen des Benutzers: ${error.message}`);
    }
}

// Function to update user flags
async function updateUserProperty(userId, property, value) {
    try {
        console.log(`Benutzer ${userId} aktualisieren, setze ${property} auf ${value}`);
        
        // Convert JavaScript camelCase to API snake_case for property names
        const apiPropertyMap = {
            'isStarter': 'is_starter',
            'isSchreibdienst': 'is_schreibdienst',
            'role': 'role',
            'active': 'active'
        };
        
        // Create the update payload
        const updateData = {};
        const apiProperty = apiPropertyMap[property] || property;
        updateData[apiProperty] = value;
        
        console.log('API-Update-Payload:', updateData);
        
        // Check if we're authenticated
        if (!AuthManager.isAuthenticated()) {
            throw new Error('Authentifizierung erforderlich');
        }
        
        // Get the auth token
        const token = AuthManager.getToken();
        
        // Send API request to update user - using regular fetch with Authorization header
        const response = await fetch(`api/users.php?id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('API-Antwort-Status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Aktualisieren des Benutzers');
        }
        
        // Update local data
        const userIndex = staticData.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            // Convert to boolean for flag properties
            if (property === 'isStarter' || property === 'isSchreibdienst') {
                staticData.users[userIndex][property] = value === true || value === 'true' || value === 1;
            } else {
                staticData.users[userIndex][property] = value;
            }
            
            console.log(`Lokale Daten für Benutzer ${userId} aktualisiert:`, staticData.users[userIndex]);
            
            // If this is a flag change that affects colors, update all day cards
            if (property === 'isStarter' || property === 'isSchreibdienst') {
                console.log(`Flag ${property} auf ${staticData.users[userIndex][property]} geändert, alle Tageskarten werden aktualisiert...`);
                
                // Force immediate refresh of all day cards
                refreshAllDayCards();
                
                // Also refresh after a small delay to ensure rendering
                setTimeout(() => {
                    refreshAllDayCards();
                    
                    // Force browser to recalculate layout
                    const calendar = document.getElementById('calendar');
                    if (calendar) {
                        // Trigger a repaint by briefly hiding and showing calendar
                        calendar.style.opacity = '0.99';
                        setTimeout(() => {
                            calendar.style.opacity = '1';
                        }, 0);
                    }
                }, 50);
            }
            
            // Update UI to reflect changes
            updateUserTable();
            updateUserList();
        }
        
        return true;
    } catch (error) {
        console.error(`Fehler beim Aktualisieren von Benutzer ${property}:`, error);
        NotificationSystem.error(`Fehler beim Aktualisieren des Benutzers: ${error.message}`);
        return false;
    }
}

// Helper function to refresh all day cards
function refreshAllDayCards() {
    const calendar = document.getElementById('calendar');
    if (calendar) {
        const dayCards = Array.from(calendar.getElementsByClassName('day-card'));
        
        dayCards.forEach(card => {
            const day = parseInt(card.dataset.day);
            if (!isNaN(day)) {
                updateDayCard(day);
                
                // Force reflow/repaint by briefly modifying a dimension
                // This triggers the browser to perform a visual update
                const shiftLeft = card.querySelector('.shift-left');
                const shiftRight = card.querySelector('.shift-right');
                
                if (shiftLeft) {
                    // Force a reflow by reading offsetHeight
                    const height = shiftLeft.offsetHeight;
                    shiftLeft.style.opacity = "0.99";
                    setTimeout(() => {
                        shiftLeft.style.opacity = "1";
                    }, 0);
                }
                
                if (shiftRight) {
                    // Force a reflow by reading offsetHeight
                    const height = shiftRight.offsetHeight;
                    shiftRight.style.opacity = "0.99";
                    setTimeout(() => {
                        shiftRight.style.opacity = "1";
                    }, 0);
                }
            }
        });
        
        console.log(`Alle Tageskarten aktualisiert mit erzwungenem Neuzeichnen`);
    }
}








// Update user starter flag (using the general function)
async function updateUserStarter(userId, isStarter) {
    // Convert checkbox boolean to integer for API if needed
    const value = typeof isStarter === 'boolean' ? isStarter : !!isStarter;
    await updateUserProperty(userId, 'isStarter', value);
}

// Update user schreibdienst flag (using the general function)
async function updateUserSchreibdienst(userId, isSchreibdienst) {
    // Convert checkbox boolean to integer for API if needed
    const value = typeof isSchreibdienst === 'boolean' ? isSchreibdienst : !!isSchreibdienst;
    await updateUserProperty(userId, 'isSchreibdienst', value);
}

// Function to ensure schedule data exists for a day
async function ensureScheduleDataExists(day) {
    if (!staticData.schedules[currentYear]) {
        staticData.schedules[currentYear] = {};
    }
    if (!staticData.schedules[currentYear][currentMonth]) {
        staticData.schedules[currentYear][currentMonth] = {};
    }
    if (!staticData.schedules[currentYear][currentMonth][day]) {
        // If the day doesn't exist, initialize it with empty data
        staticData.schedules[currentYear][currentMonth][day] = {
            E1: ["", ""],
            E2: ["", ""],
            notes: {
                E1: ["", ""],
                E2: ["", ""]
            }
        };
        
        // We don't need to create this in the database until actual changes are made
    }
    
    // Ensure arrays exist and have correct length
    const dayData = staticData.schedules[currentYear][currentMonth][day];
    if (!Array.isArray(dayData.E1)) dayData.E1 = ["", ""];
    if (!Array.isArray(dayData.E2)) dayData.E2 = ["", ""];
    if (dayData.E1.length !== 2) dayData.E1 = dayData.E1.concat("").slice(0, 2);
    if (dayData.E2.length !== 2) dayData.E2 = dayData.E2.concat("").slice(0, 2);
    
    // Ensure notes exist
    if (!dayData.notes) {
        dayData.notes = {
            E1: ["", ""],
            E2: ["", ""]
        };
    }
}

// Update shift when user selection changes
async function updateShift(day, shift, position, userId, note) {
    try {
        console.log(`Updating shift: day=${day}, shift=${shift}, position=${position}, userId=${userId}`);
        
        // Format the date to YYYY-MM-DD
        const date = new Date(Date.UTC(currentYear, currentMonth - 1, day, 12, 0, 0));
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Prepare data for API
        const shiftData = {
            date: formattedDate,
            shift_type: shift,
            position: position + 1, // Convert 0-based to 1-based
            user_id: userId,
            note: note || ''
        };
        
        // Get auth token
        const token = AuthManager.getToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Use fetch with explicit Authorization header
        const response = await fetch('api/shifts.php', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(shiftData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update shift');
        }
        
        // Update local data
        ensureScheduleDataExists(day);
        staticData.schedules[currentYear][currentMonth][day][shift][position] = userId;
        if (typeof note !== 'undefined') {
            staticData.schedules[currentYear][currentMonth][day].notes[shift][position] = note;
        }
        
        // Update UI with correct colors handling flagged users
        updateDayCard(day);
        
        console.log(`Updated shift ${shift} position ${position+1} for ${formattedDate} to user ${userId}`);
    } catch (error) {
        console.error('Error updating shift:', error);
        // Show error to user
        NotificationSystem.error(`Failed to update shift: ${error.message}`);
    }
}

// Update shift detail modal event listeners
function setupShiftDetailModal() {
    const modal = document.getElementById('shiftDetailModal');
    const overlay = document.getElementById('shiftModalOverlay');
    
    // Close button handler
    modal.querySelector('.shift-detail-close').addEventListener('click', hideShiftDetailModal);
    
    // Overlay click handler
    overlay.addEventListener('click', hideShiftDetailModal);
    
    // Prevent modal close when clicking inside
    modal.addEventListener('click', (e) => e.stopPropagation());
    
    // User selection change handler
    modal.querySelectorAll('.user-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;
            
            ensureScheduleDataExists(currentDay);
            
            // Get the old value and new value
            const oldValue = staticData.schedules[currentYear][currentMonth][currentDay][shift][position];
            const newValue = e.target.value;
            
            // Only update if there's an actual change
            if (oldValue !== newValue) {
                // Get the note for this position
                const note = staticData.schedules[currentYear][currentMonth][currentDay].notes[shift][position];
                
                // Update the shift with the API
                updateShift(currentDay, shift, position, newValue, note);
            }
        });
    });
    
    // Note input change handler
    modal.querySelectorAll('.shift-note-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;
            
            ensureScheduleDataExists(currentDay);
            
            // Get the old value and new value
            const oldValue = staticData.schedules[currentYear][currentMonth][currentDay].notes[shift][position];
            const newValue = e.target.value;
            
            // Only update if there's an actual change
            if (oldValue !== newValue) {
                // Get the user ID for this position
                const userId = staticData.schedules[currentYear][currentMonth][currentDay][shift][position];
                
                // Update the shift with the API
                updateShift(currentDay, shift, position, userId, newValue);
            }
        });
    });
    
    // Add other modal setup code (already in your original function)...
}

// Load calendar data when year/month changes
// Update the updateCalendar function with null checks
async function updateCalendar() {
    // Get the calendar element
    const calendar = document.getElementById('calendar');
    
    // Check if calendar element exists
    if (!calendar) {
        console.error('Calendar element not found. Make sure there is an element with id="calendar" in your HTML.');
        return; // Exit function early
    }
    
    // Show loading indicator
    calendar.innerHTML = '<div class="loading-indicator">Loading calendar data...</div>';
    
    // Get month title element
    const monthTitle = document.getElementById('monthTitle');

    await checkCalendarState();
    
    // Update month title if element exists
    if (monthTitle) {
        monthTitle.textContent = GermanDateFormatter.formatMonthYear(new Date(currentYear, currentMonth - 1, 1));
    }
    
    try {
        // Load data for the selected month
        await loadScheduleData(currentYear, currentMonth);
        
        // Also load Schreibdienst events if that module is active
        if (typeof SchreibdienstFeature !== 'undefined' && typeof SchreibdienstFeature.loadEvents === 'function') {
            await SchreibdienstFeature.loadEvents(currentYear, currentMonth);
        }
        
        // Also load holiday data if that module is active
        if (typeof HolidayFeature !== 'undefined' && typeof HolidayFeature.loadHolidays === 'function') {
            await HolidayFeature.loadHolidays();
        }

        // Add this line after loading holiday data:
        if (typeof CustomEventsFeature !== 'undefined' && typeof CustomEventsFeature.loadCustomEvents === 'function') {
            console.log("Loading custom events during calendar update");
            await CustomEventsFeature.loadCustomEvents();
            
            // After loading, make sure indicators are updated
            if (typeof CustomEventsFeature.updateCustomEventIndicators === 'function') {
                CustomEventsFeature.updateCustomEventIndicators();
            }
        }
        
        // Now render the calendar with the loaded data
        renderCalendar();
    } catch (error) {
        console.error('Error updating calendar:', error);
        if (calendar) {
            calendar.innerHTML = '<div class="error-message">Failed to load calendar data. Please try again.</div>';
        }
    }
}

// Also update renderCalendar to include null checks
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error('Calendar element not found in renderCalendar');
        return;
    }
    
    calendar.innerHTML = '';
    
    const monthTitle = document.getElementById('monthTitle');
    if (monthTitle) {
        monthTitle.textContent = GermanDateFormatter.formatMonthYear(new Date(currentYear, currentMonth - 1, 1));
    }
    
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    const dayNumber = document.getElementById('dayNumber');
    const dayName = document.getElementById('dayName');

    // Show current day if we're viewing the current month/year
    if (dayNumber && dayName) {
        if (todayMonth === currentMonth && todayYear === currentYear) {
            dayNumber.textContent = todayDate;
            dayName.textContent = getDayName(currentYear, currentMonth, todayDate);
        } else {
            dayNumber.textContent = '1';
            dayName.textContent = getDayName(currentYear, currentMonth, 1);
        }
    }

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    // Find first visible day (first non-weekend day)
    const firstVisibleDay = getFirstVisibleDay(currentYear, currentMonth);
    
    // Get weekday of first visible day (1 = Monday, 2 = Tuesday, ..., 5 = Friday)
    const firstVisibleDayWeekday = new Date(currentYear, currentMonth - 1, firstVisibleDay).getDay();
    
    // Calculate empty cells needed (weekday position - 1)
    // Convert Sunday (0) to 5 and Saturday (6) to 4 if needed
    let weekdayPosition = firstVisibleDayWeekday;
    if (weekdayPosition === 0) weekdayPosition = 5;      // Sunday -> Friday
    if (weekdayPosition === 6) weekdayPosition = 4;      // Saturday -> Thursday
    
    const emptyCount = weekdayPosition - 1;
    
    // Add empty cells
    for (let i = 0; i < emptyCount; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'empty-day';
        calendar.appendChild(emptyDay);
    }

    // Create day cards (skipping weekends)
    for (let day = 1; day <= daysInMonth; day++) {
        if (!isWeekend(currentYear, currentMonth, day)) {
            const dayCard = createDayCard(day);
            calendar.appendChild(dayCard);
            ensureScheduleDataExists(day);
            updateDayCard(day);
        }
    }

    updateUserList();
    updateCalendarHighlights();
    highlightCurrentDay();
    
    // Update URL to match current view
    updateUrlParams();
}

// Separate function for rendering calendar (extracted from your original updateCalendar function)
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    
    if (!calendar) {
        console.error('Calendar element not found in renderCalendar');
        return;
    }
    
    calendar.innerHTML = '';
    
    const monthTitle = document.getElementById('monthTitle');
    if (monthTitle) {
        // Force correct month title format here
        monthTitle.textContent = GermanDateFormatter.formatMonthYear(new Date(currentYear, currentMonth - 1, 1));
        console.log('Month title set correctly to:', monthTitle.textContent);
    }

    calendar.innerHTML = '';
    
    monthTitle.textContent = GermanDateFormatter.formatMonthYear(new Date(currentYear, currentMonth - 1, 1));
    monthTitle.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
    
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    const dayNumber = document.getElementById('dayNumber');
    const dayName = document.getElementById('dayName');

    // Show current day if we're viewing the current month/year
    if (dayNumber && dayName) {
        if (todayMonth === currentMonth && todayYear === currentYear) {
            dayNumber.textContent = todayDate;
            dayName.textContent = getDayName(currentYear, currentMonth, todayDate);
        } else {
            dayNumber.textContent = '1';
            dayName.textContent = getDayName(currentYear, currentMonth, 1);
        }
    }

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    // Find first visible day (first non-weekend day)
    const firstVisibleDay = getFirstVisibleDay(currentYear, currentMonth);
    
    // Get weekday of first visible day (1 = Monday, 2 = Tuesday, ..., 5 = Friday)
    const firstVisibleDayWeekday = new Date(currentYear, currentMonth - 1, firstVisibleDay).getDay();
    
    // Calculate empty cells needed (weekday position - 1)
    // Convert Sunday (0) to 5 and Saturday (6) to 4 if needed
    let weekdayPosition = firstVisibleDayWeekday;
    if (weekdayPosition === 0) weekdayPosition = 5;      // Sunday -> Friday
    if (weekdayPosition === 6) weekdayPosition = 4;      // Saturday -> Thursday
    
    const emptyCount = weekdayPosition - 1;
    
    // Add empty cells
    for (let i = 0; i < emptyCount; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'empty-day';
        calendar.appendChild(emptyDay);
    }

    // Create day cards (skipping weekends)
    for (let day = 1; day <= daysInMonth; day++) {
        if (!isWeekend(currentYear, currentMonth, day)) {
            const dayCard = createDayCard(day);
            calendar.appendChild(dayCard);
            ensureScheduleDataExists(day);
            updateDayCard(day);
        }
    }

    updateUserList();
    updateCalendarHighlights();
    highlightCurrentDay();
    
    // Update URL to match current view
    updateUrlParams();
}

// Initialize application with API data
async function initializeApp() {
    // Initialize notification system
    NotificationSystem.init();
    
    // Initialize data from API FIRST
    try {
        await initializeData();  // Load critical data first
        
        // THEN set up UI elements that depend on the data
        initializeYearSelector();
        initializeMonthSelector();
        
        // Set the selectors to match the parameters
        const params = getUrlParams();
        if (params.year) {
            currentYear = params.year;
            document.getElementById('yearSelect').value = params.year;
        }
        if (params.month) {
            currentMonth = params.month;
            document.getElementById('monthSelect').value = params.month;
        }
        
        // Set up UI and event handlers
        setupUI();
        
        // THEN update the calendar
        await updateCalendar();
        
        // Initialize color customization LAST, so it doesn't block anything else
        if (typeof ColorCustomization !== 'undefined') {
            ColorCustomization.init();  // Don't await this
        }
        
        // Continue with other UI setup
        addFreezeButton();
        setupEventListeners();
        setupMobileMenu();
        updateUserList();
        initializeDeleteConfirmation();
        updateCurrentDayDisplay();
        setupCalendarHoverListener();
        initializeUserForm();
        
        
        // Initialize modules if they exist
        if (typeof HolidayFeature !== 'undefined') {
            await HolidayFeature.init();
        }
        
        if (typeof SchreibdienstFeature !== 'undefined') {
            await SchreibdienstFeature.init();
        }

        // Initialize custom events feature if it exists
        if (typeof CustomEventsFeature !== 'undefined') {
            await CustomEventsFeature.init();
        }
        
        // Initialize official holidays feature if it exists
        if (typeof OfficialHolidaysFeature !== 'undefined') {
            await OfficialHolidaysFeature.init();
        }
        
        // Update URL to match current view
        updateUrlParams();
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error message to user
        document.body.innerHTML = `
            <div class="error-container">
                <h2>Error Loading Application</h2>
                <p>There was a problem connecting to the server. Please try again later.</p>
                <p class="error-details">${error.message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Global variable to track calendar frozen state
let isCalendarFrozen = false;
let frozenBy = null;
let frozenAt = null;

// Function to check and update calendar state
async function checkCalendarState() {
    try {
        // Use a more robust fetch with proper error handling
        const response = await fetch(`api/calendar_state.php?year=${currentYear}&month=${currentMonth}`);
        
        if (!response.ok) {
            console.warn(`Calendar state check failed: ${response.status}. Using default state.`);
            // Set default state (not frozen) and continue
            isCalendarFrozen = false;
            frozenBy = null;
            frozenAt = null;
            updateFrozenStateUI();
            return;
        }
        
        const state = await response.json();
        isCalendarFrozen = state.is_frozen;
        frozenBy = state.frozen_by;
        frozenAt = state.frozen_at;
        
        // Update UI to reflect frozen state
        updateFrozenStateUI();
        
    } catch (error) {
        console.error('Error checking calendar state:', error);
        // Set default state and continue
        isCalendarFrozen = false;
        frozenBy = null;
        frozenAt = null;
        updateFrozenStateUI();
    }
}

// Function to toggle calendar frozen state
async function toggleCalendarFrozen() {
    try {
        // Check if user is authenticated and has backoffice role
        const currentUser = AuthManager.getCurrentUser();
        if (!currentUser || currentUser.role !== 'Backoffice') {
            NotificationSystem.warning('Only backoffice users can freeze or unfreeze the calendar.');
            return;
        }
        
        // Toggle the frozen state
        const newState = !isCalendarFrozen;
        
        const response = await fetch('api/calendar_state.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthManager.getToken()}`
            },
            body: JSON.stringify({
                year: currentYear,
                month: currentMonth,
                is_frozen: newState
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update calendar state');
        }
        
        const state = await response.json();
        isCalendarFrozen = state.is_frozen;
        frozenBy = state.frozen_by;
        frozenAt = state.frozen_at;
        
        // Update UI to reflect the new state
        updateFrozenStateUI();
        
        // Show a message to confirm the action
        const message = isCalendarFrozen 
            ? `Calendar for ${getMonthName(currentMonth)} ${currentYear} has been frozen.`
            : `Calendar for ${getMonthName(currentMonth)} ${currentYear} has been unfrozen.`;
        
        if (isCalendarFrozen) {
            NotificationSystem.info(message, 'Calendar Frozen');
        } else {
            NotificationSystem.success(message, 'Calendar Unlocked');
        }
        
    } catch (error) {
        console.error('Error toggling calendar state:', error);
        NotificationSystem.error(`Failed to update calendar state: ${error.message}`);
    }
}

// Function to update UI based on frozen state
function updateFrozenStateUI() {
    try {
        // Get container elements
        const calendar = document.getElementById('calendar');
        const mainContent = document.querySelector('.main-content');
        const topNavbar = document.querySelector('.top-navbar');
        
        if (!calendar || !mainContent) {
            console.error('Calendar elements not found');
            return;
        }
        
        // Check if freeze status banner exists, create if needed
        let freezeBanner = document.getElementById('freeze-banner');
        if (!freezeBanner) {
            freezeBanner = document.createElement('div');
            freezeBanner.id = 'freeze-banner';
            freezeBanner.className = 'freeze-banner';
            
            // Create a container for the banner that will be positioned properly
            const bannerContainer = document.createElement('div');
            bannerContainer.className = 'freeze-banner-container';
            bannerContainer.appendChild(freezeBanner);
            
            // Insert the banner container after the top navbar
            if (topNavbar && topNavbar.parentNode) {
                topNavbar.parentNode.insertBefore(bannerContainer, topNavbar.nextSibling);
            } else {
                // Fallback: Insert at the top of main-content if navbar not found
                mainContent.insertBefore(bannerContainer, mainContent.firstChild);
            }
        
        }
        
        // Update UI based on frozen state
        if (isCalendarFrozen) {
            // Update body class for frozen state
            document.body.classList.add('frozen-state');
            
            // Add indicator to navbar if it exists
            if (topNavbar) {
                topNavbar.classList.add('frozen-indicator');
            }
            
            // Show freeze banner with message
            freezeBanner.style.display = 'block';
            freezeBanner.innerHTML = `<span>Einsatzplan ${getMonthName(currentMonth)} ${currentYear} gesperrt</span>`;
            
            // Add frozen class to calendar
            calendar.classList.add('calendar-frozen');
            
            // Set page title to include frozen indicator
            document.title = `🔒 ${getMonthName(currentMonth)} ${currentYear} - Calendar Scheduler`;
            
            // Disable shift assignment dropdowns for non-backoffice users
            if (!isBackofficeUser()) {
                const dayCards = calendar.querySelectorAll('.day-card');
                dayCards.forEach(card => {
                    card.classList.add('frozen');
                });
            }
        } else {
            // Remove frozen state from body
            document.body.classList.remove('frozen-state');
            
            // Remove indicator from navbar
            if (topNavbar) {
                topNavbar.classList.remove('frozen-indicator');
            }
            
            // Hide freeze banner
            freezeBanner.style.display = 'none';
            
            // Remove frozen class from calendar
            calendar.classList.remove('calendar-frozen');
            
            // Reset page title
            document.title = `Calendar Scheduler - ${getMonthName(currentMonth)} ${currentYear}`;
            
            // Enable all shift assignment dropdowns
            const dayCards = calendar.querySelectorAll('.day-card');
            dayCards.forEach(card => {
                card.classList.remove('frozen');
            });
        }
        
        // Update freeze toggle button if it exists
        updateFreezeButton();
    } catch (error) {
        console.error('Error updating frozen state UI:', error);
    }
}

// Check if current user is a backoffice user
function isBackofficeUser() {
    try {
        const currentUser = AuthManager.getCurrentUser();
        return currentUser && currentUser.role === 'Backoffice';
    } catch (error) {
        console.error('Error checking backoffice status:', error);
        return false;
    }
}

// Function to add freeze toggle button to controls
function addFreezeButton() {
    // Only add the button for backoffice users
    if (!isBackofficeUser()) {
        return;
    }
    
    // Check if button already exists
    if (document.getElementById('freezeToggleBtn')) {
        return;
    }
    
    // Get the navbar controls container
    const navbarControls = document.querySelector('.navbar-controls');
    if (!navbarControls) {
        console.error('Navbar controls not found');
        return;
    }
    
    // Create freeze toggle button - ONLY the icon, no text span
    const freezeBtn = document.createElement('button');
    freezeBtn.id = 'freezeToggleBtn';
    freezeBtn.className = 'button-freeze'; 
    // Only include the icon span, no button-text span
    freezeBtn.innerHTML = '<span class="button-icon">🔓</span>';
    freezeBtn.addEventListener('click', toggleCalendarFrozen);
    
    // Add to navbar
    navbarControls.appendChild(freezeBtn);
    
    // Update button state
    updateFreezeButton();
}

// Update freeze button appearance - only change the icon, no text
function updateFreezeButton() {
    const freezeBtn = document.getElementById('freezeToggleBtn');
    if (!freezeBtn) return;
    
    // Add brief animation when state changes
    freezeBtn.classList.add('state-changing');
    setTimeout(() => {
        freezeBtn.classList.remove('state-changing');
    }, 500);
    
    if (isCalendarFrozen) {
        // Frozen state - ONLY the icon, no text
        freezeBtn.innerHTML = '<span class="button-icon">🔒</span>';
        freezeBtn.classList.add('frozen');
    } else {
        // Unfrozen state - ONLY the icon, no text
        freezeBtn.innerHTML = '<span class="button-icon">🔓</span>';
        freezeBtn.classList.remove('frozen');
    }
}

// Update freeze button text and appearance
function updateFreezeButton() {
    const freezeBtn = document.getElementById('freezeToggleBtn');
    if (!freezeBtn) return;
    
    // Add brief animation when state changes
    freezeBtn.classList.add('state-changing');
    setTimeout(() => {
        freezeBtn.classList.remove('state-changing');
    }, 500);
    
    if (isCalendarFrozen) {
        freezeBtn.innerHTML = '<span class="button-icon">🔒</span>'; // Closed lock
        freezeBtn.classList.add('frozen');
        freezeBtn.setAttribute('title', 'Unfreeze Month');
    } else {
        freezeBtn.innerHTML = '<span class="button-icon">🔓</span>'; // Open lock
        freezeBtn.classList.remove('frozen');
        freezeBtn.setAttribute('title', 'Freeze Month');
    }
}

// Function to export calendar to iCal
function exportToIcal(userId = null) {
    let url = `einsatzplan/api/ical.php?year=${currentYear}&month=${currentMonth}`;
    
    // Add user ID if specified
    if (userId) {
        url += `&user_id=${userId}`;
    }
    
    // Open the URL in a new tab
    window.open(url, '_blank');
}

// Function to generate an iCal feed URL
function getIcalFeedUrl(userId = null) {
    let url = `${window.location.origin}/einsatzplan/api/ical.php?year=${currentYear}&month=${currentMonth}&feed=true`;
    
    // Add user ID if specified
    if (userId) {
        url += `&user_id=${userId}`;
    }
    
    return url;
}

// Function to show export options modal
function showExportModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('exportModal')) {
        const modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="export-modal-content">
                <div class="export-modal-header">
                    <h2>Kalender exportieren</h2>
                    <button class="export-modal-close">&times;</button>
                </div>
                <div class="export-modal-body">
                    <div class="export-option">
                        <h3>Kalender exportieren</h3>
                        <p>Importiere den Einsatzplan in deinen Kalender auf dein Gerät. Du kannst entweder alle Einsätze importieren. Oder nur deine Einsätze. Klicke für Letzteres zuerst auf deinen Benutzer in der Benutzerliste um deine Einsätze anzuwählen. Ein Klick auf die heruntergeladene iCal-Datei öffnet die Einsätze in deinem Kalender.</p>
                        <div class="export-actions">
                            <button id="exportAllBtn" class="button">Alle Einsätze</button>
                            <button id="exportSelectedUserBtn" class="button">Nur deine Einsätze</button>
                        </div>
                    </div>
                    
                    <div class="export-option">
                        <h3>Kalender abonnieren</h3>
                        <p>Verwende diese Links, um den Einsatzplan in deiner Kalender-App zu abonnieren.</p>
                        <div class="feed-url-container">
                            <label>URL für alle Termine:</label>
                            <input type="text" id="allFeedUrl" readonly>
                            <button id="copyAllFeedBtn" class="button-secondary">Kopieren</button>
                        </div>
                        <div class="feed-url-container">
                            <label>URL für ausgewählten Benutzer:</label>
                            <input type="text" id="userFeedUrl" readonly>
                            <button id="copyUserFeedBtn" class="button-secondary">Kopieren</button>
                        </div>
                    </div>
                    
                    <div class="feed-instructions">
                        <h4>Wie abonnieren?</h4>
                        <p>Kopierte URL in deine Kalender-App eintragen:</p>
                        <ul>
                            <li><strong>Apple Kalender:</strong> Datei > Neues Kalenderabonnement</li>
                            <li><strong>Google Kalender:</strong> Einstellungen > Kalender hinzufügen > Per URL</li>
                            <li><strong>Outlook:</strong> Kalender hinzufügen > Aus dem Web abonnieren</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.export-modal-close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Export all events button
        const exportAllBtn = document.getElementById('exportAllBtn');
        exportAllBtn.addEventListener('click', () => {
            exportToIcal();
            modal.style.display = 'none';
        });
        
        // Export selected user events button
        const exportSelectedUserBtn = document.getElementById('exportSelectedUserBtn');
        exportSelectedUserBtn.addEventListener('click', () => {
            if (selectedUserId) {
                exportToIcal(selectedUserId);
                modal.style.display = 'none';
            } else {
                NotificationSystem.warning('Bitte wähle zuerst einen Benutzer aus der Liste aus.');
            }
        });
        
        // Copy feed URL buttons
        const copyAllFeedBtn = document.getElementById('copyAllFeedBtn');
        copyAllFeedBtn.addEventListener('click', () => {
            const allFeedUrl = document.getElementById('allFeedUrl');
            allFeedUrl.select();
            document.execCommand('copy');
            copyAllFeedBtn.textContent = 'Kopiert!';
            setTimeout(() => {
                copyAllFeedBtn.textContent = 'Kopieren';
            }, 2000);
        });
        
        const copyUserFeedBtn = document.getElementById('copyUserFeedBtn');
        copyUserFeedBtn.addEventListener('click', () => {
            const userFeedUrl = document.getElementById('userFeedUrl');
            userFeedUrl.select();
            document.execCommand('copy');
            copyUserFeedBtn.textContent = 'Kopiert!';
            setTimeout(() => {
                copyUserFeedBtn.textContent = 'Kopieren';
            }, 2000);
        });
    }
    
    // Update feed URLs
    const allFeedUrl = document.getElementById('allFeedUrl');
    allFeedUrl.value = getIcalFeedUrl();
    
    const userFeedUrl = document.getElementById('userFeedUrl');
    const exportSelectedUserBtn = document.getElementById('exportSelectedUserBtn');
    
    // Check if a user is selected in the user list
    if (selectedUserId) {
        const selectedUser = staticData.users.find(user => user.id === selectedUserId);
        const userName = selectedUser ? selectedUser.name : 'Ausgewählter Benutzer';
        
        exportSelectedUserBtn.textContent = `Termine von ${userName} importieren`;
        exportSelectedUserBtn.disabled = false;
        
        userFeedUrl.value = getIcalFeedUrl(selectedUserId);
        document.getElementById('copyUserFeedBtn').disabled = false;
        userFeedUrl.disabled = false;
    } else {
        // No user selected
        exportSelectedUserBtn.textContent = 'Zuerst Benutzer anwählen';
        exportSelectedUserBtn.disabled = true;
        
        userFeedUrl.value = 'Bitte wählen Sie zuerst einen Benutzer aus der Liste';
        document.getElementById('copyUserFeedBtn').disabled = true;
        userFeedUrl.disabled = true;
    }
    
    // Show the modal
    document.getElementById('exportModal').style.display = 'block';
}


// Function to populate user dropdowns in the shift detail modal
function populateUserDropdowns() {
    document.querySelectorAll('.user-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select user</option>';
        
        // Sort users alphabetically by name
        const sortedUsers = [...staticData.users].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        sortedUsers.forEach(user => {
            if (!user.active) return;
            
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            
            // Mark Starter users
            if (user.isStarter) {
                option.textContent += ' (Starter)';
            }
            
            // Mark Schreibdienst users
            if (user.isSchreibdienst) {
                option.textContent += ' (Schreibdienst)';
            }
            
            if (currentValue === user.id) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
    });
}

// Set up event listeners for controls and modals
function setupEventListeners() {
    // Year selection
    document.getElementById('yearSelect').addEventListener('change', async (e) => {
        currentYear = parseInt(e.target.value);
        await updateCalendar();
        updateUrlParams();
    });

    // Month selection
    document.getElementById('monthSelect').addEventListener('change', async (e) => {
        currentMonth = parseInt(e.target.value);
        await updateCalendar();
        updateUrlParams();
    });

    // Export Modal
    document.getElementById('exportCalendar').addEventListener('click', showExportModal);
    
    // User management modal
    document.getElementById('manageUsers').addEventListener('click', () => {
        document.getElementById('userModal').style.display = 'block';
        updateUserTable();
        
        // Initialize form AFTER the modal is displayed
        setTimeout(() => initializeUserForm(), 100);
    });

    // Mobile version if it exists
    if (document.getElementById('mobileManageUsers')) {
        document.getElementById('mobileManageUsers').addEventListener('click', () => {
            document.getElementById('userModal').style.display = 'block';
            updateUserTable();
            
            // Initialize form AFTER the modal is displayed
            setTimeout(() => initializeUserForm(), 100);
        });
    }

    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('userModal').style.display = 'none';
    });

    // Add user button (handled in initializeUserForm function)

    // Add mobile color customize button handler
    const mobileColorCustomizeBtn = document.getElementById('mobileColorCustomizeBtn');
    if (mobileColorCustomizeBtn) {
        mobileColorCustomizeBtn.addEventListener('click', function() {
            // Close the sidebar first
            const userListPanel = document.querySelector('.user-list-panel');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            if (userListPanel) userListPanel.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
             
            // Then show the color customization modal
            if (ColorCustomization && typeof ColorCustomization.showColorCustomizationModal === 'function') {
                ColorCustomization.showColorCustomizationModal();
            }
        });
    }

    // Add new user with Enter key (handled in initializeUserForm function)

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('userModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const userModal = document.getElementById('userModal');
            if (userModal.style.display === 'block') {
                userModal.style.display = 'none';
            }
            
            const shiftModal = document.getElementById('shiftDetailModal');
            if (shiftModal.classList.contains('active')) {
                hideShiftDetailModal();
            }
        }
    });
    
    // Setup shift detail modal
    setupShiftDetailModal();

    window.addEventListener('resize', () => {
        setupUI(); // Reconfigure UI based on new window size
      });
}

// Function to position modal in the center of the screen on desktop
function positionModal(modal, targetRect) {
    if (window.innerWidth > 768) {
        // Desktop: center the modal in the viewport
        
        // First ensure modal is visible to get correct dimensions
        modal.style.visibility = 'hidden';
        modal.style.display = 'block';
        
        // Get viewport dimensions
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Get modal dimensions after it's been made visible
        const modalHeight = modal.offsetHeight;
        const modalWidth = modal.offsetWidth;
        
        // Calculate center position
        const top = Math.max(20, (viewportHeight - modalHeight) / 2);
        const left = (viewportWidth - modalWidth) / 2;
        
        // Set fixed position to center the modal
        modal.style.position = 'fixed';
        modal.style.top = `${top}px`;
        modal.style.left = `${left}px`;
        modal.style.transform = 'none'; // Remove any transforms that might interfere
        modal.style.margin = '0'; // Remove margins that might affect centering
        
        // Reset visibility
        modal.style.visibility = 'visible';
        
        // Remove any previous arrow positioning
        modal.classList.remove('arrow-bottom');
        
        // Hide any arrow if it exists
        const arrow = modal.querySelector('.shift-detail-modal-arrow');
        if (arrow) {
            arrow.style.display = 'none';
        }
    } else {
        // Mobile: clear any inline positioning so modal stays fixed as per mobile CSS rules
        modal.style.position = '';
        modal.style.top = '';
        modal.style.left = '';
        modal.style.transform = '';
        modal.style.margin = '';
    }
}

// Function to show the shift detail modal
function showShiftDetailModal(shiftElement, day, shiftType) {
     // Check if this is a frozen month and the user is not backoffice
     if (isCalendarFrozen && !isBackofficeUser()) {
        // For non-backoffice users in frozen months, show a read-only modal
        showReadOnlyShiftModal(shiftElement, day, shiftType);
        return;
    }
    const modal = document.getElementById('shiftDetailModal');
    const overlay = document.getElementById('shiftModalOverlay');
    
    // Store current shift info
    currentShiftElement = shiftElement;
    currentShiftType = shiftType;
    currentDay = day;

    // Clear any previous inline positioning (from desktop mode)
    modal.style.removeProperty('top');
    modal.style.removeProperty('left');
    
    // Load shift data
    ensureScheduleDataExists(day);
    const dayData = staticData.schedules[currentYear][currentMonth][day];

    // Get all Schreibdienst events for this day, separated by shift
    let e1Events = [];
    let e2Events = [];
    
    try {
        // Get all events for this day
        const dayEvents = staticData.schreibdienstEvents?.[currentYear]?.[currentMonth]?.[day] || [];
        
        // Separate events by shift
        e1Events = dayEvents.filter(event => event.shift === 'E1');
        e2Events = dayEvents.filter(event => event.shift === 'E2');
    } catch (error) {
        console.error('Error accessing Schreibdienst events:', error);
    }

    // Update modal title
    const titleElement = modal.querySelector('.shift-detail-title');
    if (titleElement) {
        titleElement.textContent = `${shiftType} - ${GermanDateFormatter.formatMediumDate(new Date(currentYear, currentMonth - 1, day))}`;
    }
    
    // Position the modal
    if (window.innerWidth > 768) {
        const rect = shiftElement.getBoundingClientRect();
        positionModal(modal, rect);
    }
    
    // Update user selects
    const selects = modal.querySelectorAll('.user-select');
    selects.forEach((select, index) => {
        select.innerHTML = '<option value="">Select user</option>';
        staticData.users.forEach(user => {
            if (!user.active) return;
            
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            if (dayData[shiftType][index] === user.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Update data attributes
        select.dataset.shift = shiftType;
        select.dataset.position = index + 1;
    });
    
    // Update notes
    const notes = modal.querySelectorAll('.shift-note-input');
    notes.forEach((input, index) => {
        input.value = dayData.notes?.[shiftType]?.[index] || '';
        input.dataset.shift = shiftType;
        input.dataset.position = index + 1;
    });
    
    // Show modal and overlay
    modal.style.display = 'block';
    overlay.style.display = 'block';
    modal.classList.add('active');
    overlay.classList.add('active');
    
    // Disable background scrolling
    document.body.classList.add('modal-open');
}

// Function to show a read-only shift modal
function showReadOnlyShiftModal(shiftElement, day, shiftType) {
    const modal = document.getElementById('shiftDetailModal');
    const overlay = document.getElementById('shiftModalOverlay');
    
    // Store current shift info
    currentShiftElement = shiftElement;
    currentShiftType = shiftType;
    currentDay = day;

    // Load shift data
    ensureScheduleDataExists(day);
    const dayData = staticData.schedules[currentYear][currentMonth][day];

    // Update modal title with frozen indicator
    const titleElement = modal.querySelector('.shift-detail-title');
    if (titleElement) {
        titleElement.innerHTML = `${shiftType} - ${GermanDateFormatter.formatMediumDate(new Date(currentYear, currentMonth - 1, day))} <span class="frozen-indicator">🔒</span>`;
    }
    
    // Position the modal
    if (window.innerWidth > 768) {
        const rect = shiftElement.getBoundingClientRect();
        positionModal(modal, rect);
    }
    
    // Update user selects - make them disabled
    const selects = modal.querySelectorAll('.user-select');
    selects.forEach((select, index) => {
        select.innerHTML = '<option value="">Select user</option>';
        staticData.users.forEach(user => {
            if (!user.active) return;
            
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            if (dayData[shiftType][index] === user.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Disable the select
        select.disabled = true;
        select.dataset.shift = shiftType;
        select.dataset.position = index + 1;
    });
    
    // Update notes - keep them editable
    const notes = modal.querySelectorAll('.shift-note-input');
    notes.forEach((input, index) => {
        input.value = dayData.notes?.[shiftType]?.[index] || '';
        input.dataset.shift = shiftType;
        input.dataset.position = index + 1;
    });
    
    // Add frozen message to modal
    if (!modal.querySelector('.frozen-message')) {
        const frozenMsg = document.createElement('div');
        frozenMsg.className = 'frozen-message';
        frozenMsg.innerHTML = 'This month is frozen. Shift assignments cannot be changed.';
        modal.querySelector('.shift-detail-header').after(frozenMsg);
    } else {
        modal.querySelector('.frozen-message').style.display = 'block';
    }
    
    // Show modal and overlay
    modal.classList.add('active');
    modal.classList.add('frozen-modal');
    overlay.classList.add('active');
    
    // Disable background scrolling
    document.body.classList.add('modal-open');
}

// Function to setup the mobile menu behavior
function setupMobileMenu() {
    // Get all required elements
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const closeSidebarButton = document.getElementById('closeSidebar');
    const userListPanel = document.querySelector('.user-list-panel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Mobile menu specific buttons
    const mobileManageUsersButton = document.getElementById('mobileManageUsers');
    const mobileExportCalendarButton = document.getElementById('mobileExportCalendar');
    const mobileAuthButton = document.getElementById('mobileAuthButton');
    const mobileUserInfo = document.getElementById('mobileUserInfo');
  
    // Check if essential elements exist
    if (!mobileMenuButton || !userListPanel || !sidebarOverlay) {
      console.error('Mobile menu elements not found');
      return;
    }
  
    function openSidebar() {
      if (window.innerWidth <= 768) {
        userListPanel.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Update mobile menu user info and auth button based on auth state
        updateMobileMenuAuth();
      }
    }
  
    function closeSidebar() {
      userListPanel.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Function to update auth info in mobile menu
    function updateMobileMenuAuth() {
      // Get authentication status
      const isAuthenticated = AuthManager.isAuthenticated();
      const currentUser = AuthManager.getCurrentUser();
      const isBackoffice = isAuthenticated && currentUser && currentUser.role === 'Backoffice';
      
      // Update mobile user info
      if (mobileUserInfo && isAuthenticated && currentUser) {
        mobileUserInfo.style.display = 'block';
        
        if (currentUser.role === 'Backoffice') {
          mobileUserInfo.innerHTML = `<span class="admin-badge">👑</span> ${currentUser.name}`;
        } else {
          mobileUserInfo.textContent = currentUser.name;
        }
      } else if (mobileUserInfo) {
        mobileUserInfo.style.display = 'none';
      }
      
      // Update mobile auth button
      if (mobileAuthButton) {
        if (isAuthenticated) {
          mobileAuthButton.textContent = 'Logout';
          mobileAuthButton.classList.add('logged-in');
        } else {
          mobileAuthButton.textContent = 'Login';
          mobileAuthButton.classList.remove('logged-in');
        }
      }
      
      // Show/hide mobile manage users button based on role
      if (mobileManageUsersButton) {
        if (isBackoffice) {
          mobileManageUsersButton.style.display = 'block';
        } else {
          mobileManageUsersButton.style.display = 'none';
        }
      }
    }
  
    mobileMenuButton.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.stopPropagation();
          
          // NEW - Check if mobile shift modal is open, close it first if it is
          if (mobileShiftModal && mobileShiftModal.classList.contains('active')) {
            mobileShiftModal.classList.remove('active');
            if (mobileModalOverlay) mobileModalOverlay.classList.remove('active');
          }
          
          openSidebar();
        }
      });
  
    if (closeSidebarButton) {
      closeSidebarButton.addEventListener('click', closeSidebar);
    }
  
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Setup mobile buttons functionality
    if (mobileManageUsersButton) {
      mobileManageUsersButton.addEventListener('click', () => {
        // Show user manager modal
        document.getElementById('userModal').style.display = 'block';
        updateUserTable();
        closeSidebar(); // Close the sidebar after action
      });
    }
    
    if (mobileExportCalendarButton) {
      mobileExportCalendarButton.addEventListener('click', () => {
        // Show export modal
        showExportModal();
        closeSidebar(); // Close the sidebar after action
      });
    }
    
    if (mobileAuthButton) {
      mobileAuthButton.addEventListener('click', () => {
        // Toggle authentication state (same as main auth button)
        if (AuthManager.isAuthenticated()) {
          AuthManager.logout();
        } else {
            AuthManager.showLoginDialog();
        }
        closeSidebar(); // Close the sidebar after action
      });
    }
  
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      // Check that our elements still exist
      if (!userListPanel || !mobileMenuButton) return;
        
      if (window.innerWidth <= 768) {
        const isClickInsideMenu = userListPanel.contains(e.target);
        const isClickOnButton = mobileMenuButton.contains(e.target);
        const isMenuOpen = userListPanel.classList.contains('active');
        if (isMenuOpen && !isClickInsideMenu && !isClickOnButton) {
          closeSidebar();
        }
      }
    });
  }


// Update the user list panel with current data
function updateUserList() {
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    userList.innerHTML = '';
    
    if (!staticData || !staticData.users) {
        console.error('User data not available');
        return;
    }

    staticData.users
        .filter(user => user.active)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.dataset.userId = user.id;
            
            // Keep the role as a data attribute (for styling) but don't display it
            if (user.role) {
                userItem.dataset.role = user.role;
            }
            
            // Highlight if selected
            if (selectedUserId === user.id) {
                userItem.classList.add('highlighted');
            }

            // Count shifts for this user
            const shiftsCount = countUserShifts(user.id);
            
            // Build the basic user item with name and shifts count
            userItem.innerHTML = `
                <div class="user-item-content">
                    <span class="user-name">${user.name}</span>
                    <span class="user-shifts-count">${shiftsCount} shifts</span>
                </div>
            `;

            // Add holiday button
            const holidayBtn = document.createElement('button');
            holidayBtn.className = 'holiday-btn';
            holidayBtn.innerHTML = '🏖️';
            holidayBtn.title = 'Manage Holidays';
            holidayBtn.setAttribute('data-user-id', user.id);
             
            // Add click handler for the holiday button
            holidayBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the user selection
                if (typeof HolidayFeature !== 'undefined' && HolidayFeature.openHolidayModal) {
                    HolidayFeature.openHolidayModal(user.id);
                } else {
                    console.error('HolidayFeature is not available');
                }
            });
             
            userItem.appendChild(holidayBtn);

            // Add starter indicator (yellow dot) if applicable
            if (user.isStarter) {
                const starterIndicator = document.createElement('span');
                starterIndicator.className = 'starter-indicator';
                starterIndicator.title = 'Starter';
                userItem.querySelector('.user-item-content').append(starterIndicator);
            }

            // Add Schreibdienst flag if applicable (keeping this as text)
            if (user.isSchreibdienst) {
                const schreibdienstFlag = document.createElement('span');
                schreibdienstFlag.className = 'schreibdienst-flag';
                schreibdienstFlag.textContent = 'Schreibdienst';
                schreibdienstFlag.title = 'Schreibdienst';
                // userItem.appendChild(schreibdienstFlag);
            }

            // Hover handlers
            userItem.addEventListener('mouseenter', () => {
                hoveredUserId = user.id;
                updateCalendarHighlights();
            });

            userItem.addEventListener('mouseleave', () => {
                hoveredUserId = null;
                updateCalendarHighlights();
            });

            // Click handler
            userItem.addEventListener('click', () => {
                if (selectedUserId === user.id) {
                    selectedUserId = null;
                } else {
                    selectedUserId = user.id;
                }
                updateUserList(); // Update highlighting in user list
                updateCalendarHighlights();
            });

            userList.appendChild(userItem);
        });
}

// Initialize delete confirmation dialog
function initializeDeleteConfirmation() {
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const container = document.getElementById('userDeleteConfirmation');
    
    if (!container) {
        console.error('Delete confirmation container not found');
        return;
    }
    
    // Cancel button handler
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            container.classList.remove('active');
            setTimeout(() => {
                container.style.display = 'none';
            }, 300);
        });
    }
    
    // Confirm button handler
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (pendingDeleteUserId) {
                performUserDeletion(pendingDeleteUserId);
                
                // Hide confirmation
                container.classList.remove('active');
                setTimeout(() => {
                    container.style.display = 'none';
                }, 300);
            }
        });
    }
}

// Update the day number and name in the header
function updateCurrentDayDisplay(day = null) {
    const dayNumberElement = document.getElementById('dayNumber');
    const dayNameElement = document.getElementById('dayName');
    
    if (!dayNumberElement || !dayNameElement) {
        return;
    }
    
    // If no day is provided, use the current date
    if (day === null) {
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth() + 1;
        const todayYear = today.getFullYear();
        
        // Only show today's date if we're viewing the current month/year
        if (todayMonth === currentMonth && todayYear === currentYear) {
            dayNumberElement.textContent = todayDate;
            dayNameElement.textContent = GermanDateFormatter.getWeekdayName(today);
        } else {
            // For other months, show the first visible day
            dayNumberElement.textContent = '1';
            dayNameElement.textContent = GermanDateFormatter.getWeekdayName(new Date(currentYear, currentMonth - 1, 1));
        }
    } else {
        // Update with the hovered/selected day
        dayNumberElement.textContent = day;
        dayNameElement.textContent = GermanDateFormatter.getWeekdayName(new Date(currentYear, currentMonth - 1, day));
    }
}

// Setup hover info panel behavior
function setupCalendarHoverListener() {
    // Add listener to reset day display when mouse leaves calendar
    const calendar = document.getElementById('calendar');
    if (calendar) {
        calendar.addEventListener('mouseleave', function() {
            // Reset day display to current date or first day of month
            updateCurrentDayDisplay();
            
            // Also hide the hover panel with fade effect
            const hoverPanel = document.getElementById('hoverInfoPanel');
            if (hoverPanel) {
                hoverPanel.classList.remove('visible');
            }
        });
    }
}

// Function to get calendar date info from a day card
function getDateFromDayCard(dayCard) {
    const day = parseInt(dayCard.dataset.day);
    const month = parseInt(dayCard.dataset.month);
    const year = parseInt(dayCard.dataset.year);
    
    return {
        day: day,
        month: month,
        year: year,
        date: new Date(year, month - 1, day)
    };
}

// Function to count shifts for a user
function countUserShifts(userId) {
    if (!staticData || !staticData.schedules || !staticData.schedules[currentYear] || 
        !staticData.schedules[currentYear][currentMonth]) {
        return 0;
    }
    
    let count = 0;
    const monthData = staticData.schedules[currentYear][currentMonth];
    
    Object.values(monthData).forEach(dayData => {
        if (dayData.E1 && dayData.E1.includes(userId)) {
            count++;
        }
        if (dayData.E2 && dayData.E2.includes(userId)) {
            count++;
        }
    });
    
    return count;
}

// Function to highlight the current day in the calendar
function highlightCurrentDay() {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
  
    const dayCards = document.querySelectorAll('.day-card');
    dayCards.forEach(card => {
        // Clear any existing today class
        card.classList.remove('today');
        
        // Get the date info from data attributes
        const cardDay = parseInt(card.dataset.day, 10);
        const cardMonth = parseInt(card.dataset.month, 10);
        const cardYear = parseInt(card.dataset.year, 10);
        
        // Check if this card represents today
        if (cardDay === currentDate && 
            cardMonth === currentMonth && 
            cardYear === currentYear) {
            card.classList.add('today');
        }
    });
}

// Set up the shift detail modal
function setupShiftDetailModal() {
    const modal = document.getElementById('shiftDetailModal');
    const overlay = document.getElementById('shiftModalOverlay');
    
    if (!modal || !overlay) {
        console.error('Shift detail modal elements not found');
        return;
    }
    
    // Close button handler
    const closeButton = modal.querySelector('.shift-detail-close');
    if (closeButton) {
        closeButton.addEventListener('click', hideShiftDetailModal);
    }
    
    // Overlay click handler
    overlay.addEventListener('click', hideShiftDetailModal);
    
    // Prevent modal close when clicking inside
    modal.addEventListener('click', (e) => e.stopPropagation());
    
    // User selection change handler
    modal.querySelectorAll('.user-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;
            
            ensureScheduleDataExists(currentDay);
            
            // Update shift with the selected user
            updateShift(currentDay, shift, position, e.target.value, 
                staticData.schedules[currentYear][currentMonth][currentDay].notes[shift][position]);
        });
    });
    
    // Note input change handler
    modal.querySelectorAll('.shift-note-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;
            
            ensureScheduleDataExists(currentDay);
            
            // Get the user ID for this position
            const userId = staticData.schedules[currentYear][currentMonth][currentDay][shift][position];
            
            // Update the shift with the new note
            updateShift(currentDay, shift, position, userId, e.target.value);
        });
    });
    
    // Make the modal draggable on desktop
    if (window.innerWidth > 768) {
        const modalHeader = modal.querySelector('.shift-detail-header');
        if (modalHeader) {
            makeElementDraggable(modal, modalHeader);
        }
    }
}

// Make an element draggable
function makeElementDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    // If a specific handle is provided, use that as the dragging element
    // Otherwise use the element itself
    const dragHandle = handle || element;
    
    dragHandle.style.cursor = 'move'; // Change cursor to indicate draggability
    
    // Mouse down event on the handle starts the drag
    dragHandle.addEventListener('mousedown', dragMouseDown);
    
    function dragMouseDown(e) {
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Add events to document so we can drag even if the cursor leaves the element
        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
    }
    
    function elementDrag(e) {
        e.preventDefault();
        // Calculate the new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set the element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
    }
}

// Hide the shift detail modal
function hideShiftDetailModal() {
    const modal = document.getElementById('shiftDetailModal');
    const overlay = document.getElementById('shiftModalOverlay');
  
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    // Explicitly hide the modal to prevent z-index issues
    modal.style.display = 'none';
    overlay.style.display = 'none';
  
    // Re-enable background scrolling
    document.body.classList.remove('modal-open');
}

// Function to update day card with current data
function updateDayCard(day) {
    ensureScheduleDataExists(day);
    const dayData = staticData.schedules[currentYear][currentMonth][day];
    
    const calendar = document.getElementById('calendar');
    const dayCards = Array.from(calendar.getElementsByClassName('day-card'));
    const dayCard = dayCards.find(card => parseInt(card.dataset.day) === day);
    
    if (!dayCard) return;
    
    // Store original "today" state
    const wasToday = dayCard.classList.contains('today');
    
    const shiftLeft = dayCard.querySelector('.shift-left');
    const shiftRight = dayCard.querySelector('.shift-right');

    // First, remove all classes except shift-left/shift-right
    if (shiftLeft) {
        const classes = shiftLeft.className.split(' ');
        shiftLeft.className = 'shift-left';
    }
    
    if (shiftRight) {
        const classes = shiftRight.className.split(' ');
        shiftRight.className = 'shift-right';
    }
    
    // Force a browser reflow
    if (shiftLeft) shiftLeft.offsetHeight;
    if (shiftRight) shiftRight.offsetHeight;

    // Update E1 (left) side
    const e1Users = dayData.E1.filter(user => user !== '');
    if (shiftLeft) {
        shiftLeft.className = 'shift-left ' + getColorClass(e1Users, 'E1');

        // Add data attributes for Schreibdienst split coloring
        const e1UserObjects = e1Users.map(userId => 
            staticData.users.find(u => u.id === userId)
        ).filter(u => u);
        
        // Set data attributes properly as strings
        shiftLeft.dataset.firstUserSchreibdienst = (e1UserObjects[0]?.isSchreibdienst === true).toString();
        shiftLeft.dataset.secondUserSchreibdienst = (e1UserObjects[1]?.isSchreibdienst === true).toString();
        
        // Force another reflow by temporarily changing a style property
        shiftLeft.style.display = 'none';
        shiftLeft.offsetHeight; // Force reflow
        shiftLeft.style.display = '';
    }

    // Update E2 (right) side
    const e2Users = dayData.E2.filter(user => user !== '');
    if (shiftRight) {
        shiftRight.className = 'shift-right ' + getColorClass(e2Users, 'E2');

        // Add data attributes for Schreibdienst split coloring
        const e2UserObjects = e2Users.map(userId => 
            staticData.users.find(u => u.id === userId)
        ).filter(u => u);
        
        // Set data attributes properly as strings
        shiftRight.dataset.firstUserSchreibdienst = (e2UserObjects[0]?.isSchreibdienst === true).toString();
        shiftRight.dataset.secondUserSchreibdienst = (e2UserObjects[1]?.isSchreibdienst === true).toString();
        
        // Force another reflow by temporarily changing a style property
        shiftRight.style.display = 'none';
        shiftRight.offsetHeight; // Force reflow
        shiftRight.style.display = '';
    }
    
    // Restore "today" class if it was present
    if (wasToday) {
        dayCard.classList.add('today');
    }
}

// Get color class based on assigned users
function getColorClass(users, shift) {
    if (!users || users.length === 0) return 'red';

    const validUsers = users.filter(userId => userId && userId !== '');
    if (validUsers.length === 0) return 'red';

    // Get user objects for the shift
    const shiftUsers = validUsers.map(userId => 
        staticData.users.find(u => u.id === userId)
    ).filter(u => u); // Remove any undefined users

    // Check for Starter condition (explicit boolean comparison)
    const hasStarter = shiftUsers.some(user => user.isStarter === true);
    if (hasStarter && validUsers.length === 1) {
        return 'starter';
    }

    // Check for Schreibdienst (explicit boolean comparison)
    const hasSchreibdienst = shiftUsers.some(user => user.isSchreibdienst === true);
    if (hasSchreibdienst) {
        return validUsers.length === 2 ? 'schreibdienst-full' : 'schreibdienst-single';
    }

    // Default coloring based on number of users
    return validUsers.length === 2 ? 'green' : 'orange';
}

// Check if a date is a weekend
function isWeekend(year, month, day) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
}

// Get the first day of the month that is not a weekend
function getFirstVisibleDay(year, month) {
    let day = 1;
    // Find the first non-weekend day
    while (isWeekend(year, month, day)) {
        day++;
    }
    return day;
}

// Get days in a month
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function getMonthName(month) {
    // Ensure month is treated as an integer and is within valid range
    const monthIndex = parseInt(month) - 1; // Convert 1-based to 0-based
    
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        console.error('Invalid month number:', month);
        return 'Unknown';
    }
    
    // Use GermanDateFormatter if available
    if (typeof GermanDateFormatter !== 'undefined' && GermanDateFormatter.months) {
        return GermanDateFormatter.months[monthIndex];
    }
    
    // Fallback month names
    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    return monthNames[monthIndex];
}

// Update highlights in calendar based on selected or hovered user
function updateCalendarHighlights() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    const dayCards = calendar.getElementsByClassName('day-card');

    Array.from(dayCards).forEach((dayCard) => {
        const dayNumber = parseInt(dayCard.querySelector('.day-number').textContent);
        const dayData = staticData.schedules[currentYear]?.[currentMonth]?.[dayNumber];
        
        if (!dayData) return;
        
        // Remove any previous highlighting class from the day card
        dayCard.classList.remove('all-shifts-dimmed');
        
        // Get references to the shifts
        const shiftE1 = dayCard.querySelector('.shift-left');
        const shiftE2 = dayCard.querySelector('.shift-right');

        // Check each shift separately
        const hasHoveredUserE1 = hoveredUserId && dayData.E1 && dayData.E1.includes(hoveredUserId);
        const hasHoveredUserE2 = hoveredUserId && dayData.E2 && dayData.E2.includes(hoveredUserId);
        const hasSelectedUserE1 = selectedUserId && dayData.E1 && dayData.E1.includes(selectedUserId);
        const hasSelectedUserE2 = selectedUserId && dayData.E2 && dayData.E2.includes(selectedUserId);

        // Track if all shifts are dimmed
        let allShiftsDimmed = (hoveredUserId || selectedUserId);

        // Handle E1 shift
        if (shiftE1) {
            if (hasHoveredUserE1) {
                shiftE1.classList.add('highlight-hover');
                allShiftsDimmed = false;
            } else {
                shiftE1.classList.remove('highlight-hover');
            }
            
            if (hasSelectedUserE1) {
                shiftE1.classList.add('highlight-selected');
                allShiftsDimmed = false;
            } else {
                shiftE1.classList.remove('highlight-selected');
            }
            
            if ((hoveredUserId || selectedUserId) && !hasHoveredUserE1 && !hasSelectedUserE1) {
                shiftE1.classList.add('dimmed');
            } else {
                shiftE1.classList.remove('dimmed');
                allShiftsDimmed = false;
            }
        }

        // Handle E2 shift
        if (shiftE2) {
            if (hasHoveredUserE2) {
                shiftE2.classList.add('highlight-hover');
                allShiftsDimmed = false;
            } else {
                shiftE2.classList.remove('highlight-hover');
            }
            
            if (hasSelectedUserE2) {
                shiftE2.classList.add('highlight-selected');
                allShiftsDimmed = false;
            } else {
                shiftE2.classList.remove('highlight-selected');
            }
            
            if ((hoveredUserId || selectedUserId) && !hasHoveredUserE2 && !hasSelectedUserE2) {
                shiftE2.classList.add('dimmed');
            } else {
                shiftE2.classList.remove('dimmed');
                allShiftsDimmed = false;
            }
        }
        
        // If user is hovered/selected and no shifts in this day card match, add class to the card
        if (allShiftsDimmed) {
            dayCard.classList.add('all-shifts-dimmed');
        }
    });
}

// Update user table in modal
function updateUserTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    staticData.users.forEach(user => {
        const userRole = user.role || 'Freiwillige';
        
        const row = document.createElement('tr');
        row.className = `role-${userRole.toLowerCase()}`;
        
        row.innerHTML = `
            <td class="user-name-cell">${user.name}</td>
            <td class="role-cell">${userRole}</td>
            <td class="flags-cell">
                <div class="flag-select">
                    <div class="flag-select-value">
                        ${getFlagLabels(user)}
                    </div>
                    <div class="flag-dropdown">
                        <label class="flag-option">
                            <input type="checkbox" class="user-starter" 
                                   ${user.isStarter ? 'checked' : ''}>
                            <span>Starter</span>
                        </label>
                        <label class="flag-option">
                            <input type="checkbox" class="user-schreibdienst" 
                                   ${user.isSchreibdienst ? 'checked' : ''}>
                            <span>Schreibdienst</span>
                        </label>
                    </div>
                </div>
            </td>
            <td class="actions-cell">
                <button class="button-delete" id="delete-user-${user.id}">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Event handler setup code (same as before)
        
        // Starter checkbox handler
        const starterCheckbox = row.querySelector('.user-starter');
        if (starterCheckbox) {
            starterCheckbox.addEventListener('change', function(e) {
                updateUserStarter(user.id, e.target.checked);
            });
        }
        
        // Schreibdienst checkbox handler
        const schreibdienstCheckbox = row.querySelector('.user-schreibdienst');
        if (schreibdienstCheckbox) {
            schreibdienstCheckbox.addEventListener('change', function(e) {
                updateUserSchreibdienst(user.id, e.target.checked);
            });
        }
        
        // Make flag select toggleable
        const flagSelect = row.querySelector('.flag-select');
        if (flagSelect) {
            flagSelect.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFlagDropdown(this);
            });
        }
        
        // Delete button handler
        const deleteButton = row.querySelector('.button-delete');
        if (deleteButton) {
            deleteButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showDeleteConfirmation(user.id);
            });
        }
    });
}

// Get flag labels for user
function getFlagLabels(user) {
    const flags = [];
    if (user.isStarter) flags.push('Starter');
    if (user.isSchreibdienst) flags.push('Schreibdienst');
    return flags.length ? flags.join(', ') : 'No flags';
}

// Toggle flag dropdown in user table
function toggleFlagDropdown(element) {
    document.querySelectorAll('.flag-select.active').forEach(select => {
        if (select !== element) {
            select.classList.remove('active');
        }
    });
    element.classList.toggle('active');
}

// Show confirmation dialog for user deletion
function showDeleteConfirmation(userId) {
    pendingDeleteUserId = userId;
    
    // Find user
    const user = staticData.users.find(u => u.id === userId);
    if (!user) return;
    
    // Get confirmation elements
    const confirmationContainer = document.getElementById('userDeleteConfirmation');
    const userNameElement = document.getElementById('deleteUserName');
    
    // Set user name in the confirmation
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    // Show the confirmation dialog
    if (confirmationContainer) {
        confirmationContainer.style.display = 'block';
        
        // Add fade-in animation
        setTimeout(() => {
            confirmationContainer.classList.add('active');
        }, 10);
    }
}

// Create a day card for the calendar
function createDayCard(day) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';

    // Add data attributes for the current date
    dayCard.dataset.day = day;
    dayCard.dataset.month = currentMonth;
    dayCard.dataset.year = currentYear;

    dayCard.innerHTML = `
        <span class="day-number">${day}</span>
        <div class="shift-container">
            <div class="shift-left red" data-shift="E1">
                <span class="shift-label">E1</span>
            </div>
            <div class="shift-right red" data-shift="E2">
                <span class="shift-label">E2</span>
            </div>
        </div>
    `;

    // Add hover and click handlers
    const isMobile = () => window.innerWidth <= 768;
    
    // Hover handlers for desktop
    dayCard.addEventListener('mouseenter', () => {
        if (!isMobile()) {
            updateHoverInfo(day, true);
            updateCurrentDayDisplay(day);
        }
    });
    
    dayCard.addEventListener('mouseleave', () => {
        if (!isMobile()) {
            updateHoverInfo(day, false);
            updateCurrentDayDisplay(); // Reset to default
        }
    });

    // Click handlers for shifts
    const shiftLeft = dayCard.querySelector('.shift-left');
    const shiftRight = dayCard.querySelector('.shift-right');
    
    shiftLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMobile()) {
            showMobileModal(day, 'E1', shiftLeft);
        } else {
            showShiftDetailModal(shiftLeft, day, 'E1');
        }
    });
    
    shiftRight.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMobile()) {
            showMobileModal(day, 'E2', shiftRight);
        } else {
            showShiftDetailModal(shiftRight, day, 'E2');
        }
    });

    return dayCard;
}

// Update hover info panel
function updateHoverInfo(day, show = true) {
    // Check if we're on mobile - if so, don't show the hover panel
    if (window.innerWidth <= 768) {
        return;
    }

    const hoverPanel = document.getElementById('hoverInfoPanel');
    if (!hoverPanel) return;
    
    if (!show) {
        hoverPanel.classList.remove('visible');
        // No need to hide immediately, the transition handles it
        return;
    }

    // Make sure the day's data exists
    ensureScheduleDataExists(day);
    const dayData = staticData.schedules[currentYear][currentMonth][day];
    if (!dayData) return;

    // Update date display
    const dateDisplay = hoverPanel.querySelector('.hover-info-date');
    if (dateDisplay) {
        dateDisplay.textContent = GermanDateFormatter.formatMediumDate(new Date(currentYear, currentMonth - 1, day));
    }

    // Update E1 users
    const e1Users = dayData.E1
        .map(userId => {
            if (!userId) return '';
            const user = staticData.users.find(u => u.id === userId);
            return user ? user.name : '';
        })
        .filter(name => name !== '');

    // Update E2 users
    const e2Users = dayData.E2
        .map(userId => {
            if (!userId) return '';
            const user = staticData.users.find(u => u.id === userId);
            return user ? user.name : '';
        })
        .filter(name => name !== '');

    // Display users for each shift
    const e1Display = hoverPanel.querySelector('[data-shift="E1"]');
    const e2Display = hoverPanel.querySelector('[data-shift="E2"]');

    if (e1Display) {
        e1Display.innerHTML = e1Users.length ? 
            e1Users.map(name => `<div class="shift-user">${name}</div>`).join('') : 
            '<div class="shift-user">No users assigned</div>';
    }

    if (e2Display) {
        e2Display.innerHTML = e2Users.length ? 
            e2Users.map(name => `<div class="shift-user">${name}</div>`).join('') : 
            '<div class="shift-user">No users assigned</div>';
    }

    // Show the panel with the fade-in effect
    hoverPanel.classList.add('visible');

    
    // Position the panel near the current day
    const dayCards = document.querySelectorAll('.day-card');
    const currentDayCard = Array.from(dayCards).find(card => parseInt(card.dataset.day) === day);
    
    if (currentDayCard) {
        const rect = currentDayCard.getBoundingClientRect();
        const calendarRect = document.getElementById('calendar').getBoundingClientRect();
        
        // Position the panel near but not directly on top of the day card
        // hoverPanel.style.top = `${rect.top - hoverPanel.offsetHeight - 10}px`;
        // hoverPanel.style.left = `${rect.left}px`;
    }
}

// Function to format notes with user names for mobile modal
function formatNotesWithUserNames(dayData, shiftType) {
    const notes = dayData.notes?.[shiftType] || ['', ''];
    const userIds = dayData[shiftType] || ['', ''];
    const notesHtml = [];
    
    // Process each position in the shift
    for (let i = 0; i < notes.length; i++) {
        if (notes[i] && notes[i].trim() !== '') {
            const userId = userIds[i];
            const user = staticData.users.find(u => u.id === userId);
            const userName = user ? user.name : 'Unknown';
            
            // Format as "Username: 'Note text'"
            notesHtml.push(`
                <div class="shift-note-text">
                    <strong>${userName}:</strong> "${notes[i]}"
                </div>
            `);
        }
    }
    
    return notesHtml.join('');
}

// Function to show modal for mobile devices
function showMobileModal(day, shiftType, shiftElement) {
    console.log('Showing mobile modal for day:', day, 'shift:', shiftType);
    
    // Hide any visible hover info panel first
    const hoverPanel = document.getElementById('hoverInfoPanel');
    if (hoverPanel) {
        hoverPanel.style.display = 'none';
    }
    
    const modal = document.getElementById('mobileShiftModal');
    const overlay = document.getElementById('mobileModalOverlay');
    const infoContainer = document.getElementById('mobileShiftInfo');
    const detailContainer = document.getElementById('mobileShiftDetail');
    
    if (!infoContainer || !detailContainer) {
        console.error('Modal containers not found', { infoContainer, detailContainer });
        return;
    }
    
    // Clear previous content to avoid duplicates
    infoContainer.innerHTML = '';
    detailContainer.innerHTML = '';
    
    // If modal is already active, hide it first
    if (modal.classList.contains('active')) {
        hideMobileModal();
    }
    
    ensureScheduleDataExists(day);
    const dayData = staticData.schedules[currentYear][currentMonth][day];

    // Get Schreibdienst events for this day
    let e1Events = [];
    let e2Events = [];
    
    try {
        // Get all events for this day from schreibdienstEvents
        if (staticData.schreibdienstEvents && 
            staticData.schreibdienstEvents[currentYear] && 
            staticData.schreibdienstEvents[currentYear][currentMonth] && 
            staticData.schreibdienstEvents[currentYear][currentMonth][day]) {
            
            const dayEvents = staticData.schreibdienstEvents[currentYear][currentMonth][day];
            
            // Separate events by shift
            e1Events = dayEvents.filter(event => event.shift === 'E1');
            e2Events = dayEvents.filter(event => event.shift === 'E2');
        }
    } catch (error) {
        console.error('Error accessing Schreibdienst events:', error);
    }

    // Build infoContainer content with Schreibdienst events included
    infoContainer.innerHTML = `
        <div class="shift-columns">
            <div class="shift-column">
                <div class="shift-column-title">E1</div>
                <div class="shift-users-list">
                    ${dayData.E1.filter(id => id && id !== '')
                        .map(id => {
                            const user = staticData.users.find(u => u.id === id);
                            return user ? `<div class="shift-user-item">${user.name}</div>` : '';
                        }).join('') || '<div class="shift-user-item">No users assigned</div>'}
                </div>
                ${e1Events.length > 0 ? `
                    <div class="shift-events-list">
                        <div class="shift-events-title">Schreibdienst Events</div>
                        ${e1Events.map(event => {
                            const creator = staticData.users.find(u => u.id === event.userId);
                            return `
                                <div class="shift-event-item">
                                    <div class="shift-event-time">${event.time}</div>
                                    <div class="shift-event-details">${event.details}</div>
                                    <div class="shift-event-creator">by ${creator ? creator.name : 'Unknown'}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="shift-column">
                <div class="shift-column-title">E2</div>
                <div class="shift-users-list">
                    ${dayData.E2.filter(id => id && id !== '')
                        .map(id => {
                            const user = staticData.users.find(u => u.id === id);
                            return user ? `<div class="shift-user-item">${user.name}</div>` : '';
                        }).join('') || '<div class="shift-user-item">No users assigned</div>'}
                </div>
                ${e2Events.length > 0 ? `
                    <div class="shift-events-list">
                        <div class="shift-events-title">Schreibdienst Events</div>
                        ${e2Events.map(event => {
                            const creator = staticData.users.find(u => u.id === event.userId);
                            return `
                                <div class="shift-event-item">
                                    <div class="shift-event-time">${event.time}</div>
                                    <div class="shift-event-details">${event.details}</div>
                                    <div class="shift-event-creator">by ${creator ? creator.name : 'Unknown'}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Add notes section if any notes exist
    const e1Notes = dayData.notes?.E1 || ['', ''];
    const e2Notes = dayData.notes?.E2 || ['', ''];
    const hasAnyNotes = [...e1Notes, ...e2Notes].some(note => note && note.trim() !== '');
    
    if (hasAnyNotes) {
        // FIXED: Show notes with user names in a combined section
        const notesSection = `
            <div class="shift-notes">
                <div class="shift-notes-title">Notes</div>
                ${formatNotesWithUserNames(dayData, 'E1')}
                ${formatNotesWithUserNames(dayData, 'E2')}
            </div>
        `;
        infoContainer.innerHTML += notesSection;
    }




    // Check if the month is frozen and user is not backoffice
    const isFrozen = isCalendarFrozen && !isBackofficeUser();
    
    // Add frozen month message if needed
    if (isFrozen) {
        infoContainer.innerHTML += `
            <div class="frozen-message" style="margin-top: 15px;">
                Dieser Monat ist gesperrt. Einteilungen können nicht geändert werden.
            </div>
        `;
    }

    // Build detailContainer content - with columns for E1 and E2
    detailContainer.innerHTML = `
    <div class="mobile-shift-user-columns">
        <!-- E1 Column -->
        <div class="mobile-shift-column">
            <div class="mobile-shift-column-title">E1</div>
            
            <!-- E1 User Dropdowns -->
            <div class="mobile-shift-user-row">
                
                <select class="user-select" data-shift="E1" data-position="1" ${isFrozen ? 'disabled' : ''}>
                    <option value="">Eintragen</option>
                    ${staticData.users.filter(u => u.active).map(user => `
                        <option value="${user.id}" ${dayData.E1[0] === user.id ? 'selected' : ''}>
                            ${user.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="mobile-shift-user-row">
              
                <select class="user-select" data-shift="E1" data-position="2" ${isFrozen ? 'disabled' : ''}>
                    <option value="">Eintragen</option>
                    ${staticData.users.filter(u => u.active).map(user => `
                        <option value="${user.id}" ${dayData.E1[1] === user.id ? 'selected' : ''}>
                            ${user.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
        
        <!-- E2 Column -->
        <div class="mobile-shift-column">
            <div class="mobile-shift-column-title">E2</div>
            
            <!-- E2 User Dropdowns -->
            <div class="mobile-shift-user-row">
               
                <select class="user-select" data-shift="E2" data-position="1" ${isFrozen ? 'disabled' : ''}>
                    <option value="">Eintragen</option>
                    ${staticData.users.filter(u => u.active).map(user => `
                        <option value="${user.id}" ${dayData.E2[0] === user.id ? 'selected' : ''}>
                            ${user.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="mobile-shift-user-row">
               
                <select class="user-select" data-shift="E2" data-position="2" ${isFrozen ? 'disabled' : ''}>
                    <option value="">Eintragen</option>
                    ${staticData.users.filter(u => u.active).map(user => `
                        <option value="${user.id}" ${dayData.E2[1] === user.id ? 'selected' : ''}>
                            ${user.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
    </div>
    
    <!-- Notes Section (grouped at the bottom) -->
    <div class="mobile-shift-notes-section">
        <div class="mobile-shift-notes-column">
            <div class="mobile-shift-column-title">Notiz</div>
            <input type="text" class="shift-note" 
                data-shift="E1" 
                data-position="1" 
                placeholder="Notiz für E1..."
                value="${dayData.notes?.E1?.[0] || ''}">
            <input type="text" class="shift-note" 
                data-shift="E1" 
                data-position="2" 
                placeholder="Notiz für E1..."
                value="${dayData.notes?.E1?.[1] || ''}">
        </div>
        
        <div class="mobile-shift-notes-column">
            <div class="mobile-shift-column-title">Notiz</div>
            <input type="text" class="shift-note" 
                data-shift="E2" 
                data-position="1" 
                placeholder="Notiz für E2..."
                value="${dayData.notes?.E2?.[0] || ''}">
            <input type="text" class="shift-note" 
                data-shift="E2" 
                data-position="2" 
                placeholder="Notiz für E2..."
                value="${dayData.notes?.E2?.[1] || ''}">
        </div>
    </div>
`;
    // After building the detailContainer content, add the date tab directly to the modal (not inside detailContainer)
    const dateTab = document.createElement('div');
    dateTab.className = 'mobile-date-tab';
    dateTab.textContent = GermanDateFormatter.formatMediumDate(new Date(currentYear, currentMonth - 1, day));
    
    // Add a lock icon to the date tab if the month is frozen
    if (isFrozen) {
        dateTab.innerHTML += ' <span style="margin-left: 5px;">🔒</span>';
    }
    
    modal.appendChild(dateTab);

    // Add close button to the mobile modal (reusing modal-close style)
    if (!modal.querySelector('.mobile-shift-close-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mobile-shift-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', hideMobileModal);
        modal.appendChild(closeBtn);
    }

    // Attach event listeners for user selects and notes
    detailContainer.querySelectorAll('.user-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;
            
            console.log(`Attempting to update shift: ${shift}, position: ${position}, value: ${e.target.value}`);
            
            // Make sure we have valid data
            if (!shift || isNaN(position)) {
                console.error('Invalid shift or position data', { shift, position });
                return;
            }
            
            // Update shift with new user
            updateShift(day, shift, position, e.target.value, 
                        dayData.notes?.[shift]?.[position] || '');
        });
    });

    detailContainer.querySelectorAll('.shift-note').forEach(input => {
        input.addEventListener('change', (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;
            
            console.log(`Attempting to update note: ${shift}, position: ${position}, value: ${e.target.value}`);
            
            // Make sure we have valid data
            if (!shift || isNaN(position)) {
                console.error('Invalid shift or position data', { shift, position });
                return;
            }
            
            // Update shift note
            updateShift(day, shift, position, 
                dayData[shift][position], 
                e.target.value);
        });
    });
    
      // Set up click handler on overlay to close modal
      overlay.addEventListener('click', hideMobileModal);
    
      // Prevent modal closing when clicking inside the modal
      modal.addEventListener('click', (e) => {
          e.stopPropagation();
      });

        // Add additional frozen styling if needed
        if (isFrozen) {
            modal.classList.add('frozen-modal');
            // Style the selects to appear grayed out
            detailContainer.querySelectorAll('.user-select').forEach(select => {
                select.style.backgroundColor = '#f5f7fd';
                select.style.borderColor = '#e0e5f5';
                select.style.opacity = '0.8';
                select.style.cursor = 'not-allowed';
            });
        } else {
            modal.classList.remove('frozen-modal');
        }

    // Finally, show modal and overlay
    modal.classList.add('active');
    overlay.classList.add('active');
} 

// Hide mobile modal
function hideMobileModal() {
    const modal = document.getElementById('mobileShiftModal');
    const overlay = document.getElementById('mobileModalOverlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}


// Start the application with async loading
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are properly available
    setTimeout(initializeApp, 200);
});