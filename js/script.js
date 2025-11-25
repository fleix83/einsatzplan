// Global variables (unchanged)
let staticData = null;
let currentYear = (new Date()).getFullYear();
let currentMonth = (new Date()).getMonth() + 1;
let selectedDay = null;
let hoveredUserId = null;
let selectedUserId = null;
let showUserNames = false; // Track if user names should be displayed in shifts

// Lock management helper functions
function isShiftLocked(lockedTimestamp) {
    if (!lockedTimestamp) return false;

    const lockedTime = new Date(lockedTimestamp);
    const now = new Date();
    const minutesElapsed = (now - lockedTime) / 1000 / 60;

    return minutesElapsed > 5;
}

function showLockConfirmation(userName) {
    return new Promise((resolve) => {
        const modal = document.getElementById('lockConfirmModal');
        const overlay = document.getElementById('lockConfirmOverlay');
        const messageEl = document.getElementById('lockConfirmMessage');
        const yesBtn = document.getElementById('lockConfirmYes');
        const cancelBtn = document.getElementById('lockConfirmCancel');

        // Set the message
        messageEl.textContent = `Dieser Einsatz ist bereits von ${userName} belegt.`;

        // Show modal
        modal.style.display = 'block';
        overlay.style.display = 'block';

        // Create click handlers
        const handleYes = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            yesBtn.removeEventListener('click', handleYes);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleCancel);
        };

        // Attach event listeners
        yesBtn.addEventListener('click', handleYes);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleCancel);
    });
}

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

