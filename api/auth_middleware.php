<?php
// api/auth_middleware.php - Fixed version
// Middleware for validating authentication tokens

require_once 'config.php';

// Function to validate token and get user ID
function validateToken() {
    try {
        // Check for Authorization header
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        
        // If no Authorization header, check for token in query string (for GET requests)
        if (empty($authHeader) && isset($_GET['token'])) {
            $token = $_GET['token'];
        } else if (empty($authHeader)) {
            // No Authorization header or token found
            return null;
        } else {
            // Extract token from Bearer format
            $parts = explode(' ', $authHeader, 2);
            if (count($parts) < 2) {
                error_log("Invalid Authorization header format: $authHeader");
                return null;
            }
            
            list($bearer, $token) = $parts;
            
            // Verify it's a Bearer token
            if (strtolower($bearer) !== 'bearer' || empty($token)) {
                error_log("Not a Bearer token or token is empty");
                return null;
            }
        }
        
        // If we got here, we have a token to validate
        if (empty($token)) {
            return null;
        }
        
        // Validate token in database
        $conn = getDbConnection();
        
        $stmt = $conn->prepare("
            SELECT s.user_id, s.expires_at, u.id, u.name, u.role
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > NOW() AND u.active = 1
        ");
        
        if (!$stmt) {
            error_log("Prepare failed: " . $conn->error);
            return null;
        }
        
        $stmt->bind_param('s', $token);
        
        if (!$stmt->execute()) {
            error_log("Execute failed: " . $stmt->error);
            $conn->close();
            return null;
        }
        
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            error_log("No valid session found for token");
            $conn->close();
            return null;
        }
        
        // Get user data
        $userData = $result->fetch_assoc();
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