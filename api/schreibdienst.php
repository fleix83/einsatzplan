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
        // Get Schreibdienst events - public access for everyone
        if (isset($_GET['id'])) {
            // Get a specific Schreibdienst event
            $eventId = (int)$_GET['id'];
            
            $stmt = $conn->prepare("
                SELECT id, date, time, shift_type, details, user_id, created_at
                FROM schreibdienst_events
                WHERE id = ?
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('i', $eventId);
        } else if (isset($_GET['year']) && isset($_GET['month'])) {
            // Get events for a specific year and month
            $year = (int)$_GET['year'];
            $month = (int)$_GET['month'];
            
            // Calculate the first and last day of the month
            $firstDay = sprintf('%04d-%02d-01', $year, $month);
            $lastDay = date('Y-m-t', strtotime($firstDay));
            
            $stmt = $conn->prepare("
                SELECT id, date, time, shift_type, details, user_id, created_at
                FROM schreibdienst_events
                WHERE date BETWEEN ? AND ?
                ORDER BY date, time
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('ss', $firstDay, $lastDay);
        } else {
            // Get all Schreibdienst events (limited to recent or future events)
            $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
            
            $stmt = $conn->prepare("
                SELECT id, date, time, shift_type, details, user_id, created_at
                FROM schreibdienst_events
                WHERE date >= ?
                ORDER BY date, time
                LIMIT 100
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('s', $thirtyDaysAgo);
        }
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute query: ' . $stmt->error]);
            exit;
        }
        
        $result = $stmt->get_result();
        $events = [];
        
        while ($row = $result->fetch_assoc()) {
            $events[] = $row;
        }
        
        echo json_encode($events);
        break;
        
    case 'POST':
        // Add a new Schreibdienst event - allow all users (not just authenticated ones)
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['date']) || !isset($data['time']) || !isset($data['shift_type']) || 
            !isset($data['details']) || !isset($data['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Date, time, shift_type, details, and user_id are required']);
            exit;
        }
        
        $date = $data['date'];
        $time = $data['time'];
        $shiftType = $data['shift_type'];
        $details = $data['details'];
        $userId = (int)$data['user_id'];
        
        // Validate date format (YYYY-MM-DD)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
            exit;
        }
        
        // Validate time format (HH:MM:SS or HH:MM)
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $time)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid time format. Use HH:MM or HH:MM:SS']);
            exit;
        }
        
        // Validate shift type
        if ($shiftType !== 'E1' && $shiftType !== 'E2') {
            http_response_code(400);
            echo json_encode(['error' => 'Shift type must be either E1 or E2']);
            exit;
        }
        
        // Check if the user exists and is a Schreibdienst user
        $stmt = $conn->prepare("
            SELECT is_schreibdienst FROM users 
            WHERE id = ? AND active = 1
        ");
        
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
        
        // Allow any user to create Schreibdienst events (not just those marked as Schreibdienst)
        
        // Insert the event
        $stmt = $conn->prepare("
            INSERT INTO schreibdienst_events 
            (date, time, shift_type, details, user_id) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('ssssi', $date, $time, $shiftType, $details, $userId);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create event: ' . $stmt->error]);
            exit;
        }
        
        $eventId = $conn->insert_id;
        
        // Return the created event
        echo json_encode([
            'id' => $eventId,
            'date' => $date,
            'time' => $time,
            'shift_type' => $shiftType,
            'details' => $details,
            'user_id' => $userId,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        break;
        
    case 'DELETE':
        // Delete a Schreibdienst event - allow all users (not just authenticated ones)
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID is required']);
            exit;
        }
        
        $eventId = (int)$_GET['id'];
        
        $stmt = $conn->prepare("DELETE FROM schreibdienst_events WHERE id = ?");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('i', $eventId);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete event: ' . $stmt->error]);
            exit;
        }
        
        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
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