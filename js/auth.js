// auth.js - Authentication utility functions

const AuthManager = {
    // Check if user is authenticated
    isAuthenticated: function() {
        let authData;
        try {
            const authDataString = localStorage.getItem('authData');
            if (!authDataString) {
                return false;
            }
            authData = JSON.parse(authDataString);
            if (!authData || !authData.token) {
                return false;
            }
        } catch (error) {
            // Invalid JSON in localStorage, clear it
            console.warn('Invalid authData in localStorage, clearing:', error);
            localStorage.removeItem('authData');
            return false;
        }
        
        // Check if token is expired
        const expiresAt = new Date(authData.expires_at);
        if (expiresAt < new Date()) {
            // Token expired, clear auth data
            this.logout();
            return false;
        }
        
        return true;
    },
    
    // Get current user
    getCurrentUser: function() {
        if (!this.isAuthenticated()) {
            return null;
        }
        
        try {
            const authDataString = localStorage.getItem('authData');
            if (!authDataString) {
                return null;
            }
            const authData = JSON.parse(authDataString);
            return authData.user;
        } catch (error) {
            console.warn('Invalid authData in localStorage, clearing:', error);
            localStorage.removeItem('authData');
            return null;
        }
    },
    
    // Get auth token
    getToken: function() {
        if (!this.isAuthenticated()) {
            return null;
        }
        
        try {
            const authDataString = localStorage.getItem('authData');
            if (!authDataString) {
                return null;
            }
            const authData = JSON.parse(authDataString);
            return authData.token;
        } catch (error) {
            console.warn('Invalid authData in localStorage, clearing:', error);
            localStorage.removeItem('authData');
            return null;
        }
    },
    
    // Debug function to test headers
    debugHeaders: async function() {
        try {
            const response = await this.fetchWithAuth('api/debug_headers.php');
            const data = await response.json();
            console.log('DEBUG HEADERS RESPONSE:', data);
            return data;
        } catch (error) {
            console.error('DEBUG HEADERS ERROR:', error);
            return null;
        }
    },
    
    // Helper function to add token to URL for server compatibility
    addTokenToUrl: function(url) {
        if (!this.isAuthenticated()) {
            return url;
        }
        
        const token = this.getToken();
        if (!token) {
            return url;
        }
        
        // Check if URL already has query parameters
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}token=${token}`;
    },
    
    // Logout user
    logout: async function() {
        console.error('LOGOUT FUNCTION CALLED! Current location:', window.location.href);
        
        // Prevent multiple logout calls
        if (this._loggingOut) {
            console.error('LOGOUT: Already logging out, ignoring');
            return;
        }
        this._loggingOut = true;
        
        let authData = null;
        try {
            const authDataString = localStorage.getItem('authData');
            if (authDataString) {
                authData = JSON.parse(authDataString);
            }
        } catch (error) {
            console.warn('Invalid authData in localStorage during logout:', error);
        }
        
        // Clear local storage first
        console.error('LOGOUT: Clearing localStorage');
        localStorage.removeItem('authData');
        
        // For mobile logout, stay on main calendar page - force reload immediately
        console.error(`LOGOUT: Forcing page reload to stay on calendar`);
        
        // Try to invalidate token on server (non-blocking)
        if (authData && authData.token) {
            // Fire and forget - don't wait for server response
            fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'logout',
                    token: authData.token
                })
            }).catch(error => {
                console.warn('Server logout failed (ignored):', error);
            });
        }
        
        // Force page reload immediately - this stops script execution
        if (window.location.pathname.includes('login.html')) {
            // If we're on login page, go to main calendar
            window.location.href = window.location.origin + window.location.pathname.replace('login.html', 'index.html');
        } else {
            // If we're on main page, force reload to refresh without auth
            window.location.reload();
        }
    },
    
    // Add auth token to fetch requests if available, but don't require it
    fetchWithAuth: async function(url, options = {}, requireAuth = false) {
        console.log(`DEBUG: fetchWithAuth called for ${url}`);
        console.log(`DEBUG: requireAuth: ${requireAuth}`);
        console.log(`DEBUG: isAuthenticated: ${this.isAuthenticated()}`);
        
        // If authentication is required but we're not authenticated
        if (requireAuth && !this.isAuthenticated()) {
            // Show login dialog
            this.showLoginDialog();
            throw new Error('Authentication required');
        }
        
        // Make sure headers exist
        if (!options.headers) {
            options.headers = {};
        }
        
        // Add Authorization header with token if authenticated
        if (this.isAuthenticated()) {
            const token = this.getToken();
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log(`DEBUG: Added Authorization header with token: ${token}`);
        } else {
            console.log(`DEBUG: No authentication, not adding Authorization header`);
        }
        
        console.log(`DEBUG: Final request options:`, options);
        
        // Make the request
        try {
            const response = await fetch(url, options);
            
            // If we get a 401 Unauthorized and auth is required, show login
            if (response.status === 401 && (requireAuth || this.isAuthenticated())) {
                console.error(`401 UNAUTHORIZED DEBUG:`, {
                    url: url,
                    requireAuth: requireAuth,
                    isAuthenticated: this.isAuthenticated(),
                    condition: (requireAuth || this.isAuthenticated()),
                    willShowLogin: requireAuth
                });
                
                // If we were authenticated, clear it silently (no redirect)
                if (this.isAuthenticated()) {
                    localStorage.removeItem('authData');
                    console.log('Auth data cleared due to 401 response');
                }
                
                if (requireAuth) {
                    console.error('CALLING showLoginDialog because requireAuth is true!');
                    // Show login dialog for required auth
                    this.showLoginDialog();
                }
                
                throw new Error('Authentication required');
            }
            
            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    },
    
    // Show a login dialog or redirect to login page
    showLoginDialog: function() {
        console.error('showLoginDialog called! Call stack:');
        console.trace();
        
        // Check if logout is in progress - if so, ignore this call
        if (window._logoutInProgress) {
            console.error('BLOCKED: showLoginDialog called during logout, ignoring');
            return;
        }
        
        // For simplicity, redirect to login page
        window.location.href = 'login.html?returnUrl=' + encodeURIComponent(window.location.href);
    },
    
    // Initialize auth (check token validity, set up UI)
    init: function() {
        // Check if we're on the login page
        const isLoginPage = window.location.pathname.includes('login.html');
        
        // If authenticated and on login page, redirect to returnUrl or app
        if (this.isAuthenticated() && isLoginPage) {
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get('returnUrl');
            
            if (returnUrl) {
                window.location.href = returnUrl;
            } else {
                window.location.href = 'index.html';
            }
            return;
        }
        
        // Set up the UI (login/logout button)
        this.setupUI();
    },
    
    // Set up UI elements based on authentication
    setupUI: function() {
        const user = this.getCurrentUser();
        
        // Set up login/logout button
        const authButton = document.getElementById('authButton');
        if (authButton) {
            if (user) {
                // Show user info and logout option
                authButton.textContent = 'Logout';
                authButton.classList.add('logged-in');
                authButton.onclick = () => this.logout();
                
                // Add user name to button if available
                const userInfoEl = document.getElementById('userInfo');
                if (userInfoEl && user.name) {
                    userInfoEl.textContent = user.name;
                    userInfoEl.style.display = 'block';
                }
            } else {
                // Show login option
                authButton.textContent = 'Login';
                authButton.classList.remove('logged-in');
                authButton.onclick = () => this.showLoginDialog();
                
                // Hide user info
                const userInfoEl = document.getElementById('userInfo');
                if (userInfoEl) {
                    userInfoEl.style.display = 'none';
                }
            }
        }
        
        // Set up mobile auth button
        const mobileAuthButton = document.getElementById('mobileAuthButton');
        if (mobileAuthButton) {
            if (user) {
                mobileAuthButton.textContent = 'Logout';
                mobileAuthButton.classList.add('logged-in');
                mobileAuthButton.onclick = () => this.logout();
                
                const mobileUserInfoEl = document.getElementById('mobileUserInfo');
                if (mobileUserInfoEl && user.name) {
                    mobileUserInfoEl.textContent = user.name;
                    mobileUserInfoEl.style.display = 'block';
                }
            } else {
                mobileAuthButton.textContent = 'Anmelden';
                mobileAuthButton.classList.remove('logged-in');
                mobileAuthButton.onclick = () => this.showLoginDialog();
                
                const mobileUserInfoEl = document.getElementById('mobileUserInfo');
                if (mobileUserInfoEl) {
                    mobileUserInfoEl.style.display = 'none';
                }
            }
        }
    },
    
    // Password reset functionality
    passwordReset: {
        // Request password reset
        requestReset: async function(email) {
            try {
                const response = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'request_reset',
                        email: email
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    return { success: true, message: data.message };
                } else {
                    return { success: false, error: data.error || 'Reset request failed' };
                }
            } catch (error) {
                console.error('Password reset request error:', error);
                return { success: false, error: 'Network error occurred' };
            }
        },
        
        // Validate reset token
        validateToken: async function(token) {
            try {
                const response = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'validate_reset_token',
                        token: token
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    return { success: true, message: data.message };
                } else {
                    return { success: false, error: data.error || 'Token validation failed' };
                }
            } catch (error) {
                console.error('Token validation error:', error);
                return { success: false, error: 'Network error occurred' };
            }
        },
        
        // Reset password with token
        resetPassword: async function(token, newPassword) {
            try {
                const response = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'reset_password',
                        token: token,
                        password: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    return { success: true, message: data.message };
                } else {
                    return { success: false, error: data.error || 'Password reset failed' };
                }
            } catch (error) {
                console.error('Password reset error:', error);
                return { success: false, error: 'Network error occurred' };
            }
        },
        
        // Clear reset token (admin function)
        clearResetToken: async function(userId) {
            try {
                const response = await AuthManager.fetchWithAuth('api/users.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'clear_reset_token',
                        userId: userId
                    })
                }, true);
                
                const data = await response.json();
                
                if (response.ok) {
                    return { success: true, message: data.message };
                } else {
                    return { success: false, error: data.error || 'Failed to clear reset token' };
                }
            } catch (error) {
                console.error('Clear reset token error:', error);
                return { success: false, error: 'Network error occurred' };
            }
        }
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    AuthManager.init();
});