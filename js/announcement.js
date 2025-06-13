/**
 * Announcement Text Feature
 * This module handles loading, displaying, and editing of the announcement text
 * displayed at the top of the calendar.
 */

const AnnouncementManager = {
    // Load announcement text from API
    loadAnnouncementText: async function() {
        try {
            const response = await fetch('api/announcement.php');
            
            if (!response.ok) {
                throw new Error(`Failed to load announcement: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update the announcement container
            const container = document.getElementById('announcementText');
            if (container) {
                container.innerHTML = `
                    <div class="announcement-content">${data.content}</div>
                `;
            }
            
            return data;
        } catch (error) {
            console.error('Error loading announcement text:', error);
            // Set default content on error
            const container = document.getElementById('announcementText');
            if (container) {
                container.innerHTML = `
                    <div class="announcement-content"><p>Welcome to the shift scheduling calendar. Here you can view and manage all assignments.</p></div>
                `;
            }
        }
    },

    // Save announcement text to API
    saveAnnouncementText: async function(content) {
        try {
            const response = await AuthManager.fetchWithAuth('api/announcement.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content
                })
            }, true); // Require authentication
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save announcement');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error saving announcement text:', error);
            throw error;
        }
    },

    // Set up announcement edit modal
    setupAnnouncementEditModal: function() {
        const modal = document.getElementById('announcementModal');
        const closeBtn = document.getElementById('closeAnnouncementModal');
        const saveBtn = document.getElementById('saveAnnouncementBtn');
        const contentEditor = document.getElementById('announcementContent');
        const charCounter = document.getElementById('characterCount');
        
        if (!modal || !closeBtn || !saveBtn || !contentEditor) {
            console.error('Announcement modal elements not found');
            return;
        }
        
        // Close button handler
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close when clicking outside the modal
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Character counter
        contentEditor.addEventListener('input', () => {
            const text = contentEditor.innerText;
            charCounter.textContent = text.length;
            
            // Visual feedback if too long (roughly 4 lines)
            if (text.length > 300) {
                charCounter.style.color = '#f44336';
            } else {
                charCounter.style.color = '#666';
            }
        });
        
        // Ensure the font size dropdown exists in the toolbar
        const toolbar = modal.querySelector('.announcement-toolbar');
        if (toolbar) {
            // Check if font size dropdown already exists
            let fontSizeDropdown = toolbar.querySelector('.font-size-dropdown');
            
            if (!fontSizeDropdown) {
                // Create font size dropdown if it doesn't exist
                fontSizeDropdown = document.createElement('select');
                fontSizeDropdown.className = 'font-size-dropdown';
                fontSizeDropdown.innerHTML = `
                    <option value="">Font Size</option>
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="7">Extra Large</option>
                `;
                
                // Add it to the toolbar (before the existing buttons if any)
                if (toolbar.firstChild) {
                    toolbar.insertBefore(fontSizeDropdown, toolbar.firstChild);
                } else {
                    toolbar.appendChild(fontSizeDropdown);
                }
                
                // Add event listener
                fontSizeDropdown.addEventListener('change', () => {
                    if (fontSizeDropdown.value) {
                        document.execCommand('fontSize', false, fontSizeDropdown.value);
                        contentEditor.focus();
                        // Reset dropdown to default option
                        setTimeout(() => {
                            fontSizeDropdown.selectedIndex = 0;
                        }, 10);
                    }
                });
            }
        }
        
        // Format buttons handlers
        const boldBtn = modal.querySelector('[data-command="bold"]');
        if (boldBtn) {
            boldBtn.addEventListener('click', () => {
                document.execCommand('bold', false);
                contentEditor.focus();
            });
        }
        
        const italicBtn = modal.querySelector('[data-command="italic"]');
        if (italicBtn) {
            italicBtn.addEventListener('click', () => {
                document.execCommand('italic', false);
                contentEditor.focus();
            });
        }
        
        const underlineBtn = modal.querySelector('[data-command="underline"]');
        if (underlineBtn) {
            underlineBtn.addEventListener('click', () => {
                document.execCommand('underline', false);
                contentEditor.focus();
            });
        }
        
        // Remove color dropdown if it exists
        const colorDropdown = modal.querySelector('.color-dropdown');
        if (colorDropdown) {
            colorDropdown.remove();
        }
        
        // Save button handler
        saveBtn.addEventListener('click', async () => {
            const content = contentEditor.innerHTML;
            
            if (!content) {
                NotificationSystem.warning('Please enter content for the announcement');
                return;
            }
            
            try {
                // Show loading status
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
                
                // Save to API
                await this.saveAnnouncementText(content);
                
                // Update displayed announcement
                await this.loadAnnouncementText();
                
                // Close modal
                modal.style.display = 'none';
                
                // Show success notification
                NotificationSystem.success('Ankündigung erfolgreich aktualisiert');
            } catch (error) {
                NotificationSystem.error(`Fehler beim Speichern der Ankündigung: ${error.message}`);
            } finally {
                // Reset button
                saveBtn.disabled = false;
                saveBtn.textContent = 'Änderungen speichern';
            }
        });
    },

    // Show announcement edit modal
    showAnnouncementEditModal: function() {
        const modal = document.getElementById('announcementModal');
        const contentEditor = document.getElementById('announcementContent');
        const charCounter = document.getElementById('characterCount');
        
        if (!modal || !contentEditor) {
            console.error('Announcement modal elements not found');
            return;
        }
        
        // Get current content
        const announcementContent = document.querySelector('.announcement-content');
        
        if (announcementContent) {
            contentEditor.innerHTML = announcementContent.innerHTML || '';
            
            // Update character count
            const text = contentEditor.innerText;
            charCounter.textContent = text.length;
        }
        
        // Show modal
        modal.style.display = 'block';
        
        // Focus content editor
        contentEditor.focus();
    },

    // Update edit button visibility based on user role
    updateAnnouncementEditButton: function() {
        const editBtn = document.getElementById('editAnnouncementBtn');
        if (!editBtn) return;
        
        const currentUser = AuthManager.getCurrentUser();
        const isBackoffice = currentUser && currentUser.role === 'Backoffice';
        
        editBtn.style.display = isBackoffice ? 'flex' : 'none';
    },

    // Set up announcement edit button
    setupAnnouncementEditButton: function() {
        const editBtn = document.getElementById('editAnnouncementBtn');
        if (!editBtn) return;
        
        // Add click handler
        editBtn.addEventListener('click', () => {
            this.showAnnouncementEditModal();
        });
        
        // Update visibility
        this.updateAnnouncementEditButton();
    },

    // Initialize announcement feature
    init: async function() {
        console.log('Initializing Announcement Feature');
        
        // Load announcement text
        await this.loadAnnouncementText();
        
        // Set up announcement editing
        this.setupAnnouncementEditModal();
        this.setupAnnouncementEditButton();
        
        return true;
    }
};

// Initialize the announcement feature after the page loads
window.addEventListener('load', function() {
    // Wait a moment for the app to initialize
    setTimeout(() => {
        // Don't automatically initialize here since we're doing it in script.js
        // AnnouncementManager.init();
    }, 500);
});