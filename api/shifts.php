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

/**
 * Check if a shift position is locked (> 5 minutes old)
 *
 * @param string|null $lockedAt The locked_at timestamp from database
 * @return bool True if locked, false otherwise
 */
function isShiftLocked($lockedAt) {
    if (!$lockedAt) {
        return false; // No timestamp = not locked
    }

    $lockedTime = strtotime($lockedAt);
    $now = time();
    $minutesElapsed = ($now - $lockedTime) / 60;

    return $minutesElapsed > 5;
}

/**
 * Check if a specified month is frozen and enforce permissions
 *
 * @param mysqli $conn Database connection
 * @param int $year The year
 * @param int $month The month
 * @param array|null $currentUser Current authenticated user (if any)
 * @return bool True if the user can edit, false otherwise
 */
function canEditMonth($conn, $year, $month, $currentUser = null) {
    try {
        // Get the calendar state
        $stmt = $conn->prepare("
            SELECT is_frozen
            FROM calendar_states
            WHERE year = ? AND month = ?
        ");
        
        if (!$stmt) {
            error_log("Prepare failed: " . $conn->error);
            return true; // Default to allowing edits on error
        }
        
        $stmt->bind_param('ii', $year, $month);
        
        if (!$stmt->execute()) {
            error_log("Execute failed: " . $stmt->error);
            return true; // Default to allowing edits on error
        }
        
        $result = $stmt->get_result();
        
        // If no state exists, it's not frozen
        if ($result->num_rows === 0) {
            return true;
        }
        
        $state = $result->fetch_assoc();
        
        // If not frozen, everyone can edit
        if (!$state['is_frozen']) {
            return true;
        }
        
        // If frozen, only Backoffice users can edit
        if ($currentUser && isset($currentUser['role']) && $currentUser['role'] === 'Backoffice') {
            return true;
        }
        
        // Otherwise, editing is not allowed
        return false;
    } catch (Exception $e) {
        error_log("Error in canEditMonth: " . $e->getMessage());
        return true; // Default to allowing edits on error
    }
}

/**
 * Check if a month is in the past and should be automatically frozen
 * 
 * @param mysqli $conn Database connection
 * @param int $year The year
 * @param int $month The month
 * @return bool True if month was frozen, false otherwise
 */
function checkAndFreezeMonth($conn, $year, $month) {
    // Get the current year and month
    $currentYear = (int)date('Y');
    $currentMonth = (int)date('m');
    
    // If this month is in the past
    if (($year < $currentYear) || ($year === $currentYear && $month < $currentMonth)) {
        // Check if it's already frozen
        $stmt = $conn->prepare("
            SELECT id, is_frozen
            FROM calendar_states
            WHERE year = ? AND month = ?
        ");
        
        $stmt->bind_param('ii', $year, $month);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $state = $result->fetch_assoc();
            
            // If already frozen, nothing to do
            if ($state['is_frozen']) {
                return false;
            }
            
            // Otherwise, update to frozen
            $now = date('Y-m-d H:i:s');
            $stmt = $conn->prepare("
                UPDATE calendar_states
                SET is_frozen = 1, frozen_at = ?
                WHERE id = ?
            ");
            
            $stmt->bind_param('si', $now, $state['id']);
            $stmt->execute();
        } else {
            // Create new frozen state
            $now = date('Y-m-d H:i:s');
            $stmt = $conn->prepare("
                INSERT INTO calendar_states (year, month, is_frozen, frozen_at)
                VALUES (?, ?, 1, ?)
            ");
            
            $stmt->bind_param('iis', $year, $month, $now);
            $stmt->execute();
        }
        
        return true;
    }
    
    return false;
}

// Handle request based on method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get shifts for a specific year and month - public access for everyone
        if (!isset($_GET['year']) || !isset($_GET['month'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Year and month parameters are required']);
            exit;
        }
        
        $year = (int)$_GET['year'];
        $month = (int)$_GET['month'];
        
        // Calculate the first and last day of the month
        $firstDay = sprintf('%04d-%02d-01', $year, $month);
        $lastDay = date('Y-m-t', strtotime($firstDay));
        
        error_log("Loading shifts from $firstDay to $lastDay");
        
        // Prepare the query to get shifts (including lock timestamps)
        $stmt = $conn->prepare("
            SELECT date, shift_type, user1_id, user2_id, note1, note2,
                   user1_locked_at, user2_locked_at
            FROM shifts
            WHERE date BETWEEN ? AND ?
            ORDER BY date, shift_type
        ");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('ss', $firstDay, $lastDay);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute query: ' . $stmt->error]);
            exit;
        }
        
        $result = $stmt->get_result();
        $shifts = [];
        
        while ($row = $result->fetch_assoc()) {
            error_log("Found shift for date: " . $row['date'] . ", type: " . $row['shift_type']);
            $shifts[] = $row;
        }
        
        echo json_encode($shifts);
        break;
        
    case 'POST':
        // Add or update a shift - allow all users (not just authenticated ones)
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['date']) || !isset($data['shift_type']) || !isset($data['position'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Date, shift_type, and position are required']);
            exit;
        }
        
        $date = $data['date'];
        $shiftType = $data['shift_type'];
        $position = (int)$data['position'];
        $userId = isset($data['user_id']) && !empty($data['user_id']) ? $data['user_id'] : null;
        $note = isset($data['note']) ? $data['note'] : '';
        $forceEdit = isset($data['force']) && $data['force'] === true; // User confirmed edit of locked shift

        // Log for debugging
        error_log("Shift update - Date: $date, Shift: $shiftType, Position: $position, UserID: $userId, Force: " . ($forceEdit ? 'true' : 'false'));
        
        // Validate date format (YYYY-MM-DD)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
            exit;
        }
        
        // Check if the date is a weekend (optional)
        if (isWeekend($date)) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot add shifts on weekends']);
            exit;
        }
        
        // Get authentication data if available (optional)
        $currentUser = null;
        $headers = getallheaders();
        if (!empty($headers['Authorization'])) {
            // Include auth_middleware if not already included
            if (!function_exists('getOptionalAuth')) {
                require_once 'auth_middleware.php';
            }
            $currentUser = getOptionalAuth(); // Use getOptionalAuth to avoid requiring auth
        }

        // Extract date components for freeze check
        $dateParts = explode('-', $date);
        if (count($dateParts) === 3) {
            $year = (int)$dateParts[0];
            $month = (int)$dateParts[1];
            
            // Check if month is in the past and should be frozen
            checkAndFreezeMonth($conn, $year, $month);
            
            // Check if user can edit this month
            if (!canEditMonth($conn, $year, $month, $currentUser)) {
                http_response_code(403);
                echo json_encode(['error' => 'This month is frozen. Only backoffice users can make changes.']);
                exit;
            }
        }
        
        // Check if the shift already exists and get lock status
        $stmt = $conn->prepare("
            SELECT id, user1_id, user2_id, user1_locked_at, user2_locked_at
            FROM shifts
            WHERE date = ? AND shift_type = ?
        ");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('ss', $date, $shiftType);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to execute query: ' . $stmt->error]);
            exit;
        }
        
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // Update existing shift
            $row = $result->fetch_assoc();
            $shiftId = $row['id'];

            // Check if we're editing a locked position (only if not forced and not Backoffice)
            $isBackoffice = $currentUser && isset($currentUser['role']) && $currentUser['role'] === 'Backoffice';

            if (!$forceEdit && !$isBackoffice) {
                $existingUserId = $position === 1 ? $row['user1_id'] : $row['user2_id'];
                $lockedAt = $position === 1 ? $row['user1_locked_at'] : $row['user2_locked_at'];

                // If there's an existing user and we're trying to change/remove them
                if ($existingUserId && $existingUserId != $userId) {
                    if (isShiftLocked($lockedAt)) {
                        // Get the user name for the error message
                        $userStmt = $conn->prepare("SELECT name FROM users WHERE id = ?");
                        $userStmt->bind_param('i', $existingUserId);
                        $userStmt->execute();
                        $userResult = $userStmt->get_result();
                        $userName = $userResult->num_rows > 0 ? $userResult->fetch_assoc()['name'] : 'Unknown';

                        http_response_code(423); // 423 Locked
                        echo json_encode([
                            'error' => 'locked',
                            'message' => "Dieser Einsatz ist bereits von $userName belegt.",
                            'user_name' => $userName,
                            'user_id' => $existingUserId
                        ]);
                        exit;
                    }
                }
            }
            
            // Determine which fields to update based on position
            // Set lock timestamp to NOW() if user is assigned, NULL if removed
            $now = date('Y-m-d H:i:s');

            if ($position === 1) {
                $stmt = $conn->prepare("
                    UPDATE shifts
                    SET user1_id = ?, note1 = ?, user1_locked_at = ?
                    WHERE id = ?
                ");

                if (!$stmt) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to prepare update statement: ' . $conn->error]);
                    exit;
                }

                $lockTimestamp = $userId ? $now : null;
                $stmt->bind_param('sssi', $userId, $note, $lockTimestamp, $shiftId);
            } else if ($position === 2) {
                $stmt = $conn->prepare("
                    UPDATE shifts
                    SET user2_id = ?, note2 = ?, user2_locked_at = ?
                    WHERE id = ?
                ");

                if (!$stmt) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to prepare update statement: ' . $conn->error]);
                    exit;
                }

                $lockTimestamp = $userId ? $now : null;
                $stmt->bind_param('sssi', $userId, $note, $lockTimestamp, $shiftId);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid position: must be 1 or 2']);
                exit;
            }
        } else {
            // Create new shift with lock timestamp
            $now = date('Y-m-d H:i:s');

            if ($position === 1) {
                $stmt = $conn->prepare("
                    INSERT INTO shifts (date, shift_type, user1_id, note1, user1_locked_at)
                    VALUES (?, ?, ?, ?, ?)
                ");

                if (!$stmt) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to prepare insert statement: ' . $conn->error]);
                    exit;
                }

                $lockTimestamp = $userId ? $now : null;
                $stmt->bind_param('sssss', $date, $shiftType, $userId, $note, $lockTimestamp);
            } else if ($position === 2) {
                $stmt = $conn->prepare("
                    INSERT INTO shifts (date, shift_type, user2_id, note2, user2_locked_at)
                    VALUES (?, ?, ?, ?, ?)
                ");

                if (!$stmt) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to prepare insert statement: ' . $conn->error]);
                    exit;
                }

                $lockTimestamp = $userId ? $now : null;
                $stmt->bind_param('sssss', $date, $shiftType, $userId, $note, $lockTimestamp);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid position: must be 1 or 2']);
                exit;
            }
        }
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save shift: ' . $stmt->error]);
            exit;
        }
        
        echo json_encode(['success' => true, 'date' => $date, 'shift' => $shiftType]);
        break;
    
    case 'DELETE':
        // Delete a shift - allow all users (not just authenticated ones)
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Shift ID is required']);
            exit;
        }
        
        $shiftId = (int)$_GET['id'];
        
        $stmt = $conn->prepare("DELETE FROM shifts WHERE id = ?");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('i', $shiftId);
        
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete shift: ' . $stmt->error]);
            exit;
        }
        
        if ($stmt->affected_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Shift not found']);
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