<?php
// custom_events.php - API endpoint for custom events

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
        // Get custom events - public access, but only backoffice users can create/delete
        try {
            // Get optional filters
            $year = isset($_GET['year']) ? (int)$_GET['year'] : null;
            $month = isset($_GET['month']) ? (int)$_GET['month'] : null;
            
            // Build query based on filters
            $query = "SELECT id, date, title, time FROM custom_events";
            $params = [];
            $types = "";
            
            // Add where clauses if filters are provided
            if ($year !== null && $month !== null) {
                // Filter by specific month
                $startDate = sprintf('%04d-%02d-01', $year, $month);
                $endDate = date('Y-m-t', strtotime($startDate));
                
                $query .= " WHERE date BETWEEN ? AND ?";
                $params[] = $startDate;
                $params[] = $endDate;
                $types .= "ss";
            } else if ($year !== null) {
                // Filter by year only
                $startDate = sprintf('%04d-01-01', $year);
                $endDate = sprintf('%04d-12-31', $year);
                
                $query .= " WHERE date BETWEEN ? AND ?";
                $params[] = $startDate;
                $params[] = $endDate;
                $types .= "ss";
            }
            
            // Add order by
            $query .= " ORDER BY date, time";
            
            // Prepare and execute query
            $stmt = $conn->prepare($query);
            
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Fetch and return events
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $events[] = $row;
            }
            
            echo json_encode($events);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve custom events: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        // Create a new custom event - requires backoffice role
        try {
            // Verify authentication
            $currentUser = requireAuth();
            
            // Check if user has backoffice role
            if ($currentUser['role'] !== 'Backoffice') {
                http_response_code(403);
                echo json_encode(['error' => 'Only backoffice users can create custom events']);
                exit;
            }
            
            // Parse request body
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate request
            if (!isset($data['date']) || !isset($data['title']) || !isset($data['time'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Date, title, and time are required']);
                exit;
            }
            
            // Validate date format (YYYY-MM-DD)
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
                exit;
            }
            
            // Validate time format (HH:MM)
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $data['time'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid time format. Use HH:MM']);
                exit;
            }
            
            // Prepare and execute insert query
            $stmt = $conn->prepare("
                INSERT INTO custom_events (date, title, time, created_by)
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->bind_param('sssi', $data['date'], $data['title'], $data['time'], $currentUser['id']);
            $stmt->execute();
            
            // Get inserted ID
            $id = $conn->insert_id;
            
            // Return success with created event
            http_response_code(201);
            echo json_encode([
                'id' => $id,
                'date' => $data['date'],
                'title' => $data['title'],
                'time' => $data['time'],
                'created_by' => $currentUser['id']
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create custom event: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Delete a custom event - requires backoffice role
        try {
            // Verify authentication
            $currentUser = requireAuth();
            
            // Check if user has backoffice role
            if ($currentUser['role'] !== 'Backoffice') {
                http_response_code(403);
                echo json_encode(['error' => 'Only backoffice users can delete custom events']);
                exit;
            }
            
            // Check if ID is provided
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Event ID is required']);
                exit;
            }
            
            $eventId = (int)$_GET['id'];
            
            // Verify that the event exists
            $checkStmt = $conn->prepare("SELECT id FROM custom_events WHERE id = ?");
            $checkStmt->bind_param('i', $eventId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Custom event not found']);
                exit;
            }
            
            // Delete the event
            $deleteStmt = $conn->prepare("DELETE FROM custom_events WHERE id = ?");
            $deleteStmt->bind_param('i', $eventId);
            $deleteStmt->execute();
            
            // Return success
            echo json_encode(['success' => true, 'message' => 'Custom event deleted successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete custom event: ' . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// Close database connection
$conn->close();