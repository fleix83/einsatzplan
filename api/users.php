<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include config file for database connection
require_once 'config.php';
require_once 'auth_middleware.php';

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get database connection
$conn = getDbConnection();

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Check if user is authenticated (admin view)
        $currentUser = null;
        $isAdmin = false;
        
        try {
            $currentUser = getCurrentUser();
            $isAdmin = ($currentUser && $currentUser['role'] === 'Backoffice');
        } catch (Exception $e) {
            // Not authenticated, continue with public access
        }
        
        // Get users - public access for everyone, admin gets additional info
        if ($isAdmin) {
            // Admin view - include reset token information
            $stmt = $conn->prepare("
                SELECT id, name, email, role, is_starter, is_schreibdienst, active, max_shifts_per_week,
                       reset_token, reset_token_expires,
                       CASE 
                           WHEN reset_token IS NOT NULL AND reset_token_expires > NOW() THEN 'active'
                           WHEN reset_token IS NOT NULL AND reset_token_expires <= NOW() THEN 'expired'
                           ELSE 'none'
                       END as reset_status
                FROM users 
                WHERE active = 1 
                ORDER BY name
            ");
        } else {
            // Public view - basic info only
            $stmt = $conn->prepare("
                SELECT id, name, role, is_starter, is_schreibdienst, active, max_shifts_per_week 
                FROM users 
                WHERE active = 1 
                ORDER BY name
            ");
        }
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute query: ' . $stmt->error]);
            exit;
        }
        
        $result = $stmt->get_result();
        $users = [];
        
        while ($row = $result->fetch_assoc()) {
            $user = [
                'id' => $row['id'],
                'name' => $row['name'],
                'role' => $row['role'],
                'isStarter' => (bool)$row['is_starter'],
                'isSchreibdienst' => (bool)$row['is_schreibdienst'],
                'active' => (bool)$row['active'],
                'maxShiftsPerWeek' => $row['max_shifts_per_week']
            ];
            
            // Add admin-only information
            if ($isAdmin) {
                $user['email'] = $row['email'];
                $user['resetStatus'] = $row['reset_status'];
                $user['resetTokenExpires'] = $row['reset_token_expires'];
            }
            
            $users[] = $user;
        }
        
        echo json_encode($users);
        break;
        
    case 'POST':
        // Verify authentication for all POST operations
        try {
            // Verify authentication using the new requireAuth function
            $currentUser = requireAuth();
            
            // Check if user has backoffice role
            if ($currentUser['role'] !== 'Backoffice') {
                http_response_code(403);
                echo json_encode(['error' => 'Only Backoffice users can perform this action']);
                exit;
            }
        } catch (Exception $e) {
            http_response_code(403);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
        
        // Get request data
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Handle different actions
        if (isset($data['action'])) {
            switch ($data['action']) {
                case 'clear_reset_token':
                    // Clear reset token for a user
                    if (!isset($data['userId'])) {
                        http_response_code(400);
                        echo json_encode(['error' => 'User ID is required']);
                        exit;
                    }
                    
                    $userId = $data['userId'];
                    
                    // Clear the reset token
                    $stmt = $conn->prepare("
                        UPDATE users 
                        SET reset_token = NULL, reset_token_expires = NULL 
                        WHERE id = ?
                    ");
                    
                    if (!$stmt) {
                        http_response_code(500);
                        echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                        exit;
                    }
                    
                    $stmt->bind_param('i', $userId);
                    
                    if (!$stmt->execute()) {
                        http_response_code(500);
                        echo json_encode(['error' => 'Failed to clear reset token: ' . $stmt->error]);
                        exit;
                    }
                    
                    echo json_encode(['success' => true, 'message' => 'Reset token cleared successfully']);
                    $stmt->close();
                    $conn->close();
                    exit;
                    
                default:
                    http_response_code(400);
                    echo json_encode(['error' => 'Unknown action']);
                    exit;
            }
        }
        
        // Validate request
        if (!isset($data['name']) || trim($data['name']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Name is required']);
            exit;
        }
        
        // Check if creating a Backoffice user
        $isBackoffice = isset($data['role']) && $data['role'] === 'Backoffice';
        
        // For Backoffice users, email and password are required
        if ($isBackoffice) {
            if (!isset($data['email']) || trim($data['email']) === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Email is required for Backoffice users']);
                exit;
            }
            
            if (!isset($data['password']) || trim($data['password']) === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Password is required for Backoffice users']);
                exit;
            }
            
            // Check if email is already in use
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND active = 1");
            $stmt->bind_param('s', $data['email']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Email is already in use']);
                exit;
            }
        }
        
        // Prepare statement based on user type
        if ($isBackoffice) {
            // Hash the password for Backoffice users
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, is_starter, is_schreibdienst) VALUES (?, ?, ?, ?, ?, ?)");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            // Set parameters
            $name = $data['name'];
            $email = $data['email'];
            $role = 'Backoffice';
            $isStarter = isset($data['isStarter']) ? (int)$data['isStarter'] : 0;
            $isSchreibdienst = isset($data['isSchreibdienst']) ? (int)$data['isSchreibdienst'] : 0;
            
            $stmt->bind_param("ssssii", $name, $email, $hashedPassword, $role, $isStarter, $isSchreibdienst);
        } else {
            // Regular users (Freiwillige) without password
            $stmt = $conn->prepare("INSERT INTO users (name, role, is_starter, is_schreibdienst) VALUES (?, ?, ?, ?)");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            // Set parameters
            $name = $data['name'];
            $role = isset($data['role']) ? $data['role'] : 'Freiwillige';
            $isStarter = isset($data['isStarter']) ? (int)$data['isStarter'] : 0;
            $isSchreibdienst = isset($data['isSchreibdienst']) ? (int)$data['isSchreibdienst'] : 0;
            
            $stmt->bind_param("ssii", $name, $role, $isStarter, $isSchreibdienst);
        }
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => $stmt->error]);
            exit;
        }
        
        $id = $conn->insert_id;
        echo json_encode(['id' => $id, 'success' => true]);
        break;
        
    case 'PUT':
        // Update a user - requires backoffice role
        try {
            // Verify authentication using the new requireAuth function
            $currentUser = requireAuth();
            
            // Check if user has backoffice role
            if ($currentUser['role'] !== 'Backoffice') {
                http_response_code(403);
                echo json_encode(['error' => 'Only Backoffice users can update users']);
                exit;
            }
        } catch (Exception $e) {
            http_response_code(403);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
        
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
            exit;
        }
        
        $userId = (int)$_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'No update data provided']);
            exit;
        }
        
        // Check if the user exists
        $stmt = $conn->prepare("SELECT id, role FROM users WHERE id = ?");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            exit;
        }
        
        $userToUpdate = $result->fetch_assoc();
        
        // Build the update query
        $updateFields = [];
        $updateValues = [];
        $types = '';
        
        // Map of allowed fields to update
        $allowedFields = [
            'name' => 's',  // string
            'email' => 's', // string
            'role' => 's',  // string
            'is_starter' => 'i',  // integer (boolean)
            'is_schreibdienst' => 'i', // integer (boolean)
            'active' => 'i', // integer (boolean)
            'max_shifts_per_week' => 'i' // integer
        ];
        
        // Special handling for password updates
        if (isset($data['password']) && !empty($data['password'])) {
            $updateFields[] = "password = ?";
            $updateValues[] = password_hash($data['password'], PASSWORD_DEFAULT);
            $types .= 's';
        }
        
        // Add fields to the update query if they exist in the request
        foreach ($allowedFields as $field => $type) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $updateValues[] = $data[$field];
                $types .= $type;
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            exit;
        }
        
        // Create and execute the update query
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $types .= 'i'; // Add type for the user ID
        $updateValues[] = $userId;
        
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        // Dynamically bind parameters
        $stmt->bind_param($types, ...$updateValues);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update user: ' . $stmt->error]);
            exit;
        }
        
        // Return success
        echo json_encode(['success' => true, 'id' => $userId]);
        break;
        
    case 'DELETE':
        // Delete a user - check authentication using the improved auth middleware
        $userData = validateToken();
        
        if (!$userData || $userData['role'] !== 'Backoffice') {
            http_response_code(403);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
        
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
            exit;
        }
        
        $userId = (int)$_GET['id'];
        
        // Check if the user exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            exit;
        }
        
        // IMPORTANT: Here's the actual deletion (soft delete by setting active=0)
        $stmt = $conn->prepare("UPDATE users SET active = 0 WHERE id = ?");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('i', $userId);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete user: ' . $stmt->error]);
            exit;
        }
        
        // Success
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

$conn->close();