/**
 * Feedback Feature
 * Simple feedback system for users to submit comments and suggestions
 */

const FeedbackFeature = (function() {

    // Add styles for feedback
    function addStyles() {
        if (document.getElementById('feedback-styles')) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'feedback-styles';
        styleEl.innerHTML = `
            /* Feedback button */
            .feedback-button {
                background: var(--primary-color, #1760ff);
                border: none;
                color: white;
                font-size: 16px;
                font-family: "DIN Next Rounded LT W01 Regular";
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 5px 12px;
                border-top-left-radius: 0px;
                border-bottom-right-radius: 12px;
                transition: all 0.2s ease;
            }

            .feedback-button:hover {
                opacity: 0.9;
            }

            /* Mobile Feedback button - Fixed Position */
            .mobile-feedback-link-fixed {
                display: none;
                position: fixed;
                top: 11px;
                right: 60px;
                z-index: 1600;
                color: white;
                font-size: 15px;
                font-family: inherit;
                font-weight: 400;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.2s ease;
                line-height: 25px;
                background: var(--primary-color, #1760ff) !important;
                padding: 4px 10px;
                border-radius: 12px;
            }

            .mobile-feedback-link-fixed:hover {
                color: rgba(255, 255, 255, 0.8);
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
            }

            /* Show mobile feedback button only on mobile */
            @media screen and (max-width: 768px) {
                .mobile-feedback-link-fixed {
                    display: block !important;
                }

                /* Ensure primary color background on mobile */
                a.mobile-feedback-link-fixed {
                    background-color: var(--primary-color, #1760ff) !important;
                }
            }

            /* Hide on desktop */
            @media screen and (min-width: 769px) {
                .mobile-feedback-link-fixed {
                    display: none !important;
                }
            }

            /* Feedback modal */
            #feedbackModal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 2000;
                overflow-y: auto;
            }

            .feedback-modal-content {
                background-color: #ffffff;
                margin: 5% auto;
                padding: 30px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }

            .feedback-modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                color: #aaa;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                background: none;
                border: none;
                padding: 0;
                line-height: 1;
            }

            .feedback-modal-close:hover {
                color: #000;
            }

            .feedback-modal-header {
                margin-bottom: 20px;
                padding-right: 30px;
            }

            .feedback-modal-header h2 {
                margin: 0 0 15px 0;
                color: var(--primary-color, #1760ff);
                font-size: 1.5rem;
            }

            .feedback-description {
                color: #666;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 20px;
            }

            .feedback-form {
                margin-bottom: 30px;
            }

            .feedback-textarea {
                width: 100%;
                min-height: 100px;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                margin-bottom: 15px;
                box-sizing: border-box;
            }

            .feedback-textarea:focus {
                outline: none;
                border-color: var(--primary-color, #1760ff);
            }

            .feedback-submit-btn {
                background-color: var(--primary-color, #1760ff);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 24px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .feedback-submit-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .feedback-submit-btn:disabled {
                background-color: #ccc;
                cursor: not-allowed;
                transform: none;
            }

            .feedback-list {
                border-top: 2px solid #eee;
                padding-top: 20px;
                max-height: 400px;
                overflow-y: auto;
            }

            .feedback-list h3 {
                margin: 0 0 15px 0;
                font-size: 1.1rem;
                color: #333;
            }

            .feedback-item {
                background-color: #f9f9f9;
                border-left: 2px solid var(--primary-color, #1760ff);
                padding: 12px 15px;
                margin-bottom: 12px;
                border-radius: 0px;
            }

            .feedback-item-header {
                display: flex;
                justify-content: flex-end;
                align-items: baseline;
                margin-bottom: 8px;
                flex-wrap: wrap;
                gap: 8px;
            }

            .feedback-item-date {
                font-size: 12px;
                color: #999;
            }

            .feedback-item-comment {
                color: #555;
                font-size: 14px;
                line-height: 1.5;
                white-space: pre-wrap;
                word-wrap: break-word;
            }

            .feedback-empty {
                color: #999;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }

            /* Mobile styles */
            @media screen and (max-width: 768px) {
                .feedback-modal-content {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    border-radius: 0;
                    max-width: none;
                    overflow-y: auto;
                }

                .feedback-modal-header h2 {
                    font-size: 1.3rem;
                }

                .feedback-list {
                    max-height: none;
                }
            }
        `;

        document.head.appendChild(styleEl);
        console.log('Feedback styles added');
    }

    // Create feedback button
    function createFeedbackButton() {
        if (document.getElementById('feedbackButton')) {
            return;
        }

        // Find the toggle-buttons-container
        const container = document.querySelector('.toggle-buttons-container');
        if (!container) {
            console.error('Toggle buttons container not found');
            return;
        }

        const button = document.createElement('button');
        button.id = 'feedbackButton';
        button.className = 'feedback-button';

        // Add the toggle-text span to match other buttons
        const textSpan = document.createElement('span');
        textSpan.className = 'toggle-text';
        textSpan.textContent = 'Feedback';
        button.appendChild(textSpan);

        button.addEventListener('click', openModal);

        // Append to toggle-buttons-container
        container.appendChild(button);
        console.log('Feedback button created and added to toggle-buttons-container');
    }

    // Create feedback modal
    function createModal() {
        if (document.getElementById('feedbackModal')) {
            return;
        }

        const modalHtml = `
            <div id="feedbackModal" class="modal">
                <div class="feedback-modal-content">
                    <button class="feedback-modal-close">&times;</button>

                    <div class="feedback-modal-header">
                        <h2>Feedback</h2>
                        <p class="feedback-description">
                            Feedback zum neuen Einsatzplan kannst du gerne an Milena zurückmelden oder direkt hier als Kommentar hinterlassen.
                        </p>
                    </div>

                    <div class="feedback-form">
                        <textarea
                            id="feedbackTextarea"
                            class="feedback-textarea"
                            placeholder="Dein Feedback hier eingeben..."
                        ></textarea>
                        <button id="feedbackSubmitBtn" class="feedback-submit-btn">Senden</button>
                    </div>

                    <div class="feedback-list">
                        <h3>Bisherige Kommentare</h3>
                        <div id="feedbackListContainer"></div>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = modalHtml;
        document.body.appendChild(container.firstElementChild);

        // Add event listeners
        const modal = document.getElementById('feedbackModal');
        const closeBtn = modal.querySelector('.feedback-modal-close');
        const submitBtn = document.getElementById('feedbackSubmitBtn');

        closeBtn.addEventListener('click', closeModal);
        submitBtn.addEventListener('click', submitFeedback);

        // Close when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        console.log('Feedback modal created');
    }

    // Open modal
    function openModal() {
        const modal = document.getElementById('feedbackModal');
        if (modal) {
            modal.style.display = 'block';
            loadFeedback();
        }
    }

    // Close modal
    function closeModal() {
        const modal = document.getElementById('feedbackModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Load all feedback comments
    async function loadFeedback() {
        try {
            const response = await fetch('api/feedback.php');

            if (!response.ok) {
                throw new Error('Failed to load feedback');
            }

            const feedbacks = await response.json();
            displayFeedback(feedbacks);

        } catch (error) {
            console.error('Error loading feedback:', error);
            const container = document.getElementById('feedbackListContainer');
            if (container) {
                container.innerHTML = '<p class="feedback-empty">Fehler beim Laden der Kommentare.</p>';
            }
        }
    }

    // Display feedback list
    function displayFeedback(feedbacks) {
        const container = document.getElementById('feedbackListContainer');
        if (!container) return;

        if (!feedbacks || feedbacks.length === 0) {
            container.innerHTML = '<p class="feedback-empty">Noch keine Kommentare vorhanden.</p>';
            return;
        }

        container.innerHTML = feedbacks.map(feedback => {
            const date = new Date(feedback.created_at);
            const formattedDate = formatDate(date);

            return `
                <div class="feedback-item">
                    <div class="feedback-item-header">
                        <span class="feedback-item-date">${formattedDate}</span>
                    </div>
                    <div class="feedback-item-comment">${escapeHtml(feedback.comment)}</div>
                </div>
            `;
        }).join('');
    }

    // Submit new feedback
    async function submitFeedback() {
        const textarea = document.getElementById('feedbackTextarea');
        const submitBtn = document.getElementById('feedbackSubmitBtn');

        if (!textarea) return;

        const comment = textarea.value.trim();

        if (!comment) {
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.warning('Bitte gib einen Kommentar ein');
            } else {
                alert('Bitte gib einen Kommentar ein');
            }
            return;
        }

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet...';

        try {
            const response = await fetch('api/feedback.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    comment: comment,
                    user_name: null // Anonymous feedback
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit feedback');
            }

            // Clear textarea
            textarea.value = '';

            // Reload feedback list
            await loadFeedback();

            // Show success message
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.success('Feedback erfolgreich gesendet!');
            } else {
                alert('Feedback erfolgreich gesendet!');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.error('Fehler beim Senden: ' + error.message);
            } else {
                alert('Fehler beim Senden: ' + error.message);
            }
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Senden';
        }
    }

    // Format date in German style
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Setup mobile feedback button
    function setupMobileFeedbackButton() {
        const mobileBtn = document.getElementById('mobileFeedbackButton');
        if (!mobileBtn) {
            console.log('Mobile feedback button not found');
            return;
        }

        // Prevent default link behavior
        mobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        console.log('Mobile feedback button setup complete');
    }

    // Initialize the feedback feature
    function init() {
        try {
            console.log('Initializing Feedback Feature');

            // Add styles
            addStyles();

            // Create desktop button
            createFeedbackButton();

            // Setup mobile button
            setupMobileFeedbackButton();

            // Create modal
            createModal();

            console.log('Feedback Feature initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Feedback Feature:', error);
            return false;
        }
    }

    // Public API
    return {
        init: init,
        openModal: openModal,
        closeModal: closeModal,
        loadFeedback: loadFeedback
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        FeedbackFeature.init();
    });
} else {
    FeedbackFeature.init();
}

console.log("FeedbackFeature script loaded");