// Function to refresh UI button states
function refreshButtonStates() {
    console.log('refreshButtonStates: Forcing button visibility refresh');
    const isAuthenticated = AuthManager.isAuthenticated();
    const currentUser = AuthManager.getCurrentUser();
    const isBackoffice = isAuthenticated && currentUser && currentUser.role === 'Backoffice';
    const isMobileView = window.innerWidth <= 768;
    
    const manageUsersButton = document.getElementById('manageUsers');
    const mobileManageUsersButton = document.getElementById('mobileManageUsers');
    const exportButton = document.getElementById('exportCalendar');
    
    // Handle manage users buttons
    if (manageUsersButton) {
        if (isBackoffice) {
            manageUsersButton.style.display = 'block';
            manageUsersButton.style.visibility = 'visible';
        } else {
            manageUsersButton.style.display = 'none';
            manageUsersButton.style.visibility = 'hidden';
        }
    }
    
    if (mobileManageUsersButton) {
        if (isBackoffice) {
            mobileManageUsersButton.style.display = 'block';
            mobileManageUsersButton.style.visibility = 'visible';
        } else {
            mobileManageUsersButton.style.display = 'none';
            mobileManageUsersButton.style.visibility = 'hidden';
        }
    }
    
    // Handle export button visibility based on view mode and user role
    if (exportButton) {
        if (isMobileView) {
            // Mobile view: hide for backoffice, show for others
            if (isBackoffice) {
                exportButton.style.setProperty('display', 'none', 'important');
                exportButton.style.setProperty('visibility', 'hidden', 'important');
            } else {
                exportButton.style.setProperty('display', 'flex', 'important');
                exportButton.style.setProperty('visibility', 'visible', 'important');
            }
        } else {
            // Desktop view: show for everyone
            exportButton.style.setProperty('display', 'block', 'important');
            exportButton.style.setProperty('visibility', 'visible', 'important');
        }
    }
    
    console.log('refreshButtonStates: Completed', {
        isAuthenticated,
        currentUser: currentUser ? currentUser.name : 'none',
        role: currentUser ? currentUser.role : 'none',
        isBackoffice,
        isMobileView,
        manageUsersVisible: manageUsersButton ? manageUsersButton.style.display : 'not found',
        exportButtonVisible: exportButton ? exportButton.style.display : 'not found'
    });
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
            // Show user info and logout option - no icons for backoffice users
            if (currentUser.role === 'Backoffice') {
                authLink.innerHTML = `
                    <span class="auth-link-text">${currentUser.name} (Abmelden)</span>
                `;
            } else {
                authLink.innerHTML = `
                    <span class="auth-link-icon">🔒</span>
                    <span class="auth-link-text">${currentUser.name} (Abmelden)</span>
                `;
            }
            authLink.classList.add('logged-in');
        } else {
            // Show login option
            authLink.innerHTML = `
                <span class="auth-link-icon">🔑</span>
                <span class="auth-link-text">Anmelden</span>
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
      // Hide for all other cases (unauthenticated, Freiwillige, etc.)
      console.log('setupUI: Managing user button visibility', {
        isAuthenticated,
        currentUser: currentUser ? currentUser.name : 'none',
        role: currentUser ? currentUser.role : 'none',
        isBackoffice
      });
      
      if (isBackoffice) {
        manageUsersButton.style.display = 'block';
        manageUsersButton.style.visibility = 'visible';
        console.log('setupUI: Showing manage users button for backoffice user');
      } else {
        manageUsersButton.style.display = 'none';
        manageUsersButton.style.visibility = 'hidden';
        console.log('setupUI: Hiding manage users button for non-backoffice user');
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
    
    // Handle export button visibility based on view mode and user role
    if (exportButton) {
      if (isMobileView) {
        // Mobile view: hide for backoffice, show for others
        if (isBackoffice) {
          exportButton.style.setProperty('display', 'none', 'important');
          exportButton.style.setProperty('visibility', 'hidden', 'important');
          console.log('setupUI: Hiding export button for backoffice user in mobile view');
        } else {
          exportButton.style.setProperty('display', 'flex', 'important');
          exportButton.style.setProperty('visibility', 'visible', 'important');
          console.log('setupUI: Showing export button for non-backoffice user in mobile view');
        }
      } else {
        // Desktop view: show for everyone
        exportButton.style.setProperty('display', 'block', 'important');
        exportButton.style.setProperty('visibility', 'visible', 'important');
        console.log('setupUI: Showing export button in desktop view');
      }
    }
    
    // Handle freeze button visibility in mobile view
    if (isMobileView && freezeToggleBtn) {
      if (isBackoffice) {
        freezeToggleBtn.style.display = 'flex';
        console.log('setupUI: Showing freeze button for backoffice user in mobile view');
      } else {
        freezeToggleBtn.style.display = 'none';
        console.log('setupUI: Hiding freeze button for non-backoffice user in mobile view');
      }
    }
    
    // Hide auth container in top navbar (since we're using the new auth link)
    if (navbarAuth) {
      navbarAuth.style.display = 'none';
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
          
          // No icons for backoffice users
          if (currentUser.role === 'Backoffice') {
            mobileUserInfoElement.textContent = currentUser.name;
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
        eventBtn.className = 'button-nav button-custom-event';
        eventBtn.innerHTML = '<span class="button-icon">📅</span>';
        eventBtn.title = 'Event hinzufügen';
        
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
                        NotificationSystem.warning('Komponenten werden geladen... Bitte versuchen Sie es in einem Moment erneut.');
                    }
                } else {
                    console.error('CustomEventsFeature is undefined');
                    NotificationSystem.error('Event-Funktion ist nicht verfügbar. Bitte laden Sie die Seite neu.');
                }
            } catch (error) {
                console.error('Error handling custom event button click:', error);
                NotificationSystem.error('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
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

// Function to navigate months using chevron buttons
function navigateMonth(direction) {
    console.log('navigateMonth called with direction:', direction, 'current:', { currentMonth, currentYear });

    if (direction === 'prev') {
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
    } else if (direction === 'next') {
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    }

    // Clamp year to valid range (2025-2030)
    if (currentYear < 2025) currentYear = 2025;
    if (currentYear > 2030) currentYear = 2030;

    console.log('After navigation:', { currentMonth, currentYear });

    // Update the display
    updateDateDisplay();

    // Update hidden selects for compatibility
    document.getElementById('yearSelect').value = currentYear;
    document.getElementById('monthSelect').value = currentMonth;
}

// Function to update the date display text
function updateDateDisplay() {
    console.log('updateDateDisplay called');
    const monthNames = GermanDateFormatter ?
        GermanDateFormatter.months :
        ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
         'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const displayText = monthNames[currentMonth - 1] + ' ' + currentYear;
    const monthYearText = document.getElementById('monthYearText');
    console.log('monthYearText element:', monthYearText, 'displayText:', displayText);
    if (monthYearText) {
        monthYearText.textContent = displayText;
        console.log('Updated display to:', displayText);
    } else {
        console.warn('monthYearText element not found!');
    }
}

// Month/Year Picker Module
const MonthYearPicker = {
    pickerYear: currentYear,
    isVisible: false,

    init() {
        console.log('MonthYearPicker.init() called');
        const monthGrid = document.getElementById('monthGrid');
        const pickerYearPrev = document.getElementById('pickerYearPrev');
        const pickerYearNext = document.getElementById('pickerYearNext');

        if (!monthGrid || !pickerYearPrev || !pickerYearNext) {
            console.warn('MonthYearPicker elements not found');
            return;
        }

        // Generate month buttons
        const monthNames = GermanDateFormatter ?
            GermanDateFormatter.months :
            ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
             'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

        monthNames.forEach((monthName, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'month-btn';
            btn.dataset.month = index + 1;
            btn.textContent = monthName.substring(0, 3); // First 3 letters
            btn.addEventListener('click', () => this.selectMonth(index + 1));
            monthGrid.appendChild(btn);
        });

        // Year navigation event listeners
        pickerYearPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateYear('prev');
        });

        pickerYearNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateYear('next');
        });

        // Close picker on outside click
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('monthYearPicker');
            const dateDisplay = document.getElementById('dateDisplay');

            if (this.isVisible &&
                picker &&
                !picker.contains(e.target) &&
                !dateDisplay.contains(e.target)) {
                this.hide();
            }
        });

        // Close picker on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Prevent picker clicks from bubbling
        const picker = document.getElementById('monthYearPicker');
        if (picker) {
            picker.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        console.log('MonthYearPicker initialized with', monthNames.length, 'months');
    },

    show() {
        console.log('MonthYearPicker.show() called');
        const picker = document.getElementById('monthYearPicker');
        if (!picker) {
            console.warn('Picker element not found');
            return;
        }

        // Sync picker year with current year
        this.pickerYear = currentYear;
        document.getElementById('pickerYearDisplay').textContent = this.pickerYear;

        // Update month grid highlighting
        this.updateMonthGrid();

        // Position and show picker
        picker.style.display = 'block';
        this.positionPicker();

        // Trigger transition
        setTimeout(() => {
            picker.style.opacity = '1';
            picker.style.transform = 'translateY(0)';
        }, 10);

        this.isVisible = true;
        console.log('Picker displayed');
    },

    hide() {
        console.log('MonthYearPicker.hide() called');
        const picker = document.getElementById('monthYearPicker');
        if (!picker) return;

        // Fade out
        picker.style.opacity = '0';
        picker.style.transform = 'translateY(-4px)';

        // Hide after transition
        setTimeout(() => {
            picker.style.display = 'none';
            this.isVisible = false;
        }, 200);
    },

    async selectMonth(month) {
        console.log('MonthYearPicker.selectMonth() called with month:', month);

        // Update global state
        currentMonth = month;
        currentYear = this.pickerYear;

        // Update date display
        updateDateDisplay();

        // Update hidden selects for compatibility
        document.getElementById('yearSelect').value = currentYear;
        document.getElementById('monthSelect').value = currentMonth;

        // Refresh calendar
        await updateCalendar();

        // Update URL params
        updateUrlParams();

        // Update holiday stripes if available
        if (typeof HolidayFeature !== 'undefined' && HolidayFeature.updateHolidayStripes) {
            setTimeout(() => HolidayFeature.updateHolidayStripes(), 100);
        }

        // Hide picker
        this.hide();

        console.log('Calendar updated to:', currentMonth, currentYear);
    },

    navigateYear(direction) {
        console.log('MonthYearPicker.navigateYear() called with direction:', direction);

        if (direction === 'prev' && this.pickerYear > 2025) {
            this.pickerYear--;
        } else if (direction === 'next' && this.pickerYear < 2030) {
            this.pickerYear++;
        }

        // Update year display
        document.getElementById('pickerYearDisplay').textContent = this.pickerYear;

        // Update month grid highlighting
        this.updateMonthGrid();

        // Update button states
        const prevBtn = document.getElementById('pickerYearPrev');
        const nextBtn = document.getElementById('pickerYearNext');

        if (prevBtn) {
            prevBtn.disabled = this.pickerYear <= 2025;
        }
        if (nextBtn) {
            nextBtn.disabled = this.pickerYear >= 2030;
        }

        console.log('Picker year changed to:', this.pickerYear);
    },

    updateMonthGrid() {
        console.log('MonthYearPicker.updateMonthGrid() called');
        const monthButtons = document.querySelectorAll('.month-btn');

        monthButtons.forEach(btn => {
            const btnMonth = parseInt(btn.dataset.month);

            // Highlight if this is the current month and picker is showing current year
            if (btnMonth === currentMonth && this.pickerYear === currentYear) {
                btn.classList.add('current');
            } else {
                btn.classList.remove('current');
            }
        });
    },

    positionPicker() {
        const dateDisplay = document.getElementById('dateDisplay');
        const picker = document.getElementById('monthYearPicker');

        if (!dateDisplay || !picker) {
            console.warn('Elements for positioning not found');
            return;
        }

        const rect = dateDisplay.getBoundingClientRect();
        const pickerWidth = 280;

        // Position below date display
        picker.style.top = `${rect.bottom + 8}px`;

        // Center horizontally under date display
        let left = rect.left + (rect.width / 2) - (pickerWidth / 2);

        // Check right boundary
        if (left + pickerWidth > window.innerWidth - 20) {
            left = window.innerWidth - pickerWidth - 20;
        }

        // Check left boundary
        if (left < 20) {
            left = 20;
        }

        picker.style.left = `${left}px`;

        console.log('Picker positioned at:', { top: picker.style.top, left: picker.style.left });
    }
};

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
        
        // Normalize user IDs to strings to ensure consistent type matching
        staticData.users = users.map(u => ({ ...u, id: String(u.id) }));
        console.log('Benutzer geladen:', users.length, '(IDs normalized to strings)');
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

        // Initialize shifts metadata structure if needed
        if (!staticData.shifts) staticData.shifts = {};
        if (!staticData.shifts[year]) staticData.shifts[year] = {};
        if (!staticData.shifts[year][month]) staticData.shifts[year][month] = {};

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

            // Store shift metadata (including lock timestamps) separately
            if (!staticData.shifts[year][month][day]) {
                staticData.shifts[year][month][day] = {};
            }

            const shiftMetadata = {
                user1_locked_at: shift.user1_locked_at || null,
                user2_locked_at: shift.user2_locked_at || null
            };

            if (shift.shift_type === 'E1') {
                // Normalize user IDs to strings for consistent type matching
                staticData.schedules[year][month][day].E1[0] = shift.user1_id ? String(shift.user1_id) : "";
                staticData.schedules[year][month][day].E1[1] = shift.user2_id ? String(shift.user2_id) : "";
                staticData.schedules[year][month][day].notes.E1[0] = shift.note1 || "";
                staticData.schedules[year][month][day].notes.E1[1] = shift.note2 || "";
                staticData.shifts[year][month][day].E1 = shiftMetadata;
            } else if (shift.shift_type === 'E2') {
                // Normalize user IDs to strings for consistent type matching
                staticData.schedules[year][month][day].E2[0] = shift.user1_id ? String(shift.user1_id) : "";
                staticData.schedules[year][month][day].E2[1] = shift.user2_id ? String(shift.user2_id) : "";
                staticData.schedules[year][month][day].notes.E2[0] = shift.note1 || "";
                staticData.schedules[year][month][day].notes.E2[1] = shift.note2 || "";
                staticData.shifts[year][month][day].E2 = shiftMetadata;
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
        
        // Send API request to create user - use URL token for server compatibility
        const url = AuthManager.addTokenToUrl('api/users.php');
        const response = await AuthManager.fetchWithAuth(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
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
        console.log(`DEBUG: Starting user deletion for ID: ${userId}`);
        console.log(`DEBUG: Current auth status:`, AuthManager.isAuthenticated());
        console.log(`DEBUG: Current user:`, AuthManager.getCurrentUser());
        console.log(`DEBUG: Current token:`, AuthManager.getToken());
        
        // First, call the API to delete the user from the database
        // Add token to URL for server compatibility
        const url = AuthManager.addTokenToUrl(`api/users.php?id=${userId}`);
        
        const response = await AuthManager.fetchWithAuth(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`DEBUG: Response status: ${response.status}`);
        console.log(`DEBUG: Response headers:`, response.headers);
        
        // Check if the API call was successful
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`DEBUG: Delete failed with error:`, errorData);
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
            'isSpecialist': 'is_specialist',
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
        
        // Send API request to update user - use URL token for server compatibility
        const url = AuthManager.addTokenToUrl(`api/users.php?id=${userId}`);
        const response = await AuthManager.fetchWithAuth(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
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
            if (property === 'isStarter' || property === 'isSchreibdienst' || property === 'isSpecialist') {
                staticData.users[userIndex][property] = value === true || value === 'true' || value === 1;
            } else {
                staticData.users[userIndex][property] = value;
            }
            
            console.log(`Lokale Daten für Benutzer ${userId} aktualisiert:`, staticData.users[userIndex]);
            
            // If this is a flag change that affects colors or display, update all day cards
            if (property === 'isStarter' || property === 'isSchreibdienst' || property === 'isSpecialist') {
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

// Update user specialist flag (using the general function)
async function updateUserSpecialist(userId, isSpecialist) {
    // Convert checkbox boolean to integer for API if needed
    const value = typeof isSpecialist === 'boolean' ? isSpecialist : !!isSpecialist;
    await updateUserProperty(userId, 'isSpecialist', value);
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
async function updateShift(day, shift, position, userId, note, forceEdit = false) {
    try {
        console.log(`Updating shift: day=${day}, shift=${shift}, position=${position}, userId=${userId}, force=${forceEdit}`);

        // Format the date to YYYY-MM-DD
        const date = new Date(Date.UTC(currentYear, currentMonth - 1, day, 12, 0, 0));
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Prepare data for API
        const shiftData = {
            date: formattedDate,
            shift_type: shift,
            position: position + 1, // Convert 0-based to 1-based
            user_id: userId,
            note: note || '',
            force: forceEdit
        };

        // Use server-compatible authentication with token in URL
        const url = AuthManager.addTokenToUrl('api/shifts.php');
        const response = await AuthManager.fetchWithAuth(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shiftData)
        });

        if (!response.ok) {
            const errorData = await response.json();

            // Check if this is a lock error (HTTP 423)
            if (response.status === 423 && errorData.error === 'locked') {
                // Show confirmation dialog
                const confirmed = await showLockConfirmation(errorData.user_name);

                if (confirmed) {
                    // Retry with force flag
                    return await updateShift(day, shift, position, userId, note, true);
                } else {
                    // User cancelled - reload shifts to reset UI
                    await loadScheduleData(currentYear, currentMonth);
                    await refreshShiftUI(day, false);
                    return false; // Return false to indicate cancellation
                }
            }

            throw new Error(errorData.error || 'Fehler beim Aktualisieren der Schicht');
        }

        // Update local data
        ensureScheduleDataExists(day);
        // Normalize userId to string for consistent type matching
        const normalizedUserId = userId ? String(userId) : "";
        staticData.schedules[currentYear][currentMonth][day][shift][position] = normalizedUserId;
        if (typeof note !== 'undefined') {
            staticData.schedules[currentYear][currentMonth][day].notes[shift][position] = note;
        }

        // Update UI with full refresh to ensure names are displayed correctly
        // Using refreshShiftUI instead of just updateDayCard for complete refresh
        // Don't show notification for automatic updates (only when user clicks "Speichern")
        await refreshShiftUI(day, false);

        console.log(`Updated shift ${shift} position ${position+1} for ${formattedDate} to user ${userId}`);
        return true; // Return true to indicate success
    } catch (error) {
        console.error('Error updating shift:', error);
        // Show error to user
        NotificationSystem.error(`Fehler beim Aktualisieren der Schicht: ${error.message}`);
        return false; // Return false on error
    }
}

// Function to refresh all UI elements after shift changes
async function refreshShiftUI(day, showNotification = true) {
    try {
        console.log(`Refreshing UI for day ${day}`);
        
        // Check if user data needs reloading (if it's missing or empty)
        if (!staticData.users || staticData.users.length === 0) {
            console.log('User data missing or empty, reloading...');
            await loadUsers();
            console.log(`User data reloaded, total users: ${staticData.users.length}`);
        } else {
            console.log(`User data already loaded, ${staticData.users.length} users available`);
        }
        
        // Update the specific day card (colors and styling)
        updateDayCard(day);
        
        // Force name rendering if names are enabled
        if (showUserNames) {
            const calendar = document.getElementById('calendar');
            const dayCards = Array.from(calendar.getElementsByClassName('day-card'));
            const dayCard = dayCards.find(card => parseInt(card.dataset.day) === day);
            
            if (dayCard) {
                const shiftLeft = dayCard.querySelector('.shift-left');
                const shiftRight = dayCard.querySelector('.shift-right');
                
                // Ensure schedule data exists
                ensureScheduleDataExists(day);
                const dayData = staticData.schedules[currentYear][currentMonth][day];
                
                if (dayData && shiftLeft && shiftRight) {
                    console.log(`Re-rendering names for day ${day}`, dayData);
                    
                    // Re-render names for both shifts
                    renderUserNamesInShifts(shiftLeft, dayData.E1, 'E1');
                    renderUserNamesInShifts(shiftRight, dayData.E2, 'E2');
                }
            }
        }
        
        // Delayed hover info refresh to ensure data is ready
        setTimeout(() => {
            const hoverPanel = document.getElementById('hoverInfoPanel');
            if (hoverPanel && hoverPanel.classList.contains('visible')) {
                console.log(`Refreshing hover info for day ${day}`);
                // Force complete rebuild of hover info
                updateHoverInfo(day, true);
            }
        }, 200); // Increased delay to allow user data to be processed
        
        // Update calendar highlights to ensure proper user highlighting
        updateCalendarHighlights();
        
        // Update the user list display in case user assignments affected availability
        updateUserList();
        
        // Force a visual refresh of the calendar
        const calendar = document.getElementById('calendar');
        if (calendar) {
            // Trigger a reflow to ensure all changes are applied
            calendar.offsetHeight;
        }
        
        console.log(`UI refresh completed for day ${day}`);
        
        // Show success notification only when explicitly requested (e.g., user clicks "Speichern")
        if (showNotification) {
            NotificationSystem.success('Einsatz erfolgreich eingetragen. Vielen Dank.');
        }
        
    } catch (error) {
        console.error('Error refreshing UI:', error);
        NotificationSystem.error('Fehler beim Aktualisieren der Anzeige');
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
        select.addEventListener('change', async (e) => {
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
                
                // Update the shift with the API (now properly awaited)
                await updateShift(currentDay, shift, position, newValue, note);
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
    calendar.innerHTML = '<div class="loading-indicator">Kalenderdaten werden geladen...</div>';
    
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
            console.log('🏖️ Loading holidays from updateCalendar');
            await HolidayFeature.loadHolidays();
        } else {
            console.warn('🏖️ HolidayFeature not available or loadHolidays function missing');
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
            calendar.innerHTML = '<div class="error-message">Fehler beim Laden der Kalenderdaten. Bitte versuchen Sie es erneut.</div>';
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

        // Update the date navigator display
        updateDateDisplay();

        // Set up UI and event handlers
        setupUI();
        
        // THEN update the calendar
        await updateCalendar();
        
        // Force holiday stripe update after initial calendar load
        if (typeof HolidayFeature !== 'undefined' && HolidayFeature.updateHolidayStripes) {
            console.log('🏖️ Force updating holiday stripes after initial calendar load');
            setTimeout(() => {
                HolidayFeature.updateHolidayStripes();
            }, 500); // Small delay to ensure DOM is fully rendered
        }
        
        // Initialize color customization LAST, so it doesn't block anything else
        if (typeof ColorCustomization !== 'undefined') {
            ColorCustomization.init();  // Don't await this
        }
        
        // Continue with other UI setup
        addFreezeButton();
        setupEventListeners();
        MonthYearPicker.init();
        setupMobileMenu();
        updateUserList();
        initializeDeleteConfirmation();
        updateCurrentDayDisplay();
        setupCalendarHoverListener();
        initializeUserForm();
        
        
        // Initialize modules if they exist
        if (typeof HolidayFeature !== 'undefined') {
            console.log('🏖️ Initializing HolidayFeature');
            await HolidayFeature.init();
            console.log('🏖️ HolidayFeature initialized');
        } else {
            console.warn('🏖️ HolidayFeature not found during initialization');
        }

        // Initialize Specialist Events Feature
        if (typeof SpecialistEventsFeature !== 'undefined') {
            console.log('[SPECIALIST] Initializing SpecialistEventsFeature');
            await SpecialistEventsFeature.init();
            console.log('[SPECIALIST] SpecialistEventsFeature initialized');
        } else {
            console.warn('[SPECIALIST] SpecialistEventsFeature not found during initialization');
        }

        // Force another setupUI call to ensure button visibility is correct
        console.log('initializeApp: Calling setupUI again to ensure proper button visibility');
        setupUI();
        
        // Also call refreshButtonStates to be absolutely sure
        refreshButtonStates();
        
        // Make refreshButtonStates available globally for debugging
        window.refreshButtonStates = refreshButtonStates;
        
        // Create debug function to check current state
        window.debugButtonStates = function() {
            const isAuthenticated = AuthManager.isAuthenticated();
            const currentUser = AuthManager.getCurrentUser();
            const isBackoffice = isAuthenticated && currentUser && currentUser.role === 'Backoffice';
            const isMobileView = window.innerWidth <= 768;
            const exportButton = document.getElementById('exportCalendar');
            
            console.log('DEBUG BUTTON STATES:', {
                isAuthenticated,
                currentUser: currentUser ? currentUser.name : 'none',
                role: currentUser ? currentUser.role : 'none',
                isBackoffice,
                isMobileView,
                windowWidth: window.innerWidth,
                exportButton: exportButton ? {
                    display: exportButton.style.display,
                    visibility: exportButton.style.visibility,
                    computedDisplay: window.getComputedStyle(exportButton).display,
                    computedVisibility: window.getComputedStyle(exportButton).visibility
                } : 'not found'
            });
        };
        
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

        // Initialize names toggle button state and body class
        updateNamesToggleButton();
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error message to user
        document.body.innerHTML = `
            <div class="error-container">
                <h2>Fehler beim Laden der Anwendung</h2>
                <p>Es gab ein Problem bei der Verbindung zum Server. Bitte versuchen Sie es später erneut.</p>
                <p class="error-details">${error.message}</p>
                <button onclick="location.reload()">Erneut versuchen</button>
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
        
        const url = AuthManager.addTokenToUrl('api/calendar_state.php');
        const response = await AuthManager.fetchWithAuth(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                year: currentYear,
                month: currentMonth,
                is_frozen: newState
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fehler beim Aktualisieren des Kalenderstatus');
        }
        
        const state = await response.json();
        isCalendarFrozen = state.is_frozen;
        frozenBy = state.frozen_by;
        frozenAt = state.frozen_at;
        
        // Update UI to reflect the new state
        updateFrozenStateUI();
        
        // Show a message to confirm the action
        const message = isCalendarFrozen 
            ? `Kalender für ${getMonthName(currentMonth)} ${currentYear} wurde gesperrt.`
            : `Kalender für ${getMonthName(currentMonth)} ${currentYear} wurde entsperrt.`;
        
        if (isCalendarFrozen) {
            NotificationSystem.info(message, 'Kalender gesperrt');
        } else {
            NotificationSystem.success(message, 'Kalender entsperrt');
        }
        
    } catch (error) {
        console.error('Error toggling calendar state:', error);
        NotificationSystem.error(`Fehler beim Aktualisieren des Kalenderstatus: ${error.message}`);
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
            document.title = `🔒 ${getMonthName(currentMonth)} ${currentYear} - Einsatzplan`;
            
            
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
            document.title = `Einsatzplan - ${getMonthName(currentMonth)} ${currentYear}`;
            
            
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
    freezeBtn.className = 'button-nav button-freeze'; 
    // Only include the icon span, no button-text span
    freezeBtn.innerHTML = '<span class="button-icon">🔓</span>';
    freezeBtn.title = 'Kalender sperren';
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
    // Korrigiert: Entferne den doppelten "einsatzplan" Pfad
    let url = `api/ical.php?year=${currentYear}&month=${currentMonth}`;
    
    // Add user ID if specified
    if (userId) {
        url += `&user_id=${userId}`;
    }
    
    // Open the URL in a new tab
    window.open(url, '_blank');
}

