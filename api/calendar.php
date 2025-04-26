<?php
require_once 'config.php';
require_once 'auth_middleware.php'; 

// Set content type to JSON
header('Content-Type: application/json');


// Add this line to require authentication (user can be any role)
$currentUser = requireAuth();

// Get database connection
$conn = getDbConnection();

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get calendar state for a specific year/month
        if (!isset($_GET['year']) || !isset($_GET['month'])) {
            handleError('Year and month parameters are required', 400);
        }
        
        $year = (int)$_GET['year'];
        $month = (int)$_GET['month'];
        
        $stmt = $conn->prepare("
            SELECT id, year, month, is_frozen, frozen_at, frozen_by
            FROM calendar_states
            WHERE year = ? AND month = ?
        ");
        
        $stmt->bind_param('ii', $year, $month);
        
        if (!$stmt->execute()) {
            handleError('Failed to execute query: ' . $stmt->error);
        }
        
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            // Return default state if not found
            sendJsonResponse([
                'year' => $year,
                'month' => $month,
                'is_frozen' => false,
                'frozen_at' => null,
                'frozen_by' => null
            ]);
        } else {
            $state = $result->fetch_assoc();
            sendJsonResponse($state);
        }
        break;
        
    case 'POST':
        // Set or update calendar state (freeze/unfreeze)
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['year']) || !isset($data['month']) || !isset($data['is_frozen'])) {
            handleError('Year, month, and is_frozen parameters are required', 400);
        }
        
        $year = (int)$data['year'];
        $month = (int)$data['month'];
        $isFrozen = (bool)$data['is_frozen'];
        $frozenBy = isset($data['frozen_by']) ? (int)$data['frozen_by'] : null;
        
        // Validate year and month
        if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
            handleError('Invalid year or month', 400);
        }
        
        // Check if a state already exists for this year/month
        $stmt = $conn->prepare("
            SELECT id 
            FROM calendar_states
            WHERE year = ? AND month = ?
        ");
        
        $stmt->bind_param('ii', $year, $month);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Update existing state
            $stateId = $result->fetch_assoc()['id'];
            
            if ($isFrozen) {
                // Freezing the calendar
                $frozenAt = date('Y-m-d H:i:s');
                $stmt = $conn->prepare("
                    UPDATE calendar_states
                    SET is_frozen = 1, frozen_at = ?, frozen_by = ?
                    WHERE id = ?
                ");
                $stmt->bind_param('sii', $frozenAt, $frozenBy, $stateId);
            } else {
                // Unfreezing the calendar
                $stmt = $conn->prepare("
                    UPDATE calendar_states
                    SET is_frozen = 0, frozen_at = NULL, frozen_by = NULL
                    WHERE id = ?
                ");
                $stmt->bind_param('i', $stateId);
            }
        } else {
            // Create new state
            if ($isFrozen) {
                // Create frozen state
                $frozenAt = date('Y-m-d H:i:s');
                $stmt = $conn->prepare("
                    INSERT INTO calendar_states (year, month, is_frozen, frozen_at, frozen_by)
                    VALUES (?, ?, 1, ?, ?)
                ");
                $stmt->bind_param('iisi', $year, $month, $frozenAt, $frozenBy);
            } else {
                // Create unfrozen state (default)
                $stmt = $conn->prepare("
                    INSERT INTO calendar_states (year, month, is_frozen)
                    VALUES (?, ?, 0)
                ");
                $stmt->bind_param('ii', $year, $month);
            }
        }
        
        if (!$stmt->execute()) {
            handleError('Failed to update calendar state: ' . $stmt->error);
        }
        
        // Get the updated or created state
        $stmt = $conn->prepare("
            SELECT id, year, month, is_frozen, frozen_at, frozen_by
            FROM calendar_states
            WHERE year = ? AND month = ?
        ");
        
        $stmt->bind_param('ii', $year, $month);
        $stmt->execute();
        $state = $stmt->get_result()->fetch_assoc();
        
        sendJsonResponse($state);
        break;
        
    default:
        handleError('Method not allowed', 405);
}

$conn->close();