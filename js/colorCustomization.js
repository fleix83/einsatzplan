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
        backgroundPrimary: '#fffcf7',
        logo: '#fffcf7',
        redShift: '#ff5252',
        orangeShift: '#ffab40',
        greenShift: '#4caf50',
        starterShift: '#ffd700',
        schreibdienstSingle: '#64b5f6',
        schreibdienstFull: '#1976d2',
        hoverBg: '#ffed75',
        selectedBg: '#ffed75',
        hoverBgSingle: '#fff3cd',
        selectedBgSingle: '#fff3cd',
        buttonNavBg: '#f3f3f3',
        buttonNavBgHover: '#e8e8e8'
    },

    // Current color preferences (in-memory cache)
    currentColorPreferences: null,

    // Flag to track if colors are being loaded
    isLoadingColors: false,

    // Store Pickr instances
    pickrInstances: {},

    /**
     * Initialize the color customization feature
     */
    init: async function() {
        console.log('Initializing ColorCustomization module');

        // Check if colors were already preloaded by inline script
        if (window.__colorsPreloaded && window.__preloadedColors) {
            console.log('Colors already preloaded, skipping duplicate load');
            // Use the preloaded colors
            this.currentColorPreferences = window.__preloadedColors;
            // Just use existing styles from preload
            const preloadStyles = document.getElementById('preloadColorStyles');
            if (preloadStyles) {
                // Rename it so our code recognizes it
                preloadStyles.id = 'customColorStyles';
            }
        } else {
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
     * Initialize Pickr color pickers for all color inputs
     */
    initializeColorPickers: function() {
        const currentColors = this.getColorPreferences();

        // Helper function to convert hex+alpha to rgba string
        const toRgbaString = (colorObj) => {
            const hex = colorObj.hex || colorObj;
            const alpha = colorObj.alpha !== undefined ? colorObj.alpha : 1;

            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);

            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        // Configuration for all color pickers
        const pickerConfigs = {
            primaryColorPicker: { color: currentColors.primaryColor, key: 'primaryColor' },
            backgroundPicker: { color: currentColors.background, key: 'background' },
            backgroundFreezePicker: { color: currentColors.backgroundFreeze, key: 'backgroundFreeze' },
            backgroundPrimaryPicker: { color: currentColors.backgroundPrimary, key: 'backgroundPrimary' },
            logoPicker: { color: currentColors.logo, key: 'logo' },
            redShiftPicker: { color: currentColors.redShift, key: 'redShift' },
            orangeShiftPicker: { color: currentColors.orangeShift, key: 'orangeShift' },
            greenShiftPicker: { color: currentColors.greenShift, key: 'greenShift' },
            starterShiftPicker: { color: currentColors.starterShift, key: 'starterShift' },
            schreibdienstSinglePicker: { color: currentColors.schreibdienstSingle, key: 'schreibdienstSingle' },
            schreibdienstFullPicker: { color: currentColors.schreibdienstFull, key: 'schreibdienstFull' },
            selectedBgPicker: { color: currentColors.selectedBg, key: 'selectedBg' },
            selectedBgSinglePicker: { color: currentColors.selectedBgSingle, key: 'selectedBgSingle' },
            buttonNavBgPicker: { color: currentColors.buttonNavBg, key: 'buttonNavBg' }
        };

        // Initialize each picker
        Object.entries(pickerConfigs).forEach(([pickerId, config]) => {
            const element = document.getElementById(pickerId);
            if (!element) {
                console.warn(`Picker element ${pickerId} not found`);
                return;
            }

            const pickr = Pickr.create({
                el: element,
                theme: 'nano',
                default: toRgbaString(config.color),
                swatches: null,
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: {
                        hex: false,
                        rgba: false,
                        hsla: false,
                        hsva: false,
                        cmyk: false,
                        input: true,
                        clear: false,
                        save: false,
                        eyeDropper: true
                    }
                }
            });

            // Handle color changes for live preview
            pickr.on('change', (color) => {
                const rgba = color.toRGBA();
                const tempColors = this.getColorValuesFromPickr();
                this.previewColorPreferences(tempColors);
            });

            this.pickrInstances[config.key] = pickr;
        });

        console.log('Pickr color pickers initialized:', Object.keys(this.pickrInstances));
    },

    /**
     * Get all current color values from Pickr instances
     */
    getColorValuesFromPickr: function() {
        const colors = {};

        // Helper to convert Pickr color to hex+alpha object
        const pickrToColor = (pickr) => {
            if (!pickr) return { hex: '#000000', alpha: 1 };
            const color = pickr.getColor();
            if (!color) return { hex: '#000000', alpha: 1 };

            const rgba = color.toRGBA();
            const hex = color.toHEXA().toString().substring(0, 7); // Get hex without alpha
            const alpha = rgba[3]; // Get alpha value

            return { hex, alpha };
        };

        // Get colors from all Pickr instances
        Object.entries(this.pickrInstances).forEach(([key, pickr]) => {
            colors[key] = pickrToColor(pickr);
        });

        // Add hover colors (match selected colors)
        colors.hoverBg = colors.selectedBg || { hex: '#ffed75', alpha: 1 };
        colors.hoverBgSingle = colors.selectedBgSingle || { hex: '#fff3cd', alpha: 1 };
        colors.buttonNavBgHover = colors.buttonNavBg || { hex: '#e8e8e8', alpha: 1 };

        return colors;
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
                --background-primary: ${toRgba(colors.backgroundPrimary)} !important;
                --logo: ${toRgba(colors.logo)} !important;
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

            /* Body background gradient - override hardcoded color in styles.css */
            body {
                background: linear-gradient(180deg, var(--background-color) -9%, var(--background-primary) 84%) !important;
            }

            body.frozen-state {
                background: linear-gradient(180deg, var(--background-freeze-color) -9%, rgba(245, 250, 255, 1) 84%) !important;
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
                        <div class="color-preset-section">
                            <h3>Farbschemas</h3>
                            <div class="preset-controls">
                                <div class="preset-select-container">
                                    <label for="colorPresetDropdown">Schema:</label>
                                    <select id="colorPresetDropdown" class="preset-dropdown">
                                        <option value="">Keine Auswahl</option>
                                    </select>
                                </div>
                                <button id="deletePresetBtn" class="preset-delete-btn" style="display: none;" title="Schema löschen">&times;</button>
                            </div>

                            <button id="savePresetBtn" class="button-secondary save-preset-trigger">Neues Schema speichern</button>

                            <div id="savePresetForm" class="save-preset-form" style="display: none;">
                                <input type="text" id="presetNameInput" placeholder="Schema-Name eingeben..." maxlength="100">
                                <div class="preset-form-buttons">
                                    <button id="confirmSavePresetBtn" class="button-primary">💾 Speichern</button>
                                    <button id="cancelSavePresetBtn" class="button-secondary">Abbrechen</button>
                                </div>
                            </div>
                        </div>

                       <div class="color-section">
                        <h3>Themenfarben</h3>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="primaryColorPicker"></div>
                            <label>Primärfarbe</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="backgroundPicker"></div>
                            <label>Hintergrund</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="backgroundFreezePicker"></div>
                            <label>Hintergrund Freeze</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="backgroundPrimaryPicker"></div>
                            <label>Hintergrund Elemente</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="logoPicker"></div>
                            <label>Logo</label>
                        </div>
                    </div>

                    <div class="color-section">
                        <h3>Einsätze</h3>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="redShiftPicker"></div>
                            <label>Unbesetzter Einsatz</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="orangeShiftPicker"></div>
                            <label>Einzeln besetzter Einsatz</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="greenShiftPicker"></div>
                            <label>Doppelt besetzter Einsatz</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="starterShiftPicker"></div>
                            <label>Starter</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="schreibdienstSinglePicker"></div>
                            <label>Schreibdienst einzeln besetzt</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="schreibdienstFullPicker"></div>
                            <label>Schreibdienst doppelt besetzt</label>
                        </div>
                    </div>

                    <div class="color-section">
                        <h3>User Einsätze</h3>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="selectedBgPicker"></div>
                            <label>Auswahl (Doppelt besetzt)</label>
                        </div>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="selectedBgSinglePicker"></div>
                            <label>Auswahl (Einzeln besetzt)</label>
                        </div>
                    </div>

                    <div class="color-section">
                        <h3>Navigation Buttons</h3>
                        <div class="cc-color-option">
                            <div class="color-picker-button" id="buttonNavBgPicker"></div>
                            <label>Button Hintergrund</label>
                        </div>
                    </div>

                    <div class="color-actions">
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

            // Setup preset functionality
            this.setupPresetEventListeners();
            this.loadColorPresets(true); // Auto-select current preset

            // Initialize Pickr color pickers
            this.initializeColorPickers();
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
        updateColorWithAlpha('backgroundPrimaryColor', 'backgroundPrimaryAlpha', colors.backgroundPrimary);
        updateColorWithAlpha('redShiftColor', 'redShiftAlpha', colors.redShift);
        updateColorWithAlpha('orangeShiftColor', 'orangeShiftAlpha', colors.orangeShift);
        updateColorWithAlpha('greenShiftColor', 'greenShiftAlpha', colors.greenShift);
        updateColorWithAlpha('starterShiftColor', 'starterShiftAlpha', colors.starterShift);
        updateColorWithAlpha('schreibdienstSingleColor', 'schreibdienstSingleAlpha', colors.schreibdienstSingle);
        updateColorWithAlpha('schreibdienstFullColor', 'schreibdienstFullAlpha', colors.schreibdienstFull);
        updateColorWithAlpha('selectedBgColor', 'selectedBgAlpha', colors.selectedBg);
        updateColorWithAlpha('selectedBgSingleColor', 'selectedBgSingleAlpha', colors.selectedBgSingle);
        updateColorWithAlpha('buttonNavBgColor', 'buttonNavBgAlpha', colors.buttonNavBg);
        // Skip updating commented-out elements: hoverBg, hoverBgSingle, buttonNavBgHover
        
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

        // Get values from Pickr instances
        const colors = this.getColorValuesFromPickr();
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
            'primaryColor', 'background', 'backgroundFreeze', 'backgroundPrimary', 'logo', 'redShift', 'orangeShift',
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
    },

    /**
     * Load all color presets from database
     */
    loadColorPresets: async function(autoSelectCurrent = false) {
        try {
            const response = await fetch('api/color_presets.php');
            if (!response.ok) {
                throw new Error('Failed to load presets');
            }
            const presets = await response.json();
            this.populatePresetDropdown(presets, autoSelectCurrent);
            return presets;
        } catch (error) {
            console.error('Error loading presets:', error);
            this.setColorSaveStatus('Fehler beim Laden der Schemas', 'error');
            return [];
        }
    },

    /**
     * Populate dropdown with presets and optionally select the matching one
     */
    populatePresetDropdown: function(presets, autoSelectCurrent = false) {
        const dropdown = document.getElementById('colorPresetDropdown');
        if (!dropdown) return;

        // Clear existing options
        dropdown.innerHTML = '<option value="">Keine Auswahl</option>';

        // System presets first, then user presets
        let selectedPresetId = null;
        const currentColors = autoSelectCurrent ? this.getColorPreferences() : null;

        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = preset.name;
            option.dataset.isDefault = preset.is_default;

            // Add indicator for system presets
            if (preset.is_default) {
                option.textContent += ' (System)';
            }

            dropdown.appendChild(option);

            // Check if this preset matches current colors
            if (autoSelectCurrent && currentColors && !selectedPresetId) {
                if (this.colorsMatch(preset.colors, currentColors)) {
                    selectedPresetId = preset.id;
                }
            }
        });

        // Select the matching preset if found
        if (selectedPresetId) {
            dropdown.value = selectedPresetId;
            // Trigger change event to show delete button if applicable
            const event = new Event('change');
            dropdown.dispatchEvent(event);
        }
    },

    /**
     * Compare two color objects to see if they match
     */
    colorsMatch: function(colors1, colors2) {
        const colorKeys = Object.keys(colors1);

        for (const key of colorKeys) {
            const c1 = colors1[key];
            const c2 = colors2[key];

            if (!c2) return false;

            const hex1 = c1.hex || c1;
            const hex2 = c2.hex || c2;
            const alpha1 = c1.alpha !== undefined ? c1.alpha : 1;
            const alpha2 = c2.alpha !== undefined ? c2.alpha : 1;

            if (hex1 !== hex2 || Math.abs(alpha1 - alpha2) > 0.01) {
                return false;
            }
        }

        return true;
    },

    /**
     * Save current colors as new preset
     */
    saveColorPreset: async function(name) {
        try {
            const colors = this.getCurrentColorsFromForm();

            const response = await fetch('api/color_presets.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, colors })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save preset');
            }

            // Reload preset list
            await this.loadColorPresets();

            // Select the newly created preset
            const dropdown = document.getElementById('colorPresetDropdown');
            if (dropdown && result.id) {
                dropdown.value = result.id;
                // Trigger change event to show delete button
                const event = new Event('change');
                dropdown.dispatchEvent(event);
            }

            // Show success notification
            this.setColorSaveStatus('Schema erfolgreich gespeichert!', 'success');

            // Hide the save form
            const saveForm = document.getElementById('savePresetForm');
            if (saveForm) {
                saveForm.style.display = 'none';
            }

            // Clear the input
            const nameInput = document.getElementById('presetNameInput');
            if (nameInput) {
                nameInput.value = '';
            }

            return result;
        } catch (error) {
            console.error('Error saving preset:', error);
            this.setColorSaveStatus(error.message || 'Fehler beim Speichern des Schemas', 'error');
            throw error;
        }
    },

    /**
     * Delete a preset
     */
    deleteColorPreset: async function(id) {
        try {
            const response = await fetch(`api/color_presets.php?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete preset');
            }

            // Reload preset list
            await this.loadColorPresets();

            // Show success notification
            this.setColorSaveStatus('Schema gelöscht', 'success');

            return result;
        } catch (error) {
            console.error('Error deleting preset:', error);
            this.setColorSaveStatus(error.message || 'Fehler beim Löschen des Schemas', 'error');
            throw error;
        }
    },

    /**
     * Apply a preset
     */
    applyColorPreset: async function(id) {
        try {
            const response = await fetch(`api/color_presets.php?id=${id}`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to load preset');
            }

            // Populate form with preset colors
            this.populateFormWithColors(result.colors);

            // Apply preview
            this.previewColorPreferences(result.colors);

            // Show success notification
            this.setColorSaveStatus('Schema geladen', 'success');

            return result;
        } catch (error) {
            console.error('Error applying preset:', error);
            this.setColorSaveStatus(error.message || 'Fehler beim Laden des Schemas', 'error');
            throw error;
        }
    },

    /**
     * Get current colors from form inputs
     */
    getCurrentColorsFromForm: function() {
        const colors = {};

        // Define all color input IDs and their corresponding names
        const colorMappings = {
            'primaryColorInput': 'primaryColor',
            'backgroundColor': 'background',
            'backgroundFreezeColor': 'backgroundFreeze',
            'backgroundPrimaryColor': 'backgroundPrimary',
            'logoColor': 'logo',
            'redShiftColor': 'redShift',
            'orangeShiftColor': 'orangeShift',
            'greenShiftColor': 'greenShift',
            'starterShiftColor': 'starterShift',
            'schreibdienstSingleColor': 'schreibdienstSingle',
            'schreibdienstFullColor': 'schreibdienstFull',
            'hoverBgColor': 'hoverBg',
            'selectedBgColor': 'selectedBg',
            'hoverBgSingleColor': 'hoverBgSingle',
            'selectedBgSingleColor': 'selectedBgSingle',
            'buttonNavBgColor': 'buttonNavBg',
            'buttonNavBgHoverColor': 'buttonNavBgHover'
        };

        for (const [inputId, colorName] of Object.entries(colorMappings)) {
            const colorInput = document.getElementById(inputId);
            const alphaInput = document.getElementById(inputId.replace('Color', 'Alpha').replace('Input', 'Alpha'));

            if (colorInput) {
                colors[colorName] = {
                    hex: colorInput.value,
                    alpha: alphaInput ? parseFloat(alphaInput.value) : 1.0
                };
            }
        }

        return colors;
    },

    /**
     * Populate Pickr instances with colors from preset
     */
    populateFormWithColors: function(colors) {
        // Helper to convert hex+alpha to RGBA string
        const toRgbaString = (colorObj) => {
            const hex = colorObj.hex || colorObj;
            const alpha = colorObj.alpha !== undefined ? colorObj.alpha : 1;

            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);

            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        // Update each Pickr instance with new colors
        Object.entries(colors).forEach(([colorName, colorValue]) => {
            const pickr = this.pickrInstances[colorName];
            if (pickr && colorValue) {
                const rgbaString = toRgbaString(colorValue);
                pickr.setColor(rgbaString);
            }
        });
    },

    /**
     * Setup preset event listeners
     */
    setupPresetEventListeners: function() {
        const deleteBtn = document.getElementById('deletePresetBtn');
        const saveBtn = document.getElementById('savePresetBtn');
        const confirmSaveBtn = document.getElementById('confirmSavePresetBtn');
        const cancelSaveBtn = document.getElementById('cancelSavePresetBtn');
        const saveForm = document.getElementById('savePresetForm');
        const nameInput = document.getElementById('presetNameInput');
        const dropdown = document.getElementById('colorPresetDropdown');

        // Auto-load preset on selection and show/hide delete button
        if (dropdown && deleteBtn) {
            dropdown.addEventListener('change', () => {
                const selectedOption = dropdown.options[dropdown.selectedIndex];
                const selectedId = dropdown.value;

                if (selectedOption && selectedId) {
                    // Auto-load the preset
                    this.applyColorPreset(selectedId);

                    // Show delete button only for non-system presets
                    if (selectedOption.dataset.isDefault === 'false') {
                        deleteBtn.style.display = 'inline-block';
                    } else {
                        deleteBtn.style.display = 'none';
                    }
                } else {
                    deleteBtn.style.display = 'none';
                }
            });
        }

        // Delete preset button
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const selectedId = dropdown.value;
                const selectedOption = dropdown.options[dropdown.selectedIndex];

                if (!selectedId) {
                    this.setColorSaveStatus('Bitte wählen Sie ein Schema', 'error');
                    return;
                }

                const presetName = selectedOption.textContent;
                if (confirm(`Möchten Sie das Schema "${presetName}" wirklich löschen?`)) {
                    this.deleteColorPreset(selectedId).then(() => {
                        // Reset dropdown selection and hide delete button
                        dropdown.value = '';
                        deleteBtn.style.display = 'none';
                    }).catch(error => {
                        console.error('Failed to delete preset:', error);
                    });
                }
            });
        }

        // Save preset button - show form
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (saveForm) {
                    saveForm.style.display = saveForm.style.display === 'none' ? 'block' : 'none';
                    if (saveForm.style.display === 'block' && nameInput) {
                        nameInput.focus();
                    }
                }
            });
        }

        // Confirm save button
        if (confirmSaveBtn) {
            confirmSaveBtn.addEventListener('click', () => {
                const name = nameInput ? nameInput.value.trim() : '';
                if (!name) {
                    this.setColorSaveStatus('Bitte geben Sie einen Namen ein', 'error');
                    return;
                }
                this.saveColorPreset(name);
            });
        }

        // Cancel save button
        if (cancelSaveBtn) {
            cancelSaveBtn.addEventListener('click', () => {
                if (saveForm) {
                    saveForm.style.display = 'none';
                }
                if (nameInput) {
                    nameInput.value = '';
                }
            });
        }

        // Enter key in name input
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmSaveBtn.click();
                }
            });
        }
    }
};