// Function to generate an iCal feed URL
function getIcalFeedUrl(userId = null) {
    // Monthly feed URL (backward compatibility)
    let url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}api/ical.php?year=${currentYear}&month=${currentMonth}&feed=true`;
    
    // Add user ID if specified
    if (userId) {
        url += `&user_id=${userId}`;
    }
    
    return url;
}

function getContinuousIcalFeedUrl(userId = null) {
    // Continuous subscription URL (no year/month parameters)
    let url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}api/ical.php`;
    
    // Add user ID if specified
    if (userId) {
        url += `?user_id=${userId}`;
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
                    <h2>Einsätze exportieren</h2>
                    <button class="export-modal-close">&times;</button>
                </div>
                <div class="export-modal-body">
                    <p class="export-description">
                        Abonniere den GGG Wegweiser Einsatzplan in deinem persönlichen 
                        Kalender und mache ihn auf deinem Gerät verfügbar.
                    </p>
                    
                    <h3>Wie geht das?</h3>
                    <p class="instructions">
                        Kopiere folgende URL und trage sie in deine Kalender-App ein.
                    </p>
                    
                    <div class="subscription-section">
                        <label class="subscription-label">URL für deine Einsätze</label>
                        <div class="subscription-row-single">
                            <select id="userDropdown" class="user-dropdown">
                                <option value="">Deine Einsätze auswählen</option>
                            </select>
                        </div>
                        <input type="text" id="userFeedUrl" class="url-input" readonly>
                        <button id="copyUserFeedBtn" class="copy-button copy-button-standalone">COPY</button>
                    </div>
                    
                    <div class="subscription-section">
                        <label class="subscription-label">URL für alle Einsätze</label>
                        <div class="subscription-row">
                            <input type="text" id="allFeedUrl" class="url-input" readonly placeholder="URL....">
                            <button id="copyAllFeedBtn" class="copy-button">COPY</button>
                        </div>
                    </div>
                    
                    <div class="calendar-instructions">
                        <p><strong>Apple Kalender:</strong><br>
                        Datei > Neues Kalenderabonnement</p>
                        
                        <p><strong>Google Kalender:</strong><br>
                        Einstellungen > Kalender hinzufügen > Per URL</p>
                        
                        <p><strong>Outlook:</strong><br>
                        Kalender hinzufügen > Aus dem Web abonnieren</p>
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
        
        // Populate user dropdown
        const userDropdown = document.getElementById('userDropdown');
        userDropdown.innerHTML = '<option value="">Deine Einsätze auswählen</option>';
        
        // Sort users alphabetically by name
        const sortedUsers = [...staticData.users].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        sortedUsers.forEach(user => {
            if (!user.active) return;
            
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            
            // Mark special user types
            if (user.isStarter) {
                option.textContent += ' (Starter)';
            }
            if (user.isSchreibdienst) {
                option.textContent += ' (Schreibdienst)';
            }
            
            userDropdown.appendChild(option);
        });
        
        // Handle user dropdown change
        userDropdown.addEventListener('change', (e) => {
            const userId = e.target.value;
            const userFeedUrl = document.getElementById('userFeedUrl');
            const copyUserFeedBtn = document.getElementById('copyUserFeedBtn');
            
            if (userId) {
                userFeedUrl.value = getContinuousIcalFeedUrl(userId);
                userFeedUrl.style.display = 'block';
                copyUserFeedBtn.disabled = false;
            } else {
                userFeedUrl.value = '';
                userFeedUrl.style.display = 'none';
                copyUserFeedBtn.disabled = true;
            }
        });
        
        // Copy feed URL buttons
        const copyAllFeedBtn = document.getElementById('copyAllFeedBtn');
        copyAllFeedBtn.addEventListener('click', () => {
            const allFeedUrl = document.getElementById('allFeedUrl');
            navigator.clipboard.writeText(allFeedUrl.value).then(() => {
                copyAllFeedBtn.textContent = 'COPIED!';
                setTimeout(() => {
                    copyAllFeedBtn.textContent = 'COPY';
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                allFeedUrl.select();
                document.execCommand('copy');
                copyAllFeedBtn.textContent = 'COPIED!';
                setTimeout(() => {
                    copyAllFeedBtn.textContent = 'COPY';
                }, 2000);
            });
        });
        
        const copyUserFeedBtn = document.getElementById('copyUserFeedBtn');
        copyUserFeedBtn.disabled = true; // Initially disabled
        copyUserFeedBtn.addEventListener('click', () => {
            const userFeedUrl = document.getElementById('userFeedUrl');
            navigator.clipboard.writeText(userFeedUrl.value).then(() => {
                copyUserFeedBtn.textContent = 'COPIED!';
                setTimeout(() => {
                    copyUserFeedBtn.textContent = 'COPY';
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                userFeedUrl.select();
                document.execCommand('copy');
                copyUserFeedBtn.textContent = 'COPIED!';
                setTimeout(() => {
                    copyUserFeedBtn.textContent = 'COPY';
                }, 2000);
            });
        });
    }
    
    // Initialize feed URLs
    const allFeedUrl = document.getElementById('allFeedUrl');
    allFeedUrl.value = getContinuousIcalFeedUrl();
    
    // Initialize user feed URL as hidden
    const userFeedUrl = document.getElementById('userFeedUrl');
    userFeedUrl.style.display = 'none';
    
    // Show the modal
    document.getElementById('exportModal').style.display = 'block';
}


// Function to populate user dropdowns in the shift detail modal
function populateUserDropdowns() {
    document.querySelectorAll('.user-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Eintragen</option>';
        
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
        
        // Update "Austragen" link visibility based on current value
        const removeLink = select.parentElement?.querySelector('.shift-remove-link');
        if (removeLink) {
            removeLink.style.display = select.value ? 'inline' : 'none';
        }
    });
}

// Set up event listeners for controls and modals
function setupEventListeners() {
    // Date Navigator Chevron Buttons
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    console.log('Setting up date navigator buttons:', { prevMonthBtn, nextMonthBtn });

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', async (e) => {
            console.log('Previous month clicked');
            e.preventDefault();
            e.stopPropagation();
            navigateMonth('prev');
            await updateCalendar();
            updateUrlParams();

            // Update holiday stripes after month change
            if (typeof HolidayFeature !== 'undefined' && HolidayFeature.updateHolidayStripes) {
                setTimeout(() => HolidayFeature.updateHolidayStripes(), 100);
            }
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', async (e) => {
            console.log('Next month clicked');
            e.preventDefault();
            e.stopPropagation();
            navigateMonth('next');
            await updateCalendar();
            updateUrlParams();

            // Update holiday stripes after month change
            if (typeof HolidayFeature !== 'undefined' && HolidayFeature.updateHolidayStripes) {
                setTimeout(() => HolidayFeature.updateHolidayStripes(), 100);
            }
        });
    }

    // Optional: Click on date display to show month/year pickers
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        dateDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            MonthYearPicker.show();
        });
    }

    // Year selection
    document.getElementById('yearSelect').addEventListener('change', async (e) => {
        currentYear = parseInt(e.target.value);
        updateDateDisplay(); // Update the display text
        await updateCalendar();
        updateUrlParams();

        // Update holiday stripes after year change
        if (typeof HolidayFeature !== 'undefined' && HolidayFeature.updateHolidayStripes) {
            setTimeout(() => HolidayFeature.updateHolidayStripes(), 100);
        }
    });

    // Month selection
    document.getElementById('monthSelect').addEventListener('change', async (e) => {
        currentMonth = parseInt(e.target.value);
        updateDateDisplay(); // Update the display text
        await updateCalendar();
        updateUrlParams();

        // Update holiday stripes after month change
        if (typeof HolidayFeature !== 'undefined' && HolidayFeature.updateHolidayStripes) {
            setTimeout(() => HolidayFeature.updateHolidayStripes(), 100);
        }
    });

    // Export Modal
    document.getElementById('exportCalendar').addEventListener('click', showExportModal);
    
    // User management modal (navbar version - may not exist)
    const manageUsersBtn = document.getElementById('manageUsers');
    if (manageUsersBtn) {
        manageUsersBtn.addEventListener('click', () => {
            document.getElementById('userModal').style.display = 'block';
            updateUserTable();

            // Initialize form AFTER the modal is displayed
            setTimeout(() => initializeUserForm(), 100);
        });
    }

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

    // Names toggle button handler
    const namesToggleButton = document.getElementById('namesToggleButton');
    if (namesToggleButton) {
        namesToggleButton.addEventListener('click', function() {
            showUserNames = !showUserNames;
            updateNamesToggleButton();
            updateAllDayCards();
        });
    }

    // Mobile device detection function
    function isMobileDevice() {
        return window.innerWidth <= 768;
    }

    // Mobile names toggle overlay functionality
    function setupMobileNamesToggleOverlay() {
        const overlay = document.getElementById('mobileNamesToggleOverlay');
        if (!overlay) return;

        // Mobile device detection function  
        function isMobileDevice() {
            return window.innerWidth <= 768;
        }

        // Elements that should NOT trigger the names toggle
        const excludedSelectors = [
            '.calendar', '.calendar *', // Calendar and all its children
            'button', 'input', 'select', 'textarea', 'a', // Interactive elements
            '.modal', '.modal *', // Modals and their contents
            '.user-list-panel', '.user-list-panel *', // User panel
            '.sidebar-overlay', '.sidebar-overlay *', // Sidebar overlay
            '#sidebarOverlay', // Sidebar overlay by ID
            '.navbar-controls', '.navbar-controls *', // Navigation controls
            '.hover-info-panel', '.hover-info-panel *', // Hover info
            '.shift-left', '.shift-right', // Shift containers
            '.day-card', '.day-card *', // Day cards and their contents
            '.top-navbar', '.top-navbar *', // Top navigation
            '.mobile-menu-buttons', '.mobile-menu-buttons *' // Mobile menu buttons
        ];

        // Handle overlay click
        function handleOverlayClick(event) {
            // Only handle on mobile devices
            if (!isMobileDevice()) {
                return;
            }

            // Check if the clicked element or any of its parents match excluded selectors
            for (const selector of excludedSelectors) {
                if (event.target.matches(selector) || event.target.closest(selector)) {
                    return; // Don't trigger toggle
                }
            }

            // Toggle names
            showUserNames = !showUserNames;
            updateNamesToggleButton();
            updateAllDayCards();
        }

        // Add click event listener to overlay
        overlay.addEventListener('click', handleOverlayClick);
    }

    // Initialize mobile names toggle overlay
    setupMobileNamesToggleOverlay();

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

