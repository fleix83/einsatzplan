/**
 * Color Customization Feature for Calendar Application
 * This file contains all code related to the color customization feature.
 * It allows backoffice users to customize calendar colors and stores preferences in the database.
 */

// Define the ColorCustomization namespace to avoid conflicts
const ColorCustomization = {
    // Default colors
    defaultColors: {
        primaryColor: '#1760ff',
        background: '#f5f7fd',
        redShift: '#ff5252',
        orangeShift: '#ffab40',
        greenShift: '#4caf50',
        starterShift: '#ffd700',
        schreibdienstSingle: '#64b5f6',
        schreibdienstFull: '#1976d2',
        hoverBg: '#f5f5f5',
        selectedBg: '#e3f2fd'
    },

    // Current color preferences (in-memory cache)
    currentColorPreferences: null,

    // Flag to track if colors are being loaded
    isLoadingColors: false,

    /**
     * Initialize the color customization feature
     */
    init: function() {
        console.log('Initializing ColorCustomization module');
        
        // Initialize current preferences with defaults
        this.currentColorPreferences = { ...this.defaultColors };

        // If user is backoffice, add the color button
        if (typeof isBackofficeUser === 'function' && isBackofficeUser()) {
            this.addColorCustomizationButton();
        }

        // Load preferences for all users
        this.loadColorPreferences();
    },

    /**
     * Add color customization button to navbar (for backoffice users only)
     */
    addColorCustomizationButton: function() {
        // Check if button already exists
        if (document.getElementById('colorCustomizeBtn')) {
            return;
        }

        // Get the navbar controls container
        const navbarControls = document.querySelector('.navbar-controls');
        if (!navbarControls) {
            console.error('Navbar controls not found');
            return;
        }

        // Create color customization button
        const colorBtn = document.createElement('button');
        colorBtn.id = 'colorCustomizeBtn';
        colorBtn.className = 'button-color-customize';
        colorBtn.innerHTML = '<span class="button-icon">🎨</span>';
        colorBtn.title = 'Farben anpassen';
        colorBtn.addEventListener('click', () => this.showColorCustomizationModal());

        // Add to navbar - insert before the freeze button if it exists
        const freezeBtn = document.getElementById('freezeToggleBtn');
        if (freezeBtn) {
            navbarControls.insertBefore(colorBtn, freezeBtn);
        } else {
            navbarControls.appendChild(colorBtn);
        }
    },

    // Make color modal draggable
    makeColorModalDraggable: function() {
        const modal = document.getElementById('colorCustomizationModal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.color-modal-content');
        const header = modal.querySelector('.color-modal-header');
        
        if (!modalContent || !header) return;
        
        // Make sure the content is properly positioned
        // Position the modal content with fixed positioning instead of absolute
        modalContent.style.position = 'fixed';
        modalContent.style.top = '20%';
        modalContent.style.left = '50%';
        modalContent.style.transform = 'translateX(-50%)';
        modalContent.style.margin = '0';
        
        // Make the header look draggable
        header.style.cursor = 'move';
        
        let isDragging = false;
        let offsetX, offsetY;
        
        header.addEventListener('mousedown', function(e) {
            // Prevent any default dragging behavior
            e.preventDefault();
            
            isDragging = true;
            
            // Calculate the offset between mouse position and the modal content position
            offsetX = e.clientX - modalContent.getBoundingClientRect().left;
            offsetY = e.clientY - modalContent.getBoundingClientRect().top;
            
            // Add temporary styles during dragging
            document.body.style.userSelect = 'none';
            
            console.log('Started dragging modal at position:', { 
                clientX: e.clientX, 
                clientY: e.clientY,
                offsetX: offsetX,
                offsetY: offsetY
            });
        });
        
        // Use document for mousemove to allow dragging anywhere
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            // Calculate new position
            const left = e.clientX - offsetX;
            const top = e.clientY - offsetY;
            
            // Apply new position
            modalContent.style.left = left + 'px';
            modalContent.style.top = top + 'px';
            
            // Remove the transform that was initially centering the modal
            modalContent.style.transform = 'none';
        });
        
        // Handle mouse release
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                console.log('Stopped dragging modal');
            }
        });
        
        // Make sure dragging stops if mouse leaves the window
        document.addEventListener('mouseleave', function() {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                console.log('Stopped dragging (mouse left window)');
            }
        });
        
        console.log('Modal drag functionality initialized');
    },
        
    /**
     * Set up live preview for color inputs
     */
    setupLivePreview: function() {
        const colorInputs = document.querySelectorAll('.cc-color-option input[type="color"]');
        colorInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const tempColors = this.getColorValuesFromInputs();
                this.previewColorPreferences(tempColors);
            });
        });
        console.log('Live color preview initialized');
    },

    /**
     * Get all current color values from the input fields
     */
    getColorValuesFromInputs: function() {
        return {
            primaryColor: document.getElementById('primaryColorInput').value,
            background: document.getElementById('backgroundColor').value,
            redShift: document.getElementById('redShiftColor').value,
            orangeShift: document.getElementById('orangeShiftColor').value,
            greenShift: document.getElementById('greenShiftColor').value,
            starterShift: document.getElementById('starterShiftColor').value,
            schreibdienstSingle: document.getElementById('schreibdienstSingleColor').value,
            schreibdienstFull: document.getElementById('schreibdienstFullColor').value,
            hoverBg: document.getElementById('hoverBgColor').value,
            selectedBg: document.getElementById('selectedBgColor').value
        };
    },

    /**
     * Apply color preferences for preview without saving to database or memory
     */
    previewColorPreferences: function(colors) {
        let styleSheet = document.getElementById('customColorStyles');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'customColorStyles';
            document.head.appendChild(styleSheet);
        }

        // Generate CSS rules
        const css = `
            :root {
                --primary-color: ${colors.primaryColor} !important;
                --background-color: ${colors.background} !important;
                --color-empty: ${colors.redShift} !important;
                --color-single: ${colors.orangeShift} !important;
                --color-full: ${colors.greenShift} !important;
                --color-starter: ${colors.starterShift} !important;
                --color-schreibdienst: ${colors.schreibdienstSingle} !important;
                --hover-bg: ${colors.hoverBg} !important;
                --selected-bg: ${colors.selectedBg} !important;
            }

            /* Shift Colors (using existing vars mapped above) */
            .shift-left.red, .shift-right.red { background: var(--color-empty) !important; }
            .shift-left.orange, .shift-right.orange { background-color: var(--color-single) !important; }
            .shift-left.green, .shift-right.green { background-color: var(--color-full) !important; }
            .shift-left.starter, .shift-right.starter { background-color: var(--color-starter) !important; }
            .shift-left.schreibdienst-single, .shift-right.schreibdienst-single { background-color: var(--color-schreibdienst) !important; }
            
            /* Handle schreibdienst-full specifically if different from single */
            .shift-left.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="true"],
            .shift-right.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="true"] {
                background-color: ${colors.schreibdienstFull} !important;
            }
            
            /* Handle mixed Schreibdienst */
            .shift-left.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="false"],
            .shift-right.schreibdienst-full[data-first-user-schreibdienst="true"][data-second-user-schreibdienst="false"] {
                background: linear-gradient(to bottom, var(--color-schreibdienst) 0%, var(--color-schreibdienst) 50%, var(--color-single) 50%, var(--color-single) 100%) !important;
            }

            /* Shift Highlights */
            .shift-left.highlight-hover,
            .shift-right.highlight-hover {
                background: var(--hover-bg) !important;
                box-shadow: none !important;
                z-index: 2;
            }
            .shift-left.highlight-selected,
            .shift-right.highlight-selected {
                background: var(--selected-bg) !important;
                box-shadow: none !important;
                z-index: 3;
            }

            /* User Item Highlights */
            .user-item:hover {
                background-color: var(--hover-bg) !important;
            }
            .user-item.highlighted {
                background-color: var(--selected-bg) !important;
                color: ${this.getContrastYIQ(colors.selectedBg)} !important;
            }
            .user-item.highlighted .user-name,
            .user-item.highlighted .user-shifts-count {
                color: ${this.getContrastYIQ(colors.selectedBg)} !important;
            }
            .user-item.highlighted::after {
                background-color: var(--primary-color) !important;
                color: ${this.getContrastYIQ(colors.primaryColor)} !important;
            }

            /* Apply primary color to other elements */
            .navbar-auth .auth-button,
            .mobile-menu-button,
            .button-secondary,
            .button-freeze.frozen,
            .export-actions .button,
            .color-actions .button-primary,
            .mobile-date-tab {
                background-color: var(--primary-color) !important;
            }
            .current-day-number,
            .shift-schreibdienst-creator,
            .admin-badge,
            .export-modal-header h2,
            .color-section h3,
            .shift-note-text strong,
            .frozen-indicator,
            .frozen-message,
            .notification {
                color: var(--primary-color) !important;
            }
            .notification.info {
                border-left-color: var(--primary-color) !important;
            }
            .frozen-message {
                background-color: ${this.hexToRgba(colors.primaryColor, 0.1)} !important;
                border-left-color: var(--primary-color) !important;
            }
            .day-card:hover {
                outline-color: var(--primary-color) !important;
            }
            .user-item.highlighted::after {
                background-color: var(--primary-color) !important;
            }
            
            /* Focus states */
            .shift-note:focus,
            #newUserName:focus,
            #newUserRole:focus,
            .user-role:focus,
            .shift-detail-modal .user-select:focus,
            .shift-detail-modal .shift-note-input:focus,
            .color-option input[type="color"]:focus {
                border-color: var(--primary-color) !important;
                box-shadow: 0 0 0 3px ${this.hexToRgba(colors.primaryColor, 0.15)} !important;
            }
            
            /* Navbar select dropdown arrow */
            .navbar-controls select {
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.primaryColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
            }
            .navbar-controls select:hover,
            .navbar-controls select:focus {
                border-color: var(--primary-color) !important;
                box-shadow: 0 3px 6px ${this.hexToRgba(colors.primaryColor, 0.1)}, 0 0 0 3px ${this.hexToRgba(colors.primaryColor, 0.15)} !important;
            }
            
            /* Modal close button hover */
            .shift-detail-close:hover {
                color: var(--primary-color) !important;
            }
            
            /* Shift User Row indicator */
            .shift-user-row::before {
                background: var(--primary-color) !important;
            }
            
            /* Shift user select dropdown arrow */
            .shift-user-row .user-select {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.primaryColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") !important;
            }
        `;

        styleSheet.textContent = css;

        // Force repaint if needed
        const calendar = document.getElementById('calendar');
        if (calendar) {
            calendar.style.visibility = 'hidden';
            setTimeout(() => {
                calendar.style.visibility = 'visible';
                if (typeof updateCalendarHighlights === 'function') {
                    updateCalendarHighlights();
                }
            }, 10);
        } else {
            if (typeof updateCalendarHighlights === 'function') {
                updateCalendarHighlights();
            }
        }
    },

    /**
     * Show color customization modal
     */
    showColorCustomizationModal: function() {
        if (!document.getElementById('colorCustomizationModal')) {
            const modal = document.createElement('div');
            modal.id = 'colorCustomizationModal';
            modal.className = 'modal';

            // Use current preferences for default values in the modal
            const currentColors = this.getColorPreferences();

            modal.innerHTML = `
                <div class="color-modal-content">
                    <div class="color-modal-header">
                        <h2>Farben anpassen</h2>
                        <button class="color-modal-close">×</button>
                    </div>
                    <div class="color-modal-body">
                        <div class="color-section">
                            <h3>Themenfarben</h3>
                            <div class="cc-color-option">
                                <label>Primärfarbe:</label>
                                <input type="color" id="primaryColorInput" value="${currentColors.primaryColor}">
                            </div>
                            <div class="cc-color-option">
                                <label>Hintergrund:</label>
                                <input type="color" id="backgroundColor" value="${currentColors.background}">
                            </div>
                        </div>

                        <div class="color-section">
                            <h3>Einsätze</h3>
                            <div class="cc-color-option">
                                <label>Unbesetzter Einsatz:</label>
                                <input type="color" id="redShiftColor" value="${currentColors.redShift}">
                            </div>
                            <div class="cc-color-option">
                                <label>Einzeln besetzter Einsatz:</label>
                                <input type="color" id="orangeShiftColor" value="${currentColors.orangeShift}">
                            </div>
                            <div class="cc-color-option">
                                <label>Doppelt besetzter Einsatz:</label>
                                <input type="color" id="greenShiftColor" value="${currentColors.greenShift}">
                            </div>
                            <div class="cc-color-option">
                                <label>Starter:</label>
                                <input type="color" id="starterShiftColor" value="${currentColors.starterShift}">
                            </div>
                            <div class="cc-color-option">
                                <label>Schreibdienst einzeln besetzt:</label>
                                <input type="color" id="schreibdienstSingleColor" value="${currentColors.schreibdienstSingle}">
                            </div>
                            <div class="cc-color-option">
                                <label>Schreibdienst doppelt besetzt:</label>
                                <input type="color" id="schreibdienstFullColor" value="${currentColors.schreibdienstFull}">
                            </div>
                        </div>

                        <div class="color-section">
                            <h3>User Einsätze individuell</h3>
                            <div class="cc-color-option">
                                <label>Mousover:</label>
                                <input type="color" id="hoverBgColor" value="${currentColors.hoverBg}">
                            </div>
                            <div class="cc-color-option">
                                <label>Auswahl:</label>
                                <input type="color" id="selectedBgColor" value="${currentColors.selectedBg}">
                            </div>
                        </div>

                        <div class="color-actions">
                            <button id="resetColorsBtn" class="button-secondary">Auf Standard zurücksetzen</button>
                            <button id="saveColorsBtn" class="button-primary">Änderungen speichern</button>
                        </div>

                        <div id="colorSaveStatus" class="color-save-status"></div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            modal.querySelector('.color-modal-close').addEventListener('click', () => {
                modal.style.display = 'none';
                this.applyColorPreferences();
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    this.applyColorPreferences();
                }
            });
            
            document.getElementById('saveColorsBtn').addEventListener('click', () => this.saveColorPreferences());
            document.getElementById('resetColorsBtn').addEventListener('click', () => {
                if (confirm('Sind Sie sicher, dass Sie alle Farben auf die Standardwerte zurücksetzen möchten? Dies kann nicht rückgängig gemacht werden.')) {
                    this.resetColorPreferences();
                }
            });
            
            this.setupLivePreview();
        }

        setTimeout(() => this.makeColorModalDraggable(), 100);

        // Update status and load latest colors every time modal is shown
        const statusElement = document.getElementById('colorSaveStatus');
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = 'color-save-status';
        }

        if (this.isLoadingColors) {
            this.setColorSaveStatus('Farben werden geladen...', 'info');
        }

        this.loadColorPreferences().then(() => {
            this.updateColorInputs();
            if (statusElement && statusElement.textContent === 'Farben werden geladen...') {
                statusElement.textContent = '';
            }
        });

        document.getElementById('colorCustomizationModal').style.display = 'block';

        setTimeout(() => {
            this.makeColorModalDraggable();
        }, 200);
    },

    /**
     * Set color save status message
     */
    setColorSaveStatus: function(message, type = 'success') {
        const statusElement = document.getElementById('colorSaveStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `color-save-status ${type}`;
            if (type !== 'info') {
                setTimeout(() => {
                    if (statusElement.textContent === message) {
                        statusElement.textContent = '';
                        statusElement.className = 'color-save-status';
                    }
                }, 5000);
            }
        }
    },

    /**
     * Update color inputs with current values
     */
    updateColorInputs: function() {
        const colors = this.getColorPreferences();
        document.getElementById('primaryColorInput').value = colors.primaryColor;
        document.getElementById('backgroundColor').value = colors.background;
        document.getElementById('redShiftColor').value = colors.redShift;
        document.getElementById('orangeShiftColor').value = colors.orangeShift;
        document.getElementById('greenShiftColor').value = colors.greenShift;
        document.getElementById('starterShiftColor').value = colors.starterShift;
        document.getElementById('schreibdienstSingleColor').value = colors.schreibdienstSingle;
        document.getElementById('schreibdienstFullColor').value = colors.schreibdienstFull;
        document.getElementById('hoverBgColor').value = colors.hoverBg;
        document.getElementById('selectedBgColor').value = colors.selectedBg;
    },

    /**
     * Get stored color preferences
     */
    getColorPreferences: function() {
        // Ensure defaults are applied if preferences haven't been loaded/set yet
        return { ...this.defaultColors, ...this.currentColorPreferences };
    },

    /**
     * Load color preferences from the database
     */
    loadColorPreferences: async function() {
        this.isLoadingColors = true;
        console.log("Loading colors from API...");
        
        try {
            // Make the API request
            const response = await fetch('api/colors.php');
            
            console.log(`Load colors API response status: ${response.status}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("API response data:", data);

            if (data && typeof data === 'object') {
                // Map API response to our color structure
                const colors = {
                    primaryColor: data.primaryColor || this.defaultColors.primaryColor,
                    background: data.background || this.defaultColors.background,
                    redShift: data.redShift || this.defaultColors.redShift,
                    orangeShift: data.orangeShift || this.defaultColors.orangeShift,
                    greenShift: data.greenShift || this.defaultColors.greenShift,
                    starterShift: data.starterShift || this.defaultColors.starterShift,
                    schreibdienstSingle: data.schreibdienstSingle || this.defaultColors.schreibdienstSingle,
                    schreibdienstFull: data.schreibdienstFull || this.defaultColors.schreibdienstFull,
                    hoverBg: data.hoverBg || this.defaultColors.hoverBg,
                    selectedBg: data.selectedBg || this.defaultColors.selectedBg
                };
                
                this.currentColorPreferences = colors;
                this.applyColorPreferences();
                console.log('Loaded and applied color preferences from API');
            } else {
                console.log("API returned non-object data or empty, using defaults");
                this.currentColorPreferences = { ...this.defaultColors };
                this.applyColorPreferences();
            }
        } catch (error) {
            console.error('Error loading color preferences from API:', error);
            
            // Fallback to localStorage if API fails
            try {
                const storedColors = localStorage.getItem('calendarColorPreferences');
                if (storedColors) {
                    const colors = JSON.parse(storedColors);
                    this.currentColorPreferences = { ...this.defaultColors, ...colors };
                    this.applyColorPreferences();
                    console.log('Loaded color preferences from localStorage (fallback)');
                } else {
                    console.log("No colors in localStorage, using defaults");
                    this.currentColorPreferences = { ...this.defaultColors };
                    this.applyColorPreferences();
                }
            } catch (localError) {
                console.error('Error loading from localStorage:', localError);
                console.log("Error loading from localStorage, using defaults");
                this.currentColorPreferences = { ...this.defaultColors };
                this.applyColorPreferences();
            }
        } finally {
            this.isLoadingColors = false;
            console.log("Finished loading colors");
        }
    },

    /**
     * Save color preferences to the database
     */
    saveColorPreferences: async function() {
        this.setColorSaveStatus('Farben werden gespeichert...', 'info');
        
        // Get values from input fields
        const colors = this.getColorValuesFromInputs();
        console.log("Saving colors to API:", colors);

        try {
            // Get auth token if available
            const token = AuthManager.getToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) { 
                headers['Authorization'] = `Bearer ${token}`; 
            }

            // Send to API
            const response = await fetch('api/colors.php', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(colors)
            });

            console.log(`Save colors API response status: ${response.status}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }

            // Save to localStorage as a fallback
            localStorage.setItem('calendarColorPreferences', JSON.stringify(colors));
            console.log("Saved colors to localStorage as fallback");

            // Update current preferences and apply them
            this.currentColorPreferences = colors;
            this.applyColorPreferences();
            
            // Show success message
            this.setColorSaveStatus('Farben erfolgreich gespeichert!', 'success');
            console.log('Completed saving color preferences');

        } catch (error) {
            console.error('Error saving color preferences via API:', error);
            this.setColorSaveStatus(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`, 'error');
            
            // Try to save to localStorage anyway
            try {
                localStorage.setItem('calendarColorPreferences', JSON.stringify(colors));
                console.log('Saved color preferences to localStorage only due to API error');
            } catch (localError) {
                console.error('Error saving backup to localStorage:', localError);
            }
        }
    },

    /**
     * Reset colors to defaults
     */
    resetColorPreferences: async function() {
        this.setColorSaveStatus('Farben werden zurückgesetzt...', 'info');
        console.log("Resetting colors to defaults via API");

        try {
            // Get auth token if available
            const token = AuthManager.getToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) { 
                headers['Authorization'] = `Bearer ${token}`; 
            }

            // Send DELETE request to API
            const response = await fetch('api/colors.php', { 
                method: 'DELETE', 
                headers: headers 
            });
            
            console.log(`Reset colors API response status: ${response.status}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }

            // Remove from localStorage
            localStorage.removeItem('calendarColorPreferences');
            console.log("Removed colors from localStorage");

            // Reset current preferences to defaults
            this.currentColorPreferences = { ...this.defaultColors };

            // Update inputs and apply preferences
            this.updateColorInputs();
            this.applyColorPreferences();
            
            // Show success message
            this.setColorSaveStatus('Farben auf Standard zurückgesetzt!', 'success');
            console.log('Completed resetting color preferences');

        } catch (error) {
            console.error('Error resetting color preferences via API:', error);
            this.setColorSaveStatus(`Fehler beim Zurücksetzen: ${error.message || 'Unbekannter Fehler'}`, 'error');
        }
    },

    /**
     * Apply stored color preferences
     */
    applyColorPreferences: function() {
        const colors = this.getColorPreferences();
        this.previewColorPreferences(colors);
        console.log('Applied custom color preferences globally');
    },

   /**
    * Helper function to determine text color based on background brightness
    */
   getContrastYIQ: function(hexcolor){
        if (!hexcolor || typeof hexcolor !== 'string') return '#000000';
        hexcolor = hexcolor.replace("#", "");
        if (hexcolor.length === 3) {
            hexcolor = hexcolor.split('').map(hex => hex + hex).join('');
        }
        if (hexcolor.length !== 6) return '#000000';

        const r = parseInt(hexcolor.substr(0,2),16);
        const g = parseInt(hexcolor.substr(2,2),16);
        const b = parseInt(hexcolor.substr(4,2),16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';

        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    },

    /**
     * Helper function to convert hex color to rgba
     */
    hexToRgba: function(hex, alpha = 1) {
        if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            const r = (c >> 16) & 255;
            const g = (c >> 8) & 255;
            const b = c & 255;
            return `rgba(${r},${g},${b},${alpha})`;
        }
        console.warn(`Invalid hex color: ${hex}. Using default rgba(0,0,0,${alpha}).`);
        return `rgba(0,0,0,${alpha})`; // Return default transparent black on error
    }
};