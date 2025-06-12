<?php
// api/auth_middleware.php - Fixed version
// Middleware for validating authentication tokens

require_once 'config.php';

// Function to validate token and get user ID
function validateToken() {
    try {
        // Debug: Log environment info
        error_log("DEBUG: validateToken called");
        
        // Try multiple methods to get Authorization header (server compatibility)
        $authHeader = '';
        
        // Method 1: getallheaders() - works on Apache
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            error_log("DEBUG: getallheaders() available, headers: " . json_encode($headers));
            
            // Try different case variations
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            } elseif (isset($headers['AUTHORIZATION'])) {
                $authHeader = $headers['AUTHORIZATION'];
            }
        }
        
        // Method 2: $_SERVER variables - more compatible
        if (empty($authHeader)) {
            if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
        }
        
        error_log("DEBUG: Final authHeader: '$authHeader'");
        
        // If no Authorization header, check for token in query string (for GET requests)
        if (empty($authHeader) && isset($_GET['token'])) {
            $token = $_GET['token'];
            error_log("DEBUG: Using token from query string: '$token'");
        } else if (empty($authHeader)) {
            // No Authorization header or token found
            error_log("DEBUG: No authorization header or token found");
            return null;
        } else {
            // Extract token from Bearer format
            $parts = explode(' ', $authHeader, 2);
            if (count($parts) < 2) {
                error_log("DEBUG: Invalid Authorization header format: $authHeader");
                return null;
            }
            
            list($bearer, $token) = $parts;
            
            // Verify it's a Bearer token
            if (strtolower($bearer) !== 'bearer' || empty($token)) {
                error_log("DEBUG: Not a Bearer token or token is empty. Bearer: '$bearer', Token: '$token'");
                return null;
            }
            
            error_log("DEBUG: Extracted token: '$token'");
        }
        
        // If we got here, we have a token to validate
        if (empty($token)) {
            return null;
        }
        
        // Validate token in database
        $conn = getDbConnection();
        error_log("DEBUG: Database connection established");
        
        $stmt = $conn->prepare("
            SELECT s.user_id, s.expires_at, u.id, u.name, u.role
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > NOW() AND u.active = 1
        ");
        
        if (!$stmt) {
            error_log("DEBUG: Prepare failed: " . $conn->error);
            return null;
        }
        
        $stmt->bind_param('s', $token);
        error_log("DEBUG: Executing query with token: '$token'");
        
        if (!$stmt->execute()) {
            error_log("DEBUG: Execute failed: " . $stmt->error);
            $conn->close();
            return null;
        }
        
        $result = $stmt->get_result();
        error_log("DEBUG: Query returned " . $result->num_rows . " rows");
        
        if ($result->num_rows === 0) {
            error_log("DEBUG: No valid session found for token. Checking sessions table...");
            
            // Debug: Check if token exists at all
            $debugStmt = $conn->prepare("SELECT COUNT(*) as count FROM sessions WHERE token = ?");
            $debugStmt->bind_param('s', $token);
            $debugStmt->execute();
            $debugResult = $debugStmt->get_result();
            $debugRow = $debugResult->fetch_assoc();
            error_log("DEBUG: Token exists in sessions table: " . $debugRow['count'] . " times");
            
            // Debug: Check token expiration
            $debugStmt2 = $conn->prepare("SELECT expires_at, NOW() as current_time FROM sessions WHERE token = ?");
            $debugStmt2->bind_param('s', $token);
            $debugStmt2->execute();
            $debugResult2 = $debugStmt2->get_result();
            if ($debugResult2->num_rows > 0) {
                $debugRow2 = $debugResult2->fetch_assoc();
                error_log("DEBUG: Token expires_at: " . $debugRow2['expires_at'] . ", Current time: " . $debugRow2['current_time']);
            }
            
            $conn->close();
            return null;
        }
        
        // Get user data
        $userData = $result->fetch_assoc();
        error_log("DEBUG: Found valid session for user: " . $userData['name'] . " (role: " . $userData['role'] . ")");
        $conn->close();
        
        return $userData;
    } catch (Exception $e) {
        error_log("Exception in validateToken: " . $e->getMessage());
        return null;
    }
}

// Function for public endpoints - does not require authentication
function getOptionalAuth() {
    return validateToken(); // This might be null if no valid token
}

// Function to require authentication for an endpoint
function requireAuth() {
    try {
        $userData = validateToken();
        
        if (!$userData) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        return $userData;
    } catch (Exception $e) {
        error_log("Exception in requireAuth: " . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Authentication server error']);
        exit;
    }
}

// Function to require specific role
function requireRole($role) {
    try {
        $userData = requireAuth();
        
        if (!isset($userData['role']) || $userData['role'] !== $role) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Access denied. You need ' . $role . ' permissions.']);
            exit;
        }
        
        return $userData;
    } catch (Exception $e) {
        error_log("Exception in requireRole: " . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Authorization server error']);
        exit;
    }
}