// Function to update the names toggle button text and state
function updateNamesToggleButton() {
    const button = document.getElementById('namesToggleButton');
    if (button) {
        const textElement = button.querySelector('.toggle-text');
        if (textElement) {
            textElement.textContent = showUserNames ? 'Namen ausblenden' : 'Namen anzeigen';
        }
    }

    // Toggle body class to hide/show additional elements via CSS
    // When names are VISIBLE, hide other elements for a cleaner view
    if (showUserNames) {
        document.body.classList.add('names-visible');
    } else {
        document.body.classList.remove('names-visible');
    }
}

// Function to update all day cards to show/hide names
function updateAllDayCards() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    const dayCards = calendar.querySelectorAll('.day-card');
    dayCards.forEach(dayCard => {
        const day = parseInt(dayCard.dataset.day);
        if (day) {
            updateDayCard(day);
        }
    });
    
    // Restore official holiday styling after updating day cards
    if (typeof OfficialHolidaysFeature !== 'undefined' && OfficialHolidaysFeature.updateOfficialHolidayIndicators) {
        OfficialHolidaysFeature.updateOfficialHolidayIndicators();
    }
    
    // Update holiday stripes after calendar is rendered
    if (typeof HolidayFeature !== 'undefined' && HolidayFeature.updateHolidayStripes) {
        console.log('🏖️ Updating holiday stripes after calendar render');
        HolidayFeature.updateHolidayStripes();
    }
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

    // Update modal title with circular badge
    const titleElement = modal.querySelector('.shift-detail-title');
    if (titleElement) {
        const formattedDate = GermanDateFormatter.formatMediumDate(new Date(currentYear, currentMonth - 1, day));
        titleElement.innerHTML = `<span class="shift-badge">${shiftType}</span>${formattedDate}`;
    }
    
    // Position the modal
    if (window.innerWidth > 768) {
        const rect = shiftElement.getBoundingClientRect();
        positionModal(modal, rect);
    }
    
    // Update user selects
    const selects = modal.querySelectorAll('.user-select');
    selects.forEach((select, index) => {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Eintragen';
        emptyOption.className = 'shift-empty';

        select.innerHTML = '';
        select.appendChild(emptyOption);

        let isAssigned = false;
        const currentUserId = dayData[shiftType][index];

        // Get lock timestamp for this position
        const shiftData = staticData.shifts?.[currentYear]?.[currentMonth]?.[day]?.[shiftType];
        const lockTimestamp = shiftData ? (index === 0 ? shiftData.user1_locked_at : shiftData.user2_locked_at) : null;

        staticData.users.forEach(user => {
            if (!user.active) return;

            const option = document.createElement('option');
            option.value = user.id;

            // Check if this user is currently assigned and locked
            const isThisUser = currentUserId === user.id;
            const isLocked = isThisUser && isShiftLocked(lockTimestamp);

            // Add lock emoji if locked
            option.textContent = isLocked ? `🔒 ${user.name}` : user.name;
            option.className = 'shift-assigned';

            if (isThisUser) {
                option.selected = true;
                isAssigned = true;
            }
            select.appendChild(option);
        });
        
        // Add CSS class to select based on assignment status
        select.className = `user-select ${isAssigned ? 'shift-assigned' : 'shift-empty'}`;

        // Store the original value for reverting on cancel
        select.setAttribute('data-original-value', currentUserId || '');

        // Update data attributes
        select.dataset.shift = shiftType;
        select.dataset.position = index + 1;
        
        // Update "Austragen" link visibility
        const removeLink = select.parentElement.querySelector('.shift-remove-link');
        if (removeLink) {
            removeLink.style.display = isAssigned ? 'inline' : 'none';
        }
        
        // Note: The actual change handler for updating shifts is in setupShiftDetailModal
        // This just updates the visual state and remove link visibility
        const updateVisualState = function() {
            const isNowAssigned = this.value ? true : false;
            this.className = `user-select ${isNowAssigned ? 'shift-assigned' : 'shift-empty'}`;
            
            // Update remove link visibility
            const removeLink = this.parentElement.querySelector('.shift-remove-link');
            if (removeLink) {
                removeLink.style.display = isNowAssigned ? 'inline' : 'none';
            }
        };
        
        // Remove old listener and add new one to avoid duplicates
        select.removeEventListener('change', updateVisualState);
        select.addEventListener('change', updateVisualState);
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
        const formattedDate = GermanDateFormatter.formatMediumDate(new Date(currentYear, currentMonth - 1, day));
        titleElement.innerHTML = `<span class="shift-badge">${shiftType}</span>${formattedDate} <span class="frozen-indicator">🔒</span>`;
    }
    
    // Position the modal
    if (window.innerWidth > 768) {
        const rect = shiftElement.getBoundingClientRect();
        positionModal(modal, rect);
    }
    
    // Update user selects - make them disabled
    const selects = modal.querySelectorAll('.user-select');
    selects.forEach((select, index) => {
        select.innerHTML = '<option value="">Eintragen</option>';
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
    
    // Add frozen message to modal
    if (!modal.querySelector('.frozen-message')) {
        const frozenMsg = document.createElement('div');
        frozenMsg.className = 'frozen-message';
        frozenMsg.innerHTML = 'Monat gesperrt. Einsatz kann nicht geändert werden.';
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
          console.log('Mobile logout clicked - calling logout and stopping execution');
          // Set flag immediately to prevent any further execution
          window._logoutInProgress = true;
          AuthManager.logout();
          return; // Stop execution immediately after logout
        } else {
          // Check if logout is in progress to prevent showLoginDialog
          if (window._logoutInProgress) {
            console.log('Logout in progress, ignoring showLoginDialog call');
            return;
          }
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

            // Add specialist button first (only if user is specialist)
            if (user.isSpecialist) {
                const specialistBtn = document.createElement('button');
                specialistBtn.className = 'specialist-btn';
                specialistBtn.innerHTML = 'S';
                specialistBtn.title = 'Specialist Einsätze verwalten';
                specialistBtn.setAttribute('data-user-id', user.id);

                // Add click handler for the specialist button
                specialistBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the user selection
                    if (typeof SpecialistEventsFeature !== 'undefined' && SpecialistEventsFeature.openSpecialistEventModal) {
                        SpecialistEventsFeature.openSpecialistEventModal(user.id);
                    } else {
                        console.error('SpecialistEventsFeature is not available');
                    }
                });

                userItem.appendChild(specialistBtn);
            }

            // Add holiday button after specialist button
            const holidayBtn = document.createElement('button');
            holidayBtn.className = 'holiday-btn';
            holidayBtn.innerHTML = '🏖️';
            holidayBtn.title = 'Ferien verwalten';
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
        select.addEventListener('change', async (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;

            // Store original value BEFORE calling updateShift
            const originalValue = e.target.getAttribute('data-original-value') || '';

            ensureScheduleDataExists(currentDay);

            // Update shift with the selected user
            const success = await updateShift(currentDay, shift, position, e.target.value,
                staticData.schedules[currentYear][currentMonth][currentDay].notes[shift][position]);

            // If updateShift returned false (user cancelled), revert the dropdown
            if (success === false) {
                e.target.value = originalValue;
            } else {
                // Update the stored original value for next time
                e.target.setAttribute('data-original-value', e.target.value);
            }
        });
    });
    
    // "Austragen" link click handlers
    modal.querySelectorAll('.shift-remove-link').forEach(removeLink => {
        removeLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the corresponding select element
            const select = removeLink.parentElement.querySelector('.user-select');
            if (select && select.value) {
                // Reset the dropdown to empty
                select.value = '';
                
                // Trigger the change event to update the backend and UI
                const changeEvent = new Event('change', { bubbles: true });
                select.dispatchEvent(changeEvent);
            }
        });
    });
    
    // Apply & Refresh button handler
    const saveButton = modal.querySelector('#shiftApplyRefresh');
    if (saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Disable button during refresh
            saveButton.disabled = true;
            saveButton.textContent = 'Speichern...';
            
            try {
                // Refresh the UI for the current day (now async)
                await refreshShiftUI(currentDay);
                
                // Close the modal after a brief delay to show the success message
                setTimeout(() => {
                    hideShiftDetailModal();
                }, 1000);
                
            } catch (error) {
                console.error('Error during refresh:', error);
                NotificationSystem.error('Fehler beim Aktualisieren');
            } finally {
                // Re-enable button
                saveButton.disabled = false;
                saveButton.textContent = 'Speichern';
            }
        });
    }
    
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
    
    // Add custom events to appropriate shifts based on time
    const customEvents = staticData.customEvents?.[currentYear]?.[currentMonth]?.[day] || [];

    // Clear any existing custom event elements
    const existingE1Events = shiftLeft?.querySelectorAll('.shift-custom-event');
    const existingE2Events = shiftRight?.querySelectorAll('.shift-custom-event');
    existingE1Events?.forEach(el => el.remove());
    existingE2Events?.forEach(el => el.remove());

    if (customEvents.length > 0) {
        customEvents.forEach(event => {
            // Parse time and determine if it's before 14:00
            const timeParts = event.time.split(':');
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            const totalMinutes = hour * 60 + minute;
            const cutoffMinutes = 14 * 60; // 14:00 in minutes

            // Format time for display
            const formattedTime = `${timeParts[0]}.${timeParts[1]}h`;

            // Create event element
            const eventElement = document.createElement('div');
            eventElement.className = 'shift-custom-event';
            eventElement.innerHTML = `
                 <div class="shift-custom-event-title">${event.title}</div>
                <div class="shift-custom-event-time">${formattedTime}</div>
            `;

            // Add to appropriate shift based on time
            if (totalMinutes < cutoffMinutes && shiftLeft) {
                // Event before 14:00 - add to E1 (shift-left)
                shiftLeft.appendChild(eventElement);
            } else if (shiftRight) {
                // Event at/after 14:00 - add to E2 (shift-right)
                shiftRight.appendChild(eventElement);
            }
        });
    }

    // Note: Specialist event indicators (dots) are handled by SpecialistEventsFeature.updateSpecialistEventIndicators()
    // No need to create hidden label elements here

    // Handle double assignment icons
    // Remove any existing icons first
    const existingE1Icon = shiftLeft?.querySelector('.double-assignment-icon');
    const existingE2Icon = shiftRight?.querySelector('.double-assignment-icon');
    existingE1Icon?.remove();
    existingE2Icon?.remove();

    // Add icon to E1 if it has exactly 2 users
    if (shiftLeft && e1Users.length === 2) {
        const iconE1 = document.createElement('div');
        iconE1.className = 'double-assignment-icon';
        shiftLeft.appendChild(iconE1);
    }

    // Add icon to E2 if it has exactly 2 users
    if (shiftRight && e2Users.length === 2) {
        const iconE2 = document.createElement('div');
        iconE2.className = 'double-assignment-icon';
        shiftRight.appendChild(iconE2);
    }

    // Handle user names display if enabled
    if (showUserNames) {
        renderUserNamesInShifts(shiftLeft, e1Users, 'E1');
        renderUserNamesInShifts(shiftRight, e2Users, 'E2');
    } else {
        // Remove any existing name elements
        clearUserNamesFromShift(shiftLeft);
        clearUserNamesFromShift(shiftRight);
    }
    
    // Restore "today" class if it was present
    if (wasToday) {
        dayCard.classList.add('today');
    }
}

