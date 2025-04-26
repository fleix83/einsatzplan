<?php
require_once 'config.php';
// DO NOT require auth_middleware.php here

error_log('Auth endpoint accessed: ' . file_get_contents('php://input'));

// Set content type to JSON
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
        // Handle unknown action
        else {
            handleError('Unknown action', 400);
        }
        break;
        
    default:
        handleError('Method not allowed', 405);
}

$conn->close();