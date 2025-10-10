<?php
// specialist_events.php - API endpoint for specialist events

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
        // Get specialist events - public access
        try {
            // Get optional filters
            $year = isset($_GET['year']) ? (int)$_GET['year'] : null;
            $month = isset($_GET['month']) ? (int)$_GET['month'] : null;
            $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

            // Build query based on filters
            $query = "SELECT se.id, se.user_id, se.date, se.title, se.time, se.is_weekly, se.end_date, se.created_at, u.name as user_name
                      FROM specialist_events se
                      JOIN users u ON se.user_id = u.id
                      WHERE u.is_specialist = 1 AND u.active = 1";

            $params = [];
            $types = "";

            // Add user filter
            if ($userId !== null) {
                $query .= " AND se.user_id = ?";
                $params[] = $userId;
                $types .= "i";
            }

            // Add date range filter if provided
            if ($year !== null && $month !== null) {
                // Filter by specific month
                $startDate = sprintf('%04d-%02d-01', $year, $month);
                $endDate = date('Y-m-t', strtotime($startDate));

                $query .= " AND se.date BETWEEN ? AND ?";
                $params[] = $startDate;
                $params[] = $endDate;
                $types .= "ss";
            } else if ($year !== null) {
                // Filter by year only
                $startDate = sprintf('%04d-01-01', $year);
                $endDate = sprintf('%04d-12-31', $year);

                $query .= " AND se.date BETWEEN ? AND ?";
                $params[] = $startDate;
                $params[] = $endDate;
                $types .= "ss";
            }

            // Add order by
            $query .= " ORDER BY se.date, se.time";

            // Prepare and execute query
            $stmt = $conn->prepare($query);

            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            $result = $stmt->get_result();

            // Fetch events
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $events[] = $row;
            }

            // Filter out events for users on holiday
            if (count($events) > 0) {
                // Get holidays for all specialist users
                $userIds = array_unique(array_column($events, 'user_id'));
                $placeholders = implode(',', array_fill(0, count($userIds), '?'));

                $holidayQuery = "SELECT user_id, start_date, end_date
                                 FROM holidays
                                 WHERE user_id IN ($placeholders) AND approved = 1";

                $holidayStmt = $conn->prepare($holidayQuery);
                $holidayTypes = str_repeat('i', count($userIds));
                $holidayStmt->bind_param($holidayTypes, ...$userIds);
                $holidayStmt->execute();
                $holidayResult = $holidayStmt->get_result();

                $holidays = [];
                while ($row = $holidayResult->fetch_assoc()) {
                    if (!isset($holidays[$row['user_id']])) {
                        $holidays[$row['user_id']] = [];
                    }
                    $holidays[$row['user_id']][] = [
                        'start' => $row['start_date'],
                        'end' => $row['end_date']
                    ];
                }

                // Filter events
                $filteredEvents = [];
                foreach ($events as $event) {
                    $eventDate = $event['date'];
                    $userId = $event['user_id'];
                    $isOnHoliday = false;

                    // Check if user is on holiday on this date
                    if (isset($holidays[$userId])) {
                        foreach ($holidays[$userId] as $holiday) {
                            if ($eventDate >= $holiday['start'] && $eventDate <= $holiday['end']) {
                                $isOnHoliday = true;
                                break;
                            }
                        }
                    }

                    // Only include event if user is not on holiday
                    if (!$isOnHoliday) {
                        $filteredEvents[] = $event;
                    }
                }

                $events = $filteredEvents;
            }

            echo json_encode($events);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve specialist events: ' . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Create a new specialist event - public access (no authentication required)
        try {
            // Parse request body
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate request
            if (!isset($data['user_id']) || !isset($data['date']) || !isset($data['title']) || !isset($data['time'])) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID, date, title, and time are required']);
                exit;
            }

            $userId = (int)$data['user_id'];
            $date = $data['date'];
            $title = $data['title'];
            $time = $data['time'];
            $isWeekly = isset($data['is_weekly']) ? (int)$data['is_weekly'] : 0;
            $endDate = isset($data['end_date']) && $data['end_date'] ? $data['end_date'] : null;

            // Validate date format (YYYY-MM-DD)
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
                exit;
            }

            // Validate time format (HH:MM)
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $time)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid time format. Use HH:MM']);
                exit;
            }

            // Validate end_date if weekly is enabled
            if ($isWeekly && $endDate) {
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid end date format. Use YYYY-MM-DD']);
                    exit;
                }

                if ($endDate <= $date) {
                    http_response_code(400);
                    echo json_encode(['error' => 'End date must be after start date']);
                    exit;
                }

                // Limit to 1 year max
                $maxEndDate = date('Y-m-d', strtotime($date . ' +1 year'));
                if ($endDate > $maxEndDate) {
                    http_response_code(400);
                    echo json_encode(['error' => 'End date cannot be more than 1 year in the future']);
                    exit;
                }
            }

            // Check if user is specialist
            $userStmt = $conn->prepare("SELECT id, is_specialist FROM users WHERE id = ? AND active = 1");
            $userStmt->bind_param('i', $userId);
            $userStmt->execute();
            $userResult = $userStmt->get_result();

            if ($userResult->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found or inactive']);
                exit;
            }

            $user = $userResult->fetch_assoc();
            if (!$user['is_specialist']) {
                http_response_code(403);
                echo json_encode(['error' => 'User is not a specialist']);
                exit;
            }

            // Insert event(s)
            $insertedIds = [];

            if ($isWeekly && $endDate) {
                // Generate weekly recurring events
                $currentDate = $date;
                while ($currentDate <= $endDate) {
                    $stmt = $conn->prepare("
                        INSERT INTO specialist_events (user_id, date, title, time, is_weekly, end_date)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");

                    $stmt->bind_param('isssss', $userId, $currentDate, $title, $time, $isWeekly, $endDate);
                    $stmt->execute();

                    $insertedIds[] = $conn->insert_id;

                    // Move to next week
                    $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 week'));
                }
            } else {
                // Single event
                $stmt = $conn->prepare("
                    INSERT INTO specialist_events (user_id, date, title, time, is_weekly, end_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");

                $stmt->bind_param('isssss', $userId, $date, $title, $time, $isWeekly, $endDate);
                $stmt->execute();

                $insertedIds[] = $conn->insert_id;
            }

            // Return success with created event(s)
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'ids' => $insertedIds,
                'count' => count($insertedIds),
                'user_id' => $userId,
                'date' => $date,
                'title' => $title,
                'time' => $time,
                'is_weekly' => $isWeekly,
                'end_date' => $endDate
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create specialist event: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete a specialist event - public access (no authentication required)
        try {
            // Check if ID is provided
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Event ID is required']);
                exit;
            }

            $eventId = (int)$_GET['id'];

            // Verify that the event exists
            $checkStmt = $conn->prepare("SELECT id, user_id FROM specialist_events WHERE id = ?");
            $checkStmt->bind_param('i', $eventId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Specialist event not found']);
                exit;
            }

            // Delete the event (no permission check - anyone can delete, similar to shifts)
            $deleteStmt = $conn->prepare("DELETE FROM specialist_events WHERE id = ?");
            $deleteStmt->bind_param('i', $eventId);
            $deleteStmt->execute();

            // Return success
            echo json_encode(['success' => true, 'message' => 'Specialist event deleted successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete specialist event: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// Close database connection
$conn->close();
