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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
        // Get announcement text - public access for everyone
        $stmt = $conn->prepare("
            SELECT id, content, updated_at, updated_by 
            FROM announcement_text 
            ORDER BY id DESC 
            LIMIT 1
        ");
        
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
        
        if ($result->num_rows === 0) {
            // Return default if no announcement exists
            echo json_encode([
                'content' => '<p>Welcome to the shift scheduling calendar. Here you can view and manage all assignments.</p>'
            ]);
        } else {
            $announcement = $result->fetch_assoc();
            echo json_encode($announcement);
        }
        break;
        
    case 'POST':
        // Update announcement text - requires backoffice authentication
        $currentUser = requireAuth();
        
        // Check if user has backoffice role
        if ($currentUser['role'] !== 'Backoffice') {
            http_response_code(403);
            echo json_encode(['error' => 'Only Backoffice users can update announcement text']);
            exit;
        }
        
        // Parse request body
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Content is required']);
            exit;
        }
        
        $content = $data['content'];
        $updatedBy = $currentUser['name'];
        
        // Check if record exists
        $checkStmt = $conn->prepare("SELECT id FROM announcement_text LIMIT 1");
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows > 0) {
            // Update existing record
            $row = $result->fetch_assoc();
            $id = $row['id'];
            
            $stmt = $conn->prepare("
                UPDATE announcement_text 
                SET content = ?, updated_by = ? 
                WHERE id = ?
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('ssi', $content, $updatedBy, $id);
        } else {
            // Insert new record
            $stmt = $conn->prepare("
                INSERT INTO announcement_text (content, updated_by) 
                VALUES (?, ?)
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('ss', $content, $updatedBy);
        }
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update announcement: ' . $stmt->error]);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'content' => $content,
            'updated_by' => $updatedBy,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

if (isset($conn)) {
    $conn->close();
}