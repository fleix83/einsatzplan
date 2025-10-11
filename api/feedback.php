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
        // Get all feedback comments - public access
        $stmt = $conn->prepare("
            SELECT id, comment, user_name, created_at
            FROM feedback
            ORDER BY created_at DESC
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
        $feedbacks = [];

        while ($row = $result->fetch_assoc()) {
            $feedbacks[] = $row;
        }

        echo json_encode($feedbacks);
        break;

    case 'POST':
        // Add new feedback comment - public access, no authentication required

        // Parse request body
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['comment']) || trim($data['comment']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Comment is required']);
            exit;
        }

        $comment = trim($data['comment']);
        $userName = isset($data['user_name']) && trim($data['user_name']) !== '' ? trim($data['user_name']) : null;

        // Insert new feedback
        $stmt = $conn->prepare("
            INSERT INTO feedback (comment, user_name)
            VALUES (?, ?)
        ");

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
            exit;
        }

        $stmt->bind_param('ss', $comment, $userName);

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add feedback: ' . $stmt->error]);
            exit;
        }

        // Get the inserted ID
        $insertedId = $stmt->insert_id;

        echo json_encode([
            'success' => true,
            'id' => $insertedId,
            'comment' => $comment,
            'user_name' => $userName,
            'created_at' => date('Y-m-d H:i:s')
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
