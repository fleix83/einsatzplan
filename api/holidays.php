<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include config file for database connection
require_once 'config.php';

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
        // Get holidays for a user or all holidays
        if (isset($_GET['user_id'])) {
            $userId = (int)$_GET['user_id'];
            
            $stmt = $conn->prepare("
                SELECT id, user_id, start_date, end_date, approved, created_at
                FROM holidays
                WHERE user_id = ?
                ORDER BY start_date
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('i', $userId);
        } else {
            // Get all holidays
            $stmt = $conn->prepare("
                SELECT h.id, h.user_id, h.start_date, h.end_date, h.approved, h.created_at,
                       u.name as user_name
                FROM holidays h
                JOIN users u ON h.user_id = u.id
                ORDER BY h.start_date
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
        }
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute query: ' . $stmt->error]);
            exit;
        }
        
        $result = $stmt->get_result();
        $holidays = [];
        
        while ($row = $result->fetch_assoc()) {
            $holidays[] = $row;
        }
        
        echo json_encode($holidays);
        break;
        
    case 'POST':
        // Add a holiday - allow all users (not just authenticated ones)
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['user_id']) || !isset($data['start_date']) || !isset($data['end_date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID, start date, and end date are required']);
            exit;
        }
        
        $userId = (int)$data['user_id'];
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $approved = isset($data['approved']) ? (int)$data['approved'] : 1;
        
        // Validate dates
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
            exit;
        }
        
        if (strtotime($startDate) > strtotime($endDate)) {
            http_response_code(400);
            echo json_encode(['error' => 'Start date must be before or equal to end date']);
            exit;
        }
        
        // Check if the user exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE id = ? AND active = 1");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('i', $userId);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute query: ' . $stmt->error]);
            exit;
        }
        
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found or inactive']);
            exit;
        }
        
        // Insert the holiday
        $stmt = $conn->prepare("
            INSERT INTO holidays (user_id, start_date, end_date, approved)
            VALUES (?, ?, ?, ?)
        ");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('issi', $userId, $startDate, $endDate, $approved);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create holiday: ' . $stmt->error]);
            exit;
        }
        
        $holidayId = $conn->insert_id;
        
        echo json_encode([
            'id' => $holidayId,
            'user_id' => $userId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'approved' => $approved,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        break;
        
    case 'DELETE':
        // Delete a holiday - allow all users (not just authenticated ones)
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Holiday ID is required']);
            exit;
        }
        
        $holidayId = (int)$_GET['id'];
        
        $stmt = $conn->prepare("DELETE FROM holidays WHERE id = ?");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('i', $holidayId);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete holiday: ' . $stmt->error]);
            exit;
        }
        
        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Holiday not found']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

if (isset($conn)) {
    $conn->close();
}