<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Test - Einsatzplan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .test-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .test-section h3 {
            color: #1760ff;
            margin-top: 0;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .btn {
            background: #1760ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        .btn:hover {
            background: #0a4bd4;
        }
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .result {
            margin-top: 15px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        .result.success {
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }
        .result.error {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }
        .info {
            background: #e3f2fd;
            color: #1565c0;
            border: 1px solid #bbdefb;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .status {
            font-weight: bold;
            padding: 5px 10px;
            border-radius: 3px;
            display: inline-block;
            margin-left: 10px;
        }
        .status.active {
            background: #fff3cd;
            color: #856404;
        }
        .status.expired {
            background: #ffebee;
            color: #c62828;
        }
        .status.none {
            background: #e8f5e8;
            color: #2e7d32;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>Password Reset System Test</h1>
        
        <div class="info">
            <strong>Instructions:</strong>
            <ul>
                <li>Make sure you have created the password_reset_logs table by running the SQL script</li>
                <li>Test with a valid backoffice user email</li>
                <li>Check your email server configuration for actual email delivery</li>
                <li>For development, emails will be sent using PHP's mail() function</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>1. Test Password Reset Request</h3>
            <div class="form-group">
                <label for="resetEmail">Email Address:</label>
                <input type="email" id="resetEmail" placeholder="Enter backoffice user email">
            </div>
            <button class="btn" onclick="testPasswordReset()">Request Reset</button>
            <div id="resetResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>2. Test Token Validation</h3>
            <div class="form-group">
                <label for="validateToken">Reset Token:</label>
                <input type="text" id="validateToken" placeholder="Enter reset token">
            </div>
            <button class="btn" onclick="testTokenValidation()">Validate Token</button>
            <div id="validateResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>3. Test Password Reset</h3>
            <div class="form-group">
                <label for="resetToken">Reset Token:</label>
                <input type="text" id="resetToken" placeholder="Enter reset token">
            </div>
            <div class="form-group">
                <label for="newPassword">New Password:</label>
                <input type="password" id="newPassword" placeholder="Enter new password">
            </div>
            <button class="btn" onclick="testPasswordChange()">Change Password</button>
            <div id="changeResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>4. Check User Status</h3>
            <button class="btn" onclick="checkUserStatus()">Check All Users</button>
            <div id="userStatusResult" class="result"></div>
        </div>
    </div>

    <script>
        async function testPasswordReset() {
            const email = document.getElementById('resetEmail').value;
            const resultDiv = document.getElementById('resetResult');
            
            if (!email) {
                showResult(resultDiv, 'Please enter an email address', 'error');
                return;
            }
            
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
                    showResult(resultDiv, data.message, 'success');
                } else {
                    showResult(resultDiv, data.error || 'Request failed', 'error');
                }
            } catch (error) {
                showResult(resultDiv, 'Network error: ' + error.message, 'error');
            }
        }
        
        async function testTokenValidation() {
            const token = document.getElementById('validateToken').value;
            const resultDiv = document.getElementById('validateResult');
            
            if (!token) {
                showResult(resultDiv, 'Please enter a token', 'error');
                return;
            }
            
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
                    showResult(resultDiv, data.message, 'success');
                } else {
                    showResult(resultDiv, data.error || 'Validation failed', 'error');
                }
            } catch (error) {
                showResult(resultDiv, 'Network error: ' + error.message, 'error');
            }
        }
        
        async function testPasswordChange() {
            const token = document.getElementById('resetToken').value;
            const password = document.getElementById('newPassword').value;
            const resultDiv = document.getElementById('changeResult');
            
            if (!token || !password) {
                showResult(resultDiv, 'Please enter both token and password', 'error');
                return;
            }
            
            try {
                const response = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'reset_password',
                        token: token,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showResult(resultDiv, data.message, 'success');
                } else {
                    showResult(resultDiv, data.error || 'Password change failed', 'error');
                }
            } catch (error) {
                showResult(resultDiv, 'Network error: ' + error.message, 'error');
            }
        }
        
        async function checkUserStatus() {
            const resultDiv = document.getElementById('userStatusResult');
            
            try {
                const response = await fetch('api/users.php');
                const users = await response.json();
                
                if (response.ok) {
                    let html = '<h4>User Status:</h4>';
                    users.forEach(user => {
                        if (user.role === 'Backoffice') {
                            html += `<div><strong>${user.name}</strong> (${user.email || 'No email'})`;
                            if (user.resetStatus) {
                                html += `<span class="status ${user.resetStatus}">${user.resetStatus}</span>`;
                                if (user.resetTokenExpires) {
                                    html += ` (expires: ${new Date(user.resetTokenExpires).toLocaleString()})`;
                                }
                            }
                            html += '</div>';
                        }
                    });
                    resultDiv.innerHTML = html;
                    resultDiv.style.display = 'block';
                } else {
                    showResult(resultDiv, 'Failed to fetch users', 'error');
                }
            } catch (error) {
                showResult(resultDiv, 'Network error: ' + error.message, 'error');
            }
        }
        
        function showResult(div, message, type) {
            div.textContent = message;
            div.className = `result ${type}`;
            div.style.display = 'block';
        }
    </script>
</body>
</html>