// Helper function to render user names in a shift container
function renderUserNamesInShifts(shiftElement, userIds, shiftType) {
    if (!shiftElement || !userIds) return;
    
    // Clear any existing names first
    clearUserNamesFromShift(shiftElement);
    
    // Filter out empty user IDs
    const validUserIds = userIds.filter(userId => userId && userId !== '');
    if (validUserIds.length === 0) return;
    
    // Get user names
    const userNames = validUserIds.map(userId => {
        const user = staticData.users.find(u => u.id === userId);
        return user ? user.name : 'Unbekannt';
    }).filter(name => name);
    
    if (userNames.length === 0) return;
    
    // Create names container
    const namesContainer = document.createElement('div');
    namesContainer.className = 'shift-user-names';
    
    // Add multi-user class if more than one user
    if (userNames.length > 1) {
        namesContainer.classList.add('multi-user');
    }
    
    // Set the text content
    if (userNames.length === 1) {
        namesContainer.textContent = userNames[0];
    } else {
        // For multiple users, join with line breaks
        namesContainer.innerHTML = userNames.join('<br>');
    }
    
    // Add to shift element
    shiftElement.appendChild(namesContainer);
}

// Helper function to clear user names from a shift container
function clearUserNamesFromShift(shiftElement) {
    if (!shiftElement) return;
    
    const existingNames = shiftElement.querySelectorAll('.shift-user-names');
    existingNames.forEach(element => element.remove());
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

        // Helper function to check if a shift is double-assigned
        const isDoubleAssigned = (shiftData) => {
            if (!shiftData || !Array.isArray(shiftData)) return false;
            const nonEmptyUsers = shiftData.filter(userId => userId && userId !== null && userId !== '' && userId !== undefined);
            return nonEmptyUsers.length > 1;
        };

        // Handle E1 shift
        if (shiftE1) {
            // Remove all highlight classes first
            shiftE1.classList.remove('highlight-hover', 'highlight-selected', 'highlight-hover-single', 'highlight-selected-single', 'dimmed');
            
            if (hasHoveredUserE1) {
                if (isDoubleAssigned(dayData.E1)) {
                    shiftE1.classList.add('highlight-hover');
                } else {
                    shiftE1.classList.add('highlight-hover-single');
                }
            }
            
            if (hasSelectedUserE1) {
                if (isDoubleAssigned(dayData.E1)) {
                    shiftE1.classList.add('highlight-selected');
                } else {
                    shiftE1.classList.add('highlight-selected-single');
                }
            }
        }

        // Handle E2 shift
        if (shiftE2) {
            // Remove all highlight classes first
            shiftE2.classList.remove('highlight-hover', 'highlight-selected', 'highlight-hover-single', 'highlight-selected-single', 'dimmed');
            
            if (hasHoveredUserE2) {
                if (isDoubleAssigned(dayData.E2)) {
                    shiftE2.classList.add('highlight-hover');
                } else {
                    shiftE2.classList.add('highlight-hover-single');
                }
            }
            
            if (hasSelectedUserE2) {
                if (isDoubleAssigned(dayData.E2)) {
                    shiftE2.classList.add('highlight-selected');
                } else {
                    shiftE2.classList.add('highlight-selected-single');
                }
            }
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
                        <label class="flag-option">
                            <input type="checkbox" class="user-specialist"
                                   ${user.isSpecialist ? 'checked' : ''}>
                            <span>Specialist</span>
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

        // Specialist checkbox handler
        const specialistCheckbox = row.querySelector('.user-specialist');
        if (specialistCheckbox) {
            specialistCheckbox.addEventListener('change', function(e) {
                updateUserSpecialist(user.id, e.target.checked);
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
    if (user.isSpecialist) flags.push('Specialist');
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
            '<div class="shift-user">Einsatz unbelegt</div>';
    }

    if (e2Display) {
        e2Display.innerHTML = e2Users.length ?
            e2Users.map(name => `<div class="shift-user">${name}</div>`).join('') :
            '<div class="shift-user">Einsatz unbelegt</div>';
    }

    // Add holidays display
    const holidayData = getHolidaysForDate(currentYear, currentMonth, day);
    // Mark backoffice users before combining
    const markedFreiwillige = holidayData.freiwillige.map(user => ({...user, isBackoffice: false}));
    const markedBackoffice = holidayData.backoffice.map(user => ({...user, isBackoffice: true}));
    const allHolidayUsers = [...markedFreiwillige, ...markedBackoffice];

    if (allHolidayUsers.length > 0) {
        // Check if holidays section already exists
        let holidaysSection = hoverPanel.querySelector('.hover-info-holidays');
        if (!holidaysSection) {
            // Create holidays section
            holidaysSection = document.createElement('div');
            holidaysSection.className = 'hover-info-holidays';
            hoverPanel.querySelector('.hover-info-content').appendChild(holidaysSection);
        }

        // Create multi-column layout (max 2 users per column)
        const columns = [];
        for (let i = 0; i < allHolidayUsers.length; i += 2) {
            columns.push(allHolidayUsers.slice(i, i + 2));
        }

        // Update holidays content
        holidaysSection.innerHTML = `
            <div class="holidays-title">Ferien</div>
            <div class="holidays-columns">
                ${columns.map(column => `
                    <div class="holidays-column">
                        ${column.map(user => {
                            const backofficeClass = user.isBackoffice ? ' backoffice-holiday-user' : '';
                            return `<div class="holiday-user${backofficeClass}"><span class="holiday-user-text">${user.userName}</span></div>`;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // Remove holidays section if no users on holiday
        const holidaysSection = hoverPanel.querySelector('.hover-info-holidays');
        if (holidaysSection) {
            holidaysSection.remove();
        }
    }

    // Add specialist events to E1 and E2 displays (mixed with shift users)
    // Events before 14:00 go to E1, events at/after 14:00 go to E2
    const specialistEvents = staticData.specialistEvents?.[currentYear]?.[currentMonth]?.[day] || [];

    if (specialistEvents.length > 0) {
        const cutoffMinutes = 14 * 60; // 14:00 in minutes

        specialistEvents.forEach(event => {
            // Parse time to determine which shift
            const timeParts = event.time.split(':');
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            const totalMinutes = hour * 60 + minute;

            // Format time for display
            const formattedTime = `${timeParts[0]}.${timeParts[1]}h`;

            const specialistDiv = document.createElement('div');
            specialistDiv.className = 'shift-user';
            specialistDiv.style.backgroundColor = 'var(--color-specialist, #984afe)';
            specialistDiv.style.color = 'black';
            specialistDiv.style.fontWeight = 'bold';
            specialistDiv.textContent = `${event.userName} ${formattedTime}`;

            // Add to appropriate shift based on time
            if (totalMinutes < cutoffMinutes && e1Display) {
                // Event before 14:00 - add to E1
                e1Display.appendChild(specialistDiv);
            } else if (e2Display) {
                // Event at/after 14:00 - add to E2
                e2Display.appendChild(specialistDiv);
            }
        });
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

    // Check if calendar is frozen for this month (use global variable, not staticData)
    const isFrozen = isCalendarFrozen && !isBackofficeUser();

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

    // Get Specialist events for this day
    const specialistEvents = staticData.specialistEvents?.[currentYear]?.[currentMonth]?.[day] || [];

    // Separate specialist events by shift time (14:00 cutoff)
    const cutoffMinutes = 14 * 60; // 14:00 in minutes
    const e1SpecialistEvents = [];
    const e2SpecialistEvents = [];

    specialistEvents.forEach(event => {
        const timeParts = event.time.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1]);
        const totalMinutes = hour * 60 + minute;

        if (totalMinutes < cutoffMinutes) {
            e1SpecialistEvents.push(event);
        } else {
            e2SpecialistEvents.push(event);
        }
    });

    // Get lock timestamps for E1
    const e1Data = staticData.shifts?.[currentYear]?.[currentMonth]?.[day]?.E1;
    const e1Pos1Locked = e1Data && isShiftLocked(e1Data.user1_locked_at);
    const e1Pos2Locked = e1Data && isShiftLocked(e1Data.user2_locked_at);

    // Build infoContainer content with Schreibdienst events included
    infoContainer.innerHTML = `
        ${isFrozen ? '<div class="frozen-message">Monat gesperrt. Einsätze können nicht geändert werden.</div>' : ''}
        <div class="shift-columns">
            <div class="shift-column">
                <div class="shift-column-title">E1</div>
                <div class="mobile-shift-user-assignments">
                    <div class="mobile-shift-user-container">
                        <select class="mobile-user-select ${dayData.E1[0] ? 'shift-assigned' : 'shift-empty'}" data-shift="E1" data-position="1" data-original-value="${dayData.E1[0] || ''}" ${isFrozen ? 'disabled' : ''}>
                            <option value="" class="shift-empty">Eintragen</option>
                            ${staticData.users.filter(u => u.role === 'Freiwillige').map(user => {
                                const isSelected = dayData.E1[0] == user.id;
                                const isLocked = isSelected && e1Pos1Locked;
                                const lockIcon = isLocked ? '🔒 ' : '';
                                return `<option value="${user.id}" ${isSelected ? 'selected' : ''}>${lockIcon}${user.name}</option>`;
                            }).join('')}
                        </select>
                        <span class="mobile-shift-remove-link" style="display: ${dayData.E1[0] ? 'inline' : 'none'};">Austragen</span>
                    </div>
                    <div class="mobile-shift-user-container">
                        <select class="mobile-user-select ${dayData.E1[1] ? 'shift-assigned' : 'shift-empty'}" data-shift="E1" data-position="2" data-original-value="${dayData.E1[1] || ''}" ${isFrozen ? 'disabled' : ''}>
                            <option value="" class="shift-empty">Eintragen</option>
                            ${staticData.users.filter(u => u.role === 'Freiwillige').map(user => {
                                const isSelected = dayData.E1[1] == user.id;
                                const isLocked = isSelected && e1Pos2Locked;
                                const lockIcon = isLocked ? '🔒 ' : '';
                                return `<option value="${user.id}" ${isSelected ? 'selected' : ''}>${lockIcon}${user.name}</option>`;
                            }).join('')}
                        </select>
                        <span class="mobile-shift-remove-link" style="display: ${dayData.E1[1] ? 'inline' : 'none'};">Austragen</span>
                    </div>
                </div>
                ${e1SpecialistEvents.length > 0 ? `
                    <div class="specialist-events-list">
                        ${e1SpecialistEvents.map(event => {
                            // Format time to HH.MM format
                            const timeParts = event.time.split(':');
                            const formattedTime = `${timeParts[0]}.${timeParts[1]}`;
                            return `
                                <div class="specialist-event-mobile-item">
                                    ${event.userName} ${formattedTime}h
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
                ${e1Events.length > 0 ? `
                    <div class="shift-events-list">
                        ${e1Events.map(event => {
                            // More robust user finding with debugging
                            const creator = staticData.users.find(u => u.id == event.userId);
                            
                            // Debug log if user not found
                            if (!creator) {
                                console.log('Mobile E1: User not found for event:', {
                                    eventUserId: event.userId,
                                    eventUserIdType: typeof event.userId,
                                    availableUsers: staticData.users.map(u => ({id: u.id, idType: typeof u.id, name: u.name}))
                                });
                            }
                            
                            // Format time to HH.MM format
                            const timeParts = event.time.split(':');
                            const formattedTime = `${timeParts[0]}.${timeParts[1]}`;
                            return `
                                <div class="shift-event-item">
                                    <div class="shift-event-title">Schreibdienst Einsatz</div>
                                    <div class="shift-event-content">
                                        <div class="shift-event-time">${formattedTime} - ${event.details}</div>
                                        <div class="shift-event-creator">bei ${creator ? creator.name : 'Unbekannt'}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="shift-column">
                <div class="shift-column-title">E2</div>
                <div class="mobile-shift-user-assignments">
                    <div class="mobile-shift-user-container">
                        <select class="mobile-user-select ${dayData.E2[0] ? 'shift-assigned' : 'shift-empty'}" data-shift="E2" data-position="1" data-original-value="${dayData.E2[0] || ''}" ${isFrozen ? 'disabled' : ''}>
                            <option value="" class="shift-empty">Eintragen</option>
                            ${staticData.users.filter(u => u.role === 'Freiwillige').map(user => {
                                const isSelected = dayData.E2[0] == user.id;
                                const e2Data = staticData.shifts?.[currentYear]?.[currentMonth]?.[day]?.E2;
                                const isLocked = isSelected && e2Data && isShiftLocked(e2Data.user1_locked_at);
                                const lockIcon = isLocked ? '🔒 ' : '';
                                return `<option value="${user.id}" ${isSelected ? 'selected' : ''}>${lockIcon}${user.name}</option>`;
                            }).join('')}
                        </select>
                        <span class="mobile-shift-remove-link" style="display: ${dayData.E2[0] ? 'inline' : 'none'};">Austragen</span>
                    </div>
                    <div class="mobile-shift-user-container">
                        <select class="mobile-user-select ${dayData.E2[1] ? 'shift-assigned' : 'shift-empty'}" data-shift="E2" data-position="2" data-original-value="${dayData.E2[1] || ''}" ${isFrozen ? 'disabled' : ''}>
                            <option value="" class="shift-empty">Eintragen</option>
                            ${staticData.users.filter(u => u.role === 'Freiwillige').map(user => {
                                const isSelected = dayData.E2[1] == user.id;
                                const e2Data = staticData.shifts?.[currentYear]?.[currentMonth]?.[day]?.E2;
                                const isLocked = isSelected && e2Data && isShiftLocked(e2Data.user2_locked_at);
                                const lockIcon = isLocked ? '🔒 ' : '';
                                return `<option value="${user.id}" ${isSelected ? 'selected' : ''}>${lockIcon}${user.name}</option>`;
                            }).join('')}
                        </select>
                        <span class="mobile-shift-remove-link" style="display: ${dayData.E2[1] ? 'inline' : 'none'};">Austragen</span>
                    </div>
                </div>
                ${e2SpecialistEvents.length > 0 ? `
                    <div class="specialist-events-list">
                        ${e2SpecialistEvents.map(event => {
                            // Format time to HH.MM format
                            const timeParts = event.time.split(':');
                            const formattedTime = `${timeParts[0]}.${timeParts[1]}`;
                            return `
                                <div class="specialist-event-mobile-item">
                                    ${event.userName} ${formattedTime}h
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
                ${e2Events.length > 0 ? `
                    <div class="shift-events-list">
                        ${e2Events.map(event => {
                            // More robust user finding with debugging
                            const creator = staticData.users.find(u => u.id == event.userId);
                            
                            // Debug log if user not found
                            if (!creator) {
                                console.log('Mobile E2: User not found for event:', {
                                    eventUserId: event.userId,
                                    eventUserIdType: typeof event.userId,
                                    availableUsers: staticData.users.map(u => ({id: u.id, idType: typeof u.id, name: u.name}))
                                });
                            }
                            
                            // Format time to HH.MM format
                            const timeParts = event.time.split(':');
                            const formattedTime = `${timeParts[0]}.${timeParts[1]}`;
                            return `
                                <div class="shift-event-item">
                                    <div class="shift-event-title">Schreibdienst Einsatz</div>
                                    <div class="shift-event-content">
                                        <div class="shift-event-time">${formattedTime} - ${event.details}</div>
                                        <div class="shift-event-creator">bei ${creator ? creator.name : 'Unbekannt'}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Add custom events section
    const customEvents = staticData.customEvents?.[currentYear]?.[currentMonth]?.[day] || [];
    if (customEvents.length > 0) {
        const customEventsSection = `
            <div class="mobile-custom-events">
                <div class="mobile-custom-events-title">Veranstaltungen</div>
                <div class="mobile-custom-events-list">
                    ${customEvents.map(event => {
                        const timeParts = event.time.split(':');
                        const formattedTime = `${timeParts[0]}.${timeParts[1]}h`;
                        return `
                            <div class="mobile-custom-event-item">
                                <div class="mobile-custom-event-time">${formattedTime}</div>
                                <div class="mobile-custom-event-title">${event.title}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        infoContainer.innerHTML += customEventsSection;
    }

    // Add specialist events section (variable already declared at line 4147)
    if (specialistEvents.length > 0) {
        const specialistEventsSection = `
            <div class="mobile-specialist-events">
                <div class="mobile-specialist-events-title">Specialist Einsätze</div>
                <div class="mobile-specialist-events-list">
                    ${specialistEvents.map(event => {
                        const timeParts = event.time.split(':');
                        const formattedTime = `${timeParts[0]}.${timeParts[1]}h`;
                        return `
                            <div class="mobile-specialist-event-item">
                                <div class="mobile-specialist-event-time">${formattedTime}</div>
                                <div class="mobile-specialist-event-title">${event.title}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        infoContainer.innerHTML += specialistEventsSection;
    }

    // Add holidays section
    const holidays = getHolidaysForDate(currentYear, currentMonth, day);
    if (holidays.freiwillige.length > 0 || holidays.backoffice.length > 0) {
        let holidaysSection = `<div class="mobile-holidays">`;
        
        // Add Freiwillige holidays if any
        if (holidays.freiwillige.length > 0) {
            holidaysSection += `
                <div class="mobile-holidays-section">
                    <div class="mobile-holidays-title">Ferien Freiwillige</div>
                    <div class="mobile-holidays-list">
                        ${holidays.freiwillige.map(holiday => `
                            <div class="mobile-holiday-item">
                                <div class="mobile-holiday-name">${holiday.userName}</div>
                                <div class="mobile-holiday-dates">${holiday.dateRange}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Add Backoffice holidays if any
        if (holidays.backoffice.length > 0) {
            holidaysSection += `
                <div class="mobile-holidays-section">
                    <div class="mobile-holidays-title">Ferien Backoffice</div>
                    <div class="mobile-holidays-list">
                        ${holidays.backoffice.map(holiday => `
                            <div class="mobile-holiday-item">
                                <div class="mobile-holiday-name">${holiday.userName}</div>
                                <div class="mobile-holiday-dates">${holiday.dateRange}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        holidaysSection += `</div>`;
        infoContainer.innerHTML += holidaysSection;
    }

    // isFrozen already defined above
    
    // The dropdowns are now integrated into the main info display above
    // No separate dropdown section needed
    detailContainer.innerHTML = '';
    // After building the detailContainer content, add the date tab directly to the modal (not inside detailContainer)
    const dateTab = document.createElement('div');
    dateTab.className = 'mobile-date-tab';
    const date = new Date(currentYear, currentMonth - 1, day);
    const weekday = GermanDateFormatter.getWeekdayName(date);
    const formattedDate = GermanDateFormatter.formatMediumDate(date);
    dateTab.textContent = `${weekday}, ${formattedDate}`;
    
    // Add a lock icon to the date tab if the month is frozen
    if (isFrozen) {
        dateTab.innerHTML += ' <span style="margin-left: 5px;">🔒</span>';
    }

    modal.appendChild(dateTab);

    // Add frozen-modal class to the modal if frozen
    if (isFrozen) {
        modal.classList.add('frozen-modal');
    } else {
        modal.classList.remove('frozen-modal');
    }

    // Add close button to the mobile modal (reusing modal-close style)
    if (!modal.querySelector('.mobile-shift-close-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mobile-shift-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', hideMobileModal);
        modal.appendChild(closeBtn);
    }

    // Attach event listeners for the new mobile user selects in infoContainer
    infoContainer.querySelectorAll('.mobile-user-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const shift = e.target.dataset.shift;
            const position = parseInt(e.target.dataset.position) - 1;

            // Store original value BEFORE calling updateShift
            const originalValue = e.target.getAttribute('data-original-value') || '';

            console.log(`Mobile: Attempting to update shift: ${shift}, position: ${position}, value: ${e.target.value}`);

            // Make sure we have valid data
            if (!shift || isNaN(position)) {
                console.error('Invalid shift or position data', { shift, position });
                return;
            }

            // Update shift with new user (now properly awaited)
            const success = await updateShift(day, shift, position, e.target.value,
                        dayData.notes?.[shift]?.[position] || '');

            // If cancelled, revert
            if (success === false) {
                e.target.value = originalValue;
                const isAssigned = originalValue ? true : false;
                e.target.className = `mobile-user-select ${isAssigned ? 'shift-assigned' : 'shift-empty'}`;

                const removeLink = e.target.parentElement.querySelector('.mobile-shift-remove-link');
                if (removeLink) {
                    removeLink.style.display = isAssigned ? 'inline' : 'none';
                }
            } else {
                // Update stored value and visual state
                e.target.setAttribute('data-original-value', e.target.value);
                const isAssigned = e.target.value ? true : false;
                e.target.className = `mobile-user-select ${isAssigned ? 'shift-assigned' : 'shift-empty'}`;

                const removeLink = e.target.parentElement.querySelector('.mobile-shift-remove-link');
                if (removeLink) {
                    removeLink.style.display = isAssigned ? 'inline' : 'none';
                }
            }
        });
    });
    
    // Attach event listeners for mobile "Austragen" links  
    infoContainer.querySelectorAll('.mobile-shift-remove-link').forEach(removeLink => {
        removeLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the corresponding select element
            const select = removeLink.parentElement.querySelector('.mobile-user-select');
            if (select && select.value) {
                // Reset the dropdown to empty
                select.value = '';
                
                // Trigger the change event to update the backend and UI
                const changeEvent = new Event('change', { bubbles: true });
                select.dispatchEvent(changeEvent);
            }
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

// Get detailed holiday information for mobile modal display
function getHolidaysForDate(year, month, day) {
    const result = {
        freiwillige: [],
        backoffice: []
    };
    
    // Check if staticData and holidays exist
    if (!staticData || !staticData.holidays || !staticData.users) {
        console.log(`🏖️ getHolidaysForDate: Missing data - staticData: ${!!staticData}, holidays: ${!!staticData?.holidays}, users: ${!!staticData?.users}`);
        return result;
    }
    
    
    // Format the target date as YYYY-MM-DD for string comparison
    const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Iterate through all users' holidays
    Object.keys(staticData.holidays).forEach(userIdKey => {
        const userHolidays = staticData.holidays[userIdKey];
        if (!userHolidays) return;
        
        // Find the user to get name and role - userIdKey is a string, u.id might be number
        const user = staticData.users.find(u => String(u.id) === userIdKey);
        if (!user) return;
        
        // Check each holiday period for this user
        userHolidays.forEach(holiday => {
            // Use string comparison for YYYY-MM-DD format dates
            if (targetDateStr >= holiday.start && targetDateStr <= holiday.end) {
                // Format dates for display (DD.MM format)
                const startDate = new Date(holiday.start);
                const endDate = new Date(holiday.end);
                const formattedStart = `${String(startDate.getDate()).padStart(2, '0')}.${String(startDate.getMonth() + 1).padStart(2, '0')}`;
                const formattedEnd = `${String(endDate.getDate()).padStart(2, '0')}.${String(endDate.getMonth() + 1).padStart(2, '0')}`;
                
                const holidayInfo = {
                    userName: user.name,
                    dateRange: `${formattedStart} - ${formattedEnd}`,
                    userId: parseInt(userIdKey)
                };
                
                // Sort into appropriate category based on user role
                if (user.role === 'Backoffice') {
                    result.backoffice.push(holidayInfo);
                } else {
                    result.freiwillige.push(holidayInfo);
                }
            }
        });
    });
    
    return result;
}

// Hide mobile modal
function hideMobileModal() {
    const modal = document.getElementById('mobileShiftModal');
    const overlay = document.getElementById('mobileModalOverlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// Legend Modal Functions
function showLegendModal() {
    const modal = document.getElementById('legendModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideLegendModal() {
    const modal = document.getElementById('legendModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function initializeLegendModal() {
    const desktopButton = document.getElementById('legendToggleButton');
    const mobileButton = document.getElementById('mobileLegendButton');
    const closeButton = document.getElementById('legendCloseButton');
    const overlay = document.getElementById('legendOverlay');

    // Desktop legend button event listener
    if (desktopButton) {
        desktopButton.addEventListener('click', showLegendModal);
    }

    // Mobile legend button event listener (now in top controls)
    if (mobileButton) {
        mobileButton.addEventListener('click', showLegendModal);
    }

    // Close button event listener
    if (closeButton) {
        closeButton.addEventListener('click', hideLegendModal);
    }

    // Overlay click event listener
    if (overlay) {
        overlay.addEventListener('click', hideLegendModal);
    }

    // ESC key event listener
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideLegendModal();
        }
    });

    // Initialize legend tabs
    initializeLegendTabs();
}

function initializeLegendTabs() {
    const tabs = document.querySelectorAll('.legend-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            // Remove active class from all tabs and contents
            document.querySelectorAll('.legend-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.legend-tab-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding content
            const contentId = targetTab + 'Tab';
            const content = document.getElementById(contentId);
            if (content) {
                content.classList.add('active');
            }
        });
    });
}


// Start the application with async loading
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are properly available
    setTimeout(() => {
        initializeApp();
        initializeLegendModal();
    }, 200);
});