<?php
/**
 * Application Bootstrap File
 * 
 * This file initializes the application environment and loads the
 * appropriate configuration files based on availability.
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define application base path
define('APP_BASE_PATH', dirname(__FILE__));

// Set up autoloading if needed in the future
spl_autoload_register(function($class) {
    // Convert namespace to file path
    $file = APP_BASE_PATH . '/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
        return true;
    }
    return false;
});

// Load database configuration and utility functions
if (file_exists(APP_BASE_PATH . '/config/db.php')) {
    // New configuration file
    require_once APP_BASE_PATH . '/config/db.php';
} else if (file_exists(APP_BASE_PATH . '/api/config.php')) {
    // Legacy configuration file
    require_once APP_BASE_PATH . '/api/config.php';
} else {
    // No configuration file, redirect to installer
    $currentScript = basename($_SERVER['PHP_SELF']);
    if ($currentScript !== 'install.php') {
        header('Location: install.php');
        exit;
    }
}

// Initialize session if needed
if (!isset($_SESSION) && !headers_sent()) {
    session_start();
}

// Check installation status
function isInstalled() {
    return file_exists(APP_BASE_PATH . '/config/config.php');
}

// Verify database connection is working
function isDatabaseConnected() {
    if (!function_exists('getDbConnection')) {
        return false;
    }
    
    try {
        $conn = getDbConnection();
        $result = $conn && !$conn->connect_error;
        if ($conn) $conn->close();
        return $result;
    } catch (Exception $e) {
        return false;
    }
}

// Function to redirect to installer if not installed
function requireInstallation() {
    if (!isInstalled() || !isDatabaseConnected()) {
        header('Location: install.php');
        exit;
    }
}