<?php
// Disable error output to prevent JSON corruption
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any unexpected output
ob_start();

require_once 'config.php';
// DO NOT require auth_middleware.php here

// Clean any output buffer and set content type to JSON
ob_clean();
header('Content-Type: application/json');

// Get database connection
$conn = getDbConnection();

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check action type
        if (!isset($data['action'])) {
            handleError('Action parameter is required', 400);
        }
        
        // Handle login request
        if ($data['action'] === 'login') {
            if (!isset($data['email']) || !isset($data['password'])) {
                handleError('Email and password are required', 400);
            }
            
            $email = $data['email'];
            $password = $data['password'];
            
            // Find the user
            $stmt = $conn->prepare("
                SELECT id, name, password, role
                FROM users
                WHERE email = ? AND active = 1
            ");
            
            $stmt->bind_param('s', $email);
            
            if (!$stmt->execute()) {
                handleError('Failed to execute query: ' . $stmt->error);
            }
            
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                handleError('Invalid email or password', 401);
            }
            
            $user = $result->fetch_assoc();
            
            // Check if this is a Backoffice user
            if ($user['role'] !== 'Backoffice') {
                handleError('Access denied. Only Backoffice users can log in', 403);
            }
            
            // Verify password
            if (!password_verify($password, $user['password'])) {
                handleError('Invalid email or password', 401);
            }
            
            // Generate a session token
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+12 hours'));
            
            // Store the token
            $stmt = $conn->prepare("
                INSERT INTO sessions (user_id, token, expires_at)
                VALUES (?, ?, ?)
            ");
            
            $stmt->bind_param('iss', $user['id'], $token, $expiresAt);
            
            if (!$stmt->execute()) {
                handleError('Failed to create session: ' . $stmt->error);
            }
            
            // Return user info and token
            sendJsonResponse([
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'role' => $user['role']
                ],
                'token' => $token,
                'expires_at' => $expiresAt
            ]);
        } 
        // Handle logout request
        else if ($data['action'] === 'logout') {
            if (!isset($data['token'])) {
                handleError('Token is required', 400);
            }
            
            $token = $data['token'];
            
            // Delete the session
            $stmt = $conn->prepare("DELETE FROM sessions WHERE token = ?");
            $stmt->bind_param('s', $token);
            
            if (!$stmt->execute()) {
                handleError('Failed to logout: ' . $stmt->error);
            }
            
            sendJsonResponse(['success' => true]);
        } 
        // Handle password reset request
        else if ($data['action'] === 'request_reset') {
            if (!isset($data['email'])) {
                handleError('Email is required', 400);
            }
            
            $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
            if (!$email) {
                handleError('Invalid email format', 400);
            }
            
            // Rate limiting check
            require_once 'email_service.php';
            if (!checkResetRateLimit($email)) {
                handleError('Too many reset requests. Please wait before trying again.', 429);
            }
            
            // Find user by email
            $stmt = $conn->prepare("
                SELECT id, name, email, role 
                FROM users 
                WHERE email = ? AND active = 1 AND role = 'Backoffice'
            ");
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                
                // Generate reset token
                $resetToken = generateResetToken();
                $expiresAt = date('Y-m-d H:i:s', strtotime('+30 minutes'));
                
                // Store reset token
                $stmt = $conn->prepare("
                    UPDATE users 
                    SET reset_token = ?, reset_token_expires = ?
                    WHERE id = ?
                ");
                $stmt->bind_param('ssi', $resetToken, $expiresAt, $user['id']);
                $stmt->execute();
                
                // Send email
                if (sendPasswordResetEmail($user['email'], $user['name'], $resetToken)) {
                    logPasswordResetActivity($email, 'reset_requested', 'Email sent successfully');
                } else {
                    logPasswordResetActivity($email, 'reset_request_failed', 'Failed to send email');
                }
            } else {
                // Log attempt for non-existent user
                logPasswordResetActivity($email, 'reset_request_invalid', 'User not found or not backoffice');
            }
            
            // Always return success for security (don't reveal if email exists)
            sendJsonResponse(['success' => true, 'message' => 'If an account exists with this email, a reset link has been sent.']);
        }
        // Handle token validation
        else if ($data['action'] === 'validate_reset_token') {
            if (!isset($data['token'])) {
                handleError('Token is required', 400);
            }
            
            $token = $data['token'];
            
            // Validate token
            $stmt = $conn->prepare("
                SELECT id, name, email, reset_token_expires
                FROM users 
                WHERE reset_token = ? AND active = 1 AND role = 'Backoffice'
            ");
            $stmt->bind_param('s', $token);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                handleError('Invalid or expired token', 400);
            }
            
            $user = $result->fetch_assoc();
            
            // Check if token is expired
            if (strtotime($user['reset_token_expires']) < time()) {
                handleError('Token has expired. Please request a new reset link.', 400);
            }
            
            sendJsonResponse(['success' => true, 'message' => 'Token is valid']);
        }
        // Handle password reset
        else if ($data['action'] === 'reset_password') {
            if (!isset($data['token']) || !isset($data['password'])) {
                handleError('Token and password are required', 400);
            }
            
            $token = $data['token'];
            $newPassword = $data['password'];
            
            // Validate password strength
            if (strlen($newPassword) < 8) {
                handleError('Password must be at least 8 characters long', 400);
            }
            
            if (!preg_match('/^(?=.*[a-zA-Z])(?=.*[0-9])/', $newPassword)) {
                handleError('Password must contain at least one letter and one number', 400);
            }
            
            // Find user by token
            $stmt = $conn->prepare("
                SELECT id, name, email, reset_token_expires
                FROM users 
                WHERE reset_token = ? AND active = 1 AND role = 'Backoffice'
            ");
            $stmt->bind_param('s', $token);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                handleError('Invalid or expired token', 400);
            }
            
            $user = $result->fetch_assoc();
            
            // Check if token is expired
            if (strtotime($user['reset_token_expires']) < time()) {
                handleError('Token has expired. Please request a new reset link.', 400);
            }
            
            // Hash new password
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            // Update password and clear reset token
            $stmt = $conn->prepare("
                UPDATE users 
                SET password = ?, reset_token = NULL, reset_token_expires = NULL
                WHERE id = ?
            ");
            $stmt->bind_param('si', $hashedPassword, $user['id']);
            
            if ($stmt->execute()) {
                // Log successful password reset
                require_once 'email_service.php';
                logPasswordResetActivity($user['email'], 'password_reset_successful', 'Password changed successfully');
                
                sendJsonResponse(['success' => true, 'message' => 'Password has been reset successfully']);
            } else {
                handleError('Failed to update password', 500);
            }
        }
        // Handle unknown action
        else {
            handleError('Unknown action', 400);
        }
        break;
        
    default:
        handleError('Method not allowed', 405);
}

$conn->close();
ob_end_flush();