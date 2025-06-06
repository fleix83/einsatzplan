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
        // Get all official holidays - public access for everyone
        try {
            $stmt = $conn->prepare("
                SELECT 
                    oh.id,
                    oh.start_date,
                    oh.end_date,
                    oh.title,
                    oh.description,
                    oh.created_by,
                    oh.created_at,
                    u.name as created_by_name
                FROM official_holidays oh
                LEFT JOIN users u ON oh.created_by = u.id
                ORDER BY oh.start_date DESC
            ");
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to execute query: ' . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $holidays = [];
            
            while ($row = $result->fetch_assoc()) {
                $holidays[] = $row;
            }
            
            echo json_encode($holidays);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'POST':
        // Add a new official holiday - requires backoffice role
        try {
            // Check authentication
            $userData = requireAuth();
            if ($userData['role'] !== 'Backoffice') {
                http_response_code(403);
                echo json_encode(['error' => 'Only backoffice users can create official holidays']);
                exit;
            }
            
            // Get input data
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['start_date']) || !isset($data['end_date']) || !isset($data['title'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Start date, end date, and title are required']);
                exit;
            }
            
            // Validate date format
            $startDate = $data['start_date'];
            $endDate = $data['end_date'];
            
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || 
                !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
                exit;
            }
            
            // Validate date range
            if ($startDate > $endDate) {
                http_response_code(400);
                echo json_encode(['error' => 'End date must be after or equal to start date']);
                exit;
            }
            
            // Insert new holiday
            $stmt = $conn->prepare("
                INSERT INTO official_holidays (start_date, end_date, title, description, created_by)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $title = trim($data['title']);
            $description = isset($data['description']) ? trim($data['description']) : null;
            $userId = $userData['id'];
            
            $stmt->bind_param('ssssi', $startDate, $endDate, $title, $description, $userId);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to create official holiday: ' . $stmt->error);
            }
            
            $holidayId = $conn->insert_id;
            
            // Return the created holiday
            $stmt = $conn->prepare("
                SELECT 
                    oh.id,
                    oh.start_date,
                    oh.end_date,
                    oh.title,
                    oh.description,
                    oh.created_by,
                    oh.created_at,
                    u.name as created_by_name
                FROM official_holidays oh
                LEFT JOIN users u ON oh.created_by = u.id
                WHERE oh.id = ?
            ");
            
            $stmt->bind_param('i', $holidayId);
            $stmt->execute();
            $result = $stmt->get_result();
            $holiday = $result->fetch_assoc();
            
            echo json_encode($holiday);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Update an official holiday - requires backoffice role
        try {
            // Check authentication
            $userData = requireAuth();
            if ($userData['role'] !== 'Backoffice') {
                http_response_code(403);
                echo json_encode(['error' => 'Only backoffice users can update official holidays']);
                exit;
            }
            
            // Get holiday ID from query string
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Holiday ID is required']);
                exit;
            }
            
            $holidayId = (int)$_GET['id'];
            
            // Get input data
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if holiday exists
            $stmt = $conn->prepare("SELECT id FROM official_holidays WHERE id = ?");
            $stmt->bind_param('i', $holidayId);
            $stmt->execute();
            
            if ($stmt->get_result()->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Official holiday not found']);
                exit;
            }
            
            // Build update query
            $updateFields = [];
            $updateValues = [];
            $types = '';
            
            if (isset($data['start_date'])) {
                $updateFields[] = "start_date = ?";
                $updateValues[] = $data['start_date'];
                $types .= 's';
            }
            
            if (isset($data['end_date'])) {
                $updateFields[] = "end_date = ?";
                $updateValues[] = $data['end_date'];
                $types .= 's';
            }
            
            if (isset($data['title'])) {
                $updateFields[] = "title = ?";
                $updateValues[] = trim($data['title']);
                $types .= 's';
            }
            
            if (isset($data['description'])) {
                $updateFields[] = "description = ?";
                $updateValues[] = trim($data['description']);
                $types .= 's';
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit;
            }
            
            // Execute update
            $sql = "UPDATE official_holidays SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $types .= 'i';
            $updateValues[] = $holidayId;
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$updateValues);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to update official holiday: ' . $stmt->error);
            }
            
            echo json_encode(['success' => true, 'id' => $holidayId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Delete an official holiday - requires backoffice role
        try {
            // Check authentication
            $userData = requireAuth();
            if ($userData['role'] !== 'Backoffice') {
                http_response_code(403);
                echo json_encode(['error' => 'Only backoffice users can delete official holidays']);
                exit;
            }
            
            // Get holiday ID from query string
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Holiday ID is required']);
                exit;
            }
            
            $holidayId = (int)$_GET['id'];
            
            // Check if holiday exists
            $stmt = $conn->prepare("SELECT id FROM official_holidays WHERE id = ?");
            $stmt->bind_param('i', $holidayId);
            $stmt->execute();
            
            if ($stmt->get_result()->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Official holiday not found']);
                exit;
            }
            
            // Delete the holiday
            $stmt = $conn->prepare("DELETE FROM official_holidays WHERE id = ?");
            $stmt->bind_param('i', $holidayId);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to delete official holiday: ' . $stmt->error);
            }
            
            echo json_encode(['success' => true, 'message' => 'Official holiday deleted successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

$conn->close();