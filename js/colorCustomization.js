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
        backgroundFreeze: '#f5f7fd', 
        redShift: '#ff5252',
        orangeShift: '#ffab40',
        greenShift: '#4caf50',
        starterShift: '#ffd700',
        schreibdienstSingle: '#64b5f6',
        schreibdienstFull: '#1976d2',
        hoverBg: '#f5f5f5',
        selectedBg: '#e3f2fd',
        hoverBgSingle: '#f8f8f8',
        selectedBgSingle: '#eef7ff',
        buttonNavBg: '#f3f3f3',
        buttonNavBgHover: '#e8e8e8'
    },

    // Current color preferences (in-memory cache)
    currentColorPreferences: null,

    // Flag to track if colors are being loaded
    isLoadingColors: false,

    /**
     * Initialize the color customization feature
     */
    init: async function() {
        console.log('Initializing ColorCustomization module');
        
        // Initialize current preferences with defaults temporarily
        this.currentColorPreferences = { ...this.defaultColors };

        try {
            // Wait for preferences to load from database before continuing
            await this.loadColorPreferences();
            console.log('Color preferences loaded from database successfully');
        } catch (error) {
            console.error('Failed to load color preferences from database:', error);
            // Ensure we apply default colors on failure
            this.currentColorPreferences = { ...this.defaultColors };
            this.applyColorPreferences();
        }
        
        // If user is backoffice, add the color button - do this AFTER loading preferences
        if (typeof isBackofficeUser === 'function' && isBackofficeUser()) {
            // Use setTimeout to ensure DOM is fully loaded
            setTimeout(() => this.addColorCustomizationButton(), 300);
        } else {
            console.log('User is not backoffice, not adding color button');
        }
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
        colorBtn.className = 'button-nav button-color-customize';
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
        
        console.log('Color customization button added to navbar');
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
        // Color input handlers
        const colorInputs = document.querySelectorAll('.cc-color-option input[type="color"]');
        const alphaSliders = document.querySelectorAll('.cc-color-option .alpha-slider');
        
        // Handle color changes
        colorInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updatePreview();
            });
        });
        
        // Handle alpha slider changes
        alphaSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                // Update the alpha value text
                const alphaValue = e.target.nextElementSibling;
                if (alphaValue) {
                    alphaValue.textContent = `${Math.round(e.target.value * 100)}%`;
                }
                this.updatePreview();
            });
        });
        
        console.log('Live color preview initialized');
    },
    
    // New method to update preview based on all inputs
    updatePreview: function() {
        const tempColors = this.getColorValuesFromInputs();
        this.previewColorPreferences(tempColors);
    },

    /**
     * Get all current color values from the input fields
     */
    getColorValuesFromInputs: function() {
        // Helper to get color with alpha
        const getColorWithAlpha = (colorId, alphaId) => {
            const color = document.getElementById(colorId).value;
            const alpha = document.getElementById(alphaId)?.value || 1;
            return { hex: color, alpha: parseFloat(alpha) };
        };
        
        return {
            primaryColor: getColorWithAlpha('primaryColorInput', 'primaryColorAlpha'),
            background: getColorWithAlpha('backgroundColor', 'backgroundAlpha'),
            backgroundFreeze: getColorWithAlpha('backgroundFreezeColor', 'backgroundFreezeAlpha'),
            redShift: getColorWithAlpha('redShiftColor', 'redShiftAlpha'),
            orangeShift: getColorWithAlpha('orangeShiftColor', 'orangeShiftAlpha'),
            greenShift: getColorWithAlpha('greenShiftColor', 'greenShiftAlpha'),
            starterShift: getColorWithAlpha('starterShiftColor', 'starterShiftAlpha'),
            schreibdienstSingle: getColorWithAlpha('schreibdienstSingleColor', 'schreibdienstSingleAlpha'),
            schreibdienstFull: getColorWithAlpha('schreibdienstFullColor', 'schreibdienstFullAlpha'),
            hoverBg: getColorWithAlpha('hoverBgColor', 'hoverBgAlpha'),
            selectedBg: getColorWithAlpha('selectedBgColor', 'selectedBgAlpha'),
            hoverBgSingle: getColorWithAlpha('hoverBgSingleColor', 'hoverBgSingleAlpha'),
            selectedBgSingle: getColorWithAlpha('selectedBgSingleColor', 'selectedBgSingleAlpha'),
            buttonNavBg: getColorWithAlpha('buttonNavBgColor', 'buttonNavBgAlpha'),
            buttonNavBgHover: getColorWithAlpha('buttonNavBgHoverColor', 'buttonNavBgHoverAlpha')
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
    
        // Helper to convert hex+alpha to rgba
        const toRgba = (color) => {
            if (!color) return 'rgba(0,0,0,1)';
            
            // Handle colors in object format with hex and alpha
            if (typeof color === 'object' && color.hex) {
                const hex = color.hex.replace('#', '');
                const alpha = typeof color.alpha === 'number' ? color.alpha : 1;
                
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            
            // Handle simple hex string
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            return `rgba(${r}, ${g}, ${b}, 1)`;
        };
    
        // Generate CSS rules
        const css = `
            :root {
                --primary-color: ${toRgba(colors.primaryColor)} !important;
                --background-color: ${toRgba(colors.background)} !important;
                --background-freeze-color: ${toRgba(colors.backgroundFreeze)} !important;
                --color-empty: ${toRgba(colors.redShift)} !important;
                --color-single: ${toRgba(colors.orangeShift)} !important;
                --color-full: ${toRgba(colors.greenShift)} !important;
                --color-starter: ${toRgba(colors.starterShift)} !important;
                --color-schreibdienst: ${toRgba(colors.schreibdienstSingle)} !important;
                --hover-bg: ${toRgba(colors.hoverBg)} !important;
                --selected-bg: ${toRgba(colors.selectedBg)} !important;
                --hover-bg-single: ${toRgba(colors.hoverBgSingle)} !important;
                --selected-bg-single: ${toRgba(colors.selectedBgSingle)} !important;
                --button-nav-bg: ${toRgba(colors.buttonNavBg)} !important;
                --button-nav-bg-hover: ${toRgba(colors.buttonNavBgHover)} !important;
            }
    
            /* Frozen state background */
            .frozen-state {
                background-color: var(--background-freeze-color) !important;
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
                background-color: ${toRgba(colors.schreibdienstFull)} !important;
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
            .shift-left.highlight-hover-single,
            .shift-right.highlight-hover-single {
                background: var(--hover-bg-single) !important;
                box-shadow: none !important;
                z-index: 2;
            }
            .shift-left.highlight-selected-single,
            .shift-right.highlight-selected-single {
                background: var(--selected-bg-single) !important;
                box-shadow: none !important;
                z-index: 3;
            }
    
            /* User Item Highlights */
            .user-item:hover {
                background-color: var(--hover-bg) !important;
            }
            .user-item.highlighted {
                background-color: var(--selected-bg) !important;
                color: ${this.getContrastYIQ(typeof colors.selectedBg === 'object' ? colors.selectedBg.hex : colors.selectedBg)} !important;
            }
            .user-item.highlighted .user-name,
            .user-item.highlighted .user-shifts-count {
                color: ${this.getContrastYIQ(typeof colors.selectedBg === 'object' ? colors.selectedBg.hex : colors.selectedBg)} !important;
            }
            .user-item.highlighted::after {
                background-color: var(--primary-color) !important;
                color: ${this.getContrastYIQ(typeof colors.primaryColor === 'object' ? colors.primaryColor.hex : colors.primaryColor)} !important;
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
            .notification {
                color: var(--primary-color) !important;
            }
            .notification.info {
                border-left-color: var(--primary-color) !important;
            }
            .frozen-message {
                background-color: ${this.hexToRgba(typeof colors.primaryColor === 'object' ? colors.primaryColor.hex : colors.primaryColor, 0.1)} !important;
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
                box-shadow: 0 0 0 3px ${this.hexToRgba(typeof colors.primaryColor === 'object' ? colors.primaryColor.hex : colors.primaryColor, 0.15)} !important;
            }
            
            /* Navbar select dropdown arrow */
            .navbar-controls select {
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(typeof colors.primaryColor === 'object' ? colors.primaryColor.hex : colors.primaryColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
            }
            .navbar-controls select:hover,
            .navbar-controls select:focus {
                border-color: var(--primary-color) !important;
                box-shadow: 0 3px 6px ${this.hexToRgba(typeof colors.primaryColor === 'object' ? colors.primaryColor.hex : colors.primaryColor, 0.1)}, 0 0 0 3px ${this.hexToRgba(typeof colors.primaryColor === 'object' ? colors.primaryColor.hex : colors.primaryColor, 0.15)} !important;
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
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(typeof colors.primaryColor === 'object' ? colors.primaryColor.hex : colors.primaryColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") !important;
            }
            
            /* Button nav background */
            .button-nav {
                background: var(--button-nav-bg) !important;
            }
            
            .button-nav:hover {
                background: var(--button-nav-bg-hover) !important;
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
        // Remove existing modal to ensure it's recreated with latest colors
        const existingModal = document.getElementById('colorCustomizationModal');
        if (existingModal) {
            existingModal.remove();
        }
        
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
                        <div class="color-global-note" style="margin-bottom: 15px; padding: 8px; background: #f8f9fa; border-left: 3px solid #1760ff; color: #333;">
                            <strong>Hinweis:</strong> Diese Farbeinstellungen werden auf <u>alle Benutzer</u> angewendet.
                        </div>
                        
                       <div class="color-section">
                        <h3>Themenfarben</h3>
                        <div class="cc-color-option">
                            <label>Primärfarbe:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="primaryColorInput" value="${currentColors.primaryColor.hex || currentColors.primaryColor}">
                                <input type="range" id="primaryColorAlpha" min="0" max="1" step="0.01" value="${currentColors.primaryColor.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.primaryColor.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Hintergrund:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="backgroundColor" value="${currentColors.background.hex || currentColors.background}">
                                <input type="range" id="backgroundAlpha" min="0" max="1" step="0.01" value="${currentColors.background.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.background.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Hintergrund Freeze:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="backgroundFreezeColor" value="${currentColors.backgroundFreeze?.hex || currentColors.backgroundFreeze || currentColors.background}">
                                <input type="range" id="backgroundFreezeAlpha" min="0" max="1" step="0.01" value="${currentColors.backgroundFreeze?.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.backgroundFreeze?.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="color-section">
                        <h3>Einsätze</h3>
                        <div class="cc-color-option">
                            <label>Unbesetzter Einsatz:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="redShiftColor" value="${currentColors.redShift.hex || currentColors.redShift}">
                                <input type="range" id="redShiftAlpha" min="0" max="1" step="0.01" value="${currentColors.redShift.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.redShift.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Einzeln besetzter Einsatz:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="orangeShiftColor" value="${currentColors.orangeShift.hex || currentColors.orangeShift}">
                                <input type="range" id="orangeShiftAlpha" min="0" max="1" step="0.01" value="${currentColors.orangeShift.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.orangeShift.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Doppelt besetzter Einsatz:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="greenShiftColor" value="${currentColors.greenShift.hex || currentColors.greenShift}">
                                <input type="range" id="greenShiftAlpha" min="0" max="1" step="0.01" value="${currentColors.greenShift.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.greenShift.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Starter:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="starterShiftColor" value="${currentColors.starterShift.hex || currentColors.starterShift}">
                                <input type="range" id="starterShiftAlpha" min="0" max="1" step="0.01" value="${currentColors.starterShift.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.starterShift.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Schreibdienst einzeln besetzt:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="schreibdienstSingleColor" value="${currentColors.schreibdienstSingle.hex || currentColors.schreibdienstSingle}">
                                <input type="range" id="schreibdienstSingleAlpha" min="0" max="1" step="0.01" value="${currentColors.schreibdienstSingle.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.schreibdienstSingle.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Schreibdienst doppelt besetzt:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="schreibdienstFullColor" value="${currentColors.schreibdienstFull.hex || currentColors.schreibdienstFull}">
                                <input type="range" id="schreibdienstFullAlpha" min="0" max="1" step="0.01" value="${currentColors.schreibdienstFull.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.schreibdienstFull.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="color-section">
                        <h3>User Hervorhebung </h3>
                        <div class="cc-color-option">
                            <label>Mousover (Doppelt besetzt):</label>
                            <div class="color-with-alpha">
                                <input type="color" id="hoverBgColor" value="${currentColors.hoverBg.hex || currentColors.hoverBg}">
                                <input type="range" id="hoverBgAlpha" min="0" max="1" step="0.01" value="${currentColors.hoverBg.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.hoverBg.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Auswahl (Doppelt besetzt):</label>
                            <div class="color-with-alpha">
                                <input type="color" id="selectedBgColor" value="${currentColors.selectedBg.hex || currentColors.selectedBg}">
                                <input type="range" id="selectedBgAlpha" min="0" max="1" step="0.01" value="${currentColors.selectedBg.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.selectedBg.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Mousover (Einzeln besetzt):</label>
                            <div class="color-with-alpha">
                                <input type="color" id="hoverBgSingleColor" value="${currentColors.hoverBgSingle?.hex || currentColors.hoverBgSingle || '#f8f8f8'}">
                                <input type="range" id="hoverBgSingleAlpha" min="0" max="1" step="0.01" value="${currentColors.hoverBgSingle?.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.hoverBgSingle?.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Auswahl (Einzeln besetzt):</label>
                            <div class="color-with-alpha">
                                <input type="color" id="selectedBgSingleColor" value="${currentColors.selectedBgSingle?.hex || currentColors.selectedBgSingle || '#eef7ff'}">
                                <input type="range" id="selectedBgSingleAlpha" min="0" max="1" step="0.01" value="${currentColors.selectedBgSingle?.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.selectedBgSingle?.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="color-section">
                        <h3>Navigation Buttons</h3>
                        <div class="cc-color-option">
                            <label>Button Hintergrund:</label>
                            <div class="color-with-alpha">
                                <input type="color" id="buttonNavBgColor" value="${currentColors.buttonNavBg.hex || currentColors.buttonNavBg}">
                                <input type="range" id="buttonNavBgAlpha" min="0" max="1" step="0.01" value="${currentColors.buttonNavBg.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.buttonNavBg.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                        <div class="cc-color-option">
                            <label>Button Hintergrund (Hover):</label>
                            <div class="color-with-alpha">
                                <input type="color" id="buttonNavBgHoverColor" value="${currentColors.buttonNavBgHover.hex || currentColors.buttonNavBgHover}">
                                <input type="range" id="buttonNavBgHoverAlpha" min="0" max="1" step="0.01" value="${currentColors.buttonNavBgHover.alpha || 1}" class="alpha-slider">
                                <span class="alpha-value">${Math.round((currentColors.buttonNavBgHover.alpha || 1) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="color-actions">
                        <button id="resetColorsBtn" class="button-secondary">Auf Standard zurücksetzen</button>
                        <button id="saveColorsBtn" class="button-primary">Änderungen speichern</button>
                    </div>

                    <div id="colorSaveStatus" class="color-save-status"></div>
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
        
        // Helper to update a color input and its alpha slider
        const updateColorWithAlpha = (colorId, alphaId, colorValue) => {
            const colorInput = document.getElementById(colorId);
            const alphaSlider = document.getElementById(alphaId);
            const alphaValue = alphaSlider?.nextElementSibling;
            
            if (colorInput) {
                // If colorValue is an object with hex and alpha
                if (colorValue && typeof colorValue === 'object' && colorValue.hex) {
                    colorInput.value = colorValue.hex;
                    if (alphaSlider && typeof colorValue.alpha === 'number') {
                        alphaSlider.value = colorValue.alpha;
                        if (alphaValue) {
                            alphaValue.textContent = `${Math.round(colorValue.alpha * 100)}%`;
                        }
                    }
                } else {
                    // If it's just a simple color string
                    colorInput.value = colorValue;
                    if (alphaSlider) {
                        alphaSlider.value = 1;
                        if (alphaValue) {
                            alphaValue.textContent = '100%';
                        }
                    }
                }
            }
        };
        
        // Update all color inputs and alpha sliders
        updateColorWithAlpha('primaryColorInput', 'primaryColorAlpha', colors.primaryColor);
        updateColorWithAlpha('backgroundColor', 'backgroundAlpha', colors.background);
        updateColorWithAlpha('backgroundFreezeColor', 'backgroundFreezeAlpha', colors.backgroundFreeze);
        updateColorWithAlpha('redShiftColor', 'redShiftAlpha', colors.redShift);
        updateColorWithAlpha('orangeShiftColor', 'orangeShiftAlpha', colors.orangeShift);
        updateColorWithAlpha('greenShiftColor', 'greenShiftAlpha', colors.greenShift);
        updateColorWithAlpha('starterShiftColor', 'starterShiftAlpha', colors.starterShift);
        updateColorWithAlpha('schreibdienstSingleColor', 'schreibdienstSingleAlpha', colors.schreibdienstSingle);
        updateColorWithAlpha('schreibdienstFullColor', 'schreibdienstFullAlpha', colors.schreibdienstFull);
        updateColorWithAlpha('hoverBgColor', 'hoverBgAlpha', colors.hoverBg);
        updateColorWithAlpha('selectedBgColor', 'selectedBgAlpha', colors.selectedBg);
        updateColorWithAlpha('hoverBgSingleColor', 'hoverBgSingleAlpha', colors.hoverBgSingle);
        updateColorWithAlpha('selectedBgSingleColor', 'selectedBgSingleAlpha', colors.selectedBgSingle);
        updateColorWithAlpha('buttonNavBgColor', 'buttonNavBgAlpha', colors.buttonNavBg);
        updateColorWithAlpha('buttonNavBgHoverColor', 'buttonNavBgHoverAlpha', colors.buttonNavBgHover);
        
        // Force a preview update
        this.updatePreview();
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
    
            if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                // Create a new colors object using our default as base
                const colors = { ...this.defaultColors };
                
                // Update with values from API
                Object.keys(data).forEach(key => {
                    if (colors.hasOwnProperty(key)) {
                        colors[key] = data[key];
                    }
                });
                
                console.log("Processed colors:", colors);
                
                this.currentColorPreferences = colors;
                this.applyColorPreferences();
                console.log('Loaded and applied color preferences from API');
            } else {
                console.log("API returned non-object data or empty, using defaults");
                this.currentColorPreferences = { ...this.defaultColors };
                this.applyColorPreferences();
            }
            
            // Remove any localStorage entries to avoid inconsistencies
            if (localStorage.getItem('calendarColorPreferences')) {
                localStorage.removeItem('calendarColorPreferences');
                console.log("Removed colors from localStorage to maintain consistency with DB");
            }
        } catch (error) {
            console.error('Error loading color preferences from API:', error);
            
            // Use defaults if API fails, do NOT check localStorage
            this.currentColorPreferences = { ...this.defaultColors };
            this.applyColorPreferences();
            
            // Show a user notification
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.warning('Die Farbeinstellungen konnten nicht geladen werden. Standard-Farben werden verwendet.');
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
            // Use server-compatible authentication with token in URL
            const url = AuthManager.addTokenToUrl('api/colors.php');
            const response = await AuthManager.fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(colors)
            });

            console.log(`Save colors API response status: ${response.status}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }

            // REMOVE localStorage storing - we only want database storage
            // Remove any existing localStorage entries to prevent inconsistencies
            if (localStorage.getItem('calendarColorPreferences')) {
                localStorage.removeItem('calendarColorPreferences');
            }

            // Update current preferences and apply them
            this.currentColorPreferences = colors;
            this.applyColorPreferences();
            
            // Show success message - make it clear these are global settings
            this.setColorSaveStatus('Farben erfolgreich global gespeichert!', 'success');
            console.log('Completed saving color preferences');

        } catch (error) {
            console.error('Error saving color preferences via API:', error);
            this.setColorSaveStatus(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`, 'error');
            
            // DO NOT save to localStorage on error
        }
    },

    /**
     * Reset colors to defaults
     */
    resetColorPreferences: async function() {
        this.setColorSaveStatus('Farben werden zurückgesetzt...', 'info');
        console.log("Resetting colors to defaults via API");

        try {
            // Send DELETE request to API with token in URL for server compatibility
            const url = AuthManager.addTokenToUrl('api/colors.php');
            const response = await AuthManager.fetchWithAuth(url, { 
                method: 'DELETE'
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
            
            // Show success message - make it clear these are global settings
            this.setColorSaveStatus('Farben global auf Standard zurückgesetzt!', 'success');
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
        
        // More flexible check for required colors
        const requiredColors = [
            'primaryColor', 'background', 'backgroundFreeze', 'redShift', 'orangeShift', 
            'greenShift', 'starterShift', 'schreibdienstSingle', 
            'schreibdienstFull', 'hoverBg', 'selectedBg', 'hoverBgSingle', 'selectedBgSingle'
        ];
        
        // Check if all required colors exist in some form (either as object or string)
        const allColorsPresent = requiredColors.every(key => {
            return colors[key] !== undefined && colors[key] !== null;
        });
        
        if (!allColorsPresent) {
            console.error('Invalid color structure detected, resetting to defaults. Missing colors:', 
                requiredColors.filter(key => colors[key] === undefined || colors[key] === null));
            this.currentColorPreferences = { ...this.defaultColors };
            this.previewColorPreferences(this.defaultColors);
            return;
        }
        
        this.previewColorPreferences(colors);
        console.log('Applied custom color preferences globally', colors);
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