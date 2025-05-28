<?php
// Database connection functions

// Set timezone
date_default_timezone_set('Europe/Zurich');

// Determine the correct configuration file to use
$configFilePath = dirname(__FILE__) . '/config.php';
$legacyConfigFile = dirname(__FILE__) . '/api/config.php';

// First try to load the new config file
if (file_exists($configFile)) {
    require_once($configFile);
}
// If new config doesn't exist, try the legacy file
else if (file_exists($legacyConfigFile)) {
    // Only load the legacy file if we're not in the middle of installation
    if (!strpos($_SERVER['PHP_SELF'], 'install.php')) {
        require_once($legacyConfigFile);
    }
}
// If neither exists, show an error or redirect to installation
else {
    // Check if we're not already on the installation page
    if (!strpos($_SERVER['PHP_SELF'], 'install.php')) {
        header('Location: install.php');
        exit;
    }
}

// Helper function to get database connection
function getDbConnection() {
    if (!defined('DB_HOST') || !defined('DB_USER') || !defined('DB_PASS') || !defined('DB_NAME')) {
        http_response_code(500);
        echo json_encode(['error' => 'Database configuration not found. Please run the installation wizard.']);
        exit;
    }
    
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

// Helper function to send JSON response
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Helper function to handle errors
function handleError($message, $statusCode = 500) {
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

// Add any other helper functions from config.php here