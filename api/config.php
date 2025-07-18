<?php
// Database configuration

define('DB_HOST', 'localhost');
define('DB_USER', 'ggg');
define('DB_PASS', 'Dd7O5@rEJ*wAM1*o');
define('DB_NAME', 'calendar');

// Set timezone
date_default_timezone_set('Europe/Zurich');

// Helper function to get database connection
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
        exit;
    }
    
    // Set charset to UTF-8
    $conn->set_charset('utf8mb4');
    
    return $conn;
}

// Helper function to get the current user (if authenticated)
function getCurrentUser() {
    // Check for Authorization header
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // If no auth header, return null (public access)
    if (empty($authHeader)) {
        return null;
    }
    
    // Try to authenticate the user
    return validateToken();
}

// Helper function to send JSON response
function sendJsonResponse($data, $statusCode = 200) {
    // Clear any output buffer to prevent corruption
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Helper function to handle errors
function handleError($message, $statusCode = 500) {
    // Clear any output buffer to prevent corruption
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
    exit;
}

// Helper function to check if a date is a weekend
function isWeekend($date) {
    $dayOfWeek = date('N', strtotime($date));
    return ($dayOfWeek >= 6); // 6 = Saturday, 7 = Sunday
}

// Set CORS headers for all API endpoints
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}